import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown } from 'lucide-react';

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

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function getDaysDiff(startStr: string, endStr: string): number {
  const d1 = new Date(startStr + 'T00:00:00');
  const d2 = new Date(endStr + 'T00:00:00');
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

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
  const [mode, setMode] = useState<'single' | 'range'>(() => {
    return startDate && endDate ? 'range' : 'single';
  });

  // Currently viewed month/year in calendar
  const initialDate = startDate
    ? new Date(startDate + 'T12:00:00')
    : selectedDate
    ? new Date(selectedDate + 'T12:00:00')
    : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Range selection staging
  const [rangeStart, setRangeStart] = useState<string | null>(startDate || null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(endDate || null);

  // Sync state whenever popover opens or props change
  useEffect(() => {
    if (isOpen) {
      if (startDate && endDate) {
        setMode('range');
        setRangeStart(startDate);
        setRangeEnd(endDate);
        const d = new Date(startDate + 'T12:00:00');
        if (!isNaN(d.getTime())) {
          setViewYear(d.getFullYear());
          setViewMonth(d.getMonth());
        }
      } else if (selectedDate) {
        setMode('single');
        const d = new Date(selectedDate + 'T12:00:00');
        if (!isNaN(d.getTime())) {
          setViewYear(d.getFullYear());
          setViewMonth(d.getMonth());
        }
      }
    }
  }, [isOpen, startDate, endDate, selectedDate]);

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
      // If extending beyond bottom of viewport, position above parent if there's room
      if (top + 460 > window.innerHeight && rect.top > 460) {
        top = Math.max(12, rect.top - 460 - 8);
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
        // First click: start new range
        setRangeStart(dateStr);
        setRangeEnd(null);
      } else {
        // Second click: complete range staging
        let start = rangeStart;
        let end = dateStr;
        if (new Date(start) > new Date(end)) {
          [start, end] = [end, start];
        }
        setRangeStart(start);
        setRangeEnd(end);
        // Do NOT close! Show confirmation button and preview to user
      }
    }
  };

  const handleConfirmRange = () => {
    if (!rangeStart) return;
    const start = rangeStart;
    const end = rangeEnd || rangeStart;
    onSelectRange(start, end);
    onClose();
  };

  const handleSelectToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    if (mode === 'single') {
      onSelectSingleDate(todayStr);
      onClose();
    } else {
      setRangeStart(todayStr);
      setRangeEnd(todayStr);
    }
  };

  const handleClear = () => {
    onClear();
    setRangeStart(null);
    setRangeEnd(null);
    onClose();
  };

  // Determine active start and end for styling
  const activeStart = rangeStart !== null ? rangeStart : startDate;
  const activeEnd = rangeEnd !== null ? rangeEnd : (rangeStart ? null : endDate);

  return (
    <div
      ref={containerRef}
      style={coords ? { top: `${coords.top}px`, left: `${coords.left}px` } : undefined}
      className={`fixed z-50 w-[calc(100vw-24px)] max-w-[320px] max-h-[calc(100vh-24px)] overflow-y-auto rounded-3xl border border-slate-200 dark:border-[#1e2f52] bg-white dark:bg-[#0e172a] p-3.5 sm:p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-100 ${className}`}
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
            mode === 'range' && activeStart === item.dateStr;

          const isRangeEnd =
            mode === 'range' && activeEnd === item.dateStr;

          const isInRange =
            mode === 'range' &&
            Boolean(activeStart && activeEnd && item.dateStr > activeStart && item.dateStr < activeEnd);

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

      {/* 5. Range Mode Confirmation & Selected Interval Display */}
      {mode === 'range' && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#1e2f52] space-y-2">
          {/* Selected interval box */}
          {rangeStart && rangeEnd ? (
            <div className="flex items-center justify-between bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-2xl px-3 py-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Intervalo Escolhido
                </span>
                <span className="font-black text-[#2563eb] dark:text-blue-400 text-xs">
                  {formatDateBR(rangeStart)} até {formatDateBR(rangeEnd)}
                </span>
              </div>
              <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/70 text-[#2563eb] dark:text-blue-200 px-2.5 py-0.5 rounded-full">
                {getDaysDiff(rangeStart, rangeEnd)} dias
              </span>
            </div>
          ) : rangeStart ? (
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl px-3 py-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Data Inicial
                </span>
                <span className="font-black text-amber-700 dark:text-amber-400 text-xs">
                  {formatDateBR(rangeStart)}
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                Selecione a data final
              </span>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-[#131f38] border border-slate-200 dark:border-[#1e2f52] rounded-2xl px-3 py-2 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
              Clique na data de início e depois na data de fim
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirmRange}
            disabled={!rangeStart}
            className={`w-full py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md ${
              rangeStart
                ? 'bg-[#059669] hover:bg-[#047857] text-white shadow-emerald-700/20 active:scale-[0.98] cursor-pointer'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>
              {rangeStart && rangeEnd
                ? 'Confirmar Intervalo'
                : rangeStart
                ? 'Confirmar Data Inicial'
                : 'Selecione as Datas'}
            </span>
          </button>
        </div>
      )}

      {/* 6. Footer Actions: [ Limpar ]      [ Hoje ] */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-[#1e2f52] px-1">
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
