import React, { useState } from 'react';
import {
  Banknote,
  Calendar,
  CheckCircle,
  CreditCard,
  QrCode,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { PaymentMethod, Sale } from '../types';
import { formatCurrency, generateCode } from '../utils/formatters';
import { playCashSound } from '../utils/printReceiptHelper';
import { addSaleRecord, getStoredSettings } from '../utils/storage';
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
  const {
    items,
    subtotal,
    total,
    discount,
    surcharge,
    selectedCustomer,
    setSelectedCustomer,
    clearCart,
  } = useCart();
  const settings = getStoredSettings();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('money');
  const [amountPaid, setAmountPaid] = useState<number>(total);
  const [installments, setInstallments] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
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

  const formatNumberOnly = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setAmountPaid(0);
      return;
    }
    const numeric = parseInt(rawDigits, 10) / 100;
    setAmountPaid(numeric);
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
      notes: notes.trim() || undefined,
    };

    // Save sale record & update stock
    addSaleRecord(newSale);

    // Audio sound if enabled
    if (settings.enableSound) {
      playCashSound();
    }

    clearCart();
    onSaleComplete(newSale);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 overflow-hidden max-h-[94vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Finalizar Pagamento
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>Cliente: </span>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="font-bold text-slate-900 dark:text-slate-200 hover:underline hover:text-emerald-600 transition-colors cursor-pointer"
                  title="Clique para alterar cliente"
                >
                  {selectedCustomer ? selectedCustomer.name : 'Consumidor Final (Balcão)'}
                </button>
                <span className="mx-1.5 text-slate-300 dark:text-slate-600">•</span>
                <span>Vendedor: </span>
                <span className="font-bold text-slate-900 dark:text-slate-200">
                  {currentOperator?.name || 'Anacleto'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-0.5 py-3.5 space-y-4">
            
            {/* Card: VALOR TOTAL DA VENDA (diminuído na vertical pela metade) */}
            <div className="rounded-xl bg-[#111c38] text-white py-2.5 px-4 text-center shadow-xs">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300 block leading-tight">
                VALOR TOTAL DA VENDA
              </span>
              <div className="text-2xl sm:text-[26px] font-black font-mono tracking-tight text-white leading-tight mt-0.5">
                {formatCurrency(total)}
              </div>
              {Boolean(discount > 0 || (surcharge && surcharge > 0)) && (
                <div className="mt-1.5 pt-1 border-t border-slate-700/60 flex items-center justify-center gap-2.5 text-[10px]">
                  {discount > 0 && (
                    <span className="text-amber-300 font-semibold">
                      Desconto: -{formatCurrency(discount)}
                    </span>
                  )}
                  {Boolean(surcharge && surcharge > 0) && (
                    <span className="text-teal-300 font-semibold">
                      Acréscimo: +{formatCurrency(surcharge)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* FORMA DE PAGAMENTO */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                FORMA DE PAGAMENTO
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Dinheiro */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('money');
                    setAmountPaid(total);
                  }}
                  className={`py-3 px-3.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'money'
                      ? 'border-[#f97316] bg-[#fffaf5] dark:bg-orange-950/20 text-slate-900 dark:text-white ring-2 ring-[#f97316]/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dinheiro</span>
                </button>

                {/* PIX */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`py-3 px-3.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'pix'
                      ? 'border-[#f97316] bg-[#fffaf5] dark:bg-orange-950/20 text-slate-900 dark:text-white ring-2 ring-[#f97316]/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>PIX</span>
                </button>

                {/* Crédito */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  className={`py-3 px-3.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'credit'
                      ? 'border-[#f97316] bg-[#fffaf5] dark:bg-orange-950/20 text-slate-900 dark:text-white ring-2 ring-[#f97316]/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Crédito</span>
                </button>

                {/* Débito */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('debit')}
                  className={`py-3 px-3.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'debit'
                      ? 'border-[#f97316] bg-[#fffaf5] dark:bg-orange-950/20 text-slate-900 dark:text-white ring-2 ring-[#f97316]/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Débito</span>
                </button>

                {/* A Prazo (Full width across two columns) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_account')}
                  className={`col-span-2 py-3 px-3.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'credit_account'
                      ? 'border-[#f97316] bg-[#fffaf5] dark:bg-orange-950/20 text-slate-900 dark:text-white ring-2 ring-[#f97316]/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>A Prazo</span>
                </button>
              </div>
            </div>

            {/* Contextual payment section */}
            {paymentMethod === 'money' && (
              <div className="rounded-2xl border border-[#86efac] dark:border-emerald-800/80 bg-[#f0fdf4]/50 dark:bg-emerald-950/20 p-3.5">
                <div className="grid grid-cols-2 gap-3 items-center">
                  {/* Valor Pago */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Valor Pago (R$)
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-2xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                      <span className="text-xs font-bold text-slate-400 select-none mr-2">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={amountPaid > 0 ? formatNumberOnly(amountPaid) : '0,00'}
                        onChange={handleAmountPaidChange}
                        onFocus={(e) => e.target.select()}
                        className="w-full text-right text-sm font-black font-mono text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Troco */}
                  <div className="rounded-xl border border-[#34d399] dark:border-emerald-700 bg-white dark:bg-slate-900 p-2.5 flex flex-col justify-center min-h-[58px]">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                      TROCO A DEVOLVER
                    </span>
                    <span className="text-base font-black font-mono text-[#059669] dark:text-emerald-400 block mt-0.5">
                      {formatCurrency(change)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'credit' && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3.5">
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

            {paymentMethod === 'credit_account' && (
              <div className="rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 p-3.5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                    Venda a Prazo (Fiado)
                  </span>
                  <span className="text-xs text-purple-700 dark:text-purple-300 block mt-0.5">
                    {selectedCustomer ? `Cliente: ${selectedCustomer.name}` : 'Nenhum cliente selecionado'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  {selectedCustomer ? 'Alterar' : 'Identificar'}
                </button>
              </div>
            )}

            {/* Observações da Venda (Opcional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Observações da Venda (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Entrega agendada, garantia estendida..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
                {error}
              </p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleFinalizeSale}
              disabled={!isPaidEnough}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-black text-xs sm:text-sm uppercase shadow-md shadow-emerald-700/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <CheckCircle className="w-5 h-5 stroke-[2.2]" />
              <span>CONFIRMAR E FINALIZAR</span>
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
