import React, { useEffect, useMemo, useState } from 'react';
import {
  Barcode,
  ChevronDown,
  Layers,
  LayoutGrid,
  List,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { CameraBarcodeScannerModal } from '../components/CameraBarcodeScannerModal';
import { CartDrawerModal } from '../components/CartDrawerModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { QuoteModal } from '../components/QuoteModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { ReturnModal } from '../components/ReturnModal';
import { SelectSaleForReturnModal } from '../components/SelectSaleForReturnModal';
import { useCart } from '../hooks/useCart';
import { Category, Product, Sale } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getStoredCategories, getStoredProducts } from '../utils/storage';

export const PDVPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [categories, setCategories] = useState<Category[]>(getStoredCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const {
    items,
    lastActiveItem,
    addItem,
    updateQuantity,
    total,
  } = useCart();

  // Modals state
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showSelectSaleForReturn, setShowSelectSaleForReturn] = useState(false);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<Sale | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [scanAlert, setScanAlert] = useState<string | null>(null);

  // Sync storage
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

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const cleanSearch = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !cleanSearch ||
        p.name.toLowerCase().includes(cleanSearch) ||
        p.code.toLowerCase().includes(cleanSearch) ||
        p.barcode.toLowerCase().includes(cleanSearch);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleBarcodeScanned = (scannedCode: string) => {
    const clean = scannedCode.trim();
    const product = products.find(
      (p) => p.barcode === clean || p.code === clean
    );

    if (product) {
      if (product.stock <= 0) {
        setScanAlert(`Atenção: "${product.name}" sem estoque.`);
      } else {
        addItem(product, 1);
        setScanAlert(`Adicionado: ${product.name}`);
      }
    } else {
      setScanAlert(`Código "${clean}" não encontrado.`);
    }

    setTimeout(() => {
      setScanAlert(null);
    }, 3000);
  };

  const handleSaleComplete = (sale: Sale) => {
    setCompletedSale(sale);
    setShowReceipt(true);
  };

  const getProductCartQty = (productId: string) => {
    const item = items.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);
  const activeCategoryName = selectedCategory === 'all' ? 'Todas as Categorias' : activeCategoryObj?.name || 'Categoria';

  // Last added item for top card
  const topCartItem = lastActiveItem || items[0] || null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-[#050b16] text-slate-900 dark:text-white max-w-md md:max-w-xl mx-auto w-full select-none relative transition-colors">
      
      {/* Scan alert banner */}
      {scanAlert && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-[#111c34] text-white border border-[#2563eb] px-4 py-2 rounded-2xl shadow-xl text-xs font-bold animate-in fade-in flex items-center gap-2">
          <Barcode className="w-4 h-4 text-[#3b82f6]" />
          <span>{scanAlert}</span>
        </div>
      )}

      {/* ========================================================
          FIXED TOP AREA: STAYS FROZEN AT THE TOP AT ALL TIMES
         ======================================================== */}
      <div className="shrink-0 px-3 pt-2 pb-2 bg-slate-100 dark:bg-[#050b16] z-20 space-y-2.5 transition-colors">
        
        {/* 1. TOP ROW: Cart Summary Button & Green COBRAR Button */}
        <div className="grid grid-cols-2 gap-2">
          
          {/* Left Card: Clickable Button to Open Cart */}
          <button
            type="button"
            onClick={() => setShowCartDrawer(true)}
            className="bg-white dark:bg-[#0e172a] border border-slate-200 dark:border-[#1b2b4c] hover:border-[#2563eb] dark:hover:border-[#2563eb] active:scale-[0.98] transition-all rounded-2xl p-2.5 flex items-center gap-2.5 overflow-hidden text-left cursor-pointer group shadow-xs"
            title="Clique para abrir o carrinho de compras"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2563eb] group-hover:bg-blue-500 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs transition-colors">
              {topCartItem ? topCartItem.quantity : 0}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-black text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-200 uppercase block truncate leading-tight transition-colors">
                {topCartItem ? topCartItem.product.name : 'SEM ITENS'}
              </span>
              <div className="text-[11px] font-mono mt-0.5">
                <span className="text-[#2563eb] dark:text-[#3b82f6] font-bold">
                  {topCartItem ? formatCurrency(topCartItem.subtotal) : 'R$ 0,00'}
                </span>
              </div>
            </div>
          </button>

          {/* Right Button: COBRAR */}
          <button
            type="button"
            onClick={() => setShowCheckout(true)}
            className="bg-[#00c076] hover:bg-[#00b06c] active:scale-98 text-white rounded-2xl px-3 py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-[#00c076]/25 font-black text-xs sm:text-sm tracking-wider uppercase transition-all"
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
              $
            </span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[11px] sm:text-xs">COBRAR</span>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold opacity-90 mt-0.5">
                ({formatCurrency(total)})
              </span>
            </div>
          </button>
        </div>

        {/* 2. SEARCH BAR & VIEW SWITCHER */}
        <div className="flex items-center gap-2">
          
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, código..."
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-white dark:bg-[#0c1527] border border-slate-200 dark:border-[#1a2846] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2563eb] transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Barcode Scanner Button */}
          <button
            type="button"
            onClick={() => setShowBarcodeScanner(true)}
            className="w-9 h-9 rounded-2xl bg-white dark:bg-[#0e182e] border border-slate-200 dark:border-[#1b2c4e] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-[#2b4170] flex items-center justify-center shrink-0 transition-colors shadow-2xs"
            title="Ler código de barras"
          >
            <div className="flex items-center gap-0.5">
              <span className="w-0.5 h-4 bg-slate-500 dark:bg-slate-300 rounded-full" />
              <span className="w-0.5 h-4 bg-slate-500 dark:bg-slate-300 rounded-full" />
              <span className="w-1 h-4 bg-slate-500 dark:bg-slate-300 rounded-full" />
              <span className="w-0.5 h-4 bg-slate-500 dark:bg-slate-300 rounded-full" />
              <span className="w-0.5 h-4 bg-slate-500 dark:bg-slate-300 rounded-full" />
            </div>
          </button>

          {/* List View Toggle Button */}
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
              viewMode === 'list'
                ? 'bg-[#2563eb] text-white shadow-xs'
                : 'bg-white dark:bg-[#0e182e] border border-slate-200 dark:border-[#1b2c4e] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 shadow-2xs'
            }`}
            title="Visualização em lista"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Grid View Toggle Button */}
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
              viewMode === 'grid'
                ? 'bg-[#2563eb] text-white shadow-xs'
                : 'bg-white dark:bg-[#0e182e] border border-slate-200 dark:border-[#1b2c4e] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 shadow-2xs'
            }`}
            title="Visualização em grade"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        {/* 3. CATEGORY SELECTOR CARD */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-full bg-white dark:bg-[#0e172a] border border-slate-200 dark:border-[#1b2c4e] rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-[#2b4170] transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-800 dark:text-slate-100">{activeCategoryName}</span>
              <span className="bg-slate-100 dark:bg-[#1a2846] text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                {filteredProducts.length} itens
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                showCategoryDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown popup */}
          {showCategoryDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-[#0e172a] border border-slate-200 dark:border-[#1e2f54] rounded-2xl shadow-2xl p-1.5 space-y-1 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setShowCategoryDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#2563eb] text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152342]'
                }`}
              >
                <span>Todas as Categorias</span>
                <span className="text-[10px] opacity-80">{products.length} itens</span>
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-[#2563eb] text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152342]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                    </div>
                    <span className="text-[10px] opacity-80">{count} itens</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          SCROLLABLE PRODUCTS AREA: ONLY THIS AREA SCROLLS!
         ======================================================== */}
      <div className="flex-1 overflow-y-auto px-3 pb-24 pt-1 space-y-2 pr-1.5 scrollbar-thin">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-bold">Nenhum produto encontrado</p>
          </div>
        ) : viewMode === 'list' ? (
          filteredProducts.map((product) => {
            const inCartQty = getProductCartQty(product.id);
            const isInCart = inCartQty > 0;

            return (
              <div
                key={product.id}
                className={`p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-2.5 transition-all ${
                  isInCart
                    ? 'bg-blue-50/70 dark:bg-[#0c1527] border-2 border-[#2563eb] shadow-[0_0_15px_rgba(37,99,235,0.18)]'
                    : 'bg-white dark:bg-[#0c1527] border border-slate-200 dark:border-[#16233d] hover:border-slate-300 dark:hover:border-[#22355c] shadow-2xs'
                }`}
              >
                {/* Left Badge or Photo */}
                {isInCart ? (
                  <div className="w-11 h-11 rounded-xl bg-[#2563eb] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {inCartQty}x
                  </div>
                ) : product.imageUrl ? (
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#111d38] border border-slate-200 dark:border-[#1e3058] shrink-0">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#111d38] border border-slate-200 dark:border-[#1e3058] text-slate-500 dark:text-slate-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                    #{product.code}
                  </div>
                )}

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 block leading-tight">
                    ##{product.code}
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white uppercase block truncate leading-tight">
                    {product.name}
                  </h3>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-[#00c076] uppercase block mt-0.5 tracking-wide">
                    EST: {product.stock} {product.unit.toUpperCase()}
                  </span>
                </div>

                {/* Right: Price & Stepper or Add Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm font-black font-mono text-[#2563eb] dark:text-[#3b82f6]">
                    {formatCurrency(product.sellPrice)}
                  </span>

                  {isInCart ? (
                    <div className="bg-slate-100 dark:bg-[#111d38] border border-slate-200 dark:border-[#1e3058] rounded-xl p-0.5 flex items-center">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, inCartQty - 1)}
                        className="w-6 h-6 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1e3058] flex items-center justify-center active:scale-95 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-6 text-center text-xs font-black text-slate-900 dark:text-white font-mono">
                        {inCartQty}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, inCartQty + 1)}
                        className="w-6 h-6 rounded-lg bg-[#2563eb] text-white hover:bg-blue-500 flex items-center justify-center active:scale-95 transition-all shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addItem(product, 1)}
                      className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-[#111e3b] hover:bg-[#2563eb] text-[#2563eb] dark:text-[#3b82f6] hover:text-white border border-blue-200 dark:border-[#1e325c] hover:border-transparent flex items-center justify-center transition-all active:scale-95 shadow-xs"
                      title="Adicionar ao carrinho"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 gap-2.5">
            {filteredProducts.map((product) => {
              const inCartQty = getProductCartQty(product.id);
              const isInCart = inCartQty > 0;

              return (
                <div
                  key={product.id}
                  className={`p-3 rounded-2xl flex flex-col justify-between transition-all ${
                    isInCart
                      ? 'bg-blue-50/70 dark:bg-[#0c1527] border-2 border-[#2563eb] shadow-[0_0_15px_rgba(37,99,235,0.18)]'
                      : 'bg-white dark:bg-[#0c1527] border border-slate-200 dark:border-[#16233d] shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>##{product.code}</span>
                      {isInCart && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#2563eb] text-white font-black text-[10px]">
                          {inCartQty}x
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-[#00c076] uppercase block mt-1">
                      EST: {product.stock} {product.unit.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#16233d] flex items-center justify-between gap-1">
                    <span className="text-xs font-black font-mono text-[#2563eb] dark:text-[#3b82f6]">
                      {formatCurrency(product.sellPrice)}
                    </span>
                    <button
                      type="button"
                      onClick={() => addItem(product, 1)}
                      className="w-7 h-7 rounded-xl bg-[#2563eb] text-white flex items-center justify-center active:scale-95 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Drawer / Modal */}
      <CartDrawerModal
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
        onCheckout={() => {
          setShowCartDrawer(false);
          setShowCheckout(true);
        }}
        onQuote={() => {
          setShowCartDrawer(false);
          setShowQuoteModal(true);
        }}
        onReturn={() => {
          setShowCartDrawer(false);
          setShowSelectSaleForReturn(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSaleComplete={handleSaleComplete}
      />

      {/* Quote Modal */}
      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
      />

      {/* Select Sale For Return Modal */}
      <SelectSaleForReturnModal
        isOpen={showSelectSaleForReturn}
        onClose={() => setShowSelectSaleForReturn(false)}
        onSelectSale={(sale) => {
          setSelectedSaleForReturn(sale);
          setShowReturnModal(true);
        }}
      />

      {/* Return Modal */}
      <ReturnModal
        sale={selectedSaleForReturn}
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false);
          setSelectedSaleForReturn(null);
        }}
        onSuccess={() => {
          setScanAlert('Devolução concluída com sucesso!');
          setTimeout(() => setScanAlert(null), 3000);
        }}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        sale={completedSale}
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        onNewSale={() => {
          setCompletedSale(null);
          setShowReceipt(false);
        }}
      />

      {/* Barcode / Camera Modals */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScanned}
      />

      <CameraBarcodeScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onDetected={handleBarcodeScanned}
      />
    </div>
  );
};
