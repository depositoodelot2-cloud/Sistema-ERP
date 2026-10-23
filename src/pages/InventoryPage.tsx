import React, { useEffect, useMemo, useState } from 'react';
import {
  Barcode,
  Edit2,
  FileSpreadsheet,
  Minus,
  Package,
  Plus,
  Search,
  Trash2,
  X,
  ZoomIn,
} from 'lucide-react';
import { CameraBarcodeScannerModal } from '../components/CameraBarcodeScannerModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductImageZoomModal } from '../components/ProductImageZoomModal';
import { Category, Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import { filterAndRankProducts } from '../utils/semanticSearch';
import {
  getStoredCategories,
  getStoredProducts,
  saveStoredProducts,
} from '../utils/storage';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [categories, setCategories] = useState<Category[]>(getStoredCategories);
  const [search, setSearch] = useState('');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [zoomedProduct, setZoomedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const handleProductsChange = () => setProducts(getStoredProducts());
    const handleCategoriesChange = () => setCategories(getStoredCategories());
    window.addEventListener('odelot_products_changed', handleProductsChange);
    window.addEventListener('odelot_categories_changed', handleCategoriesChange);
    return () => {
      window.removeEventListener('odelot_products_changed', handleProductsChange);
      window.removeEventListener('odelot_categories_changed', handleCategoriesChange);
    };
  }, []);

  // Filtered and ranked products with semantic, partial & intent matching
  const filteredProducts = useMemo(() => {
    return filterAndRankProducts(products, search);
  }, [products, search]);


  const handleSaveProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingProduct) {
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              ...productData,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      setProducts(updated);
      saveStoredProducts(updated);
      setEditingProduct(null);
    } else {
      const newProduct: Product = {
        ...productData,
        id: `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newProduct, ...products];
      setProducts(updated);
      saveStoredProducts(updated);
    }
    setShowProductModal(false);
  };

  const handleDeleteProduct = () => {
    if (!productToDelete) return;
    const updated = products.filter((p) => p.id !== productToDelete.id);
    setProducts(updated);
    saveStoredProducts(updated);
    setProductToDelete(null);
  };

  const handleQuickStockAdjust = (productId: string, delta: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          stock: Math.max(0, p.stock + delta),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
  };

  const handleExportCSV = () => {
    const headers = ['Código', 'Nome', 'Categoria', 'Cód. Barras', 'Custo', 'Venda', 'Estoque', 'Mínimo', 'Unidade'];
    const rows = products.map((p) => [
      p.code,
      `"${p.name.replace(/"/g, '""')}"`,
      getCategoryName(p.category),
      p.barcode,
      p.costPrice.toFixed(2),
      p.sellPrice.toFixed(2),
      p.stock,
      p.minStock,
      p.unit,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `estoque_deposito_odelot_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : 'Geral';
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-[#f8fafc] dark:bg-[#070e1c] text-slate-900 dark:text-white max-w-xl mx-auto w-full transition-colors">
      
      {/* ========================================================
          FIXED TOP AREA: STAYS FIXED AT THE TOP
         ======================================================== */}
      <div className="shrink-0 px-4 sm:px-5 pt-3 sm:pt-4 pb-3 space-y-3 bg-[#f8fafc] dark:bg-[#070e1c] border-b border-slate-200/80 dark:border-[#131f38] shadow-2xs z-10 transition-colors">
        
        {/* 1. HEADER: Title & Action Buttons (Spreadsheet, Novo Produto) */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Estoque
          </h1>

          <div className="flex items-center gap-2">
            {/* Export to CSV / Spreadsheet Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-[#1e2f52] bg-white dark:bg-[#0e172a] text-emerald-600 hover:bg-slate-50 dark:hover:bg-[#131f38] flex items-center justify-center transition-colors shadow-2xs"
              title="Exportar planilha de estoque"
            >
              <FileSpreadsheet className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/* Novo Produto Button */}
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
              className="h-10 px-3.5 rounded-2xl bg-[#2563eb] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Produto</span>
            </button>
          </div>
        </div>

        {/* 2. SEARCH BAR & BARCODE SCANNER */}
        <div className="relative flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, código, barras ou intenção (ex: sem estoque, categoria)..."
              className="w-full pl-10 pr-12 py-2.5 rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2563eb] shadow-2xs transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-12 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowBarcodeScanner(true)}
              className="absolute right-1.5 top-1.5 w-8 h-8 rounded-xl bg-white dark:bg-[#131f38] border border-slate-200 dark:border-[#1e3056] text-orange-500 hover:bg-orange-50 flex items-center justify-center transition-colors shadow-2xs"
              title="Ler código de barras"
            >
              <Barcode className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          SCROLLABLE PRODUCT CARDS LIST
         ======================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-3 space-y-3 pb-24 overscroll-contain">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-bold">Nenhum produto encontrado</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const profit = Math.max(0, product.sellPrice - product.costPrice);
            const profitPct =
              product.costPrice > 0
                ? (profit / product.costPrice) * 100
                : 100;

            return (
              <div
                key={product.id}
                className="p-3 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/90 dark:border-[#1a2846] hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition-all space-y-2"
              >
                {/* Top Info Row */}
                <div className="flex items-start gap-2.5">
                  {/* Photo with Click to Zoom or placeholder */}
                  {product.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setZoomedProduct(product)}
                      className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200/80 dark:border-[#1e3056] group cursor-zoom-in active:scale-95 hover:border-blue-500 transition-all shadow-2xs"
                      title="Clique para ampliar a imagem do produto"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <ZoomIn className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#131f38] border border-slate-200/80 dark:border-[#1e3056] text-slate-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      #{product.code}
                    </div>
                  )}

                  {/* Info details */}
                  <div className="flex-1 min-w-0">
                    {/* Line 1: Name, Code badge, Category badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase truncate">
                        {product.name}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#152342] text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold border border-slate-200/80 dark:border-[#1e3056]">
                        #{product.code}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#2563eb] dark:text-blue-400 text-[10px] font-bold">
                        {getCategoryName(product.category)}
                      </span>
                    </div>

                    {/* Line 2: Venda & Custo */}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1 flex-wrap">
                      <span>Venda:</span>
                      <span className="font-bold text-[#2563eb] dark:text-sky-400">
                        {formatCurrency(product.sellPrice)}
                      </span>
                      <span>/ {product.unit.toUpperCase()}</span>
                      <span className="mx-1 text-slate-300 dark:text-slate-700">•</span>
                      <span>Custo: {formatCurrency(product.costPrice)}</span>
                    </div>

                    {/* Line 3: Lucro badge & EAN */}
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="px-1.5 py-0.5 rounded-md bg-[#f0fdf4] dark:bg-emerald-950/40 text-[#16a34a] dark:text-emerald-400 border border-[#bbf7d0] dark:border-emerald-900/50 font-bold text-[10px] inline-flex items-center">
                        Lucro: {formatCurrency(profit)} ({profitPct.toFixed(1)}%)
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        EAN : {product.barcode || 'Não cadastrado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Quick Stock Stepper & Edit/Delete Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-[#16233d] flex items-center justify-between gap-2">
                  {/* Stock Stepper (Horizontal & Compact) */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      ESTOQUE
                    </span>
                    <div className="rounded-lg border border-blue-200/80 dark:border-blue-900/60 bg-[#f0f6ff] dark:bg-[#111e3b] p-0.5 flex items-center shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleQuickStockAdjust(product.id, -1)}
                        className="w-6 h-6 rounded-md bg-white dark:bg-[#0e172a] text-blue-600 dark:text-blue-400 hover:bg-blue-50 flex items-center justify-center font-bold transition-colors active:scale-95 shadow-2xs"
                        title="Diminuir estoque"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>

                      <span className="w-11 text-center text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {product.stock} {product.unit.toUpperCase()}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleQuickStockAdjust(product.id, 1)}
                        className="w-6 h-6 rounded-md bg-[#2563eb] text-white hover:bg-blue-600 flex items-center justify-center font-bold transition-colors active:scale-95 shadow-xs"
                        title="Aumentar estoque"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(product);
                        setShowProductModal(true);
                      }}
                      className="w-7.5 h-7.5 rounded-lg border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0c1527] text-slate-600 dark:text-slate-300 hover:text-[#2563eb] hover:bg-blue-50 dark:hover:bg-[#152342] flex items-center justify-center transition-colors shadow-2xs"
                      title="Editar produto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setProductToDelete(product)}
                      className="w-7.5 h-7.5 rounded-lg border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0c1527] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors shadow-2xs"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        categories={categories}
        initialProduct={editingProduct}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteProduct}
        title="Excluir Produto"
        message={`Tem certeza que deseja excluir o produto "${productToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isDestructive
      />

      {/* Camera Barcode Scanner Modal (abre direto a câmera) */}
      <CameraBarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onDetected={(code) => setSearch(code)}
      />

      {/* Product Image Zoom Modal */}
      <ProductImageZoomModal
        isOpen={Boolean(zoomedProduct)}
        product={zoomedProduct}
        onClose={() => setZoomedProduct(null)}
      />
    </div>
  );
};
