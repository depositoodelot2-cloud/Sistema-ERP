import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';

interface CalendarDropdownPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  onSelectSingleDate: (date: string) => void;
  onSelectRange: (startDate: string, endDate: string) => void;
  onClear: () => void;
  className?: string;
}

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const CalendarDropdownPopover: React.FC<CalendarDropdownPopoverProps> = ({
  isOpen,
  onClose,
  selectedDate,
  startDate,
  endDate,
  onSelectSingleDate,
  onSelectRange,
  onClear,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  // Tab mode: 'single' (Dia Único) or 'range' (Intervalo/Período)
  const [mode, setMode] = useState<'single' | 'range'>('single');

  // Currently viewed month/year in calendar
  const initialDate = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Range selection staging
  const [rangeStart, setRangeStart] = useState<string | null>(startDate || null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(endDate || null);

  // Dynamic positioning calculation and viewport boundary clamping
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const popoverWidth = Math.min(320, window.innerWidth - 24);

      let left = rect.left;
      // If extending beyond right edge of viewport, clamp to right margin
      if (left + popoverWidth > window.innerWidth - 12) {
        left = window.innerWidth - popoverWidth - 12;
      }
      // If extending beyond left edge of viewport, clamp to left margin
      if (left < 12) {
        left = 12;
      }

      let top = rect.bottom + 8;
      // If extending beyond bottom of viewport, position above parent if there's enough room
      if (top + 400 > window.innerHeight && rect.top > 400) {
        top = Math.max(12, rect.top - 400 - 8);
      }

      setCoords({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !containerRef.current.parentElement?.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Build calendar matrix (42 cells: previous month days, current month days, next month days)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 for Sunday
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days: Array<{
    dayNumber: number;
    dateStr: string;
    isCurrentMonth: boolean;
  }> = [];

  // 1. Days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const mm = String(prevMonthIdx + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    days.push({
      dayNumber: d,
      dateStr: `${prevYear}-${mm}-${dd}`,
      isCurrentMonth: false,
    });
  }

  // 2. Days from current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    days.push({
      dayNumber: d,
      dateStr: `${viewYear}-${mm}-${dd}`,
      isCurrentMonth: true,
    });
  }

  // 3. Days from next month to fill complete grid
  const remainingCells = 42 - days.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const mm = String(nextMonthIdx + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    days.push({
      dayNumber: d,
      dateStr: `${nextYear}-${mm}-${dd}`,
      isCurrentMonth: false,
    });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDayClick = (dateStr: string) => {
    if (mode === 'single') {
      onSelectSingleDate(dateStr);
      onClose();
    } else {
      // Range mode
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(dateStr);
        setRangeEnd(null);
      } else {
        // Second click
        let start = rangeStart;
        let end = dateStr;
        if (new Date(start) > new Date(end)) {
          [start, end] = [end, start];
        }
        setRangeStart(start);
        setRangeEnd(end);
        onSelectRange(start, end);
        onClose();
      }
    }
  };

  const handleSelectToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectSingleDate(todayStr);
    onClose();
  };

  const handleClear = () => {
    onClear();
    setRangeStart(null);
    setRangeEnd(null);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      style={coords ? { top: `${coords.top}px`, left: `${coords.left}px` } : undefined}
      className={`fixed z-50 w-[calc(100vw-24px)] max-w-[320px] rounded-3xl border border-slate-200 dark:border-[#1e2f52] bg-white dark:bg-[#0e172a] p-3.5 sm:p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-100 ${className}`}
    >
      {/* 1. Mode Switcher: [ Dia Único ]  [ Intervalo (Período) ] */}
      <div className="p-1 rounded-2xl bg-slate-100 dark:bg-[#131f38] flex gap-1 mb-3">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'single'
              ? 'bg-white dark:bg-[#0e172a] text-[#2563eb] dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Dia Único
        </button>

        <button
          type="button"
          onClick={() => setMode('range')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'range'
              ? 'bg-white dark:bg-[#0e172a] text-[#2563eb] dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Intervalo (Período)
        </button>
      </div>

      {/* 2. Month & Year Title with Navigation Up/Down */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1">
          <span className="font-extrabold text-sm text-slate-900 dark:text-white capitalize">
            {MONTH_NAMES[viewMonth]} de {viewYear}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* Navigation Arrows (Up / Down matching screenshot) */}
        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-[#152342] flex items-center justify-center transition-colors cursor-pointer"
            title="Mês anterior"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-[#152342] flex items-center justify-center transition-colors cursor-pointer"
            title="Próximo mês"
          >
            <ArrowDown className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 3. Weekday Labels Header: D S T Q Q S S */}
      <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-700 dark:text-slate-300 py-1 mb-1">
        {WEEKDAYS.map((wd, idx) => (
          <span key={idx} className="block py-0.5 text-center">
            {wd}
          </span>
        ))}
      </div>

      {/* 4. Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-medium">
        {days.map((item, idx) => {
          const isSelectedSingle =
            mode === 'single' && selectedDate === item.dateStr;

          const isRangeStart =
            mode === 'range' &&
            (rangeStart === item.dateStr || startDate === item.dateStr);

          const isRangeEnd =
            mode === 'range' &&
            (rangeEnd === item.dateStr || endDate === item.dateStr);

          const isInRange =
            mode === 'range' &&
            ((rangeStart && rangeEnd && item.dateStr > rangeStart && item.dateStr < rangeEnd) ||
              (startDate && endDate && item.dateStr > startDate && item.dateStr < endDate));

          const isHighlighted = isSelectedSingle || isRangeStart || isRangeEnd;

          const isToday = item.dateStr === todayStr;

          return (
            <div
              key={idx}
              className={`p-0.5 relative ${
                isInRange
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-[#2563eb]'
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={() => handleDayClick(item.dateStr)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center mx-auto text-xs transition-all cursor-pointer ${
                  isHighlighted
                    ? 'bg-[#0055ff] text-white font-black shadow-sm ring-2 ring-black/70 dark:ring-white/80 scale-105'
                    : isToday
                    ? 'font-black text-[#2563eb] hover:bg-blue-50 dark:hover:bg-blue-950/50'
                    : item.isCurrentMonth
                    ? 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                    : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                {item.dayNumber}
              </button>
            </div>
          );
        })}
      </div>

      {/* 5. Footer Actions: [ Limpar ]      [ Hoje ] */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-[#1e2f52] px-1">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-bold text-[#2563eb] hover:underline cursor-pointer"
        >
          Limpar
        </button>

        <button
          type="button"
          onClick={handleSelectToday}
          className="text-xs font-bold text-[#2563eb] hover:underline cursor-pointer"
        >
          Hoje
        </button>
      </div>
    </div>
  );
};
