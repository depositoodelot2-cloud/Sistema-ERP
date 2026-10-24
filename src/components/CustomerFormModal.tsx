import React, { useState, useEffect } from 'react';
import { Users, X, Trash2, Save } from 'lucide-react';
import { Customer } from '../types';
import { formatDocument, formatPhone } from '../utils/formatters';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'totalSpent' | 'purchasesCount' | 'createdAt'>) => void;
  initialCustomer?: Customer | null;
  onDelete?: (customer: Customer) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCustomer,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialCustomer) {
        setName(initialCustomer.name || '');
        setDocument(initialCustomer.document ? formatDocument(initialCustomer.document) : '');
        setPhone(initialCustomer.phone ? formatPhone(initialCustomer.phone) : '');
        setEmail(initialCustomer.email || '');
        setAddress(initialCustomer.address || '');
        setNotes(initialCustomer.notes || '');
        setCreditLimit(
          initialCustomer.creditLimit !== undefined && initialCustomer.creditLimit !== null
            ? initialCustomer.creditLimit > 0
              ? initialCustomer.creditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '0,00'
            : ''
        );
      } else {
        setName('');
        setDocument('');
        setPhone('');
        setEmail('');
        setAddress('');
        setNotes('');
        setCreditLimit('');
      }
      setError('');
    }
  }, [isOpen, initialCustomer]);

  if (!isOpen) return null;

  const parseCurrencyInput = (val: string): number | undefined => {
    if (!val || !val.trim()) return undefined;
    const clean = val.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? undefined : num;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do cliente é obrigatório.');
      return;
    }

    onSave({
      name: name.trim(),
      document: document.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim(),
      creditLimit: parseCurrencyInput(creditLimit),
    });

    onClose();
  };

  const handleDelete = () => {
    if (initialCustomer && onDelete) {
      onDelete(initialCustomer);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 overflow-hidden">
        
        {/* Header - Fixed at Top */}
        <div className="shrink-0 flex items-center justify-between pb-3 mb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#ff5c00] text-white flex items-center justify-center shadow-sm shrink-0">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 leading-tight truncate">
                {initialCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Cadastro para vendas a prazo e histórico
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#edf2f7] dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0 ml-2"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Form Body - Scrollable if screen is very short */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 -mr-1">
            {/* Nome Completo / Razão Social */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nome Completo / Razão Social <span className="text-[#ff5c00]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Consumidor Final (Balcão)"
                className="w-full px-3 py-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ff5c00] focus:ring-2 focus:ring-[#ff5c00]/20 transition-all"
              />
            </div>

            {/* Grid 2 Cols: CPF/CNPJ + Telefone */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  CPF ou CNPJ
                </label>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(formatDocument(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:border-[#ff5c00] focus:ring-2 focus:ring-[#ff5c00]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="w-full px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ff5c00] focus:ring-2 focus:ring-[#ff5c00]/20 transition-all"
                />
              </div>
            </div>

            {/* Grid 2 Cols: E-mail + Limite de Crédito */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ff5c00] focus:ring-2 focus:ring-[#ff5c00]/20 transition-all truncate"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Limite de Crédito
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 sm:left-3 text-[11px] sm:text-xs font-extrabold text-slate-400 select-none pointer-events-none">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-extrabold text-right placeholder:text-slate-900 dark:placeholder:text-slate-100 focus:outline-none focus:border-[#ff5c00] focus:ring-2 focus:ring-[#ff5c00]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Endereço Completo */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, complemento, bairro, cidade"
                className="w-full px-3 py-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ff5c00] focus:ring-2 focus:ring-[#ff5c00]/20 transition-all"
              />
            </div>

            {/* Observações Internas */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Observações Internas
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Cliente padrão para vendas rápidas no balcão"
                className="w-full px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ff5c00] focus:ring-2 focus:ring-[#ff5c00]/20 transition-all resize-none min-h-[52px]"
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
                {error}
              </p>
            )}
          </div>

          {/* Footer Actions - Anchored and never pushed off-screen */}
          <div className="shrink-0 flex items-center gap-2 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
            {initialCustomer && (
              <button
                type="button"
                onClick={handleDelete}
                className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl sm:rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold flex items-center justify-center gap-1 transition-all shrink-0 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                <span>Excluir</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 sm:h-10 px-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#edf2f7] hover:bg-[#e2e8f0] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-center active:scale-95"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex-1 h-9 sm:h-10 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-[#ff5c00] hover:bg-[#ea5300] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5 stroke-[2]" />
              <span>{initialCustomer ? 'Salvar Alteração' : 'Salvar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
