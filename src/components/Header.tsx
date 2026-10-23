import React, { useState } from 'react';
import { ChevronDown, Moon, Sun, User as UserIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useTheme } from '../hooks/useTheme';
import { NavTab } from './BottomNav';
import { CustomerSelectModal } from './CustomerSelectModal';
import { OperatorSwitchModal } from './OperatorSwitchModal';

interface HeaderProps {
  currentTab?: NavTab;
}

export const Header: React.FC<HeaderProps> = ({ currentTab = 'pdv' }) => {
  const { currentOperator } = useAuth();
  const { selectedCustomer, setSelectedCustomer } = useCart();
  const { theme, toggleTheme } = useTheme();

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const displayCustomer = selectedCustomer
    ? selectedCustomer.name.length > 12
      ? `${selectedCustomer.name.slice(0, 10)}...`
      : selectedCustomer.name
    : 'Consumidor';

  return (
    <>
      <header className="shrink-0 sticky top-0 z-30 w-full bg-white dark:bg-[#080f1e] border-b border-slate-200 dark:border-[#142038] px-2.5 sm:px-3 py-2 select-none transition-colors">
        <div className="max-w-md md:max-w-xl mx-auto flex items-center gap-1.5 sm:gap-2">
          
          {/* 1. Operator Pill */}
          <button
            type="button"
            onClick={() => setShowSwitchModal(true)}
            className="flex-1 min-w-0 h-9 sm:h-10 flex items-center justify-between px-2 sm:px-2.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-[#111c34] border border-slate-200 dark:border-[#1e2f54] text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-[#2d4476] transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            title="Trocar vendedor do caixa"
          >
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[10px] sm:text-[11px] font-black shrink-0">
                {currentOperator.name.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {currentOperator.name}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0 ml-0.5" />
          </button>

          {/* 2. Customer Pill - Appears on PDV tab */}
          {currentTab === 'pdv' && (
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="flex-1 min-w-0 h-9 sm:h-10 flex items-center justify-between px-2 sm:px-2.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-[#111c34] border border-slate-200 dark:border-[#1e2f54] text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-[#2d4476] transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              title="Identificar cliente"
            >
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-200 dark:bg-[#1e2f54] text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] sm:text-[11px] shrink-0">
                  <UserIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-600 dark:text-slate-300" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {displayCustomer}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0 ml-0.5" />
            </button>
          )}

          {/* 3. Theme Toggle Pill (Sun / Moon) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-[#111c34] border border-slate-200 dark:border-[#1e2f54] text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-[#1a2846] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
            title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 fill-amber-400/20 text-amber-400" />
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
