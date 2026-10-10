import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ReturnRecord, Sale } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getStoredProducts, getStoredReturns, getStoredSales, saveStoredProducts, saveStoredReturns, saveStoredSales } from '../utils/storage';

interface ReturnModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  sale,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentOperator } = useAuth();
  const [selectedItems, setSelectedItems] = useState<{ [productId: string]: number }>({});
  const [reason, setReason] = useState<string>('Defeito / Avaria no produto');
  const [restock, setRestock] = useState<boolean>(true);
  const [customReason, setCustomReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen || !sale) return null;

  const toggleItemSelection = (productId: string, maxQty: number) => {
    setSelectedItems((prev) => {
      const current = prev[productId] || 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      } else {
        return { ...prev, [productId]: maxQty };
      }
    });
  };

  const updateItemQty = (productId: string, qty: number, maxQty: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: Math.max(1, Math.min(maxQty, qty)),
    }));
  };

  // Calculate refund amount
  const totalRefund = Object.entries(selectedItems).reduce((sum, [productId, qty]) => {
    const saleItem = sale.items.find((i) => i.productId === productId);
    if (saleItem) {
      return sum + qty * saleItem.unitPrice;
    }
    return sum;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(selectedItems).length === 0) {
      setError('Selecione pelo menos um item para devolução.');
      return;
    }

    const finalReason = reason === 'Outro' ? customReason || 'Não especificado' : reason;

    // Create return record
    const returnRecord: ReturnRecord = {
      id: `ret-${Date.now()}`,
      saleId: sale.id,
      saleCode: sale.code,
      date: new Date().toISOString(),
      operatorName: currentOperator.name,
      items: Object.entries(selectedItems).map(([pId, qty]) => {
        const item = sale.items.find((i) => i.productId === pId)!;
        return {
          productId: pId,
          productName: item.productName,
          quantity: qty,
          amount: qty * item.unitPrice,
        };
      }),
      reason: finalReason,
      totalRefund,
      restocked: restock,
    };

    // Save return
    const returns = getStoredReturns();
    saveStoredReturns([returnRecord, ...returns]);

    // Restock items in inventory if checked
    if (restock) {
      const products = getStoredProducts();
      const updatedProducts = products.map((p) => {
        const returnedQty = selectedItems[p.id];
        if (returnedQty) {
          return {
            ...p,
            stock: p.stock + returnedQty,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      saveStoredProducts(updatedProducts);
    }

    // Mark sale as refunded if all items returned
    const allItemsReturned = sale.items.every(
      (item) => selectedItems[item.productId] === item.quantity
    );
    if (allItemsReturned) {
      const sales = getStoredSales();
      const updatedSales = sales.map((s) =>
        s.id === sale.id ? { ...s, status: 'refunded' as const } : s
      );
      saveStoredSales(updatedSales);
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Devolução / Troca
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cupom #{sale.code}
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
          
          {/* Instruction */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Selecione os produtos que o cliente está devolvendo ou trocando.
            </span>
          </div>

          {/* Items to select */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Itens da Compra
            </label>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {sale.items.map((item) => {
                const isSelected = selectedItems[item.productId] !== undefined;
                const qty = selectedItems[item.productId] || item.quantity;

                return (
                  <div
                    key={item.productId}
                    className={`p-3 flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-amber-50/50 dark:bg-amber-950/20'
                        : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItemSelection(item.productId, item.quantity)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {item.productName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatCurrency(item.unitPrice)} un. (Comprou {item.quantity} {item.unit})
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">Qtd:</span>
                        <input
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={qty}
                          onChange={(e) =>
                            updateItemQty(
                              item.productId,
                              parseInt(e.target.value, 10) || 1,
                              item.quantity
                            )
                          }
                          className="w-14 py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 text-center font-bold text-xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo da Devolução
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
            >
              <option value="Defeito / Avaria no produto">Defeito / Avaria no produto</option>
              <option value="Produto vencido / impróprio">Produto vencido / impróprio</option>
              <option value="Arrependimento / Desistência">Arrependimento / Desistência</option>
              <option value="Erro no pedido / item incorreto">Erro no pedido / item incorreto</option>
              <option value="Troca por outro item">Troca por outro item</option>
              <option value="Outro">Outro motivo</option>
            </select>
          </div>

          {reason === 'Outro' && (
            <div>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Especifique o motivo..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </div>
          )}

          {/* Restock checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={restock}
              onChange={(e) => setRestock(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Retornar itens devolvidos ao estoque comercial
            </span>
          </label>

          {/* Total Refund Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex justify-between items-center">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Valor Total do Reembolso:
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatCurrency(totalRefund)}
            </span>
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={Object.keys(selectedItems).length === 0}
              className="px-5 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 rounded-xl shadow-md shadow-amber-600/20 transition-all"
            >
              Concluir Devolução
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
