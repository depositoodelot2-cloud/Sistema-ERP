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
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountVal, setDiscountVal] = useState<number>(discount || 0);
  const [showSurchargeInput, setShowSurchargeInput] = useState(false);
  const [surchargeVal, setSurchargeVal] = useState<number>(surcharge || 0);

  useEffect(() => {
    setDiscountVal(discount || 0);
  }, [discount]);

  useEffect(() => {
    setSurchargeVal(surcharge || 0);
  }, [surcharge]);

  if (!isOpen) return null;

  const totalProductsCount = items.length;

  const handleDiscountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setDiscountVal(0);
      return;
    }
    const numeric = parseInt(rawDigits, 10) / 100;
    setDiscountVal(numeric);
  };

  const handleApplyDiscount = () => {
    setDiscount(Math.max(0, Math.min(discountVal, subtotal)));
    setShowDiscountInput(false);
  };

  const handleRemoveDiscount = () => {
    setDiscount(0);
    setDiscountVal(0);
    setShowDiscountInput(false);
  };

  const handleSurchargeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setSurchargeVal(0);
      return;
    }
    const numeric = parseInt(rawDigits, 10) / 100;
    setSurchargeVal(numeric);
  };

  const handleApplySurcharge = () => {
    setSurcharge(Math.max(0, surchargeVal));
    setShowSurchargeInput(false);
  };

  const handleRemoveSurcharge = () => {
    setSurcharge(0);
    setSurchargeVal(0);
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
        <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
          
          {/* ========================================================
              TOP HEADER: Orange Bag Icon, Title, Orçamento, Trash, Close
             ======================================================== */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              {/* Orange Shopping Bag Icon */}
              <div className="w-11 h-11 rounded-2xl bg-[#ff5500] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  Carrinho de Compras
                </h2>
                <span className="text-xs text-slate-400 font-medium">
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
                className="px-2.5 py-1.5 rounded-xl border border-[#dbe4ff] bg-[#f0f4ff] hover:bg-[#e4ebff] text-[#4f46e5] font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Orçamento</span>
              </button>

              {/* Red Trash Icon (Clear cart) */}
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                  title="Esvaziar carrinho"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

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
          </div>

          {/* ========================================================
              CUSTOMER ROW: Cliente, Alterar, Orçamento
             ======================================================== */}
          <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs truncate flex-1 min-w-0">
              <span className="text-slate-500 font-medium">Cliente:</span>
              <span className="font-bold text-slate-900 truncate">
                {customerDisplayName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowCustomerSelect(true)}
                className="px-2.5 py-1 rounded-lg border border-[#dbeafe] bg-white hover:bg-blue-50 text-[#2563eb] text-[11px] font-bold transition-colors shadow-2xs"
              >
                Alterar
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onQuote();
                }}
                disabled={items.length === 0}
                className="px-2.5 py-1 rounded-lg bg-[#4338ca] hover:bg-[#3730a3] text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-xs disabled:opacity-40"
              >
                <FileText className="w-3 h-3" />
                <span>Orçamento</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              ITEMS LIST: White Cards with Steppers and Trash
             ======================================================== */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#fafbfc]">
            {items.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-center">
                <ShoppingBag className="w-14 h-14 stroke-1 mb-2 opacity-30 text-slate-400" />
                <p className="font-bold text-sm text-slate-700">Carrinho Vazio</p>
                <p className="text-xs text-slate-400 max-w-xs mt-0.5">
                  Adicione produtos no PDV para fechar a venda.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-150 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-between gap-3"
                >
                  {/* Name and Price breakdown */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-slate-900 uppercase block truncate leading-tight">
                      {item.product.name}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>{formatCurrency(item.unitPrice)} / {item.product.unit.toUpperCase()}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  </div>

                  {/* Stepper & Trash */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="rounded-xl border border-blue-200 bg-[#f0f6ff] p-0.5 flex items-center">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white text-blue-600 hover:bg-blue-50 flex items-center justify-center shadow-2xs transition-colors active:scale-95"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>

                      <span className="w-7 text-center text-xs font-black text-slate-900 font-mono">
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
              BOTTOM TOTALS & ACTIONS: Exactly like Screenshot
             ======================================================== */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-3 shrink-0">
            
            {/* Subtotal row */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {/* Discount & Surcharge rows */}
            <div className="space-y-2">
              {/* Desconto Aplicado */}
              {discount > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Desconto aplicado:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountVal(discount);
                        setShowDiscountInput(true);
                      }}
                      className="text-[10px] text-emerald-700 underline ml-1 hover:text-emerald-900 cursor-pointer"
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
                  <span className="font-bold text-emerald-600 font-mono">
                    -{formatCurrency(discount)}
                  </span>
                </div>
              )}

              {/* Input de Desconto */}
              {showDiscountInput && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={discountVal > 0 ? formatCurrency(discountVal) : ''}
                      onChange={handleDiscountInputChange}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyDiscount();
                        }
                        if (e.key === 'Escape') setShowDiscountInput(false);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-orange-300 bg-white text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDiscountInput(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Acréscimo Aplicado */}
              {surcharge > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-[#2563eb] font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Acréscimo aplicado:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSurchargeVal(surcharge);
                        setShowSurchargeInput(true);
                      }}
                      className="text-[10px] text-blue-700 underline ml-1 hover:text-blue-900 cursor-pointer"
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
                  <span className="font-bold text-[#2563eb] font-mono">
                    +{formatCurrency(surcharge)}
                  </span>
                </div>
              )}

              {/* Input de Acréscimo */}
              {showSurchargeInput && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={surchargeVal > 0 ? formatCurrency(surchargeVal) : ''}
                      onChange={handleSurchargeInputChange}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplySurcharge();
                        }
                        if (e.key === 'Escape') setShowSurchargeInput(false);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-blue-300 bg-white text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplySurcharge}
                    className="px-3 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSurchargeInput(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Botões para Adicionar Desconto e Acréscimo */}
              <div className="flex items-center gap-3 pt-0.5 flex-wrap">
                {discount === 0 && !showDiscountInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountVal(discount || 0);
                      setShowDiscountInput(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#ea580c] hover:text-orange-700 transition-colors cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>+ Adicionar Desconto</span>
                  </button>
                )}

                {surcharge === 0 && !showSurchargeInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSurchargeVal(surcharge || 0);
                      setShowSurchargeInput(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#2563eb] hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+ Adicionar Acréscimo</span>
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 my-1" />

            {/* TOTAL DOS ITENS Highlight */}
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  TOTAL DOS ITENS
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {items.reduce((sum, i) => sum + i.quantity, 0)} itens no carrinho
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 leading-none">
                {formatCurrency(total)}
              </span>
            </div>

            {/* ACTION BUTTONS: DEVOLUÇÃO & COBRAR */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              
              {/* DEVOLUÇÃO button (pale cream/yellow background, amber border & text) */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReturn();
                }}
                className="py-3 px-3 rounded-2xl bg-[#fffdf5] border-2 border-[#fcd34d] hover:bg-[#fff9e6] active:scale-[0.98] text-[#78350f] font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <RotateCcw className="w-4 h-4 text-[#92400e] stroke-[2.2]" />
                <span>DEVOLUÇÃO</span>
              </button>

              {/* COBRAR button (vibrant orange, bold, arrow right) */}
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
