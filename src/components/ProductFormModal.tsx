import React, { useEffect, useRef, useState } from 'react';
import {
  Barcode,
  Camera,
  Check,
  Package,
  Plus,
  Upload,
  X,
  ZoomIn,
} from 'lucide-react';
import { Category, Product, UnitType } from '../types';
import { getStoredCategories, saveStoredCategories } from '../utils/storage';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ProductImageZoomModal } from './ProductImageZoomModal';
import { formatCurrency, formatTitleCase } from '../utils/formatters';
import { playScannerBeep, validateBarcode } from '../utils/barcodeValidator';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  categories: Category[];
  initialProduct?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories: initialCategories,
  initialProduct,
}) => {
  const [categories, setCategories] = useState<Category[]>(() => {
    return initialCategories.length > 0 ? initialCategories : getStoredCategories();
  });

  const [code, setCode] = useState(
    initialProduct?.code || Math.floor(10000 + Math.random() * 90000).toString()
  );
  const [barcode, setBarcode] = useState(initialProduct?.barcode || '');
  const [name, setName] = useState(initialProduct?.name || '');
  const [category, setCategory] = useState(
    initialProduct?.category || categories[0]?.id || ''
  );
  const [costPrice, setCostPrice] = useState<number | null>(
    initialProduct && initialProduct.costPrice > 0 ? initialProduct.costPrice : null
  );
  const [sellPrice, setSellPrice] = useState<number | null>(
    initialProduct && initialProduct.sellPrice > 0 ? initialProduct.sellPrice : null
  );
  const [stock, setStock] = useState<number>(initialProduct ? initialProduct.stock : 1);
  const [minStock, setMinStock] = useState<number>(initialProduct ? initialProduct.minStock : 1);
  const [unit, setUnit] = useState<UnitType>(initialProduct?.unit || 'un');
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || '');
  const [showImageZoom, setShowImageZoom] = useState(false);

  // Reset form when modal opens or initialProduct changes
  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setCode(initialProduct.code || Math.floor(10000 + Math.random() * 90000).toString());
        setBarcode(initialProduct.barcode || '');
        setName(initialProduct.name || '');
        setCategory(initialProduct.category || categories[0]?.id || '');
        setCostPrice(initialProduct.costPrice > 0 ? initialProduct.costPrice : null);
        setSellPrice(initialProduct.sellPrice > 0 ? initialProduct.sellPrice : null);
        setStock(initialProduct.stock ?? 1);
        setMinStock(initialProduct.minStock ?? 1);
        setUnit(initialProduct.unit || 'un');
        setImageUrl(initialProduct.imageUrl || '');
      } else {
        // Novo Produto: nome, preço de venda e preço de custo começam totalmente limpos
        setCode(Math.floor(10000 + Math.random() * 90000).toString());
        setBarcode('');
        setName('');
        setCategory(categories[0]?.id || '');
        setCostPrice(null);
        setSellPrice(null);
        setStock(1);
        setMinStock(1);
        setUnit('un');
        setImageUrl('');
      }
      setError('');
    }
  }, [isOpen, initialProduct]);

  // Modals & sub-flows
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#2563eb');
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawUrl = event.target?.result as string;
        if (!rawUrl) return;
        const img = new Image();
        img.onload = () => {
          const maxDim = 500;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setImageUrl(canvas.toDataURL('image/jpeg', 0.75));
          } else {
            setImageUrl(rawUrl);
          }
        };
        img.onerror = () => setImageUrl(rawUrl);
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formatTitleCase(newCatName.trim());
    if (!cleanName) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: cleanName,
      color: newCatColor,
    };

    const currentCats = getStoredCategories();
    const updated = [...currentCats, newCat];
    saveStoredCategories(updated);
    setCategories(updated);
    setCategory(newCat.id);
    setNewCatName('');
    setShowNewCategoryModal(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursor = input.selectionStart;
    const formatted = formatTitleCase(input.value);
    setName(formatted);
    if (cursor !== null) {
      requestAnimationFrame(() => {
        input.setSelectionRange(cursor, cursor);
      });
    }
  };

  const handlePriceChange = (setter: (val: number | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setter(null);
      return;
    }
    const numeric = parseInt(rawDigits, 10) / 100;
    setter(numeric);
  };

  const currentSell = sellPrice ?? 0;
  const currentCost = costPrice ?? 0;
  const profitValue = Math.max(0, currentSell - currentCost);
  const marginPercent = currentSell > 0 ? ((currentSell - currentCost) / currentSell) * 100 : 0;
  const markupPercent =
    currentCost > 0
      ? ((currentSell - currentCost) / currentCost) * 100
      : currentSell > 0
      ? 100
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do produto é obrigatório.');
      return;
    }
    if (currentSell <= 0) {
      setError('O preço de venda deve ser maior que zero.');
      return;
    }

    onSave({
      code: code.trim().replace(/^#/, ''),
      barcode: barcode.trim(),
      name: formatTitleCase(name.trim()),
      description: initialProduct?.description || '',
      category: category || categories[0]?.id || '',
      costPrice: currentCost,
      sellPrice: currentSell,
      stock: Math.max(0, stock),
      minStock: Math.max(0, minStock),
      unit,
      imageUrl: imageUrl.trim() || undefined,
    });

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* ========================================================
              1. HEADER: Orange Box Icon, Title, Subtitle, Close Button
             ======================================================== */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shrink-0">
            <div className="flex items-center gap-3">
              {/* Orange Package Icon */}
              <div className="w-11 h-11 rounded-2xl bg-[#ff5500] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                <Package className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  {initialProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                  Controle de estoque e precificação
                </span>
              </div>
            </div>

            {/* Circular Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold">
                {error}
              </div>
            )}

            {/* ========================================================
                2. IMAGE CONTROLS ROW: Preview, Camera, Upload, Link URL
               ======================================================== */}
            <div className="flex items-center gap-2">
              {/* Preview with Click to Zoom / Default placeholder */}
              {imageUrl ? (
                <button
                  type="button"
                  onClick={() => setShowImageZoom(true)}
                  className="relative w-12 h-12 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-[#f0f4ff] dark:bg-blue-950/40 flex items-center justify-center overflow-hidden shrink-0 cursor-zoom-in group active:scale-95 transition-all shadow-2xs"
                  title="Clique para ampliar a imagem do produto"
                >
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <ZoomIn className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>
              ) : (
                <div className="w-12 h-12 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-[#f0f4ff] dark:bg-blue-950/40 flex items-center justify-center overflow-hidden shrink-0">
                  <Camera className="w-5 h-5 text-blue-400 dark:text-blue-400" />
                </div>
              )}

              {/* Camera Button (Orange) */}
              <button
                type="button"
                onClick={() => setShowCameraCapture(true)}
                className="w-12 h-12 rounded-2xl bg-[#ff5500] hover:bg-[#ea4e00] text-white flex items-center justify-center shadow-xs transition-colors shrink-0"
                title="Tirar foto com câmera"
              >
                <Camera className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* Upload from file button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center shadow-2xs transition-colors shrink-0"
                title="Enviar arquivo de imagem"
              >
                <Upload className="w-5 h-5 stroke-[2]" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Image URL Input */}
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Link da imagem (URL)..."
                className="flex-1 min-w-0 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2563eb] shadow-2xs"
              />
            </div>

            {/* ========================================================
                3. ROW: Código do Item & Unidade
               ======================================================== */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block mb-1">
                  Código do Item *
                </label>
                <input
                  type="text"
                  value={code.startsWith('#') ? code : `#${code}`}
                  onChange={(e) => setCode(e.target.value.replace(/^#/, ''))}
                  placeholder="#59712"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-xs font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563eb]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block mb-1">
                  Unidade
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as UnitType)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="un">UN (Unidade)</option>
                  <option value="kg">KG (Quilo)</option>
                  <option value="m">MT (Metro)</option>
                  <option value="l">L (Litro)</option>
                  <option value="cx">CX (Caixa)</option>
                  <option value="pc">PC (Peça)</option>
                  <option value="pct">PCT (Pacote)</option>
                  <option value="par">PAR (Par)</option>
                </select>
              </div>
            </div>

            {/* ========================================================
                4. ROW: Nome do Produto
               ======================================================== */}
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Ex: Lápis Ped Irwin, Cimento Cp-II..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#2563eb]"
                required
                autoFocus={!initialProduct}
              />
            </div>

            {/* ========================================================
                5. ROW: Preço de Custo & Preço de Venda
               ======================================================== */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block mb-1">
                  Preço de Custo
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={costPrice !== null && costPrice > 0 ? formatCurrency(costPrice) : ''}
                  onChange={handlePriceChange(setCostPrice)}
                  placeholder="R$ 0,00"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563eb] shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block mb-1">
                  Preço de Venda *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={sellPrice !== null && sellPrice > 0 ? formatCurrency(sellPrice) : ''}
                  onChange={handlePriceChange(setSellPrice)}
                  placeholder="R$ 0,00"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563eb] shadow-2xs"
                />
              </div>
            </div>

            {/* Banner: LUCRO, MARGEM e MARKUP */}
            <div className="py-1.5 px-3 rounded-2xl bg-[#ecfdf5] dark:bg-emerald-950/30 border border-[#a7f3d0] dark:border-emerald-900/60 grid grid-cols-3 text-center shadow-2xs">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#065f46] dark:text-emerald-400 block leading-none">
                  LUCRO
                </span>
                <span className="text-xs font-black font-mono text-[#065f46] dark:text-emerald-300 block leading-tight mt-0.5">
                  {formatCurrency(profitValue)}
                </span>
              </div>

              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#065f46] dark:text-emerald-400 block leading-none">
                  MARGEM
                </span>
                <span className="text-xs font-black font-mono text-[#065f46] dark:text-emerald-300 block leading-tight mt-0.5">
                  {marginPercent.toFixed(1)}%
                </span>
              </div>

              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#065f46] dark:text-emerald-400 block leading-none">
                  MARKUP
                </span>
                <span className="text-xs font-black font-mono text-[#065f46] dark:text-emerald-300 block leading-tight mt-0.5">
                  {markupPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* ========================================================
                6. ROW: Estoque Atual & Estoque Mínimo (Steppers)
               ======================================================== */}
            <div className="grid grid-cols-2 gap-3">
              {/* Estoque Atual */}
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block mb-1">
                  Estoque Atual *
                </label>
                <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-[#f0f6ff] dark:bg-[#111c33] p-1 flex items-center justify-between shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setStock((prev) => Math.max(0, prev - 1))}
                    className="w-7 h-7 rounded-xl bg-white dark:bg-[#1a2947] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#22355c] flex items-center justify-center font-bold shadow-2xs transition-all active:scale-95 shrink-0"
                    title="Diminuir"
                  >
                    -
                  </button>

                  <div className="flex items-center justify-center gap-0.5 flex-1 min-w-0 px-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={stock}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        setStock(isNaN(parsed) ? 0 : Math.max(0, parsed));
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-11 text-center bg-transparent hover:bg-white/60 dark:hover:bg-white/10 focus:bg-white dark:focus:bg-[#1a2947] text-xs font-black text-slate-900 dark:text-white font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 py-0.5 transition-colors cursor-text"
                      title="Clique para digitar a quantidade"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold shrink-0">
                      {unit}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStock((prev) => prev + 1)}
                    className="w-7 h-7 rounded-xl bg-[#2563eb] text-white hover:bg-blue-600 flex items-center justify-center font-bold shadow-xs transition-all active:scale-95 shrink-0"
                    title="Aumentar"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Estoque Mínimo */}
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block mb-1">
                  Estoque Mínimo
                </label>
                <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-[#f0f6ff] dark:bg-[#111c33] p-1 flex items-center justify-between shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setMinStock((prev) => Math.max(0, prev - 1))}
                    className="w-7 h-7 rounded-xl bg-white dark:bg-[#1a2947] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#22355c] flex items-center justify-center font-bold shadow-2xs transition-all active:scale-95 shrink-0"
                    title="Diminuir"
                  >
                    -
                  </button>

                  <div className="flex items-center justify-center gap-0.5 flex-1 min-w-0 px-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={minStock}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        setMinStock(isNaN(parsed) ? 0 : Math.max(0, parsed));
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-11 text-center bg-transparent hover:bg-white/60 dark:hover:bg-white/10 focus:bg-white dark:focus:bg-[#1a2947] text-xs font-black text-slate-900 dark:text-white font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 py-0.5 transition-colors cursor-text"
                      title="Clique para digitar a quantidade"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold shrink-0">
                      {unit}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMinStock((prev) => prev + 1)}
                    className="w-7 h-7 rounded-xl bg-[#2563eb] text-white hover:bg-blue-600 flex items-center justify-center font-bold shadow-xs transition-all active:scale-95 shrink-0"
                    title="Aumentar"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================
                7. ROW: Categoria & + Nova Categoria
               ======================================================== */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                  Categoria
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(true)}
                  className="text-xs font-bold text-[#2563eb] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nova Categoria</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563eb]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(true)}
                  className="w-10 h-10 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-[#eff6ff] dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 flex items-center justify-center font-bold shadow-2xs shrink-0 transition-colors"
                  title="Adicionar nova categoria"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* ========================================================
                8. ROW: Código de Barras (EAN) & Botão LER
               ======================================================== */}
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block mb-1">
                Código de Barras (EAN)
              </label>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 p-1 pl-3.5 flex items-center justify-between gap-2 shadow-2xs">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = validateBarcode(barcode);
                      if (val.cleaned) {
                        setBarcode(val.cleaned);
                        playScannerBeep();
                        if (navigator.vibrate) navigator.vibrate(60);
                      }
                    }
                  }}
                  placeholder="7896541364845"
                  className="flex-1 min-w-0 bg-transparent text-xs font-bold font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />

                {barcode && (
                  <button
                    type="button"
                    onClick={() => setBarcode('')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Orange Ler Barcode Button */}
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#ff5500] hover:bg-[#ea4e00] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer active:scale-95"
                >
                  <Barcode className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Ler</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Toque no botão para ler o código direto da embalagem
              </span>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-[#2563eb] hover:bg-blue-600 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{initialProduct ? 'Salvar Alteração' : 'Salvar Produto'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-[#0f172a] rounded-3xl p-5 shadow-2xl space-y-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Nova Categoria</h3>
              <button
                type="button"
                onClick={() => setShowNewCategoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(formatTitleCase(e.target.value))}
                  placeholder="Ex: Tintas, Elétrica..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2563eb]"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-2">
                  {['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#e11d48', '#0891b2'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newCatColor === c ? 'scale-125 ring-2 ring-slate-900 dark:ring-white ring-offset-2 dark:ring-offset-slate-900' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-blue-600"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onCapture={(img) => setImageUrl(img)}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(codigo) => {
          setBarcode(codigo);
        }}
      />

      {/* Product Image Zoom Modal */}
      <ProductImageZoomModal
        isOpen={showImageZoom}
        onClose={() => setShowImageZoom(false)}
        imageSrc={imageUrl}
        title={name || 'Foto do Produto'}
        subtitle={code ? `#${code}` : undefined}
      />
    </>
  );
};
