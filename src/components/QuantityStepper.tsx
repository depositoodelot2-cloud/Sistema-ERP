import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onChange?: (val: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showTrashOnMin?: boolean;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  onChange,
  min = 1,
  max = 9999,
  size = 'md',
  showTrashOnMin = false,
}) => {
  const isAtMin = quantity <= min;

  const sizeClasses = {
    sm: {
      btn: 'w-6 h-6 text-xs',
      input: 'w-8 text-xs py-0.5',
      icon: 'w-3 h-3',
    },
    md: {
      btn: 'w-8 h-8 text-sm',
      input: 'w-10 text-sm py-1',
      icon: 'w-3.5 h-3.5',
    },
    lg: {
      btn: 'w-10 h-10 text-base',
      input: 'w-14 text-base py-1.5',
      icon: 'w-4 h-4',
    },
  }[size];

  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-0.5 shadow-xs select-none">
      <button
        type="button"
        onClick={onDecrement}
        disabled={isAtMin && !showTrashOnMin}
        className={`${sizeClasses.btn} rounded-lg flex items-center justify-center transition-all ${
          isAtMin && showTrashOnMin
            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            : isAtMin
            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-xs'
        } active:scale-95`}
      >
        {isAtMin && showTrashOnMin ? (
          <Trash2 className={sizeClasses.icon} />
        ) : (
          <Minus className={sizeClasses.icon} />
        )}
      </button>

      {onChange ? (
        <input
          type="number"
          min={min}
          max={max}
          value={quantity}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val)) {
              onChange(Math.max(min, Math.min(max, val)));
            }
          }}
          className={`${sizeClasses.input} text-center font-bold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-0`}
        />
      ) : (
        <span className={`${sizeClasses.input} text-center font-bold text-slate-800 dark:text-slate-100`}>
          {quantity}
        </span>
      )}

      <button
        type="button"
        onClick={onIncrement}
        disabled={quantity >= max}
        className={`${sizeClasses.btn} rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <Plus className={sizeClasses.icon} />
      </button>
    </div>
  );
};
