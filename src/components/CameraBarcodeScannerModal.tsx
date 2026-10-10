import React, { useEffect, useRef, useState } from 'react';
import { Camera, Flashlight, RefreshCw, Scan, X } from 'lucide-react';
import { playBeep } from '../utils/printReceiptHelper';

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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      startDetectionLoop(mediaStream);
    } catch (err: unknown) {
      console.warn('Camera access issue:', err);
      const msg = err instanceof Error ? err.message : 'Não foi possível acessar a câmera.';
      setCameraError(
        msg.includes('Permission') || msg.includes('NotAllowed')
          ? 'Permissão de câmera negada. Permita o acesso nas configurações do navegador ou digite o código manualmente.'
          : 'Câmera não disponível no momento. Use o campo abaixo para inserir o código.'
      );
    }
  };

  const stopCamera = () => {
    isScanningRef.current = false;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startDetectionLoop = (mediaStream: MediaStream) => {
    isScanningRef.current = true;

    // Check for native BarcodeDetector API in modern Chromium / Android
    const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;

    if (BarcodeDetectorClass) {
      try {
        const detector = new BarcodeDetectorClass({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
        });

        const detectFrame = async () => {
          if (!isScanningRef.current || !videoRef.current) return;

          if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                if (code) {
                  playBeep();
                  onDetected(code);
                  stopCamera();
                  onClose();
                  return;
                }
              }
            } catch (e) {
              console.debug('Frame detect error', e);
            }
          }
          requestAnimationFrame(detectFrame);
        };

        requestAnimationFrame(detectFrame);
      } catch (e) {
        console.debug('BarcodeDetector init fallback', e);
      }
    }
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities = (track.getCapabilities?.() || {}) as { torch?: boolean };
        if (capabilities.torch) {
          const nextTorch = !torchOn;
          await track.applyConstraints({
            advanced: [{ torch: nextTorch } as any],
          });
          setTorchOn(nextTorch);
        }
      } catch (err) {
        console.debug('Torch not supported', err);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      playBeep();
      onDetected(manualCode.trim());
      stopCamera();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Leitor de Código de Barras</h2>
              <p className="text-[11px] text-slate-400">Aponte a câmera para o código do produto</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-4/3 w-full bg-black overflow-hidden flex items-center justify-center">
          {cameraError ? (
            <div className="p-6 text-center text-slate-300 max-w-sm">
              <Camera className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-medium">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Tentar Novamente
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Target Aim Box */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-40 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  {/* Laser Scan line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-scanline" />
                  
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />
                </div>
              </div>

              {/* Torch Button if supported */}
              <button
                type="button"
                onClick={toggleTorch}
                className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all ${
                  torchOn ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/30' : 'bg-slate-900/60 text-white hover:bg-slate-800'
                }`}
                title="Ligar/Desligar Lanterna"
              >
                <Flashlight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Footer / Manual Input Fallback */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ou digite o código de barras / SKU..."
              className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors"
            >
              Inserir
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
