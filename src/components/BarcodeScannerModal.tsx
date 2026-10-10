import React, { useEffect, useState } from 'react';
import { Barcode, Camera, Keyboard, X } from 'lucide-react';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';
import { playBeep } from '../utils/printReceiptHelper';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [openCamera, setOpenCamera] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Buffer for hardware barcode scanners
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      // Hardware scanner sends keys in very rapid succession (< 50ms)
      if (now - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.trim().length >= 3) {
          playBeep();
          onScan(buffer.trim());
          onClose();
        }
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onScan, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      playBeep();
      onScan(barcodeInput.trim());
      setBarcodeInput('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Ler Código de Barras
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pistola USB, Câmera ou Teclado
              </p>
            </div>
          </div>

          {/* Camera Scanner Trigger Button */}
          <button
            type="button"
            onClick={() => setOpenCamera(true)}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all mb-4"
          >
            <Camera className="w-5 h-5" />
            Escanear com a Câmera
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="shrink-0 mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              ou digite o código
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <div className="relative">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Ex: 7891991010887 ou 001"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  autoFocus
                />
                <Keyboard className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                Leitores de código de barras USB são detectados automaticamente.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!barcodeInput.trim()}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl shadow-xs transition-all"
              >
                Buscar Produto
              </button>
            </div>
          </form>
        </div>
      </div>

      <CameraBarcodeScannerModal
        isOpen={openCamera}
        onClose={() => setOpenCamera(false)}
        onDetected={(code) => {
          onScan(code);
          setOpenCamera(false);
          onClose();
        }}
      />
    </>
  );
};
