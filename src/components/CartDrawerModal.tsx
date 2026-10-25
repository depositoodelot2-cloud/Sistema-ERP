import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  FileText,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  Tag,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import { CustomerSelectModal } from './CustomerSelectModal';

interface CartDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  onQuote: () => void;
  onReturn: () => void;
}

export const CartDrawerModal: React.FC<CartDrawerModalProps> = ({
  isOpen,
  onClose,
  onCheckout,
  onQuote,
  onReturn,
}) => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    discount,
    setDiscount,
    surcharge,
    setSurcharge,
    total,
    selectedCustomer,
    setSelectedCustomer,
  } = useCart();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);

  // Desconto
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountType, setDiscountType] = useState<'value' | 'percent'>('value');
  const [discountVal, setDiscountVal] = useState<number>(discount || 0);
  const [discountPercentStr, setDiscountPercentStr] = useState<string>('');

  // Acréscimo
  const [showSurchargeInput, setShowSurchargeInput] = useState(false);
  const [surchargeType, setSurchargeType] = useState<'value' | 'percent'>('value');
  const [surchargeVal, setSurchargeVal] = useState<number>(surcharge || 0);
  const [surchargePercentStr, setSurchargePercentStr] = useState<string>('');

  useEffect(() => {
    setDiscountVal(discount || 0);
  }, [discount]);

  useEffect(() => {
    setSurchargeVal(surcharge || 0);
  }, [surcharge]);

  if (!isOpen) return null;

  const totalProductsCount = items.length;

  const formatNumberOnly = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Handlers de Desconto
  const handleDiscountValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setDiscountVal(0);
      return;
    }
    const numeric = parseInt(rawDigits, 10) / 100;
    setDiscountVal(numeric);
  };

  const handleDiscountPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/[^0-9,\.]/g, '');
    const parts = clean.split(/[,.]/);
    if (parts.length > 2) {
      clean = parts[0] + ',' + parts.slice(1).join('');
    }
    setDiscountPercentStr(clean);
  };

  const handleApplyDiscount = () => {
    if (discountType === 'value') {
      setDiscount(Math.max(0, Math.min(discountVal, subtotal)));
    } else {
      const parsed = parseFloat(discountPercentStr.replace(',', '.')) || 0;
      const calculated = Math.max(0, Math.min(subtotal, (subtotal * parsed) / 100));
      setDiscount(calculated);
    }
    setShowDiscountInput(false);
  };

  const handleRemoveDiscount = () => {
    setDiscount(0);
    setDiscountVal(0);
    setDiscountPercentStr('');
    setShowDiscountInput(false);
  };

  // Handlers de Acréscimo
  const handleSurchargeValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setSurchargeVal(0);
      return;
    }
    const numeric = parseInt(rawDigits, 10) / 100;
    setSurchargeVal(numeric);
  };

  const handleSurchargePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/[^0-9,\.]/g, '');
    const parts = clean.split(/[,.]/);
    if (parts.length > 2) {
      clean = parts[0] + ',' + parts.slice(1).join('');
    }
    setSurchargePercentStr(clean);
  };

  const handleApplySurcharge = () => {
    if (surchargeType === 'value') {
      setSurcharge(Math.max(0, surchargeVal));
    } else {
      const parsed = parseFloat(surchargePercentStr.replace(',', '.')) || 0;
      const calculated = Math.max(0, (subtotal * parsed) / 100);
      setSurcharge(calculated);
    }
    setShowSurchargeInput(false);
  };

  const handleRemoveSurcharge = () => {
    setSurcharge(0);
    setSurchargeVal(0);
    setSurchargePercentStr('');
    setShowSurchargeInput(false);
  };

  const customerDisplayName = selectedCustomer
    ? selectedCustomer.name.length > 20
      ? `${selectedCustomer.name.slice(0, 18)}...`
      : selectedCustomer.name
    : 'Consumidor Final (B...';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-t-3xl sm:rounded-3xl text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
          
          {/* ========================================================
              TOP HEADER: Orange Bag Icon, Title, Orçamento, Trash, Close
             ======================================================== */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shrink-0">
            <div className="flex items-center gap-3">
              {/* Orange Shopping Bag Icon */}
              <div className="w-11 h-11 rounded-2xl bg-[#ff5500] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  Carrinho de Compras
                </h2>
                <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                  {totalProductsCount} {totalProductsCount === 1 ? 'produto adicionado' : 'produtos adicionados'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Orçamento pill button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onQuote();
                }}
                disabled={items.length === 0}
                className="px-2.5 py-1.5 rounded-xl border border-[#dbe4ff] dark:border-indigo-900/60 bg-[#f0f4ff] dark:bg-indigo-950/40 hover:bg-[#e4ebff] dark:hover:bg-indigo-950/60 text-[#4f46e5] dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Orçamento</span>
              </button>

              {/* Red Trash Icon (Clear cart) */}
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Esvaziar carrinho"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

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
          </div>

          {/* ========================================================
              CUSTOMER ROW: Cliente, Alterar
             ======================================================== */}
          <div className="px-4 py-2.5 bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs truncate flex-1 min-w-0">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Cliente:</span>
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {customerDisplayName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowCustomerSelect(true)}
                className="px-2.5 py-1 rounded-lg border border-[#dbeafe] dark:border-blue-900/60 bg-white dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-950/70 text-[#2563eb] dark:text-blue-400 text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
              >
                Alterar
              </button>
            </div>
          </div>

          {/* ========================================================
              ITEMS LIST: Cards with Steppers and Trash
             ======================================================== */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#fafbfc] dark:bg-[#080f1d]">
            {items.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-center">
                <ShoppingBag className="w-14 h-14 stroke-1 mb-2 opacity-30 text-slate-400" />
                <p className="font-bold text-sm text-slate-700 dark:text-slate-200">Carrinho Vazio</p>
                <p className="text-xs text-slate-400 max-w-xs mt-0.5">
                  Adicione produtos no PDV para fechar a venda.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#111c33] border border-slate-150 dark:border-[#1a2b4d] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-none flex items-center justify-between gap-3"
                >
                  {/* Name and Price breakdown */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white block truncate leading-tight">
                      {item.product.name}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>{formatCurrency(item.unitPrice)} / {item.product.unit.toUpperCase()}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  </div>

                  {/* Stepper & Trash */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-[#f0f6ff] dark:bg-[#16233f] p-0.5 flex items-center">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-[#1f2e4d] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#253966] flex items-center justify-center shadow-2xs transition-colors active:scale-95"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>

                      <span className="w-7 text-center text-xs font-black text-slate-900 dark:text-white font-mono">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-[#2563eb] text-white hover:bg-blue-600 flex items-center justify-center shadow-xs transition-colors active:scale-95"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      title="Excluir item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ========================================================
              BOTTOM TOTALS & ACTIONS
             ======================================================== */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] space-y-3 shrink-0">
            
            {/* Subtotal row */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {/* Discount & Surcharge rows */}
            <div className="space-y-2">
              {/* Desconto Aplicado */}
              {discount > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Desconto aplicado:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountVal(discount);
                        setShowDiscountInput(true);
                      }}
                      className="text-[10px] text-emerald-700 dark:text-emerald-400 underline ml-1 hover:text-emerald-900 cursor-pointer"
                    >
                      editar
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="text-[10px] text-rose-500 underline ml-1 hover:text-rose-700 cursor-pointer"
                    >
                      remover
                    </button>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    -{formatCurrency(discount)}
                  </span>
                </div>
              )}

              {/* Input de Desconto com Opção R$ (Valor) e % (Porcentagem) */}
              {showDiscountInput && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in duration-150">
                  {/* Top: Label & Segmented Control */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Tipo de Desconto:
                    </span>
                    <div className="inline-flex p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-xs">
                      <button
                        type="button"
                        onClick={() => setDiscountType('value')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          discountType === 'value'
                            ? 'bg-white dark:bg-slate-900 text-[#ea580c] dark:text-orange-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        R$ (Valor)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('percent')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          discountType === 'percent'
                            ? 'bg-white dark:bg-slate-900 text-[#ea580c] dark:text-orange-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        % (Porcentagem)
                      </button>
                    </div>
                  </div>

                  {/* Bottom: Input field with prefix, right-aligned number and Aplicar button */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all shadow-2xs">
                      <span className="text-xs font-bold text-slate-400 select-none mr-2">
                        {discountType === 'value' ? 'R$' : '%'}
                      </span>
                      <input
                        type="text"
                        inputMode={discountType === 'value' ? 'numeric' : 'decimal'}
                        placeholder={discountType === 'value' ? '0,00' : '0'}
                        value={
                          discountType === 'value'
                            ? (discountVal > 0 ? formatNumberOnly(discountVal) : '0,00')
                            : discountPercentStr
                        }
                        onChange={
                          discountType === 'value'
                            ? handleDiscountValueChange
                            : handleDiscountPercentChange
                        }
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyDiscount();
                          }
                          if (e.key === 'Escape') setShowDiscountInput(false);
                        }}
                        className="w-full text-right text-xs font-mono font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none placeholder:text-slate-300"
                        autoFocus
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      className="px-4 py-2 rounded-xl bg-[#0f172a] dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-xs active:scale-95"
                    >
                      Aplicar
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDiscountInput(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Realtime calculated equivalence for % */}
                  {discountType === 'percent' && parseFloat(discountPercentStr.replace(',', '.')) > 0 && (
                    <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 text-right pr-1">
                      Equivale a -{formatCurrency((subtotal * (parseFloat(discountPercentStr.replace(',', '.')) || 0)) / 100)} de desconto
                    </div>
                  )}
                </div>
              )}

              {/* Acréscimo Aplicado */}
              {surcharge > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-[#2563eb] dark:text-blue-400 font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Acréscimo aplicado:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSurchargeType('value');
                        setSurchargeVal(surcharge);
                        setShowSurchargeInput(true);
                      }}
                      className="text-[10px] text-blue-700 dark:text-blue-400 underline ml-1 hover:text-blue-900 cursor-pointer"
                    >
                      editar
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveSurcharge}
                      className="text-[10px] text-rose-500 underline ml-1 hover:text-rose-700 cursor-pointer"
                    >
                      remover
                    </button>
                  </div>
                  <span className="font-bold text-[#2563eb] dark:text-blue-400 font-mono">
                    +{formatCurrency(surcharge)}
                  </span>
                </div>
              )}

              {/* Input de Acréscimo com Opção R$ (Valor) e % (Porcentagem) */}
              {showSurchargeInput && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in duration-150">
                  {/* Top: Label & Segmented Control */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Tipo de Acréscimo:
                    </span>
                    <div className="inline-flex p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-xs">
                      <button
                        type="button"
                        onClick={() => setSurchargeType('value')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          surchargeType === 'value'
                            ? 'bg-white dark:bg-slate-900 text-[#2563eb] dark:text-blue-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        R$ (Valor)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSurchargeType('percent')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          surchargeType === 'percent'
                            ? 'bg-white dark:bg-slate-900 text-[#2563eb] dark:text-blue-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        % (Porcentagem)
                      </button>
                    </div>
                  </div>

                  {/* Bottom: Input field with prefix, right-aligned number and Aplicar button */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-2xs">
                      <span className="text-xs font-bold text-slate-400 select-none mr-2">
                        {surchargeType === 'value' ? 'R$' : '%'}
                      </span>
                      <input
                        type="text"
                        inputMode={surchargeType === 'value' ? 'numeric' : 'decimal'}
                        placeholder={surchargeType === 'value' ? '0,00' : '0'}
                        value={
                          surchargeType === 'value'
                            ? (surchargeVal > 0 ? formatNumberOnly(surchargeVal) : '0,00')
                            : surchargePercentStr
                        }
                        onChange={
                          surchargeType === 'value'
                            ? handleSurchargeValueChange
                            : handleSurchargePercentChange
                        }
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplySurcharge();
                          }
                          if (e.key === 'Escape') setShowSurchargeInput(false);
                        }}
                        className="w-full text-right text-xs font-mono font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none placeholder:text-slate-300"
                        autoFocus
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleApplySurcharge}
                      className="px-4 py-2 rounded-xl bg-[#0f172a] dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-xs active:scale-95"
                    >
                      Aplicar
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSurchargeInput(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Realtime calculated equivalence for % */}
                  {surchargeType === 'percent' && parseFloat(surchargePercentStr.replace(',', '.')) > 0 && (
                    <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 text-right pr-1">
                      Equivale a +{formatCurrency((subtotal * (parseFloat(surchargePercentStr.replace(',', '.')) || 0)) / 100)} de acréscimo
                    </div>
                  )}
                </div>
              )}

              {/* Botões para Adicionar Desconto e Acréscimo */}
              <div className="flex items-center gap-3 pt-0.5 flex-wrap">
                {discount === 0 && !showDiscountInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('value');
                      setDiscountVal(0);
                      setDiscountPercentStr('');
                      setShowDiscountInput(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#ea580c] dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>+ Adicionar Desconto</span>
                  </button>
                )}

                {surcharge === 0 && !showSurchargeInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSurchargeType('value');
                      setSurchargeVal(0);
                      setSurchargePercentStr('');
                      setShowSurchargeInput(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#2563eb] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+ Adicionar Acréscimo</span>
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

            {/* TOTAL DOS ITENS Highlight */}
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  TOTAL DOS ITENS
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                  {items.reduce((sum, i) => sum + i.quantity, 0)} itens no carrinho
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white leading-none">
                {formatCurrency(total)}
              </span>
            </div>

            {/* ACTION BUTTONS: DEVOLUÇÃO & COBRAR */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              
              {/* DEVOLUÇÃO button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReturn();
                }}
                className="py-3 px-3 rounded-2xl bg-[#fffdf5] dark:bg-amber-950/20 border-2 border-[#fcd34d] dark:border-amber-700/60 hover:bg-[#fff9e6] dark:hover:bg-amber-950/30 active:scale-[0.98] text-[#78350f] dark:text-amber-300 font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <RotateCcw className="w-4 h-4 text-[#92400e] dark:text-amber-400 stroke-[2.2]" />
                <span>DEVOLUÇÃO</span>
              </button>

              {/* COBRAR button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                disabled={items.length === 0}
                className="py-3 px-4 rounded-2xl bg-[#ff5500] hover:bg-[#ea4e00] disabled:opacity-40 text-white font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all"
              >
                <span>COBRAR</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearCart}
        title="Limpar Carrinho"
        message="Tem certeza que deseja remover todos os itens adicionados ao carrinho?"
        confirmText="Limpar Tudo"
        isDestructive
      />

      <CustomerSelectModal
        isOpen={showCustomerSelect}
        onClose={() => setShowCustomerSelect(false)}
        selectedCustomerId={selectedCustomer?.id}
        onSelect={(c) => setSelectedCustomer(c)}
      />
    </>
  );
};
