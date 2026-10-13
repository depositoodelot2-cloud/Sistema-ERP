import React, { useEffect, useState } from 'react';
import {
  Check,
  Maximize2,
  Package,
  Plus,
  RotateCcw,
  ShoppingCart,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';

export interface ProductImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  imageSrc?: string;
  title?: string;
  subtitle?: string;
  onAddToCart?: (product: Product) => void;
}

export const ProductImageZoomModal: React.FC<ProductImageZoomModalProps> = ({
  isOpen,
  onClose,
  product,
  imageSrc,
  title,
  subtitle,
  onAddToCart,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Determine actual image source and details
  const displayImage = product?.imageUrl || imageSrc;
  const displayName = product?.name || title || 'Produto';
  const displayCode = product?.code ? `#${product.code}` : subtitle;
  const displayPrice = product?.sellPrice !== undefined ? formatCurrency(product.sellPrice) : null;

  // Reset zoom level whenever modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setAddedAnimation(false);
    }
  }, [isOpen, product, imageSrc]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !displayImage) return null;

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.75 : prev === 1.75 ? 2.5 : 1));
  };

  const handleAddToCart = () => {
    if (product && onAddToCart) {
      onAddToCart(product);
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1500);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-[#0c1527] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-[#1e3058] flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-[#16233d] bg-white dark:bg-[#0c1527] shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            {displayCode && (
              <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-[#13203c] text-[#2563eb] dark:text-blue-400 font-mono text-xs font-bold border border-blue-100 dark:border-[#1e325c] shrink-0">
                {displayCode}
              </span>
            )}
            <h3
              className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase truncate"
              title={displayName}
            >
              {displayName}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 dark:bg-[#13203c] rounded-xl p-0.5 border border-slate-200 dark:border-[#1e325c]">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, +(z - 0.5).toFixed(2)))}
                disabled={zoomLevel <= 1}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-[#1a2c52] transition-colors"
                title="Reduzir zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={toggleZoom}
                className="px-2 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:text-[#2563eb] dark:hover:text-blue-400"
                title="Alterar nível de zoom"
              >
                {zoomLevel}x
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.5).toFixed(2)))}
                disabled={zoomLevel >= 3}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-[#1a2c52] transition-colors"
                title="Ampliar zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#13203c] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e325c] transition-colors"
                title="Redefinir zoom (1x)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#13203c] text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 border border-slate-200 dark:border-[#1e325c] transition-colors ml-1"
              title="Fechar (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display Area with Pan/Zoom */}
        <div
          onClick={toggleZoom}
          className="relative w-full bg-slate-950/90 dark:bg-[#060b14] flex items-center justify-center overflow-auto max-h-[55vh] sm:max-h-[62vh] min-h-[260px] sm:min-h-[360px] cursor-zoom-in p-2 select-none group"
          style={{
            cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in',
          }}
        >
          {/* Subtle checkered grid behind image to help gauge transparency & edges */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          <img
            src={displayImage}
            alt={displayName}
            className="transition-transform duration-200 ease-out object-contain max-w-full max-h-[52vh] sm:max-h-[58vh] rounded-xl drop-shadow-md pointer-events-none"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
            }}
          />

          {/* Quick hint badge */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/80 text-[11px] font-medium pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
            {zoomLevel === 1
              ? 'Clique na imagem para aproximar'
              : 'Clique na imagem para voltar'}
          </div>
        </div>

        {/* Footer Info & Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-[#16233d] bg-white dark:bg-[#0c1527] shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {displayPrice && (
                  <span className="text-xl sm:text-2xl font-black text-[#2563eb] dark:text-blue-400 font-mono">
                    {displayPrice}
                  </span>
                )}
                {product && (
                  <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 uppercase">
                    ESTOQUE: {product.stock} {product.unit}
                  </span>
                )}
                {product?.barcode && (
                  <span className="text-xs text-slate-400 font-mono">
                    Barras: {product.barcode}
                  </span>
                )}
              </div>
              {product?.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {product && onAddToCart && (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                    addedAnimation
                      ? 'bg-emerald-600 text-white'
                      : product.stock <= 0
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-[#2563eb] hover:bg-blue-600 text-white shadow-blue-600/20'
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Adicionado!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Adicionar ao Carrinho</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm border border-slate-200 dark:border-[#1e325c] bg-slate-50 dark:bg-[#111e3b] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182b52] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
