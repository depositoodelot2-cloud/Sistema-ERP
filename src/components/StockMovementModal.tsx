import React, { useEffect, useState } from 'react';
import {
  ArrowDownUp,
  Check,
  Minus,
  PackageMinus,
  PackagePlus,
  Plus,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Product, StockMovement, StockMovementType } from '../types';
import { playCashSound } from '../utils/printReceiptHelper';
import {
  getStoredProducts,
  getStoredSettings,
  saveStoredProducts,
  saveStoredStockMovement,
} from '../utils/storage';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  initialType?: StockMovementType;
  onSuccess?: (product: Product, movement: StockMovement) => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  product,
  initialType = 'in',
  onSuccess,
}) => {
  const { currentOperator } = useAuth();
  const [movementType, setMovementType] = useState<StockMovementType>(initialType);
  const [qtyInput, setQtyInput] = useState<string>('1');

  // Reset states when opening
  useEffect(() => {
    setMovementType(initialType);
    setQtyInput('1');
  }, [product, initialType, isOpen]);

  const parsedQty = parseFloat(qtyInput.replace(',', '.')) || 0;
  const currentStock = product?.stock ?? 0;

  // Calculate new resulting stock
  const resultingStock =
    movementType === 'in'
      ? Math.round((currentStock + parsedQty) * 1000) / 1000
      : Math.max(0, Math.round((currentStock - parsedQty) * 1000) / 1000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || parsedQty <= 0) return;

    const allProducts = getStoredProducts();
    const targetProduct: Product = allProducts.find((p) => p.id === product.id) || product;

    const previousStock = targetProduct.stock;
    const newStock =
      movementType === 'in'
        ? Math.round((previousStock + parsedQty) * 1000) / 1000
        : Math.max(0, Math.round((previousStock - parsedQty) * 1000) / 1000);

    // 1. Update product in storage (if it exists)
    const exists = allProducts.some((p) => p.id === targetProduct.id);
    let updatedProduct: Product;

    if (exists) {
      const updatedProducts = allProducts.map((p) =>
        p.id === targetProduct.id
          ? {
              ...p,
              stock: newStock,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      saveStoredProducts(updatedProducts);
      updatedProduct = updatedProducts.find((p) => p.id === targetProduct.id)!;
    } else {
      updatedProduct = {
        ...targetProduct,
        stock: newStock,
        updatedAt: new Date().toISOString(),
      };
    }

    // 2. Save Movement History Log
    const movementRecord: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: targetProduct.id,
      productCode: targetProduct.code,
      productName: targetProduct.name,
      type: movementType,
      quantity: parsedQty,
      previousStock,
      newStock,
      reason: movementType === 'in' ? 'Entrada manual' : 'Saída manual',
      operatorName: currentOperator?.name || 'Carlos Admin',
      date: new Date().toISOString(),
    };
    saveStoredStockMovement(movementRecord);

    // 3. Audio feedback if enabled
    const settings = getStoredSettings();
    if (settings.enableSound) {
      playCashSound();
    }

    onSuccess?.(updatedProduct, movementRecord);
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-[420px] bg-[#edf2f7] dark:bg-[#0c1527] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-[#1e2f54] p-4 sm:p-5 overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownUp className="w-4 h-4 text-[#2563eb] stroke-[2.5]" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Movimentação de Estoque
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-3.5 space-y-2.5 sm:space-y-3">
          {/* Row 1: Type Selection (Adicionar Entrada / Retirar Saída) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Botão + Adicionar (Entrada) */}
            <button
              type="button"
              onClick={() => setMovementType('in')}
              className={`h-14 sm:h-15 rounded-2xl flex items-center justify-center gap-2.5 px-3 transition-all cursor-pointer active:scale-95 ${
                movementType === 'in'
                  ? 'bg-[#059669] text-white shadow-sm'
                  : 'bg-white dark:bg-[#111e38] text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-[#1e2f54] hover:border-slate-300'
              }`}
            >
              <PackagePlus className="w-5 h-5 shrink-0" />
              <div className="text-left leading-tight">
                <div className="font-bold text-xs sm:text-sm">+ Adicionar</div>
                <div className={`text-[10px] sm:text-[11px] font-medium ${movementType === 'in' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  (Entrada)
                </div>
              </div>
            </button>

            {/* Botão - Retirar (Saída) */}
            <button
              type="button"
              onClick={() => setMovementType('out')}
              className={`h-14 sm:h-15 rounded-2xl flex items-center justify-center gap-2 px-3 transition-all cursor-pointer active:scale-95 ${
                movementType === 'out'
                  ? 'bg-[#dc2626] text-white shadow-sm'
                  : 'bg-white dark:bg-[#111e38] text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-[#1e2f54] hover:border-slate-300'
              }`}
            >
              <PackageMinus className="w-5 h-5 shrink-0" />
              <span className="font-bold text-xs sm:text-sm">
                - Retirar (Saída)
              </span>
            </button>
          </div>

          {/* Row 2: Quantity Input with - and + buttons */}
          <div className="bg-white dark:bg-[#111e38] rounded-2xl p-1.5 px-2 flex items-center justify-between border border-slate-200/70 dark:border-[#1e2f54] shadow-2xs">
            <button
              type="button"
              onClick={() =>
                setQtyInput((prev) => {
                  const val = parseFloat(prev.replace(',', '.')) || 1;
                  return Math.max(1, val - 1).toString();
                })
              }
              className="w-9 h-8 sm:w-10 sm:h-9 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
              title="Diminuir"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>

            <input
              type="text"
              inputMode="decimal"
              value={qtyInput}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, '');
                setQtyInput(val);
              }}
              onFocus={(e) => e.target.select()}
              className="w-24 text-center font-bold text-base sm:text-lg text-slate-900 dark:text-white bg-transparent focus:outline-none"
            />

            <button
              type="button"
              onClick={() =>
                setQtyInput((prev) => {
                  const val = parseFloat(prev.replace(',', '.')) || 0;
                  return (val + 1).toString();
                })
              }
              className="w-9 h-8 sm:w-10 sm:h-9 rounded-xl bg-[#1d63ed] hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
              title="Aumentar"
            >
              <Plus className="w-4 h-4 stroke-[2.8]" />
            </button>
          </div>

          {/* Row 3: Result Preview Card */}
          <div className="bg-white dark:bg-[#111e38] rounded-2xl p-3 px-4 flex items-center justify-center border border-slate-200/70 dark:border-[#1e2f54] shadow-2xs">
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium text-center">
              Novo Estoque:{' '}
              <span className="font-bold text-slate-800 dark:text-white">
                {currentStock}
              </span>{' '}
              <span
                className={`font-bold ${
                  movementType === 'in'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {movementType === 'in' ? '+' : '-'} {parsedQty}
              </span>{' '}
              <span className="font-bold text-slate-600 dark:text-slate-300">
                =
              </span>{' '}
              <span
                className={`font-black ${
                  movementType === 'in'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {resultingStock} {product.unit.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Row 4: Apply Button (na linha abaixo) */}
          <button
            type="submit"
            disabled={parsedQty <= 0}
            className="w-full h-11 sm:h-12 bg-[#1d63ed] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <Check className="w-4.5 h-4.5 stroke-[2.8]" />
            <span>Aplicar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
