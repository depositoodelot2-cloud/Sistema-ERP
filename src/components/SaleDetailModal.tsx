import React from 'react';
import { Calendar, CheckCircle2, DollarSign, Printer, RotateCcw, User, X, XCircle } from 'lucide-react';
import { Sale } from '../types';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../utils/formatters';

interface SaleDetailModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintReceipt: (sale: Sale) => void;
  onStartReturn: (sale: Sale) => void;
  onCancelSale?: (sale: Sale) => void;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({
  sale,
  isOpen,
  onClose,
  onPrintReceipt,
  onStartReturn,
  onCancelSale,
}) => {
  if (!isOpen || !sale) return null;

  const isCancelled = sale.status === 'cancelled';
  const isRefunded = sale.status === 'refunded';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isCancelled
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50'
                  : isRefunded
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50'
              }`}
            >
              {isCancelled ? (
                <XCircle className="w-5 h-5" />
              ) : isRefunded ? (
                <RotateCcw className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Venda #{sale.code}
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    isCancelled
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : isRefunded
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {isCancelled ? 'Cancelada' : isRefunded ? 'Devolvida' : 'Concluída'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDateTime(sale.date)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Operador do Caixa</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {sale.operatorName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Forma de Pagamento</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {getPaymentMethodLabel(sale.paymentMethod)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Cliente</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {sale.customerName || 'Consumidor Final'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Documento</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {sale.customerDocument || 'Não informado'}
              </span>
            </div>
          </div>

          {/* Items list */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Itens da Venda ({sale.items.length})
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {sale.items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 flex items-center justify-between text-xs bg-white dark:bg-slate-900"
                >
                  <div className="flex-1 pr-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {it.productName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {it.quantity} {it.unit} x {formatCurrency(it.unitPrice)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(it.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Desconto:</span>
                <span className="font-mono">-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            {sale.surcharge !== undefined && sale.surcharge > 0 && (
              <div className="flex justify-between text-teal-600 dark:text-teal-400 font-semibold">
                <span>Acréscimo:</span>
                <span className="font-mono">+{formatCurrency(sale.surcharge)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 dark:text-slate-100 pt-1.5 border-t border-emerald-200/50 dark:border-emerald-800/60">
              <span>Total Pago:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(sale.total)}
              </span>
            </div>

            {sale.paymentMethod === 'money' && sale.change !== undefined && sale.change > 0 && (
              <div className="flex justify-between text-slate-500 pt-1">
                <span>Troco Devolvido:</span>
                <span className="font-mono">{formatCurrency(sale.change)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {!isCancelled && !isRefunded && onCancelSale && (
              <button
                type="button"
                onClick={() => onCancelSale(sale)}
                className="py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
              >
                Cancelar Venda
              </button>
            )}
            {!isCancelled && (
              <button
                type="button"
                onClick={() => onStartReturn(sale)}
                className="py-2.5 px-3 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Devolução / Troca
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onPrintReceipt(sale)}
            className="py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-4 h-4" /> Ver Comprovante
          </button>
        </div>
      </div>
    </div>
  );
};
