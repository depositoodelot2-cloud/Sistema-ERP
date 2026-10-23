import React from 'react';
import { MessageSquare, Printer, RotateCcw, X } from 'lucide-react';
import { Sale, StoreSettings } from '../types';
import { generateReceiptShareText, printReceipt } from '../utils/printReceiptHelper';
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

  const handleWhatsAppShare = () => {
    const text = generateReceiptShareText(sale, settings);
    const phone = sale.customerDocument ? '' : ''; // WhatsApp direct link
    const url = `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    printReceipt();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Comprovante de Venda
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black tracking-wide border border-slate-200 dark:border-slate-700">
                  80mm Térmica
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cupom #{sale.code}
              </p>
            </div>
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
        <div className="flex-1 overflow-y-auto py-3 my-1 flex justify-center bg-slate-100/70 dark:bg-slate-950/50 rounded-2xl p-2 sm:p-3">
          <PrintReceiptView sale={sale} settings={settings} />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-white shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" /> Imprimir Cupom
            </button>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-xs transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Enviar WhatsApp
            </button>
          </div>

          {onNewSale && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewSale();
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Iniciar Nova Venda
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
