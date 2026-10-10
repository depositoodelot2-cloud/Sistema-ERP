import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface ActionBannerProps {
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  onClose?: () => void;
  actionText?: string;
  onAction?: () => void;
}

export const ActionBanner: React.FC<ActionBannerProps> = ({
  message,
  type = 'info',
  onClose,
  actionText,
  onAction,
}) => {
  const styles = {
    success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
    warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200',
    info: 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200',
    error: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200',
  }[type];

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
  }[type];

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-xs ${styles}`}>
      <div className="flex items-center gap-3">
        {icons}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <div className="flex items-center gap-2">
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-bold underline hover:opacity-80 transition-opacity"
          >
            {actionText}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
