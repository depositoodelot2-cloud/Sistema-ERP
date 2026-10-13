import React, { useState } from 'react';
import { Check, Plus, Search, UserCheck, Users, X } from 'lucide-react';
import { Customer } from '../types';
import { filterAndRankCustomers } from '../utils/semanticSearch';
import { getStoredCustomers, saveStoredCustomers } from '../utils/storage';
import { CustomerFormModal } from './CustomerFormModal';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomerId?: string;
  onSelect: (customer: Customer | null) => void;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({
  isOpen,
  onClose,
  selectedCustomerId,
  onSelect,
}) => {
  const [customers, setCustomers] = useState<Customer[]>(getStoredCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  if (!isOpen) return null;

  const filteredCustomers = filterAndRankCustomers(customers, searchTerm);

  const handleCreateCustomer = (data: Omit<Customer, 'id' | 'totalSpent' | 'purchasesCount' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      totalSpent: 0,
      purchasesCount: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    saveStoredCustomers(updated);
    onSelect(newCustomer);
    setShowAddModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden flex flex-col max-h-[90vh]">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Identificar Cliente
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione o cliente para vincular a esta venda
              </p>
            </div>
          </div>

          {/* Search & Add Bar */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, CPF/CNPJ, telefone ou cidade..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Cadastrar
            </button>
          </div>

          {/* Consumidor Final Button (Clear Customer) */}
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className="w-full mb-3 p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <div className="text-left">
                <span className="text-xs font-bold block text-slate-800 dark:text-slate-100">
                  Consumidor Final (Não Identificado)
                </span>
                <span className="text-[10px] text-slate-400">Venda avulsa no balcão</span>
              </div>
            </div>
            {!selectedCustomerId && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Padrão
              </span>
            )}
          </button>

          {/* Customers List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
            {filteredCustomers.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <p className="text-sm">Nenhum cliente encontrado.</p>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 underline"
                >
                  Cadastrar novo cliente agora
                </button>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomerId === cust.id;

                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      onSelect(cust);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
                        {cust.name}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {cust.document && (
                          <span className="font-mono">{cust.document}</span>
                        )}
                        {cust.phone && <span>{cust.phone}</span>}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <CustomerFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleCreateCustomer}
      />
    </>
  );
};
