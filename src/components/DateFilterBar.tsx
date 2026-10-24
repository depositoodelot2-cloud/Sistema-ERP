import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DatePeriod, DateRange } from '../types';
import { CalendarPickerPopover } from './CalendarPickerPopover';
import { DateFilterModal } from './DateFilterModal';

interface DateFilterBarProps {
  currentRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  className?: string;
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  currentRange,
  onRangeChange,
  className = '',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handlePeriodChange = (period: DatePeriod) => {
    import('../utils/dateFilter').then(({ getDateRange }) => {
      onRangeChange(getDateRange(period));
    });
  };

  const handleCustomApply = (start: string, end: string) => {
    import('../utils/dateFilter').then(({ getDateRange }) => {
      onRangeChange(getDateRange('custom', start, end));
    });
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{currentRange.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      <DateFilterModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedPeriod={currentRange.period}
        onSelectPeriod={handlePeriodChange}
        onOpenCustomCalendar={() => setShowCalendar(true)}
      />

      <CalendarPickerPopover
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        startDate={currentRange.startDate}
        endDate={currentRange.endDate}
        onApply={handleCustomApply}
      />
    </>
  );
};
