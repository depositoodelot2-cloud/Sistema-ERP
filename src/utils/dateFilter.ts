import { DatePeriod, DateRange } from '../types';

export const getDateRange = (
  period: DatePeriod,
  customStart?: string,
  customEnd?: string
): DateRange => {
  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  switch (period) {
    case 'today': {
      const todayStr = formatYMD(now);
      return {
        period,
        startDate: todayStr,
        endDate: todayStr,
        label: 'Hoje',
      };
    }
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const str = formatYMD(yesterday);
      return {
        period,
        startDate: str,
        endDate: str,
        label: 'Ontem',
      };
    }
    case '7days': {
      const past = new Date(now);
      past.setDate(now.getDate() - 6);
      return {
        period,
        startDate: formatYMD(past),
        endDate: formatYMD(now),
        label: 'Últimos 7 dias',
      };
    }
    case '30days': {
      const past = new Date(now);
      past.setDate(now.getDate() - 29);
      return {
        period,
        startDate: formatYMD(past),
        endDate: formatYMD(now),
        label: 'Últimos 30 dias',
      };
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        period,
        startDate: formatYMD(start),
        endDate: formatYMD(now),
        label: 'Este Mês',
      };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        period,
        startDate: formatYMD(start),
        endDate: formatYMD(end),
        label: 'Mês Passado',
      };
    }
    case 'all': {
      return {
        period,
        startDate: '2020-01-01',
        endDate: formatYMD(now),
        label: 'Tudo',
      };
    }
    case 'custom':
    default: {
      const start = customStart || formatYMD(now);
      const end = customEnd || formatYMD(now);
      return {
        period: 'custom',
        startDate: start,
        endDate: end,
        label: 'Personalizado',
      };
    }
  }
};

export const isDateInRange = (dateIso: string, range: DateRange): boolean => {
  if (!dateIso) return false;
  const dateStr = dateIso.split('T')[0];
  return dateStr >= range.startDate && dateStr <= range.endDate;
};
