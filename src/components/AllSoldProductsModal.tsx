import React from 'react';
import { Package, Trophy, X } from 'lucide-react';
import { Sale } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AllSoldProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
}

export const AllSoldProductsModal: React.FC<AllSoldProductsModalProps> = ({
  isOpen,
  onClose,
  sales,
}) => {
  if (!isOpen) return null;

  // Aggregate products
  const productStats: {
    [name: string]: {
      name: string;
      code: string;
      quantity: number;
      revenue: number;
      unit: string;
    };
  } = {};

  sales.forEach((s) => {
    if (s.status === 'cancelled') return;
    s.items.forEach((item) => {
      const key = item.productId || item.productName;
      if (!productStats[key]) {
        productStats[key] = {
          name: item.productName,
          code: item.productCode,
          quantity: 0,
          revenue: 0,
          unit: item.unit || 'un',
        };
      }
      productStats[key].quantity += item.quantity;
      productStats[key].revenue += item.subtotal;
    });
  });

  const rankedProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Ranking de Produtos Vendidos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Itens com maior faturamento e saída
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

        {/* List */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-2">
          {rankedProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum produto vendido no período selecionado.</p>
            </div>
          ) : (
            rankedProducts.map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-900 font-black'
                        : idx === 2
                        ? 'bg-amber-700/60 text-white font-black'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block line-clamp-1">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Total vendido: <strong className="text-slate-800 dark:text-slate-200">{p.quantity} {p.unit}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm block">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
