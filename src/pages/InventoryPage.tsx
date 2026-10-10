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
} from 'lucide-react';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProductFormModal } from '../components/ProductFormModal';
import { Category, Product } from '../types';
import { formatCurrency } from '../utils/formatters';
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

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const cleanSearch = search.toLowerCase().trim();
      if (!cleanSearch) return true;
      return (
        p.name.toLowerCase().includes(cleanSearch) ||
        p.code.toLowerCase().includes(cleanSearch) ||
        p.barcode.toLowerCase().includes(cleanSearch)
      );
    });
  }, [products, search]);

  // Inventory stats
  const totalCostValue = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  const totalRetailValue = products.reduce((acc, p) => acc + p.stock * p.sellPrice, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

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
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#070e1c] text-slate-900 dark:text-white p-4 sm:p-5 max-w-xl mx-auto w-full pb-24 space-y-4 transition-colors">
      
      {/* ========================================================
          1. HEADER: Title & Action Buttons (Spreadsheet, Novo Produto, Moon)
         ======================================================== */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Controle de <br className="hidden sm:inline" /> Estoque
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

      {/* ========================================================
          2. METRICS 2x2 CARD
         ======================================================== */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] overflow-hidden shadow-xs grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-[#1a2846]">
        
        {/* Cell 1: Total de Produtos */}
        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
            Total de Produtos
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block font-mono">
            {products.length} itens
          </span>
        </div>

        {/* Cell 2: Valor em Estoque */}
        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
            Valor em Estoque
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-[#2563eb] dark:text-sky-400 block">
            {formatCurrency(totalRetailValue)}
          </span>
        </div>

        {/* Cell 3: Custo Total do Estoque */}
        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
            Custo Total do Estoque
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white block">
            {formatCurrency(totalCostValue)}
          </span>
        </div>

        {/* Cell 4: Estoque Baixo */}
        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
            Estoque Baixo
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-[#ea580c] dark:text-orange-400 block">
            {lowStockCount} itens
          </span>
        </div>
      </div>

      {/* ========================================================
          3. SEARCH BAR & BARCODE SCANNER
         ======================================================== */}
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, código ou código de barras..."
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

      {/* ========================================================
          4. PRODUCT CARDS LIST
         ======================================================== */}
      <div className="space-y-3">
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
                className="p-4 rounded-3xl bg-white dark:bg-[#0e172a] border border-slate-200 dark:border-[#1a2846] shadow-xs space-y-3"
              >
                {/* Top Info Row */}
                <div className="flex items-start gap-3">
                  {/* Photo or placeholder */}
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-[#1e3056]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#131f38] border border-slate-200 dark:border-[#1e3056] text-slate-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      #{product.code}
                    </div>
                  )}

                  {/* Info details */}
                  <div className="flex-1 min-w-0">
                    {/* Line 1: Name, Code badge, Category badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                        {product.name}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#152342] text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold border border-slate-200 dark:border-[#1e3056]">
                        #{product.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2563eb] dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 text-[10px] font-bold">
                        {getCategoryName(product.category)}
                      </span>
                    </div>

                    {/* Line 2: Venda & Custo */}
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 flex items-center gap-1 flex-wrap">
                      <span>Venda:</span>
                      <span className="font-black text-[#2563eb] dark:text-sky-400">
                        {formatCurrency(product.sellPrice)}
                      </span>
                      <span>/ {product.unit.toUpperCase()}</span>
                      <span className="ml-2">Custo: {formatCurrency(product.costPrice)}</span>
                    </div>

                    {/* Line 3: Lucro badge & EAN */}
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-[#f0fdf4] dark:bg-emerald-950/40 text-[#16a34a] dark:text-emerald-400 border border-[#bbf7d0] dark:border-emerald-900/50 font-bold text-[11px] inline-flex items-center">
                        Lucro: {formatCurrency(profit)} ({profitPct.toFixed(1)}%)
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        EAN : {product.barcode || 'Não cadastrado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Quick Stock Stepper & Edit/Delete Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-[#16233d] flex items-center justify-between gap-3">
                  
                  {/* Stock Stepper */}
                  <div className="flex flex-col items-center">
                    <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-[#f0f6ff] dark:bg-[#111e3b] p-0.5 flex items-center shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleQuickStockAdjust(product.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-[#0e172a] text-blue-600 dark:text-blue-400 hover:bg-blue-50 flex items-center justify-center font-bold transition-colors active:scale-95 shadow-2xs"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      <span className="w-12 text-center text-xs font-black text-slate-900 dark:text-white font-mono">
                        {product.stock} {product.unit.toUpperCase()}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleQuickStockAdjust(product.id, 1)}
                        className="w-7 h-7 rounded-lg bg-[#2563eb] text-white hover:bg-blue-600 flex items-center justify-center font-bold transition-colors active:scale-95 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      ESTOQUE
                    </span>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(product);
                        setShowProductModal(true);
                      }}
                      className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0c1527] text-slate-600 dark:text-slate-300 hover:text-[#2563eb] hover:bg-blue-50 dark:hover:bg-[#152342] flex items-center justify-center transition-colors shadow-2xs"
                      title="Editar produto"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setProductToDelete(product)}
                      className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0c1527] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors shadow-2xs"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-4 h-4" />
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

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={(code) => setSearch(code)}
      />
    </div>
  );
};
