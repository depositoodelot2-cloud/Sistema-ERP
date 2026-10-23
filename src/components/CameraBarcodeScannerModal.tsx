import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  ChevronRight,
  Flashlight,
  HelpCircle,
  Image as ImageIcon,
  Keyboard,
  Lightbulb,
  Maximize2,
  RefreshCw,
  Scan,
  Sparkles,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from '@zxing/library';
import { playScannerBeep, validateBarcode } from '../utils/barcodeValidator';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onDetected,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stream & camera hardware state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

  // Hardware controls
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomCaps, setZoomCaps] = useState<{ min: number; max: number; step: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [focusTapAnim, setFocusTapAnim] = useState<{ x: number; y: number } | null>(null);

  // Scanner status & assistance
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [lastReadCode, setLastReadCode] = useState<string>('');
  const [elapsedScanTime, setElapsedScanTime] = useState<number>(0);
  const [showTips, setShowTips] = useState<boolean>(false);
  const [activeTipIndex, setActiveTipIndex] = useState<number>(0);
  const [highContrastActive, setHighContrastActive] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Plan B: Manual input
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState('');

  // Scanning loop references (avoid re-renders during loop)
  const isLoopRunningRef = useRef(false);
  const isProcessingFrameRef = useRef(false);
  const scanStartTimeRef = useRef<number>(0);
  const candidateMatchRef = useRef<{ code: string; count: number }>({ code: '', count: 0 });
  const zxingReaderRef = useRef<MultiFormatReader | null>(null);
  const nativeDetectorRef = useRef<any>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const loopTimeoutIdRef = useRef<number | null>(null);

  // Rotating tips list
  const SCAN_TIPS = [
    'Afaste um pouco o celular (distância de 15 a 25 cm)',
    'Incline levemente para evitar o reflexo do plástico brilhante',
    'Aumente o zoom para focar sem aproximar demais',
    'Ligue a lanterna para ambientes com pouca luz',
  ];

  // 1. Initialize readers on mount
  useEffect(() => {
    // ZXing multi-format reader with retail format restriction
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const zReader = new MultiFormatReader();
    zReader.setHints(hints);
    zxingReaderRef.current = zReader;

    // Native BarcodeDetector (Chromium / Android Chrome / WebViews)
    const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
    if (BarcodeDetectorClass) {
      try {
        const supported = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];
        nativeDetectorRef.current = new BarcodeDetectorClass({ formats: supported });
      } catch (err) {
        console.debug('Native BarcodeDetector format restriction note:', err);
      }
    }
  }, []);

  // 2. Lifecycle management: start / stop on isOpen
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetScanState();
      return;
    }

    resetScanState();
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // 3. Scan duration counter for UX tips and high-contrast trigger
  useEffect(() => {
    if (!isOpen || scanState !== 'scanning') return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - scanStartTimeRef.current) / 1000);
      setElapsedScanTime(elapsed);

      // After 2s, high-contrast filter becomes active
      if (elapsed >= 2) {
        setHighContrastActive(true);
      }

      // After 5s, display helpful tips
      if (elapsed >= 5) {
        setShowTips(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, scanState]);

  // Cycle tips every 3 seconds if tips are shown
  useEffect(() => {
    if (!showTips) return;
    const interval = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % SCAN_TIPS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [showTips]);

  const resetScanState = () => {
    setCameraError('');
    setScanState('idle');
    setLastReadCode('');
    setShowTips(false);
    setHighContrastActive(false);
    setShowManualInput(false);
    setManualCode('');
    candidateMatchRef.current = { code: '', count: 0 };
  };

  /**
   * Smart Back Camera Selection (Crucial for Samsung S23, S22 and modern multi-lens phones)
   * Avoids ultra-wide (0.5x / 0.6x) which fail to focus up close
   */
  const findBestMainBackCamera = async (): Promise<string | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return null;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');

      if (videoInputs.length === 0) return null;
      if (videoInputs.length === 1) return videoInputs[0].deviceId;

      // Filter out front/selfie cameras
      const backCameras = videoInputs.filter((d) => {
        const label = (d.label || '').toLowerCase();
        return (
          !label.includes('front') &&
          !label.includes('frontal') &&
          !label.includes('selfie') &&
          !label.includes('user')
        );
      });

      const candidates = backCameras.length > 0 ? backCameras : videoInputs;

      // Filter OUT ultra-wide cameras (S23, iPhone, Pixel, Motorola)
      const nonUltraWide = candidates.filter((d) => {
        const label = (d.label || '').toLowerCase();
        return (
          !label.includes('ultra') &&
          !label.includes('0.5x') &&
          !label.includes('0.6x') &&
          !label.includes('wide-angle') // some vendors label ultrawide as wide-angle while main is standard
        );
      });

      const pool = nonUltraWide.length > 0 ? nonUltraWide : candidates;

      // Prioritize cameras explicitly mentioning "back", "traseira", "main", "principal" or index 0
      const mainCam =
        pool.find((d) => {
          const label = (d.label || '').toLowerCase();
          return (
            label.includes('main') ||
            label.includes('principal') ||
            label.includes('camera2 0') ||
            label.includes('back 0') ||
            label.includes('traseira') ||
            label.includes('rear')
          );
        }) || pool[0];

      return mainCam?.deviceId || null;
    } catch (err) {
      console.debug('Error enumerating cameras:', err);
      return null;
    }
  };

  /**
   * Starts camera with ideal 1920x1080 resolution, 30fps and main rear sensor
   */
  const startCamera = async () => {
    setCameraError('');
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador ou ambiente sem HTTPS.');
      }

      // 1. Initial permission check or device enumeration
      let targetDeviceId = await findBestMainBackCamera();

      // Video constraints following user specification
      const videoConstraints: MediaTrackConstraints = {
        facingMode: targetDeviceId ? undefined : { ideal: 'environment' },
        deviceId: targetDeviceId ? { exact: targetDeviceId } : undefined,
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 30 },
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch (err) {
        // Fallback without deviceId if exact device failed
        console.warn('Fallback to ideal environment facingMode:', err);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      }

      setStream(mediaStream);
      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        setActiveDeviceId(track.getSettings().deviceId || null);
        await configureTrackHardware(track);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play().catch((e) => console.debug('Video play caught:', e));
      }

      scanStartTimeRef.current = Date.now();
      setScanState('scanning');
      startScanningLoop();
    } catch (err: unknown) {
      console.error('Camera startup error:', err);
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('NotAllowedError') || msg.includes('Permission') || msg.includes('denied')) {
        setCameraError(
          'Permissão da câmera negada. Permita o acesso à câmera nas configurações do navegador ou use o botão de tirar foto/digitar abaixo.'
        );
      } else if (msg.includes('NotReadableError') || msg.includes('in use') || msg.includes('busy')) {
        setCameraError('A câmera está sendo utilizada por outro aplicativo. Feche-o e tente novamente.');
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setCameraError('Acesso à câmera requer conexão segura HTTPS.');
      } else {
        setCameraError('Não foi possível iniciar a câmera traseira. Você pode digitar o código ou carregar uma foto.');
      }
    }
  };

  /**
   * Applies continuous focus, 2x default zoom (if supported) and discovers torch support
   */
  const configureTrackHardware = async (track: MediaStreamTrack) => {
    try {
      if (!track.getCapabilities) return;
      const capabilities = track.getCapabilities() as any;

      // 1. Torch (lanterna)
      if (capabilities.torch) {
        setTorchSupported(true);
      } else {
        setTorchSupported(false);
      }

      const advanced: any = {};

      // 2. Continuous focus mode
      if (
        capabilities.focusMode &&
        Array.isArray(capabilities.focusMode) &&
        capabilities.focusMode.includes('continuous')
      ) {
        advanced.focusMode = 'continuous';
      }

      // 3. Zoom capabilities & initial 2x zoom (helps close-up focus on S23 and macro packaging)
      if (capabilities.zoom) {
        const minZ = capabilities.zoom.min || 1;
        const maxZ = capabilities.zoom.max || 1;
        const stepZ = capabilities.zoom.step || 0.1;
        setZoomCaps({ min: minZ, max: maxZ, step: stepZ });

        // Initial 2x zoom clamped to hardware limits
        const initialZoom = Math.max(minZ, Math.min(2.0, maxZ));
        advanced.zoom = initialZoom;
        setCurrentZoom(initialZoom);
      }

      if (Object.keys(advanced).length > 0) {
        await track.applyConstraints({ advanced: [advanced] }).catch((e) => {
          console.debug('applyConstraints note:', e);
        });
      }
    } catch (err) {
      console.debug('Track hardware setup note:', err);
    }
  };

  /**
   * Toggles flashlight (torch)
   */
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.debug('Failed to toggle torch:', err);
    }
  };

  /**
   * Applies zoom slider changes
   */
  const handleZoomChange = async (newZoom: number) => {
    if (!stream || !zoomCaps) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const clamped = Math.max(zoomCaps.min, Math.min(newZoom, zoomCaps.max));
    setCurrentZoom(clamped);

    try {
      await track.applyConstraints({
        advanced: [{ zoom: clamped } as any],
      });
    } catch (err) {
      console.debug('Failed to apply zoom:', err);
    }
  };

  /**
   * Tap on screen triggers continuous autofocus re-application
   */
  const handleScreenTap = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusTapAnim({ x, y });
    setTimeout(() => setFocusTapAnim(null), 800);

    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const caps = (track.getCapabilities ? track.getCapabilities() : {}) as any;
      if (caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' } as any],
        });
      }
    } catch (err) {
      console.debug('Tap autofocus trigger note:', err);
    }
  };

  /**
   * Stops camera stream and frees hardware tracks immediately
   */
  const stopCamera = () => {
    isLoopRunningRef.current = false;
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (loopTimeoutIdRef.current) {
      clearTimeout(loopTimeoutIdRef.current);
      loopTimeoutIdRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  };

  /**
   * Applies pixel-level high-contrast and grayscale to offscreen canvas
   * Critical for glossy plastic packaging reflections
   */
  const applyHighContrastGrayscale = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    // Contrast boost factor
    const factor = 1.65;
    const intercept = 128 * (1 - factor);

    for (let i = 0; i < data.length; i += 4) {
      // ITU-R BT.601 standard luma formula
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      let contrastVal = factor * gray + intercept;
      if (contrastVal < 0) contrastVal = 0;
      else if (contrastVal > 255) contrastVal = 255;

      data[i] = contrastVal;
      data[i + 1] = contrastVal;
      data[i + 2] = contrastVal;
    }
    ctx.putImageData(imgData, 0, 0);
  };

  /**
   * Central Core Scanning Loop
   * - 100-150ms intervals
   * - 80% width x 40% height Central ROI
   * - BarcodeDetector native + ZXing fallback
   * - Check-digit validation + 2 consecutive matches required
   */
  const startScanningLoop = () => {
    isLoopRunningRef.current = true;

    const processFrame = async () => {
      if (!isLoopRunningRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (
        !isProcessingFrameRef.current &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        isProcessingFrameRef.current = true;

        try {
          // Central ROI: 80% width, 40% height of actual video stream
          const vWidth = video.videoWidth;
          const vHeight = video.videoHeight;
          const roiWidth = Math.max(100, Math.round(vWidth * 0.8));
          const roiHeight = Math.max(60, Math.round(vHeight * 0.4));
          const roiX = Math.round((vWidth - roiWidth) / 2);
          const roiY = Math.round((vHeight - roiHeight) / 2);

          let canvas = canvasRef.current;
          if (!canvas) {
            canvas = document.createElement('canvas');
            canvasRef.current = canvas;
          }
          if (canvas.width !== roiWidth || canvas.height !== roiHeight) {
            canvas.width = roiWidth;
            canvas.height = roiHeight;
          }

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            // Draw central ROI into canvas
            ctx.drawImage(video, roiX, roiY, roiWidth, roiHeight, 0, 0, roiWidth, roiHeight);

            // Attempt 1: Standard ROI detection
            let detectedRaw = await decodeCanvas(canvas, ctx, roiWidth, roiHeight);

            // Attempt 2: If elapsed > 2s and no barcode found, try with high contrast & grayscale
            if (!detectedRaw && (Date.now() - scanStartTimeRef.current > 2000)) {
              applyHighContrastGrayscale(ctx, roiWidth, roiHeight);
              detectedRaw = await decodeCanvas(canvas, ctx, roiWidth, roiHeight);
            }

            if (detectedRaw) {
              handleBarcodeCandidate(detectedRaw);
            }
          }
        } catch (err) {
          console.debug('Frame scanning error:', err);
        } finally {
          isProcessingFrameRef.current = false;
        }
      }

      // Schedule next frame with ~120ms cadence
      if (isLoopRunningRef.current) {
        loopTimeoutIdRef.current = window.setTimeout(() => {
          if ('requestVideoFrameCallback' in (videoRef.current || {})) {
            (videoRef.current as any).requestVideoFrameCallback(() => {
              processFrame();
            });
          } else {
            animationFrameIdRef.current = requestAnimationFrame(processFrame);
          }
        }, 110);
      }
    };

    processFrame();
  };

  /**
   * Decodes a canvas element using native BarcodeDetector or ZXing fallback
   */
  const decodeCanvas = async (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): Promise<string | null> => {
    // 1. Native BarcodeDetector (fast, hardware accelerated)
    if (nativeDetectorRef.current) {
      try {
        const barcodes = await nativeDetectorRef.current.detect(canvas);
        if (barcodes && barcodes.length > 0) {
          const raw = barcodes[0].rawValue;
          if (raw) return raw;
        }
      } catch (e) {
        // Continue to fallback
      }
    }

    // 2. ZXing fallback
    if (zxingReaderRef.current) {
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const lum = new RGBLuminanceSource(imgData.data, width, height);
        const bitmap = new BinaryBitmap(new HybridBinarizer(lum));
        const result = zxingReaderRef.current.decode(bitmap);
        if (result && result.getText()) {
          return result.getText();
        }
      } catch (e) {
        // Expected when no barcode in frame
      }
    }

    return null;
  };

  /**
   * Validates check digit and enforces 2 consecutive identical readings
   */
  const handleBarcodeCandidate = (rawCode: string) => {
    const validation = validateBarcode(rawCode);
    if (!validation.isValid) {
      return; // Discard invalid checksum or corrupted scan
    }

    const validCode = validation.cleaned;

    // Check consecutive matches
    if (candidateMatchRef.current.code === validCode) {
      candidateMatchRef.current.count += 1;
    } else {
      candidateMatchRef.current = { code: validCode, count: 1 };
    }

    // Require 2 identical consecutive readings
    if (candidateMatchRef.current.count >= 2) {
      triggerScanSuccess(validCode);
    }
  };

  /**
   * Successful barcode acquisition: vibration, sound feedback and return
   */
  const triggerScanSuccess = (finalCode: string) => {
    isLoopRunningRef.current = false;
    setScanState('success');
    setLastReadCode(finalCode);

    // 1. Vibration
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([70, 40, 70]);
      }
    } catch {
      // ignore
    }

    // 2. POS scanner audio beep
    playScannerBeep();

    // 3. Close & deliver code
    setTimeout(() => {
      stopCamera();
      onDetected(finalCode);
      onClose();
    }, 450);
  };

  /**
   * Plan B (a): Photo capture and file decoding fallback
   */
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });

      const maxDim = 1600;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const offCanvas = document.createElement('canvas');
      offCanvas.width = w;
      offCanvas.height = h;
      const ctx = offCanvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objectUrl);

        // Try standard decode
        let decoded = await decodeCanvas(offCanvas, ctx, w, h);

        // If not found, try high contrast
        if (!decoded) {
          applyHighContrastGrayscale(ctx, w, h);
          decoded = await decodeCanvas(offCanvas, ctx, w, h);
        }

        if (decoded) {
          const val = validateBarcode(decoded);
          if (val.isValid) {
            triggerScanSuccess(val.cleaned);
            return;
          }
        }
      }

      alert(
        'Nenhum código de barras legível foi encontrado nesta foto. Tente tirar mais de perto ou com boa iluminação.'
      );
    } catch (err) {
      console.error('Photo decode error:', err);
      alert('Erro ao processar imagem. Tente novamente.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Plan B (b): Manual barcode typing
   */
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim();
    if (!clean) return;

    playScannerBeep();
    stopCamera();
    onDetected(clean);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-md sm:max-w-lg bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[95vh]">
        {/* Hidden Canvas for ROI analysis */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input for Plan B photo capture */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          className="hidden"
        />

        {/* ========================================================
            1. HEADER
           ======================================================== */}
        <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Scan className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-extrabold text-white">Leitor de Código de Barras</h2>
                {highContrastActive && (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Antirreflexo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Posicione o código no centro da moldura</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar leitor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================
            2. CAMERA VIEWPORT & INTERACTIVE ROI
           ======================================================== */}
        <div
          onClick={handleScreenTap}
          className="relative aspect-4/3 w-full bg-black overflow-hidden flex items-center justify-center cursor-pointer select-none"
        >
          {cameraError ? (
            <div className="p-6 text-center text-slate-300 max-w-sm">
              <Camera className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-xs sm:text-sm font-medium leading-relaxed">{cameraError}</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white inline-flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tentar Novamente
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white inline-flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" /> Tirar Foto
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Real Video Stream */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover pointer-events-none"
              />

              {/* Shaded Viewport Mask with Exact 80% x 40% ROI Cutout */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* 80% width, 40% height Central Scanner Box */}
                <div
                  className={`relative w-[82%] h-[42%] rounded-2xl border-2 transition-all duration-300 ${
                    scanState === 'success'
                      ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_35px_rgba(16,185,129,0.5)] scale-102'
                      : 'border-orange-400/90 shadow-[0_0_20px_rgba(249,115,22,0.25)]'
                  }`}
                >
                  {/* Glowing Laser Scanline */}
                  {scanState !== 'success' && (
                    <div className="absolute inset-x-2 h-0.5 bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-scanline" />
                  )}

                  {/* Corner Target Brackets */}
                  <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-3 border-l-3 border-orange-400 rounded-tl-md" />
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-3 border-r-3 border-orange-400 rounded-tr-md" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-3 border-l-3 border-orange-400 rounded-bl-md" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-3 border-r-3 border-orange-400 rounded-br-md" />

                  {/* Success readout inside box */}
                  {scanState === 'success' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 rounded-xl animate-in zoom-in-90 duration-200">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1 shadow-lg shadow-emerald-500/30">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <span className="text-xs font-black font-mono tracking-wider text-emerald-400">
                        {lastReadCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tap to focus animated ring */}
              {focusTapAnim && (
                <div
                  style={{ top: `${focusTapAnim.y - 24}px`, left: `${focusTapAnim.x - 24}px` }}
                  className="absolute w-12 h-12 rounded-full border-2 border-white/90 shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none animate-ping duration-700"
                />
              )}

              {/* Top Controls: Torch (Lanterna) */}
              {torchSupported && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTorch();
                  }}
                  className={`absolute top-3 right-3 p-2.5 rounded-2xl backdrop-blur-md transition-all z-20 cursor-pointer ${
                    torchOn
                      ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/40 scale-105'
                      : 'bg-slate-900/70 text-white hover:bg-slate-800'
                  }`}
                  title="Ligar/Desligar Lanterna"
                >
                  <Flashlight className="w-4 h-4 stroke-[2.2]" />
                </button>
              )}

              {/* Floating Help Badge */}
              <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none px-4">
                <span className="text-[10px] text-white/80 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-center truncate">
                  Toque na tela para focar • Centralize as barras
                </span>
              </div>
            </>
          )}
        </div>

        {/* ========================================================
            3. HARDWARE ZOOM SLIDER (Samsung S23 & Macro focus)
           ======================================================== */}
        {zoomCaps && zoomCaps.max > zoomCaps.min && !cameraError && (
          <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
              <ZoomOut className="w-3.5 h-3.5" />
              <span>{currentZoom.toFixed(1)}x</span>
            </span>

            <input
              type="range"
              min={zoomCaps.min}
              max={Math.min(zoomCaps.max, 5.0)}
              step={zoomCaps.step || 0.1}
              value={currentZoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />

            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
              <ZoomIn className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {/* ========================================================
            4. ASSISTANCE TIPS (Auto-triggered after 5 seconds)
           ======================================================== */}
        {showTips && !cameraError && (
          <div className="mx-3.5 my-2 p-2.5 rounded-2xl bg-orange-950/40 border border-orange-500/30 flex items-center gap-2.5 text-orange-200 text-xs animate-in slide-in-from-top-2 duration-200">
            <div className="w-6 h-6 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-extrabold text-[11px] text-orange-400 uppercase tracking-wide block">
                Dica de leitura:
              </span>
              <p className="text-[11px] font-medium text-slate-200 truncate">{SCAN_TIPS[activeTipIndex]}</p>
            </div>
          </div>
        )}

        {/* ========================================================
            5. PLAN B OPTIONS: PHOTO CAPTURE & MANUAL TYPING
           ======================================================== */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border-t border-slate-800/80 space-y-2.5 shrink-0">
          {showManualInput ? (
            <form onSubmit={handleManualSubmit} className="space-y-2 animate-in fade-in duration-150">
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Digite o código (ex: 7891234567890)"
                  className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer shrink-0"
                >
                  OK
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="text-[11px] font-bold text-slate-400 hover:text-white"
              >
                Voltar para a câmera
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              {/* Plan B: Take Photo / File Decode */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="flex-1 h-10 px-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.98]"
                title="Tirar foto ou carregar imagem para decodificar"
              >
                {isProcessingFile ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                ) : (
                  <Camera className="w-4 h-4 text-orange-400" />
                )}
                <span>{isProcessingFile ? 'Decodificando...' : 'Tirar Foto'}</span>
              </button>

              {/* Plan B: Manual Digitation Toggle */}
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="flex-1 h-10 px-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.98]"
              >
                <Keyboard className="w-4 h-4 text-blue-400" />
                <span>Digitar Código</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
