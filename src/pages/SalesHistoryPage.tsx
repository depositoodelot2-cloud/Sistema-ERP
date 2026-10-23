import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  CreditCard,
  FileText,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { CalendarDropdownPopover } from '../components/CalendarDropdownPopover';
import { ConfirmModal } from '../components/ConfirmModal';
import { QuoteModal } from '../components/QuoteModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { ReturnModal } from '../components/ReturnModal';
import { SaleDetailModal } from '../components/SaleDetailModal';
import { PaymentMethod, Sale } from '../types';
import { getDateRange, isDateInRange } from '../utils/dateFilter';
import { formatCurrency, getPaymentMethodLabel } from '../utils/formatters';
import { filterAndRankSales } from '../utils/semanticSearch';
import { getStoredSales, saveStoredSales } from '../utils/storage';

export const SalesHistoryPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>(getStoredSales);
  const [selectedQuickDate, setSelectedQuickDate] = useState<'all' | 'today' | 'month'>('today');
  const [singleSelectedDate, setSingleSelectedDate] = useState<string | undefined>(undefined);
  const [customStartDate, setCustomStartDate] = useState<string | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<string | undefined>(undefined);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedSaleForDetail, setSelectedSaleForDetail] = useState<Sale | null>(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<Sale | null>(null);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);

  useEffect(() => {
    const handleSalesChange = () => setSales(getStoredSales());
    window.addEventListener('odelot_sales_changed', handleSalesChange);
    return () => {
      window.removeEventListener('odelot_sales_changed', handleSalesChange);
    };
  }, []);

  // Format time (HH:mm) for sales rows
  const formatSaleTime = (isoString: string): string => {
    if (!isoString) return '--:--';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '--:--';
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '--:--';
    }
  };

  // Format label for Tudo button
  const customDateLabel = useMemo(() => {
    if (singleSelectedDate) {
      const [y, m, d] = singleSelectedDate.split('-');
      return `${d}/${m}`;
    }
    if (customStartDate && customEndDate) {
      const [, m1, d1] = customStartDate.split('-');
      const [, m2, d2] = customEndDate.split('-');
      return `${d1}/${m1} - ${d2}/${m2}`;
    }
    return 'Tudo';
  }, [singleSelectedDate, customStartDate, customEndDate]);

  // Filter sales
  const filteredSales = useMemo(() => {
    const dateAndFilterSales = sales.filter((s) => {
      // Date range check
      if (selectedQuickDate === 'today') {
        const todayRange = getDateRange('today');
        if (!isDateInRange(s.date, todayRange)) return false;
      } else if (selectedQuickDate === 'month') {
        const monthRange = getDateRange('this_month');
        if (!isDateInRange(s.date, monthRange)) return false;
      } else if (singleSelectedDate) {
        if (!s.date.startsWith(singleSelectedDate)) return false;
      } else if (customStartDate && customEndDate) {
        const sDate = s.date.split('T')[0];
        if (sDate < customStartDate || sDate > customEndDate) return false;
      }

      // Method filter
      if (methodFilter !== 'all' && s.paymentMethod !== methodFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      return true;
    });

    // Semantic, partial & intent-based sales search
    return filterAndRankSales(dateAndFilterSales, search);
  }, [sales, selectedQuickDate, singleSelectedDate, customStartDate, customEndDate, methodFilter, statusFilter, search]);

  // Set of dates with recorded sales (for calendar dot indicators)
  const saleDatesSet = useMemo(() => {
    const dates = new Set<string>();
    sales.forEach((s) => {
      if (s.status !== 'cancelled' && s.date) {
        const d = s.date.split('T')[0];
        if (d) dates.add(d);
      }
    });
    return dates;
  }, [sales]);

  // Metrics
  const completedSalesCount = filteredSales.filter((s) => s.status === 'completed').length;

  const handleCancelSale = () => {
    if (!saleToCancel) return;
    const updated = sales.map((s) =>
      s.id === saleToCancel.id ? { ...s, status: 'cancelled' as const } : s
    );
    setSales(updated);
    saveStoredSales(updated);
    setSaleToCancel(null);
    setSelectedSaleForDetail(null);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-[#f8fafc] dark:bg-[#070e1c] text-slate-900 dark:text-white max-w-xl mx-auto w-full transition-colors">
      
      {/* ========================================================
          FIXED TOP AREA: EXACT REPLICA OF REFERENCE DESIGN
         ======================================================== */}
      <div className="shrink-0 px-4 pt-4 pb-3 space-y-3 bg-[#f8fafc] dark:bg-[#070e1c] z-20 transition-colors">
        
        {/* 1. HEADER: Title & "1 efetivada" badge */}
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Vendas
          </h1>
          <span className="px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold shrink-0">
            {completedSalesCount} {completedSalesCount === 1 ? 'efetivada' : 'efetivadas'}
          </span>
        </div>

        {/* 2. ROW 1: [Hoje] [Mês] [Tudo v]      [Status v] */}
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Hoje */}
            <button
              type="button"
              onClick={() => {
                setSelectedQuickDate('today');
                setSingleSelectedDate(undefined);
                setCustomStartDate(undefined);
                setCustomEndDate(undefined);
                setShowCalendarDropdown(false);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                selectedQuickDate === 'today'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hoje
            </button>

            {/* Mês */}
            <button
              type="button"
              onClick={() => {
                setSelectedQuickDate('month');
                setSingleSelectedDate(undefined);
                setCustomStartDate(undefined);
                setCustomEndDate(undefined);
                setShowCalendarDropdown(false);
              }}
              className={`px-2.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                selectedQuickDate === 'month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mês
            </button>

            {/* Tudo (Calendário Popover) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCalendarDropdown((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer ${
                  showCalendarDropdown || customDateLabel !== 'Tudo' || selectedQuickDate === 'all'
                    ? 'border-blue-300 dark:border-blue-700 bg-white dark:bg-[#0e172a] text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e172a] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{customDateLabel}</span>
                {showCalendarDropdown ? (
                  <ChevronUp className="w-3.5 h-3.5 text-blue-500 stroke-[2.5]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-blue-400 stroke-[2.5]" />
                )}
              </button>

              <CalendarDropdownPopover
                isOpen={showCalendarDropdown}
                onClose={() => setShowCalendarDropdown(false)}
                selectedDate={singleSelectedDate}
                startDate={customStartDate}
                endDate={customEndDate}
                saleDates={saleDatesSet}
                onSelectSingleDate={(d) => {
                  setSingleSelectedDate(d);
                  setCustomStartDate(undefined);
                  setCustomEndDate(undefined);
                  setSelectedQuickDate('all');
                }}
                onSelectRange={(start, end) => {
                  setCustomStartDate(start);
                  setCustomEndDate(end);
                  setSingleSelectedDate(undefined);
                  setSelectedQuickDate('all');
                }}
                onClear={() => {
                  setSingleSelectedDate(undefined);
                  setCustomStartDate(undefined);
                  setCustomEndDate(undefined);
                  setSelectedQuickDate('all');
                }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e172a] text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-slate-300 transition-colors pointer-events-none">
              <Filter className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>
                {statusFilter === 'all'
                  ? 'Status'
                  : statusFilter === 'completed'
                  ? 'Efetivadas'
                  : statusFilter === 'cancelled'
                  ? 'Canceladas'
                  : 'Estornadas'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              title="Filtrar por Status"
            >
              <option value="all">Todos os Status</option>
              <option value="completed">Efetivadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="returned">Estornadas</option>
            </select>
          </div>
        </div>

        {/* 3. ROW 2: [Orçamentos]      [Pagamento v] */}
        <div className="flex items-center justify-between w-full gap-2">
          {/* Orçamentos */}
          <button
            type="button"
            onClick={() => setShowQuoteModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-200 dark:border-blue-900 bg-white dark:bg-[#0e172a] text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Orçamentos</span>
          </button>

          {/* Pagamento Filter */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-200 dark:border-blue-900 bg-white dark:bg-[#0e172a] text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-blue-300 transition-colors pointer-events-none">
              <CreditCard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {methodFilter === 'all' ? 'Pagamento' : getPaymentMethodLabel(methodFilter as PaymentMethod)}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 stroke-[2.5] shrink-0" />
            </div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              title="Filtrar por Forma de Pagamento"
            >
              <option value="all">Todas as Formas</option>
              <option value="money">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="debit">Cartão Débito</option>
              <option value="credit">Cartão Crédito</option>
              <option value="credit_account">Fiado</option>
            </select>
          </div>
        </div>

        {/* 4. ROW 3: Rounded-Full Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cupom #, cliente..."
            className="w-full pl-9 pr-8 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e172a] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Subtle Divider Line below Search */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 w-full shrink-0" />

      {/* ========================================================
          SCROLLABLE SALES LIST (SLEEK PILL ROWS)
         ======================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-3 space-y-2 pb-24 overscroll-contain">
        {filteredSales.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] p-10 text-center min-h-[220px] flex flex-col items-center justify-center shadow-xs animate-in fade-in">
            <div className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2.5 flex items-center justify-center">
              <svg
                className="w-10 h-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
                <path d="M12 7v10" />
                <path d="M15 9.5a2.5 2.5 0 0 0-5 0c0 1.5 1 2 2.5 2.5s2.5 1 2.5 2.5a2.5 2.5 0 0 1-5 0" />
              </svg>
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
              Nenhuma venda encontrada
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Realize vendas no PDV para listar aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-2 animate-in fade-in">
            {filteredSales.map((sale) => (
              <div
                key={sale.id}
                onClick={() => setSelectedSaleForDetail(sale)}
                className="rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0e172a] px-4 py-2.5 flex items-center justify-between shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group active:scale-[0.99]"
              >
                {/* Left: Clock Icon + Time + Customer / Operator Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-mono font-medium text-slate-500 shrink-0">
                    {formatSaleTime(sale.date)}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {sale.customerName || sale.operatorName || 'Anacleto'}
                  </span>
                </div>

                {/* Right: Total Value + Chevron Right */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(sale.total)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          MODALS
         ======================================================== */}
      {/* Quotes Modal */}
      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
      />

      {/* Sale Detail Modal */}
      {selectedSaleForDetail && (
        <SaleDetailModal
          isOpen={!!selectedSaleForDetail}
          onClose={() => setSelectedSaleForDetail(null)}
          sale={selectedSaleForDetail}
          onPrintReceipt={() => {
            setSelectedSaleForReceipt(selectedSaleForDetail);
          }}
          onStartReturn={() => {
            setSelectedSaleForReturn(selectedSaleForDetail);
            setSelectedSaleForDetail(null);
          }}
          onCancelSale={() => {
            setSaleToCancel(selectedSaleForDetail);
          }}
        />
      )}

      {/* Receipt Modal */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          isOpen={!!selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
          sale={selectedSaleForReceipt}
        />
      )}

      {/* Return Modal */}
      {selectedSaleForReturn && (
        <ReturnModal
          isOpen={!!selectedSaleForReturn}
          onClose={() => setSelectedSaleForReturn(null)}
          sale={selectedSaleForReturn}
        />
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={!!saleToCancel}
        onClose={() => setSaleToCancel(null)}
        onConfirm={handleCancelSale}
        title="Cancelar Venda"
        message={`Deseja realmente cancelar a venda #${saleToCancel?.code}? Os itens serão retornados ao estoque.`}
        confirmText="Confirmar Cancelamento"
        isDestructive
      />
    </div>
  );
};
