import React, { useState } from 'react';
import { History, RotateCcw, Search, X } from 'lucide-react';
import { Sale } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { filterAndRankSales } from '../utils/semanticSearch';
import { getStoredSales } from '../utils/storage';

interface SelectSaleForReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSale: (sale: Sale) => void;
}

export const SelectSaleForReturnModal: React.FC<SelectSaleForReturnModalProps> = ({
  isOpen,
  onClose,
  onSelectSale,
}) => {
  const [sales] = useState<Sale[]>(getStoredSales);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Filter completed sales for return with semantic, partial & item search
  const nonCancelledSales = sales.filter((s) => s.status !== 'cancelled');
  const eligibleSales = filterAndRankSales(nonCancelledSales, searchTerm);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#0e172a] rounded-3xl border border-[#1e2f54] text-white p-5 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1b2b4c]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Devolução & Troca de Produtos
              </h2>
              <p className="text-xs text-slate-400">
                Selecione o cupom da venda original para estornar ou trocar itens
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1a2846] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative my-3">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cupom (#VND-...), cliente, produto ou intenção..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#091122] border border-[#1b2d50] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            autoFocus
          />
        </div>

        {/* List of eligible sales */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {eligibleSales.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold">Nenhuma venda encontrada para devolução.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Verifique o código digitado ou realize uma venda antes de estornar.
              </p>
            </div>
          ) : (
            eligibleSales.map((sale) => (
              <button
                key={sale.id}
                type="button"
                onClick={() => {
                  onSelectSale(sale);
                  onClose();
                }}
                className="w-full p-3 rounded-2xl bg-[#0a1326] border border-[#192744] hover:border-amber-500/60 hover:bg-[#111e3b] text-left transition-all group flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white group-hover:text-amber-400 transition-colors">
                      #{sale.code}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateTime(sale.date)}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-slate-300 block truncate">
                    Cliente: {sale.customerName || 'Consumidor Final'}
                  </span>

                  <span className="text-[10px] text-slate-500 block truncate">
                    {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-black text-sm text-amber-400 block">
                    {formatCurrency(sale.total)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#1b2b4c] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-[#1a2846] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
