import React, { useRef, useState } from 'react';
import {
  Barcode,
  Camera,
  Check,
  Package,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import { Category, Product, UnitType } from '../types';
import { getStoredCategories, saveStoredCategories } from '../utils/storage';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import { formatCurrency } from '../utils/formatters';

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
  const [costPrice, setCostPrice] = useState(initialProduct?.costPrice || 0);
  const [sellPrice, setSellPrice] = useState(initialProduct?.sellPrice || 0);
  const [stock, setStock] = useState<number>(initialProduct ? initialProduct.stock : 1);
  const [minStock, setMinStock] = useState<number>(initialProduct ? initialProduct.minStock : 1);
  const [unit, setUnit] = useState<UnitType>(initialProduct?.unit || 'un');
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || '');

  // Modals & sub-flows
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
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
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
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

  const handlePriceChange = (setter: (val: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    const numeric = rawDigits ? parseInt(rawDigits, 10) / 100 : 0;
    setter(numeric);
  };

  const profitValue = Math.max(0, sellPrice - costPrice);
  const marginPercent = sellPrice > 0 ? ((sellPrice - costPrice) / sellPrice) * 100 : 0;
  const markupPercent =
    costPrice > 0
      ? ((sellPrice - costPrice) / costPrice) * 100
      : sellPrice > 0
      ? 100
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do produto é obrigatório.');
      return;
    }
    if (sellPrice <= 0) {
      setError('O preço de venda deve ser maior que zero.');
      return;
    }

    onSave({
      code: code.trim().replace(/^#/, ''),
      barcode: barcode.trim(),
      name: name.trim(),
      description: initialProduct?.description || '',
      category: category || categories[0]?.id || '',
      costPrice,
      sellPrice,
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
        <div className="relative w-full max-w-md bg-white rounded-3xl text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* ========================================================
              1. HEADER: Orange Box Icon, Title, Subtitle, Close Button
             ======================================================== */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              {/* Orange Package Icon */}
              <div className="w-11 h-11 rounded-2xl bg-[#ff5500] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                <Package className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  {initialProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  Controle de estoque e precificação
                </span>
              </div>
            </div>

            {/* Circular Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
                {error}
              </div>
            )}

            {/* ========================================================
                2. IMAGE CONTROLS ROW: Preview, Camera, Upload, Link URL
               ======================================================== */}
            <div className="flex items-center gap-2">
              {/* Preview / Default placeholder */}
              <div className="w-12 h-12 rounded-2xl border border-blue-200 bg-[#f0f4ff] flex items-center justify-center overflow-hidden shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-5 h-5 text-blue-400" />
                )}
              </div>

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
                className="w-12 h-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center shadow-2xs transition-colors shrink-0"
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
                className="flex-1 min-w-0 px-3 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2563eb] shadow-2xs"
              />
            </div>

            {/* ========================================================
                3. ROW: Código do Item & Unidade
               ======================================================== */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Código do Item *
                </label>
                <input
                  type="text"
                  value={code.startsWith('#') ? code : `#${code}`}
                  onChange={(e) => setCode(e.target.value.replace(/^#/, ''))}
                  placeholder="#59712"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-[#2563eb]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Unidade
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as UnitType)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-[#2563eb]"
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
              <label className="text-xs font-bold text-slate-900 block mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="EX: LÁPIS PED IRWIN, CIMENTO CP-II..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal uppercase focus:outline-none focus:border-[#2563eb]"
                required
              />
            </div>

            {/* ========================================================
                5. ROW: Preço de Venda & Preço de Custo
               ======================================================== */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Preço de Venda *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrency(sellPrice)}
                  onChange={handlePriceChange(setSellPrice)}
                  placeholder="R$ 0,00"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-black font-mono text-slate-900 focus:outline-none focus:border-[#2563eb] shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Preço de Custo
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrency(costPrice)}
                  onChange={handlePriceChange(setCostPrice)}
                  placeholder="R$ 0,00"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-black font-mono text-slate-900 focus:outline-none focus:border-[#2563eb] shadow-2xs"
                />
              </div>
            </div>

            {/* Banner: LUCRO, MARGEM e MARKUP (metade da altura vertical) */}
            <div className="py-1.5 px-3 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] grid grid-cols-3 text-center shadow-2xs">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#065f46] block leading-none">
                  LUCRO
                </span>
                <span className="text-xs font-black font-mono text-[#065f46] block leading-tight mt-0.5">
                  {formatCurrency(profitValue)}
                </span>
              </div>

              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#065f46] block leading-none">
                  MARGEM
                </span>
                <span className="text-xs font-black font-mono text-[#065f46] block leading-tight mt-0.5">
                  {marginPercent.toFixed(1)}%
                </span>
              </div>

              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#065f46] block leading-none">
                  MARKUP
                </span>
                <span className="text-xs font-black font-mono text-[#065f46] block leading-tight mt-0.5">
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
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Estoque Atual *
                </label>
                <div className="rounded-2xl border border-blue-200 bg-[#f0f6ff] p-1 flex items-center justify-between shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setStock((prev) => Math.max(0, prev - 1))}
                    className="w-7 h-7 rounded-xl bg-white text-blue-600 hover:bg-blue-50 flex items-center justify-center font-bold shadow-2xs transition-all active:scale-95 shrink-0"
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
                      className="w-11 text-center bg-transparent hover:bg-white/60 focus:bg-white text-xs font-black text-slate-900 font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 py-0.5 transition-colors cursor-text"
                      title="Clique para digitar a quantidade"
                    />
                    <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">
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
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Estoque Mínimo
                </label>
                <div className="rounded-2xl border border-blue-200 bg-[#f0f6ff] p-1 flex items-center justify-between shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setMinStock((prev) => Math.max(0, prev - 1))}
                    className="w-7 h-7 rounded-xl bg-white text-blue-600 hover:bg-blue-50 flex items-center justify-center font-bold shadow-2xs transition-all active:scale-95 shrink-0"
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
                      className="w-11 text-center bg-transparent hover:bg-white/60 focus:bg-white text-xs font-black text-slate-900 font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 py-0.5 transition-colors cursor-text"
                      title="Clique para digitar a quantidade"
                    />
                    <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">
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
                <label className="text-xs font-bold text-slate-900">
                  Categoria
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(true)}
                  className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nova Categoria</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-[#2563eb]"
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
                  className="w-10 h-10 rounded-2xl border border-blue-200 bg-[#eff6ff] text-[#2563eb] hover:bg-blue-100 flex items-center justify-center font-bold shadow-2xs shrink-0 transition-colors"
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
              <label className="text-xs font-bold text-slate-900 block mb-1">
                Código de Barras (EAN)
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-1 pl-3.5 flex items-center justify-between gap-2 shadow-2xs">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="7896541364845"
                  className="flex-1 min-w-0 bg-transparent text-xs font-bold font-mono text-slate-900 focus:outline-none"
                />

                {barcode && (
                  <button
                    type="button"
                    onClick={() => setBarcode('')}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Orange Ler Barcode Button */}
                <button
                  type="button"
                  onClick={() => setShowBarcodeScanner(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#ff5500] hover:bg-[#ea4e00] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
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
                <span>Salvar Produto</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Nova Categoria</h3>
              <button
                type="button"
                onClick={() => setShowNewCategoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Tintas, Elétrica..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#2563eb]"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-2">
                  {['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#e11d48', '#0891b2'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newCatColor === c ? 'scale-125 ring-2 ring-slate-900 ring-offset-2' : ''
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
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
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

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onDetected={(scanned) => setBarcode(scanned)}
      />
    </>
  );
};
