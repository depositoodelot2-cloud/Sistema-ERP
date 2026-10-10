import React, { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  QrCode,
  RotateCcw,
  Search,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { CalendarDropdownPopover } from '../components/CalendarDropdownPopover';
import { ConfirmModal } from '../components/ConfirmModal';
import { QuoteModal } from '../components/QuoteModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { ReturnModal } from '../components/ReturnModal';
import { SaleDetailModal } from '../components/SaleDetailModal';
import { useAuth } from '../hooks/useAuth';
import { DateRange, PaymentMethod, Sale } from '../types';
import { getDateRange, isDateInRange } from '../utils/dateFilter';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../utils/formatters';
import { getStoredSales, saveStoredSales } from '../utils/storage';

export const SalesHistoryPage: React.FC = () => {
  const { currentOperator } = useAuth();

  const [sales, setSales] = useState<Sale[]>(getStoredSales);
  const [selectedQuickDate, setSelectedQuickDate] = useState<'all' | 'today' | 'month'>('all');
  const [singleSelectedDate, setSingleSelectedDate] = useState<string | undefined>(undefined);
  const [customStartDate, setCustomStartDate] = useState<string | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<string | undefined>(undefined);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
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
    return sales.filter((s) => {
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

      // Search check
      const cleanSearch = search.toLowerCase().trim();
      if (!cleanSearch) return true;

      return (
        s.code.toLowerCase().includes(cleanSearch) ||
        (s.customerName && s.customerName.toLowerCase().includes(cleanSearch)) ||
        s.operatorName.toLowerCase().includes(cleanSearch) ||
        (s.customerDocument && s.customerDocument.includes(cleanSearch))
      );
    });
  }, [sales, selectedQuickDate, singleSelectedDate, customStartDate, customEndDate, methodFilter, statusFilter, search]);

  // Metrics
  const completedSalesCount = filteredSales.filter((s) => s.status === 'completed').length;
  const totalRevenue = filteredSales.reduce(
    (sum, s) => (s.status === 'completed' ? sum + s.total : sum),
    0
  );
  const averageTicket = completedSalesCount > 0 ? totalRevenue / completedSalesCount : 0;
  const totalDiscounts = filteredSales.reduce((sum, s) => sum + (s.discount || 0), 0);

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

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'money':
        return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
      case 'pix':
        return <QrCode className="w-3.5 h-3.5 text-teal-600" />;
      case 'credit':
      case 'debit':
        return <CreditCard className="w-3.5 h-3.5 text-indigo-600" />;
      case 'credit_account':
        return <User className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <DollarSign className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#070e1c] text-slate-900 dark:text-white p-4 sm:p-5 max-w-xl mx-auto w-full pb-24 space-y-3.5 transition-colors">
      
      {/* ========================================================
          1. HEADER: Title, "0 efetivadas" green pill, subtitle
         ======================================================== */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Histórico de Vendas
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black tracking-wide shrink-0">
            {completedSalesCount} efetivadas
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          Consultas de cupons fiscais, estornos e faturamento
        </p>
      </div>

      {/* ========================================================
          2. ROW 1: Operator Pill & Orçamentos Pill
         ======================================================== */}
      <div className="flex items-center gap-2">
        {/* Operator Badge Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-[#f0f6ff] dark:bg-blue-950/30 text-xs shadow-2xs">
          <span className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[10px] font-black shrink-0">
            {currentOperator?.name?.charAt(0) || 'C'}
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 font-black text-[9px] tracking-wide">
            {currentOperator?.role === 'admin' ? 'ADMIN' : 'OPERADOR'}
          </span>
        </div>

        {/* Orçamentos Button */}
        <button
          type="button"
          onClick={() => setShowQuoteModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-[#f5f7ff] dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-xs font-bold shadow-2xs transition-all active:scale-95"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Orçamentos</span>
        </button>
      </div>

      {/* ========================================================
          3. ROW 2: Hoje, Mês, Calendário Tudo, Filtro Status, Filtro Pagamento
         ======================================================== */}
      <div className="flex items-center gap-1.5 flex-wrap">
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
          className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all active:scale-95 ${
            selectedQuickDate === 'today'
              ? 'bg-[#2563eb] text-white shadow-xs'
              : 'bg-white dark:bg-[#0e172a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1e2f52] hover:bg-slate-50'
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
          className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
            selectedQuickDate === 'month'
              ? 'bg-[#2563eb] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Mês
        </button>

        {/* Calendário Tudo Button with Interactive Dropdown Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCalendarDropdown((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer ${
              showCalendarDropdown || customDateLabel !== 'Tudo'
                ? 'border-blue-400 bg-blue-50/80 dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-400'
                : 'border-slate-200 dark:border-[#1e2f52] bg-white dark:bg-[#0e172a] text-slate-700 dark:text-slate-200 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{customDateLabel}</span>
            {showCalendarDropdown ? (
              <ChevronUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
            )}
          </button>

          <CalendarDropdownPopover
            isOpen={showCalendarDropdown}
            onClose={() => setShowCalendarDropdown(false)}
            selectedDate={singleSelectedDate}
            startDate={customStartDate}
            endDate={customEndDate}
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

        {/* Status Filter Dropdown [ 🌪️ ∨ ] */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-2xl border border-slate-200 dark:border-[#1e2f52] bg-white dark:bg-[#0e172a] text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs focus:outline-none focus:border-[#2563eb] cursor-pointer"
            title="Filtrar por Status"
          >
            <option value="all">🌪️ Status</option>
            <option value="completed">Efetivadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="returned">Estornadas</option>
          </select>
        </div>

        {/* Payment Method Filter Dropdown [ 💳 ∨ ] */}
        <div className="relative">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-2xl border border-slate-200 dark:border-[#1e2f52] bg-white dark:bg-[#0e172a] text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs focus:outline-none focus:border-[#2563eb] cursor-pointer"
            title="Filtrar por Forma de Pagamento"
          >
            <option value="all">💳 Pagamento</option>
            <option value="money">Dinheiro</option>
            <option value="pix">PIX</option>
            <option value="debit">Cartão Débito</option>
            <option value="credit">Cartão Crédito</option>
            <option value="credit_account">Fiado</option>
          </select>
        </div>
      </div>

      {/* ========================================================
          4. ROW 3: Report Button [ 📄 ] & Search Input
         ======================================================== */}
      <div className="flex items-center gap-2">
        {/* Report / Financial Summary Button */}
        <button
          type="button"
          onClick={() => setShowSummaryModal(true)}
          className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-[#1e2f52] bg-white dark:bg-[#0e172a] hover:bg-slate-50 dark:hover:bg-[#131f38] text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs transition-all active:scale-95"
          title="Ver resumo financeiro das vendas"
        >
          <FileSpreadsheet className="w-4 h-4" />
        </button>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cupom #, cliente..."
            className="w-full pl-9 pr-8 py-2 rounded-2xl border border-slate-200 dark:border-[#1e2f52] bg-slate-50/70 dark:bg-[#0e172a] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#131f38] focus:border-[#2563eb] shadow-2xs transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          5. MAIN CARD: Empty State (Matches Screenshot) or Sales List
         ======================================================== */}
      {filteredSales.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] p-10 sm:p-14 text-center min-h-[300px] flex flex-col items-center justify-center shadow-xs animate-in fade-in">
          {/* Outline Receipt Icon with Dollar Sign */}
          <div className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-3 flex items-center justify-center">
            <svg
              className="w-14 h-14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
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
        <div className="space-y-2.5 animate-in fade-in">
          {filteredSales.map((sale) => (
            <div
              key={sale.id}
              className="rounded-3xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] p-4 shadow-xs transition-all hover:border-slate-300 dark:hover:border-[#22355c] space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-black font-mono text-xs text-slate-900 dark:text-white">
                    #{sale.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                      sale.status === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : sale.status === 'cancelled'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {sale.status === 'completed'
                      ? 'Efetivada'
                      : sale.status === 'cancelled'
                      ? 'Cancelada'
                      : 'Estornada'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {formatDateTime(sale.date)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-[#14213d]">
                <div>
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block truncate max-w-[200px]">
                    {sale.customerName || 'Consumidor Final'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getMethodIcon(sale.paymentMethod)}
                    <span className="text-[11px] font-bold text-slate-500">
                      {getPaymentMethodLabel(sale.paymentMethod)} • {sale.items.length}{' '}
                      {sale.items.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black font-mono text-base text-slate-900 dark:text-white block">
                    {formatCurrency(sale.total)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100 dark:border-[#14213d]">
                <button
                  type="button"
                  onClick={() => setSelectedSaleForReceipt(sale)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  title="Imprimir 2ª via"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>2ª Via</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSaleForDetail(sale)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold transition-colors"
                >
                  Detalhes
                </button>

                {sale.status === 'completed' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedSaleForReturn(sale)}
                      className="px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      title="Estornar / Devolver itens"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Estorno</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSaleToCancel(sale)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Cancelar venda"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          MODALS
         ======================================================== */}
      {/* Quotes Modal */}
      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
      />

      {/* Financial Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#0e172a] rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-[#1e2f52]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e2f52] pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Resumo do Faturamento
                </h3>
                <span className="text-[11px] text-slate-400">
                  {filteredSales.length} registros filtrados
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#131f38]">
                <span className="text-xs text-slate-500">Total Faturado</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(totalRevenue)}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#131f38]">
                <span className="text-xs text-slate-500">Vendas Efetivadas</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono">
                  {completedSalesCount}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#131f38]">
                <span className="text-xs text-slate-500">Ticket Médio</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono">
                  {formatCurrency(averageTicket)}
                </span>
              </div>

              {totalDiscounts > 0 && (
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#131f38]">
                  <span className="text-xs text-slate-500">Total de Descontos</span>
                  <span className="text-xs font-black text-rose-500 font-mono">
                    {formatCurrency(totalDiscounts)}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowSummaryModal(false)}
              className="w-full py-2.5 rounded-2xl bg-[#2563eb] text-white text-xs font-bold hover:bg-blue-600 transition-colors"
            >
              Fechar Resumo
            </button>
          </div>
        </div>
      )}

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
