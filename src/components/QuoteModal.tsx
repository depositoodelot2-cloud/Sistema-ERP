import React, { useState } from 'react';
import { Calendar, CheckCircle, FileText, MessageSquare, Printer, ShoppingCart, Trash2, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { Quote } from '../types';
import { formatCurrency, formatDate, generateCode } from '../utils/formatters';
import { getStoredQuotes, getStoredSettings, saveStoredQuotes } from '../utils/storage';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadQuoteToCart?: (quote: Quote) => void;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  onLoadQuoteToCart,
}) => {
  const { currentOperator } = useAuth();
  const { items, subtotal, discount, total, selectedCustomer, clearCart, loadItems } = useCart();
  const [quotes, setQuotes] = useState<Quote[]>(getStoredQuotes);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [validDays, setValidDays] = useState<number>(7);
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>(selectedCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(selectedCustomer?.phone || '');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const settings = getStoredSettings();

  if (!isOpen) return null;

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validDays);

    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      code: generateCode('ORC'),
      items: items.map((i) => ({
        productId: i.product.id,
        productCode: i.product.code,
        productName: i.product.name,
        barcode: i.product.barcode,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        costPrice: i.product.costPrice,
        discount: i.discount,
        subtotal: i.subtotal,
        unit: i.product.unit,
      })),
      subtotal,
      discount,
      total,
      customerId: selectedCustomer?.id,
      customerName: customerName || selectedCustomer?.name || 'Cliente Avulso',
      customerPhone: customerPhone || selectedCustomer?.phone || '',
      operatorName: currentOperator.name,
      date: new Date().toISOString(),
      validUntil: validUntilDate.toISOString(),
      notes: quoteNotes,
      status: 'sent',
    };

    const updated = [newQuote, ...quotes];
    setQuotes(updated);
    saveStoredQuotes(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveTab('list');
    }, 1200);
  };

  const handleLoadQuote = (quote: Quote) => {
    if (onLoadQuoteToCart) {
      onLoadQuoteToCart(quote);
      onClose();
    } else {
      // Map quote items back to cart items
      const cartItems = quote.items.map((qi) => ({
        id: `item-${qi.productId}-${Date.now()}`,
        product: {
          id: qi.productId,
          code: qi.productCode,
          barcode: qi.barcode,
          name: qi.productName,
          description: '',
          category: '',
          costPrice: qi.costPrice,
          sellPrice: qi.unitPrice,
          stock: 999,
          minStock: 0,
          unit: qi.unit,
          createdAt: '',
          updatedAt: '',
        },
        quantity: qi.quantity,
        unitPrice: qi.unitPrice,
        discount: qi.discount,
        subtotal: qi.subtotal,
      }));
      loadItems(cartItems, null);
      onClose();
    }
  };

  const handleDeleteQuote = (id: string) => {
    const updated = quotes.filter((q) => q.id !== id);
    setQuotes(updated);
    saveStoredQuotes(updated);
  };

  const handleShareQuoteWhatsApp = (quote: Quote) => {
    let text = `📄 *ORÇAMENTO #${quote.code}*\n`;
    text += `*${settings.name}*\n`;
    text += `Cliente: ${quote.customerName}\n`;
    text += `Válido até: ${formatDate(quote.validUntil)}\n\n`;
    quote.items.forEach((it, idx) => {
      text += `${idx + 1}. ${it.productName} (${it.quantity} ${it.unit}) - ${formatCurrency(it.subtotal)}\n`;
    });
    text += `\n*TOTAL: ${formatCurrency(quote.total)}*`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Orçamentos Comerciais
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gere propostas e converta em vendas a qualquer momento
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 my-3">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'create'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Gerar Novo Orçamento ({items.length} itens)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'list'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Orçamentos Salvos ({quotes.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'create' ? (
            items.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">O carrinho está vazio.</p>
                <p className="text-xs mt-1">Adicione produtos ao carrinho antes de salvar um orçamento.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveQuote} className="space-y-4 py-2">
                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-sky-700 dark:text-sky-300 block font-semibold">
                      Total do Orçamento:
                    </span>
                    <span className="text-xl font-black text-sky-900 dark:text-sky-100 font-mono">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <span className="text-xs text-sky-600 dark:text-sky-400 font-bold">
                    {items.length} itens selecionados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Cliente / Empresa
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Bar do Zé ou Carlos"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 98888-7777"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prazo de Validade da Proposta
                  </label>
                  <select
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value={3}>3 dias</option>
                    <option value={7}>7 dias (Padrão)</option>
                    <option value={15}>15 dias</option>
                    <option value={30}>30 dias</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Condições / Observações
                  </label>
                  <textarea
                    rows={2}
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    placeholder="Ex: Entrega inclusa para pedidos acima de R$ 300..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:border-sky-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    {savedSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-300" /> Orçamento Salvo com Sucesso!
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" /> Salvar Orçamento
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="space-y-3 py-2">
              {quotes.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm">Nenhum orçamento salvo no histórico.</p>
                </div>
              ) : (
                quotes.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                            #{q.code}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                            Válido até {formatDate(q.validUntil)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                          Cliente: {q.customerName} {q.customerPhone && `(${q.customerPhone})`}
                        </p>
                      </div>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(q.total)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {q.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleShareQuoteWhatsApp(q)}
                          className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5"
                          title="Enviar WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuote(q.id)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold"
                          title="Excluir Orçamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLoadQuote(q)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Converter em Venda
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
