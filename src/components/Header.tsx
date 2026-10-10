import React, { useState } from 'react';
import { ChevronDown, Moon, Shield, Sun, User as UserIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useTheme } from '../hooks/useTheme';
import { CustomerSelectModal } from './CustomerSelectModal';
import { OperatorSwitchModal } from './OperatorSwitchModal';

export const Header: React.FC = () => {
  const { currentOperator } = useAuth();
  const { selectedCustomer, setSelectedCustomer } = useCart();
  const { theme, toggleTheme } = useTheme();

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Shorten names for clean pill display like screenshot
  const displayOperator = currentOperator.name.length > 8
    ? `${currentOperator.name.slice(0, 5)}...`
    : currentOperator.name;

  const displayCustomer = selectedCustomer
    ? selectedCustomer.name.length > 10
      ? `${selectedCustomer.name.slice(0, 8)}...`
      : selectedCustomer.name
    : 'Consumido...';

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white dark:bg-[#080f1e] border-b border-slate-200 dark:border-[#142038] px-3 py-2.5 select-none transition-colors">
        <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-between gap-2">
          
          {/* Operator Pill */}
          <button
            type="button"
            onClick={() => setShowSwitchModal(true)}
            className="flex-1 flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-100 dark:bg-[#111c34] border border-slate-200 dark:border-[#1e2f54] text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-[#2d4476] transition-all shadow-xs"
            title="Trocar operador do caixa"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-xs font-black shrink-0">
                {currentOperator.name.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {displayOperator}
              </span>
              <div className="p-0.5 rounded bg-blue-100 dark:bg-[#1e2f54]/60 text-[#2563eb] dark:text-[#3b82f6] shrink-0">
                <Shield className="w-3 h-3" />
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          </button>

          {/* Customer Pill */}
          <button
            type="button"
            onClick={() => setShowCustomerModal(true)}
            className="flex-1 flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-100 dark:bg-[#111c34] border border-slate-200 dark:border-[#1e2f54] text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-[#2d4476] transition-all shadow-xs"
            title="Identificar cliente"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-[#1e2f54] text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs shrink-0">
                <UserIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {displayCustomer}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          </button>

          {/* Theme Pill (Sun / Moon) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#111c34] border border-slate-200 dark:border-[#1e2f54] text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-[#1a2846] transition-all shadow-xs shrink-0 active:scale-95"
            title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 fill-amber-400/20" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </header>

      <OperatorSwitchModal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
      />

      <CustomerSelectModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        selectedCustomerId={selectedCustomer?.id}
        onSelect={(c) => setSelectedCustomer(c)}
      />
    </>
  );
};
