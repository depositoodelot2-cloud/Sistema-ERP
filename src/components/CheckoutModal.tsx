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
  const { items, subtotal, total, discount, setDiscount, selectedCustomer, setSelectedCustomer, clearCart } = useCart();
  const settings = getStoredSettings();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('money');
  const [amountPaid, setAmountPaid] = useState<number>(total);
  const [installments, setInstallments] = useState<number>(1);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [pixCopied, setPixCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen || items.length === 0) return null;

  const change = Math.max(0, amountPaid - total);
  const isPaidEnough = paymentMethod !== 'money' || amountPaid >= total;

  const handleQuickMoney = (amount: number) => {
    setAmountPaid(amount);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(settings.pixKey || '42.189.923/0001-55');
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  };

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
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecione a forma de pagamento e confira os valores
                </p>
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
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-100 block uppercase tracking-wider">
                  Total a Cobrar
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono">
                  {formatCurrency(total)}
                </span>
              </div>
              <div className="text-right text-xs text-emerald-100">
                <span>{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
                {discount > 0 && (
                  <span className="block font-bold text-amber-200">
                    Desconto: -{formatCurrency(discount)}
                  </span>
                )}
              </div>
            </div>

            {/* Customer Identification Badge */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Cliente</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {selectedCustomer ? selectedCustomer.name : 'Consumidor Final (Não Identificado)'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerModal(true)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {selectedCustomer ? 'Alterar' : 'Identificar'}
              </button>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                
                {/* Dinheiro */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('money');
                    setAmountPaid(total);
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all ${
                    paymentMethod === 'money'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold">Dinheiro</span>
                </button>

                {/* PIX */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all ${
                    paymentMethod === 'pix'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-teal-600" />
                  <span className="text-xs font-bold">PIX (Instantâneo)</span>
                </button>

                {/* Cartão de Débito */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('debit')}
                  className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all ${
                    paymentMethod === 'debit'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-sky-600" />
                  <span className="text-xs font-bold">Cartão de Débito</span>
                </button>

                {/* Cartão de Crédito */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all ${
                    paymentMethod === 'credit'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold">Cartão de Crédito</span>
                </button>

                {/* A Prazo / Fiado */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_account')}
                  className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all ${
                    paymentMethod === 'credit_account'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-bold">A Prazo / Fiado</span>
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

                {/* Quick money buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Rápido:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickMoney(total)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-600"
                  >
                    Exato
                  </button>
                  {[10, 20, 50, 100, 200].map((val) => {
                    if (val < total && total > 50) return null;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickMoney(val)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-600"
                      >
                        R$ {val}
                      </button>
                    );
                  })}
                </div>

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

            {paymentMethod === 'pix' && (
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-center space-y-3">
                <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl shadow-sm border border-teal-200 flex items-center justify-center">
                  <QrCode className="w-28 h-28 text-teal-800" />
                </div>
                <div>
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-200 block">
                    Chave PIX ({settings.pixKeyType?.toUpperCase() || 'CNPJ'}):
                  </span>
                  <span className="font-mono text-sm font-bold text-teal-800 dark:text-teal-300">
                    {settings.pixKey || '42.189.923/0001-55'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {pixCopied ? 'Chave Copiada!' : 'Copiar Chave PIX'}
                </button>
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

            {/* Discount Section */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <CurrencyInput
                label="Desconto Geral na Venda (R$)"
                value={discount}
                onChange={setDiscount}
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
                {error}
              </p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Voltar ao Caixa
            </button>
            <button
              type="button"
              onClick={handleFinalizeSale}
              disabled={!isPaidEnough}
              className="flex-1 py-3 px-6 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2"
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
