import React, { useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, Shield, User, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Operator } from '../types';

interface OperatorSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OperatorSwitchModal: React.FC<OperatorSwitchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentOperator, operators, switchOperator } = useAuth();
  const [selectedOperator, setSelectedOperator] = useState<Operator>(currentOperator);
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSelect = (op: Operator) => {
    setSelectedOperator(op);
    setPin('');
    setShowPin(false);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOperator.id === currentOperator.id) {
      onClose();
      return;
    }

    if (selectedOperator.pin && pin !== selectedOperator.pin) {
      setError('PIN incorreto. Tente novamente.');
      return;
    }

    const success = switchOperator(selectedOperator.id, pin);
    if (success) {
      setError('');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError('Falha ao alternar vendedor.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Trocar Vendedor
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione o vendedor do caixa atual
            </p>
          </div>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {operators.map((op) => {
            const isSelected = selectedOperator.id === op.id;
            const isCurrent = currentOperator.id === op.id;

            return (
              <button
                key={op.id}
                type="button"
                onClick={() => handleSelect(op)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {op.avatar ? (
                    <img
                      src={op.avatar}
                      alt={op.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm">
                      {op.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{op.name}</span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full">
                          Atual
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize flex items-center gap-1 mt-0.5">
                      {op.role === 'admin' ? (
                        <Shield className="w-3 h-3 text-amber-500 inline" />
                      ) : null}
                      {op.role === 'admin' ? 'Administrador' : 'Vendedor'}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {selectedOperator.pin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                Digite o PIN de Acesso (4 dígitos)
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Ex: 1234"
                  className="w-full text-center tracking-widest text-lg font-mono font-bold pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={showPin ? 'Ocultar PIN' : 'Ver PIN digitado'}
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Dica para teste: Danilo PIN = <span className="font-mono">1234</span> | Caixa 01 = <span className="font-mono">0000</span>
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              Confirmar Troca
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
