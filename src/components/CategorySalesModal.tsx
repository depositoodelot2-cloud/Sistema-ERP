import React from 'react';
import { Tag, Trophy, X } from 'lucide-react';
import { Category, Product, Sale } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CategorySalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  categories: Category[];
  products: Product[];
}

export const CategorySalesModal: React.FC<CategorySalesModalProps> = ({
  isOpen,
  onClose,
  sales,
  categories,
  products,
}) => {
  if (!isOpen) return null;

  // Build product to category map
  const productCatMap = new Map<string, string>();
  products.forEach((p) => productCatMap.set(p.id, p.category));

  // Category stats
  const catRevenue: { [catId: string]: number } = {};
  const catItemsCount: { [catId: string]: number } = {};
  let totalRevenue = 0;

  sales.forEach((s) => {
    if (s.status === 'cancelled') return;
    s.items.forEach((item) => {
      const catId = productCatMap.get(item.productId) || 'cat-outros';
      catRevenue[catId] = (catRevenue[catId] || 0) + item.subtotal;
      catItemsCount[catId] = (catItemsCount[catId] || 0) + item.quantity;
      totalRevenue += item.subtotal;
    });
  });

  const categoryListWithStats = categories.map((cat) => {
    const rev = catRevenue[cat.id] || 0;
    const items = catItemsCount[cat.id] || 0;
    const percentage = totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0;
    return {
      ...cat,
      revenue: rev,
      itemsCount: items,
      percentage,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Ranking Completo de Categorias
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribuição de faturamento e volume por departamento
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

        {/* Total banner */}
        <div className="p-3.5 my-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Faturamento Total em Itens:
          </span>
          <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {formatCurrency(totalRevenue)}
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {categoryListWithStats.map((cat, idx) => (
            <div
              key={cat.id}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-slate-100">
                  <div
                    className={`w-6 h-6 rounded-lg font-black flex items-center justify-center text-[11px] shrink-0 ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-900'
                        : idx === 2
                        ? 'bg-amber-700/60 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black font-mono text-slate-900 dark:text-slate-100 block">
                    {formatCurrency(cat.revenue)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {cat.itemsCount} {cat.itemsCount === 1 ? 'item' : 'itens'} ({cat.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
