import React from 'react';
import { Ban, FileText, Printer, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Sale } from '../types';
import { formatCurrency, getPaymentMethodLabel } from '../utils/formatters';

interface SaleDetailModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintReceipt: (sale: Sale) => void;
  onStartReturn?: (sale: Sale) => void;
  onCancelSale?: (sale: Sale) => void;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({
  sale,
  isOpen,
  onClose,
  onPrintReceipt,
  onCancelSale,
}) => {
  if (!isOpen || !sale) return null;

  const { isAdmin } = useAuth();

  const isCancelled = sale.status === 'cancelled';
  const isRefunded = sale.status === 'refunded';

  // Format code to match image pattern: #VD-769354
  const formatSaleCode = (code: string): string => {
    if (!code) return 'VD-000000';
    if (code.startsWith('VD-')) return code;
    if (code.startsWith('VND-')) return code.replace('VND-', 'VD-');
    return `VD-${code}`;
  };

  // Format date and time: 21/10/2026, 22:49
  const formatSaleDateTime = (isoString: string): string => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const datePart = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
      const timePart = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
      return `${datePart}, ${timePart}`;
    } catch {
      return '';
    }
  };

  // Calculate CMV (Custo dos Produtos) and Lucro Bruto Estimado
  const totalCost = sale.items.reduce((sum, it) => {
    const itemCost =
      it.costPrice !== undefined && it.costPrice > 0
        ? it.costPrice
        : it.unitPrice
        ? it.unitPrice * 0.6
        : 0;
    return sum + itemCost * it.quantity;
  }, 0);

  const estimatedProfit = Math.max(0, sale.total - totalCost);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#0e172a] rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* ========================================================
            1. HEADER: Icon + Title/Date + Status Badge + Close Button
           ======================================================== */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Blue File Icon Box */}
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5 text-white" />
            </div>

            {/* Sale Title & Date */}
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                Venda #{formatSaleCode(sale.code)}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono mt-0.5">
                {formatSaleDateTime(sale.date)}
              </p>
            </div>
          </div>

          {/* Right: Status Pill & Close (X) */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shrink-0 ${
                isCancelled
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                  : isRefunded
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                  : 'bg-[#dcfce7] text-[#15803d] dark:bg-emerald-950/70 dark:text-emerald-300'
              }`}
            >
              {isCancelled ? 'CANCELADA' : isRefunded ? 'ESTORNADA' : 'CONCLUÍDA'}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ========================================================
            2. SCROLLABLE CONTENT BODY
           ======================================================== */}
        <div className="flex-1 overflow-y-auto pr-0.5 py-3 space-y-3 overscroll-contain">
          
          {/* Metadata Grid Card */}
          <div className="rounded-2xl border border-blue-100/80 dark:border-[#1c2c4d] bg-[#f8faff] dark:bg-[#0b1428] p-4">
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              {/* Vendedor / Caixa */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  VENDEDOR / CAIXA
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                  {sale.operatorName || 'Anacleto'}
                </span>
              </div>

              {/* Cliente */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  CLIENTE
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                  {sale.customerName ? sale.customerName : 'Consumidor Final (Balcão)'}
                </span>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  FORMA DE PAGAMENTO
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase block">
                  {getPaymentMethodLabel(sale.paymentMethod).toUpperCase()}
                </span>
              </div>

              {/* Total da Venda */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  TOTAL DA VENDA
                </span>
                <span
                  className={`text-xs font-black font-mono block ${
                    isCancelled
                      ? 'text-orange-500 dark:text-orange-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatCurrency(sale.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Section: ITENS DA VENDA */}
          <div>
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              ITENS DA VENDA ({sale.items.length})
            </h3>
            
            <div className="space-y-2">
              {sale.items.map((it, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-blue-100/90 dark:border-[#1c2c4d] bg-white dark:bg-[#0e172a] p-3 flex items-center justify-between shadow-2xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                      {it.productName}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium font-mono mt-0.5 block">
                      {it.quantity} {it.unit ? it.unit.toUpperCase() : 'UN'} x {formatCurrency(it.unitPrice)}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
                      {formatCurrency(it.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Financial Summary Card */}
          <div className="rounded-2xl border border-blue-100/80 dark:border-[#1c2c4d] bg-[#f8faff] dark:bg-[#0b1428] p-3.5 space-y-2">
            {/* Subtotal */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(sale.subtotal)}
              </span>
            </div>

            {/* Desconto */}
            {sale.discount > 0 && (
              <div className="flex justify-between items-center text-xs text-rose-600 font-bold">
                <span>Desconto</span>
                <span className="font-mono">-{formatCurrency(sale.discount)}</span>
              </div>
            )}

            {/* Acréscimo */}
            {sale.surcharge !== undefined && sale.surcharge > 0 && (
              <div className="flex justify-between items-center text-xs text-blue-600 font-bold">
                <span>Acréscimo</span>
                <span className="font-mono">+{formatCurrency(sale.surcharge)}</span>
              </div>
            )}

            {/* TOTAL */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
              <span className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
                TOTAL
              </span>
              <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                {formatCurrency(sale.total)}
              </span>
            </div>

            {/* Custo dos Produtos (CMV) & Lucro Bruto Estimado - Visível apenas para o Administrador */}
            {isAdmin && (
              <div className="pt-2 border-t border-dashed border-slate-200/90 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Custo dos Produtos (CMV):
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(totalCost)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-black text-[#15803d] dark:text-emerald-400">
                    Lucro Bruto Estimado:
                  </span>
                  <span className="font-black font-mono text-[#15803d] dark:text-emerald-400">
                    {formatCurrency(estimatedProfit)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            3. BOTTOM ACTION BUTTONS: Cancelar Venda & Ver / Re-imprimir
           ======================================================== */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
          {onCancelSale && (
            <button
              type="button"
              onClick={() => onCancelSale(sale)}
              disabled={isCancelled}
              className={`rounded-2xl border py-2.5 px-3 flex items-center justify-center gap-2 flex-1 shadow-2xs text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isCancelled
                  ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                  : 'border-rose-200 bg-white hover:bg-rose-50 text-rose-600'
              }`}
            >
              <Ban className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="leading-tight text-center">Cancelar Venda</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onPrintReceipt(sale)}
            className="rounded-2xl bg-[#111827] dark:bg-slate-800 hover:bg-[#1f2937] text-white py-2.5 px-4 flex items-center justify-center gap-2 flex-[1.4] shadow-md text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 shrink-0 text-white" />
            <span className="leading-tight text-center">Ver / Re-imprimir Cupom</span>
          </button>
        </div>
      </div>
    </div>
  );
};
