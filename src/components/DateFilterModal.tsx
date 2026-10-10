import React from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { DatePeriod } from '../types';

interface DateFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPeriod: DatePeriod;
  onSelectPeriod: (period: DatePeriod) => void;
  onOpenCustomCalendar: () => void;
}

export const DateFilterModal: React.FC<DateFilterModalProps> = ({
  isOpen,
  onClose,
  selectedPeriod,
  onSelectPeriod,
  onOpenCustomCalendar,
}) => {
  if (!isOpen) return null;

  const periods: Array<{ id: DatePeriod; label: string; desc: string }> = [
    { id: 'today', label: 'Hoje', desc: 'Apenas vendas realizadas no dia atual' },
    { id: 'yesterday', label: 'Ontem', desc: 'Vendas realizadas no dia anterior' },
    { id: '7days', label: 'Últimos 7 Dias', desc: 'Semana recente' },
    { id: '30days', label: 'Últimos 30 Dias', desc: 'Mês corrido' },
    { id: 'this_month', label: 'Este Mês', desc: 'Do dia 1º até hoje' },
    { id: 'last_month', label: 'Mês Passado', desc: 'Mês anterior completo' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Filtrar por Período
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione o período dos relatórios e vendas
            </p>
          </div>
        </div>

        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {periods.map((p) => {
            const isSelected = selectedPeriod === p.id;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelectPeriod(p.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/30'
                }`}
              >
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    {p.label}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {p.desc}
                  </span>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}

          {/* Custom Date button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCustomCalendar();
            }}
            className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
              selectedPeriod === 'custom'
                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/30'
            }`}
          >
            <div>
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                Personalizado...
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Escolha dia de início e fim no calendário
              </span>
            </div>
            {selectedPeriod === 'custom' && (
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-3 h-3" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
