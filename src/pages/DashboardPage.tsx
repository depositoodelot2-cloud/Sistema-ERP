import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Calendar,
  ChevronDown,
  ChevronUp,
  Coins,
  CreditCard,
  DollarSign,
  Package,
  PieChart,
  QrCode,
  Tag,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { AllSoldProductsModal } from '../components/AllSoldProductsModal';
import { CalendarDropdownPopover } from '../components/CalendarDropdownPopover';
import { CalendarPickerPopover } from '../components/CalendarPickerPopover';
import { CategorySalesModal } from '../components/CategorySalesModal';
import { DateFilterModal } from '../components/DateFilterModal';
import { Category, DatePeriod, DateRange, PaymentMethod, Product, Sale } from '../types';
import { getDateRange, isDateInRange } from '../utils/dateFilter';
import { formatCurrency, getPaymentMethodLabel } from '../utils/formatters';
import {
  getStoredCategories,
  getStoredProducts,
  getStoredSales,
} from '../utils/storage';

export const DashboardPage: React.FC<{ onNavigateToInventory?: () => void }> = ({
  onNavigateToInventory,
}) => {
  const [sales, setSales] = useState<Sale[]>(getStoredSales);
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [categories, setCategories] = useState<Category[]>(getStoredCategories);
  
  // Date range filter
  const [activeQuickTab, setActiveQuickTab] = useState<'today' | 'this_month' | 'all'>('today');
  const [currentRange, setCurrentRange] = useState<DateRange>(() => getDateRange('today'));
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  // Rankings modals
  const [showAllSoldModal, setShowAllSoldModal] = useState(false);
  const [showCategorySalesModal, setShowCategorySalesModal] = useState(false);

  useEffect(() => {
    const handleSales = () => setSales(getStoredSales());
    const handleProducts = () => setProducts(getStoredProducts());
    const handleCategories = () => setCategories(getStoredCategories());

    window.addEventListener('odelot_sales_changed', handleSales);
    window.addEventListener('odelot_products_changed', handleProducts);
    window.addEventListener('odelot_categories_changed', handleCategories);

    return () => {
      window.removeEventListener('odelot_sales_changed', handleSales);
      window.removeEventListener('odelot_products_changed', handleProducts);
      window.removeEventListener('odelot_categories_changed', handleCategories);
    };
  }, []);

  const handleQuickTabSelect = (tab: 'today' | 'this_month' | 'all') => {
    setActiveQuickTab(tab);
    if (tab === 'today') {
      setCurrentRange(getDateRange('today'));
    } else if (tab === 'this_month') {
      setCurrentRange(getDateRange('this_month'));
    } else {
      setCurrentRange(getDateRange('all'));
    }
  };

  const handlePeriodChange = (period: DatePeriod) => {
    if (period === 'today') setActiveQuickTab('today');
    else if (period === 'this_month') setActiveQuickTab('this_month');
    else if (period === 'all') setActiveQuickTab('all');
    else setActiveQuickTab('all');

    setCurrentRange(getDateRange(period));
  };

  const handleCustomApply = (start: string, end: string) => {
    setActiveQuickTab('all');
    setCurrentRange(getDateRange('custom', start, end));
  };

  // Filter sales by date range
  const periodSales = useMemo(() => {
    return sales.filter(
      (s) => s.status === 'completed' && isDateInRange(s.date, currentRange)
    );
  }, [sales, currentRange]);

  // Aggregate metrics
  const totalRevenue = periodSales.reduce((acc, s) => acc + s.total, 0);
  const totalSalesCount = periodSales.length;
  const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

  // Calculate gross profit (Revenue - Cost)
  const totalCost = periodSales.reduce((acc, s) => {
    const saleCost = s.items.reduce(
      (itemAcc, item) => itemAcc + item.quantity * (item.costPrice || 0),
      0
    );
    return acc + saleCost;
  }, 0);
  const grossProfit = Math.max(0, totalRevenue - totalCost);

  // Critical stock products (stock <= minStock)
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  // Transferred Inventory metrics
  const totalProductsCount = products.length;
  const totalStockRetailValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.sellPrice, 0);
  }, [products]);
  const totalStockCostValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  }, [products]);

  // Payment methods breakdown
  const paymentBreakdown = useMemo(() => {
    const methods: { [k in PaymentMethod]?: { amount: number; count: number } } = {};
    periodSales.forEach((s) => {
      const current = methods[s.paymentMethod] || { amount: 0, count: 0 };
      methods[s.paymentMethod] = {
        amount: current.amount + s.total,
        count: current.count + 1,
      };
    });

    return Object.entries(methods)
      .map(([method, data]) => ({
        method: method as PaymentMethod,
        amount: data!.amount,
        count: data!.count,
        percentage: totalRevenue > 0 ? (data!.amount / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodSales, totalRevenue]);

  // Top products (Top 5)
  const topProducts = useMemo(() => {
    const stats: { [name: string]: { name: string; quantity: number; revenue: number; unit: string } } = {};
    periodSales.forEach((s) => {
      s.items.forEach((item) => {
        const key = item.productId || item.productName;
        if (!stats[key]) {
          stats[key] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            unit: item.unit || 'un',
          };
        }
        stats[key].quantity += item.quantity;
        stats[key].revenue += item.subtotal;
      });
    });

    return Object.values(stats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [periodSales]);

  // Top categories (Top 5)
  const topCategories = useMemo(() => {
    const productCatMap = new Map<string, string>();
    products.forEach((p) => productCatMap.set(p.id, p.category));

    const stats: { [catId: string]: { id: string; name: string; color: string; itemsCount: number; revenue: number } } = {};

    categories.forEach((cat) => {
      stats[cat.id] = {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        itemsCount: 0,
        revenue: 0,
      };
    });

    periodSales.forEach((s) => {
      s.items.forEach((item) => {
        const catId = productCatMap.get(item.productId) || 'cat-outros';
        if (!stats[catId]) {
          stats[catId] = {
            id: catId,
            name: 'Outros',
            color: '#64748b',
            itemsCount: 0,
            revenue: 0,
          };
        }
        stats[catId].itemsCount += item.quantity;
        stats[catId].revenue += item.subtotal;
      });
    });

    return Object.values(stats)
      .filter((c) => c.revenue > 0 || c.itemsCount > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [periodSales, products, categories]);

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'money':
        return <Banknote className="w-4 h-4 text-emerald-600" />;
      case 'pix':
        return <QrCode className="w-4 h-4 text-teal-600" />;
      case 'credit':
      case 'debit':
        return <CreditCard className="w-4 h-4 text-indigo-600" />;
      case 'credit_account':
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#070e1c] text-slate-900 dark:text-white p-4 sm:p-5 max-w-xl mx-auto w-full pb-24 space-y-4 transition-colors">
      
      {/* ========================================================
          1. HEADER: Title & Subtitle
         ======================================================== */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Dashboard Executivo
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Relatórios, métricas de vendas e estoque em tempo real
        </p>
      </div>

      {/* ========================================================
          2. FILTERS & THEME BAR: Hoje, Mês, Tudo ∨, 🌙
         ======================================================== */}
      <div className="flex items-center justify-between gap-2 pt-1 pb-2">
        <div className="flex items-center gap-1.5">
          {/* Hoje */}
          <button
            type="button"
            onClick={() => handleQuickTabSelect('today')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeQuickTab === 'today'
                ? 'bg-[#2563eb] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hoje
          </button>

          {/* Mês */}
          <button
            type="button"
            onClick={() => handleQuickTabSelect('this_month')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeQuickTab === 'this_month'
                ? 'bg-[#2563eb] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mês
          </button>

          {/* Tudo / Calendário Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCalendarDropdown((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer ${
                showCalendarDropdown || (activeQuickTab === 'all' && currentRange.period !== 'all')
                  ? 'border-blue-400 bg-blue-50/80 dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-400'
                  : 'border-slate-200 dark:border-[#1e2f52] bg-white dark:bg-[#0e172a] text-slate-700 dark:text-slate-200 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>
                {activeQuickTab === 'all' && currentRange.period !== 'all'
                  ? currentRange.label
                  : 'Tudo'}
              </span>
              {showCalendarDropdown ? (
                <ChevronUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
              )}
            </button>

            <CalendarDropdownPopover
              isOpen={showCalendarDropdown}
              onClose={() => setShowCalendarDropdown(false)}
              startDate={currentRange.startDate}
              endDate={currentRange.endDate}
              onSelectSingleDate={(d) => {
                handleCustomApply(d, d);
              }}
              onSelectRange={(start, end) => {
                handleCustomApply(start, end);
              }}
              onClear={() => {
                handlePeriodChange('all');
              }}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/60 dark:border-[#16233d]" />

      {/* ========================================================
          3. BIG HERO CARD: FATURAMENTO TOTAL
         ======================================================== */}
      <div className="p-5 rounded-3xl bg-[#131d47] dark:bg-[#11193d] text-white shadow-xl shadow-[#131d47]/20 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
            FATURAMENTO TOTAL
          </span>
          <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-black text-sm shadow-xs">
            $
          </div>
        </div>

        <div className="my-2.5">
          <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
            {formatCurrency(totalRevenue)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#00c076] font-bold">
          <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{totalSalesCount} vendas registradas no período</span>
        </div>
      </div>

      {/* ========================================================
          4. 2x2 KPI CARDS: Custo, Lucro, Ticket Médio, Estoque Crítico
         ======================================================== */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* CARD 1: CUSTO DAS VENDAS (CMV) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-[#182642] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              CUSTO DAS VEND..
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#fef9c3] dark:bg-amber-950/60 text-[#b45309] dark:text-amber-400 flex items-center justify-center shrink-0">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-1.5">
            <span className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white block">
              {formatCurrency(totalCost)}
            </span>
          </div>

          <span className="text-[10px] text-slate-400 block truncate">
            Custo de mercadorias (CMV)
          </span>
        </div>

        {/* CARD 2: LUCRO BRUTO */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-[#182642] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              LUCRO BRUTO
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#dcfce7] dark:bg-emerald-950/60 text-[#15803d] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          <div className="my-1.5">
            <span className="text-lg sm:text-xl font-black font-mono text-[#00c076] dark:text-emerald-400 block">
              {formatCurrency(grossProfit)}
            </span>
          </div>

          <span className="text-[10px] text-slate-400 block truncate">
            Faturamento líquido - Custo
          </span>
        </div>

        {/* CARD 3: TICKET MÉDIO */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-[#182642] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              TICKET MÉDIO
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#dbeafe] dark:bg-blue-950/60 text-[#1d4ed8] dark:text-blue-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-1.5">
            <span className="text-lg sm:text-xl font-black font-mono text-[#2563eb] dark:text-sky-400 block">
              {formatCurrency(averageTicket)}
            </span>
          </div>

          <span className="text-[10px] text-slate-400 block truncate">
            Média por transação conclu...
          </span>
        </div>

        {/* CARD 4: ESTOQUE CRÍTICO */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-[#182642] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 truncate">
              ESTOQUE CRÍTICO
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#ffedd5] dark:bg-orange-950/60 text-[#c2410c] dark:text-orange-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-1.5">
            <span className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white block">
              {lowStockProducts.length} itens
            </span>
          </div>

          {onNavigateToInventory ? (
            <button
              type="button"
              onClick={onNavigateToInventory}
              className="text-[10px] font-bold text-[#b45309] dark:text-amber-400 flex items-center gap-0.5 hover:underline text-left cursor-pointer"
            >
              <span>Repor estoque</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 block truncate">
              Itens em nível mínimo
            </span>
          )}
        </div>
      </div>

      {/* ========================================================
          5. FATURAMENTO NO PERÍODO CARD
         ======================================================== */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-[#182642] shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              Faturamento no Período
            </h3>
            <span className="text-[11px] text-slate-400">
              Evolução de receitas ao longo do tempo
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-xl bg-[#eff6ff] dark:bg-[#152342] text-[#2563eb] dark:text-sky-400 font-bold font-mono text-xs shadow-2xs">
            {formatCurrency(totalRevenue)}
          </span>
        </div>

        {/* Mini progress / timeline representation */}
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#182642] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{totalSalesCount} transações aprovadas</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {totalSalesCount > 0 ? '100% liquidadas' : 'Aguardando novas vendas'}
          </span>
        </div>
      </div>

      {/* ========================================================
          6. FORMAS DE PAGAMENTO
         ======================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-[#182642] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-500" />
            <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
              Formas de Pagamento
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400">
            {totalSalesCount} transações
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {paymentBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Sem vendas registradas no período selecionado.
            </p>
          ) : (
            paymentBreakdown.map((item) => (
              <div key={item.method} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    {getMethodIcon(item.method)}
                    <span>{getPaymentMethodLabel(item.method)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({item.count})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-bold">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================
          7. PRODUTOS MAIS VENDIDOS (TOP 5)
         ======================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-[#182642] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                Produtos Mais Vendidos
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">Top 5</span>
          </div>

          <div className="space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Sem produtos vendidos no período selecionado.
              </p>
            ) : (
              topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-[#16233d] flex items-center justify-between gap-2.5 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black flex items-center justify-center text-[10px] shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {p.quantity} {p.unit} vendidos
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-black text-slate-900 dark:text-white shrink-0">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAllSoldModal(true)}
          className="mt-4 pt-3 border-t border-slate-100 dark:border-[#182642] w-full text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1 transition-colors"
        >
          Ver Ranking Completo de Produtos <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ========================================================
          8. CATEGORIA MAIS VENDIDAS (TOP 5)
         ======================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-[#182642] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-500" />
              <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                Categoria Mais Vendidas
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">Top 5</span>
          </div>

          <div className="space-y-2">
            {topCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Sem categorias vendidas no período selecionado.
              </p>
            ) : (
              topCategories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-[#16233d] flex items-center justify-between gap-2.5 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center text-[10px] shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {cat.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {cat.itemsCount} {cat.itemsCount === 1 ? 'item vendido' : 'itens vendidos'}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-black text-slate-900 dark:text-white shrink-0">
                    {formatCurrency(cat.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCategorySalesModal(true)}
          className="mt-4 pt-3 border-t border-slate-100 dark:border-[#182642] w-full text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1 transition-colors"
        >
          Ver Ranking Completo de Categoria <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
 
      {/* ========================================================
          9. CARDS DE ESTOQUE TRANSFERIDOS (Total de Produtos, Valor em Estoque, Custo Total)
         ======================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-[#182642] shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#2563eb]" />
            <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
              Visão Geral do Estoque
            </h3>
          </div>
          {onNavigateToInventory && (
            <button
              type="button"
              onClick={onNavigateToInventory}
              className="text-xs font-bold text-[#2563eb] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Ir para Estoque</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Total de Produtos */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-[#16233d] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                Total de Produtos
              </span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2563eb] dark:text-blue-400 flex items-center justify-center shrink-0">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1.5">
              <span className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white block">
                {totalProductsCount} itens
              </span>
            </div>

            <span className="text-[10px] text-slate-400 block truncate">
              Itens cadastrados no catálogo
            </span>
          </div>

          {/* Card 2: Valor em Estoque */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-[#16233d] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                Valor em Estoque
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1.5">
              <span className="text-lg sm:text-xl font-black font-mono text-[#2563eb] dark:text-sky-400 block">
                {formatCurrency(totalStockRetailValue)}
              </span>
            </div>

            <span className="text-[10px] text-slate-400 block truncate">
              Preço de venda total projetado
            </span>
          </div>

          {/* Card 3: Custo Total do Estoque */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-[#16233d] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                Custo Total do Estoque
              </span>
              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Coins className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1.5">
              <span className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white block">
                {formatCurrency(totalStockCostValue)}
              </span>
            </div>

            <span className="text-[10px] text-slate-400 block truncate">
              Custo total de aquisição
            </span>
          </div>
        </div>
      </div>

      {/* Date Filter Modals */}
      <DateFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedPeriod={currentRange.period}
        onSelectPeriod={handlePeriodChange}
        onOpenCustomCalendar={() => setShowCalendarPicker(true)}
      />

      <CalendarPickerPopover
        isOpen={showCalendarPicker}
        onClose={() => setShowCalendarPicker(false)}
        startDate={currentRange.startDate}
        endDate={currentRange.endDate}
        onApply={handleCustomApply}
      />

      {/* Detailed Ranking Modals */}
      <AllSoldProductsModal
        isOpen={showAllSoldModal}
        onClose={() => setShowAllSoldModal(false)}
        sales={periodSales}
      />

      <CategorySalesModal
        isOpen={showCategorySalesModal}
        onClose={() => setShowCategorySalesModal(false)}
        sales={periodSales}
        categories={categories}
        products={products}
      />
    </div>
  );
};
