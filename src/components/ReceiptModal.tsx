import React, { useEffect, useState } from 'react';
import { MessageSquare, Printer, RotateCcw, X } from 'lucide-react';
import { Sale, StoreSettings } from '../types';
import { generateReceiptHtml, generateReceiptShareText, printReceipt } from '../utils/printReceiptHelper';
import { getStoredSettings } from '../utils/storage';
import { PrintReceiptView } from './PrintReceiptView';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onNewSale?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  isOpen,
  onClose,
  onNewSale,
}) => {
  if (!isOpen || !sale) return null;

  const settings: StoreSettings = getStoredSettings();
  const format: '80mm' | '58mm' = settings.printerWidth === '58mm' ? '58mm' : '80mm';
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Ensure any rogue receipt dynamic style tag is removed to prevent font distortion on-screen
  useEffect(() => {
    document.getElementById('receipt-dynamic-print-style')?.remove();
    return () => {
      document.getElementById('receipt-dynamic-print-style')?.remove();
    };
  }, []);

  // Pre-load clean thermal receipt in #direct-print-container immediately upon opening
  useEffect(() => {
    if (isOpen && sale) {
      document.getElementById('receipt-dynamic-print-style')?.remove();
      const html = generateReceiptHtml(sale, settings, format);
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1] : html;

      let printContainer = document.getElementById('direct-print-container');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'direct-print-container';
        document.body.appendChild(printContainer);
      }
      printContainer.innerHTML = bodyContent;
    }
  }, [isOpen, sale, format, settings]);

  const handleWhatsAppShare = () => {
    try {
      const text = generateReceiptShareText(sale, settings);
      const url = `https://api.whatsapp.com/send?text=${text}`;

      // Anchor element dispatch bypasses browser popup restrictions
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
      }, 300);

      // Also try window.open as safe fallback
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Erro ao compartilhar no WhatsApp:', err);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      printReceipt(sale, settings, format);
      setTimeout(() => setIsPrinting(false), 800);
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 overflow-hidden flex flex-col max-h-[92vh] transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              Comprovante de Venda
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cupom #{sale.code} • Bobina Térmica 80mm
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="flex-1 overflow-y-auto py-3 my-1 flex justify-center bg-slate-100/70 dark:bg-slate-950/50 rounded-2xl p-2 sm:p-4">
          <PrintReceiptView sale={sale} settings={settings} format={format} />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="py-3 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-white active:scale-95 shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Térmica (80mm)</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          {onNewSale && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewSale();
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Iniciar Nova Venda
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
