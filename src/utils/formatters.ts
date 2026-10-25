import { PaymentMethod } from '../types';

export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const parseCurrencyString = (value: string): number => {
  const clean = value.replace(/[^\d]/g, '');
  if (!clean) return 0;
  return parseFloat(clean) / 100;
};

export const formatDate = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatTime = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

export const formatDocument = (value: string): string => {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 11) {
    // CPF: 000.000.000-00
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: 00.000.000/0000-00
    return clean
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

export const formatPhone = (value: string): string => {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 10) {
    // (00) 0000-0000
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  // (00) 00000-0000
  return clean
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

export const generateCode = (prefix: string = 'VND'): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case 'money':
      return 'Dinheiro';
    case 'pix':
      return 'PIX';
    case 'credit':
      return 'Cartão de Crédito';
    case 'debit':
      return 'Cartão de Débito';
    case 'credit_account':
      return 'A Prazo / Fiado';
    case 'split':
      return 'Múltiplas Formas';
    case 'other':
    default:
      return 'Outro';
  }
};

/**
 * Capitalizes only the first letter of each word in a string,
 * keeping the remaining letters lowercase (Title Case).
 */
export const formatTitleCase = (value: string): string => {
  if (!value) return '';
  return value.toLowerCase().replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_match, boundary, char) => {
    return boundary + char.toUpperCase();
  });
};

/**
 * Capitalizes the first letter of each word in real-time while typing,
 * WITHOUT forcing lowercase on remaining letters (so user can type acronyms like PVC, LED, EPI).
 */
export const formatCapitalizeWords = (value: string): string => {
  if (!value) return '';
  return value.replace(/(^|[\s\-\/\.])([a-z\u00E0-\u00FC])/gu, (_match, boundary, char) => {
    return boundary + char.toUpperCase();
  });
};

/**
 * Checks if a string has alphabetic characters and all of them are uppercase.
 */
export const isAllUpper = (str: string): boolean => {
  const letters = str.replace(/[^\p{L}]/gu, '');
  return letters.length > 0 && letters === letters.toUpperCase();
};

/**
 * Common abbreviations and acronyms that should remain UPPERCASE.
 */
export const KNOWN_UPPERCASE_ACRONYMS = new Set([
  'PVC', 'EPI', 'LED', 'CP', 'CPII', 'CP-II', 'RG', 'CPF', 'CNPJ',
  'UN', 'PCT', 'CX', 'MM', 'CM', 'KG', 'LT', 'ML', 'V', 'W', 'A',
  'TIGRE', 'IRWIN', 'AVANT', 'MEGATRON', 'INTECH', 'AMBILUX', 'LORENZETTI', 'EAN'
]);

/**
 * Converts ONLY completely uppercase names to Title Case,
 * while preserving known acronyms (PVC, EPI, LED, etc.) and number notations.
 */
export const standardizeUppercaseName = (name: string): string => {
  if (!isAllUpper(name)) return name;

  // Split tokens by spaces or delimiters
  const tokens = name.split(/(\s+|[-/.,])/);
  const formatted = tokens.map((token) => {
    if (!token || /^(\s+|[-/.,]+)$/.test(token)) return token;

    const upper = token.toUpperCase();
    if (KNOWN_UPPERCASE_ACRONYMS.has(upper)) {
      return upper;
    }

    // Preserve numbers combined with measure units (e.g. 32MM, 20W, 220V)
    if (/^\d+[A-Z]+$/i.test(token)) {
      return token.toUpperCase();
    }

    // Capitalize first letter, lowercase the rest
    return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  });

  return formatted.join('');
};
