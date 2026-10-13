import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Banknote, CheckCircle, CreditCard, DollarSign, QrCode, User, Wallet, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { PaymentMethod, Sale } from '../types';
import { formatCurrency, generateCode } from '../utils/formatters';
import { playCashSound } from '../utils/printReceiptHelper';
import { addSaleRecord, getStoredSettings } from '../utils/storage';
import { CurrencyInput } from './CurrencyInput';
import { CustomerSelectModal } from './CustomerSelectModal';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleComplete: (sale: Sale) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSaleComplete,
}) => {
  const { currentOperator } = useAuth();
  const { items, subtotal, total, discount, surcharge, selectedCustomer, setSelectedCustomer, clearCart } = useCart();
  const settings = getStoredSettings();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('money');
  const [amountPaid, setAmountPaid] = useState<number>(total);
  const [installments, setInstallments] = useState<number>(1);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const prevTotalRef = React.useRef(total);
  React.useEffect(() => {
    if (paymentMethod === 'money' && amountPaid === prevTotalRef.current) {
      setAmountPaid(total);
    }
    prevTotalRef.current = total;
  }, [total, paymentMethod, amountPaid]);

  if (!isOpen || items.length === 0) return null;

  const change = Math.max(0, amountPaid - total);
  const isPaidEnough = paymentMethod !== 'money' || amountPaid >= total;

  const handleFinalizeSale = () => {
    if (paymentMethod === 'money' && amountPaid < total) {
      setError('O valor recebido é menor que o total da venda.');
      return;
    }

    if (paymentMethod === 'credit_account' && !selectedCustomer) {
      setError('Para venda A Prazo (Fiado), é obrigatório selecionar um cliente.');
      return;
    }

    const saleCode = generateCode('VND');
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      code: saleCode,
      items: items.map((item) => ({
        productId: item.product.id,
        productCode: item.product.code,
        productName: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: item.product.costPrice,
        discount: item.discount,
        subtotal: item.subtotal,
        unit: item.product.unit,
      })),
      subtotal,
      discount,
      surcharge: surcharge || 0,
      total,
      paymentMethod,
      amountPaid: paymentMethod === 'money' ? amountPaid : total,
      change: paymentMethod === 'money' ? change : 0,
      installments: paymentMethod === 'credit' ? installments : undefined,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerDocument: selectedCustomer?.document,
      operatorId: currentOperator.id,
      operatorName: currentOperator.name,
      date: new Date().toISOString(),
      status: 'completed',
    };

    // Save sale record & update stock
    addSaleRecord(newSale);

    // Audio and confetti celebration
    if (settings.enableSound) {
      playCashSound();
    }

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d399', '#f59e0b', '#3b82f6'],
      });
    } catch (e) {
      console.debug('Confetti error', e);
    }

    clearCart();
    onSaleComplete(newSale);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Finalizar Venda
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
            
            {/* Total Highlight Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/20 flex items-center justify-between min-h-[88px]">
              <div>
                <span className="text-xs font-bold text-emerald-100 block uppercase tracking-wider mb-1">
                  Total a Cobrar
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono">
                  {formatCurrency(total)}
                </span>
              </div>
              <div className="text-right text-xs text-emerald-100 space-y-1">
                <span className="block font-medium">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
                {discount > 0 && (
                  <span className="block font-bold text-amber-200">
                    Desconto: -{formatCurrency(discount)}
                  </span>
                )}
                {surcharge > 0 && (
                  <span className="block font-bold text-teal-200">
                    Acréscimo: +{formatCurrency(surcharge)}
                  </span>
                )}
              </div>
            </div>

            {/* Customer Identification Badge */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-h-[60px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block leading-tight">Cliente</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block leading-tight mt-0.5">
                    {selectedCustomer ? selectedCustomer.name : 'Consumidor Final (Não Identificado)'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerModal(true)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline py-1 px-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                {selectedCustomer ? 'Alterar' : 'Identificar'}
              </button>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                
                {/* Dinheiro */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('money');
                    setAmountPaid(total);
                  }}
                  className={`py-4 px-3 min-h-[92px] sm:min-h-[96px] rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'money'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    paymentMethod === 'money' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <Banknote className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold leading-tight">Dinheiro</span>
                </button>

                {/* PIX */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`py-4 px-3 min-h-[92px] sm:min-h-[96px] rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'pix'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    paymentMethod === 'pix' 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                  }`}>
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold leading-tight">PIX (Instantâneo)</span>
                </button>

                {/* Cartão de Débito */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('debit')}
                  className={`py-4 px-3 min-h-[92px] sm:min-h-[96px] rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'debit'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    paymentMethod === 'debit' 
                      ? 'bg-sky-600 text-white' 
                      : 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
                  }`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold leading-tight">Cartão de Débito</span>
                </button>

                {/* Cartão de Crédito */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  className={`py-4 px-3 min-h-[92px] sm:min-h-[96px] rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'credit'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    paymentMethod === 'credit' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold leading-tight">Cartão de Crédito</span>
                </button>

                {/* A Prazo / Fiado */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_account')}
                  className={`py-4 px-3 min-h-[92px] sm:min-h-[96px] rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'credit_account'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    paymentMethod === 'credit_account' 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  }`}>
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold leading-tight">A Prazo / Fiado</span>
                </button>
              </div>
            </div>

            {/* Contextual payment fields */}
            {paymentMethod === 'money' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <CurrencyInput
                  label="Valor Recebido em Dinheiro"
                  value={amountPaid}
                  onChange={setAmountPaid}
                />


                {/* Troco */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    Troco a Devolver:
                  </span>
                  <span
                    className={`text-xl font-black font-mono ${
                      change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {formatCurrency(change)}
                  </span>
                </div>
              </div>
            )}


            {paymentMethod === 'credit' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Número de Parcelas
                </label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value={1}>1x de {formatCurrency(total)} (À vista)</option>
                  <option value={2}>2x de {formatCurrency(total / 2)}</option>
                  <option value={3}>3x de {formatCurrency(total / 3)}</option>
                  <option value={4}>4x de {formatCurrency(total / 4)}</option>
                  <option value={5}>5x de {formatCurrency(total / 5)}</option>
                  <option value={6}>6x de {formatCurrency(total / 6)}</option>
                </select>
              </div>
            )}



            {error && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
                {error}
              </p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3.5 text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
            >
              Voltar ao Caixa
            </button>
            <button
              type="button"
              onClick={handleFinalizeSale}
              disabled={!isPaidEnough}
              className="w-full sm:flex-1 py-3.5 px-6 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" /> Confirmar Pagamento
            </button>
          </div>
        </div>
      </div>

      <CustomerSelectModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        selectedCustomerId={selectedCustomer?.id}
        onSelect={(c) => setSelectedCustomer(c)}
      />
    </>
  );
};
