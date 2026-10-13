import React, { useState } from 'react';
import { Eye, Package, Plus } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import { ProductImageZoomModal } from './ProductImageZoomModal';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  cartQuantity?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  cartQuantity = 0,
}) => {
  const [showZoom, setShowZoom] = useState(false);

  const isLowStock = product.stock <= product.minStock && product.stock > 0;
  const isOutOfStock = product.stock <= 0;

  return (
    <>
      <div className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden hover:border-emerald-500/50">
        
        {/* Product Image & Badges */}
        <div
          onClick={(e) => {
            if (product.imageUrl) {
              e.stopPropagation();
              setShowZoom(true);
            }
          }}
          className={`relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden ${
            product.imageUrl ? 'cursor-zoom-in' : ''
          }`}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-1">
              <Package className="w-8 h-8 stroke-1" />
              <span className="text-[10px] font-semibold">Sem foto</span>
            </div>
          )}

          {/* Quick Zoom Button */}
          {product.imageUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowZoom(true);
              }}
              className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-900/60 text-white backdrop-blur-xs hover:bg-slate-900 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-xs"
              title="Ampliar foto"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Stock Badge */}
          <div className="absolute bottom-2 left-2">
            {isOutOfStock ? (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                Esgotado
              </span>
            ) : isLowStock ? (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                Baixo: {product.stock} {product.unit}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-900/70 text-slate-100 backdrop-blur-xs">
                {product.stock} {product.unit}
              </span>
            )}
          </div>

          {/* Cart Quantity Indicator if already in cart */}
          {cartQuantity > 0 && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[11px] font-black bg-emerald-600 text-white shadow-md">
              {cartQuantity} no carrinho
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 font-mono mb-1">
              <span>#{product.code}</span>
              {product.barcode && (
                <span className="truncate max-w-[90px]" title={product.barcode}>
                  {product.barcode}
                </span>
              )}
            </div>

            <h3
              className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
              title={product.name}
            >
              {product.name}
            </h3>
          </div>

          {/* Price & Add Button */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block leading-none">Preço</span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-50 font-mono">
                {formatCurrency(product.sellPrice)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1 font-bold text-xs shadow-xs transition-all active:scale-95 ${
                isOutOfStock
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
              title="Adicionar ao carrinho"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>
        </div>
      </div>

      <ProductImageZoomModal
        product={product}
        isOpen={showZoom}
        onClose={() => setShowZoom(false)}
        onAddToCart={onAddToCart}
      />
    </>
  );
};
