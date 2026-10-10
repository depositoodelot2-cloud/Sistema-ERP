import React from 'react';
import { X } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ProductImageZoomModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductImageZoomModal: React.FC<ProductImageZoomModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-4"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 backdrop-blur-xs transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-400 text-sm font-semibold">
              Sem foto disponível
            </div>
          )}
        </div>

        <div className="mt-4 px-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400">
              CÓD: {product.code} {product.barcode && `| ${product.barcode}`}
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(product.sellPrice)}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {product.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
