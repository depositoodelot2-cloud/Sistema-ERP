import { Category, Customer, Operator, Product, Quote, ReturnRecord, Sale, StoreSettings } from '../types';
import { batchSyncAllToFirestore, saveSettingsToFirestore } from '../lib/firestoreSync';
import { safeGetItem, safeRemoveItem, safeSetItem } from './safeStorage';

export const STORAGE_KEYS = {
  PRODUCTS: 'odelot_pdv_products_v3',
  CATEGORIES: 'odelot_pdv_categories_v3',
  SALES: 'odelot_pdv_sales_v3',
  QUOTES: 'odelot_pdv_quotes_v3',
  CUSTOMERS: 'odelot_pdv_customers_v3',
  OPERATORS: 'odelot_pdv_operators_v3',
  CURRENT_OPERATOR: 'odelot_pdv_curr_op_v3',
  RETURNS: 'odelot_pdv_returns_v3',
  SETTINGS: 'odelot_pdv_settings_v3',
};

// Clean legacy sample caches from previous runs
try {
  const legacyKeys = [
    'odelot_pdv_products_v1', 'odelot_pdv_categories_v1', 'odelot_pdv_sales_v1',
    'odelot_pdv_quotes_v1', 'odelot_pdv_customers_v1', 'odelot_pdv_operators_v1',
    'odelot_pdv_returns_v1', 'odelot_pdv_settings_v1',
    'odelot_pdv_products_v2', 'odelot_pdv_categories_v2', 'odelot_pdv_sales_v2',
    'odelot_pdv_quotes_v2', 'odelot_pdv_customers_v2', 'odelot_pdv_operators_v2',
    'odelot_pdv_returns_v2', 'odelot_pdv_settings_v2', 'odelot_seeded_cart_v2',
  ];
  legacyKeys.forEach((k) => safeRemoveItem(k));
} catch {
  // ignore
}

const DEFAULT_SETTINGS: StoreSettings = {
  name: 'ODELOT',
  tradingName: '',
  document: '03.989.211/0001-97',
  phone: '(31)98372-7095',
  address: 'Avenida JK,1240 - Jardim Panorama',
  cityState: 'Ipatinga - MG',
  receiptFooter: 'Agradecemos a sua preferência! Volte sempre.',
  pixKey: '03989211000197',
  pixKeyType: 'cnpj',
  enableSound: true,
  printerWidth: '80mm',
  printerCopies: 1,
  autoPrintOnSale: false,
  condensedFont: false,
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Segurança', color: '#ea580c' },
  { id: 'cat-2', name: 'Tinta', color: '#ea580c' },
];

const DEFAULT_OPERATORS: Operator[] = [
  {
    id: 'op-carlos',
    name: 'Carlos Admin',
    role: 'admin',
    pin: '1234',
    active: true,
  },
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Consumidor Final',
    document: '',
    phone: '',
    email: '',
    address: 'Balcão',
    totalSpent: 0,
    purchasesCount: 0,
    createdAt: new Date().toISOString(),
  },
];

// Clean initial products array (0 mock products)
const DEFAULT_PRODUCTS: Product[] = [];

export const getStoredProducts = (): Product[] => {
  const data = safeGetItem(STORAGE_KEYS.PRODUCTS);
  if (!data) {
    safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_PRODUCTS;
  }
};

export const saveStoredProducts = (products: Product[]) => {
  safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  window.dispatchEvent(new Event('odelot_products_changed'));
  batchSyncAllToFirestore({ products }).catch((e) => console.warn('Firestore sync products:', e));
};

export const getStoredCategories = (): Category[] => {
  const data = safeGetItem(STORAGE_KEYS.CATEGORIES);
  if (!data) {
    safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

export const saveStoredCategories = (categories: Category[]) => {
  safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  window.dispatchEvent(new Event('odelot_categories_changed'));
  batchSyncAllToFirestore({ categories }).catch((e) => console.warn('Firestore sync categories:', e));
};

export const getStoredSales = (): Sale[] => {
  const data = safeGetItem(STORAGE_KEYS.SALES);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveStoredSales = (sales: Sale[]) => {
  safeSetItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  window.dispatchEvent(new Event('odelot_sales_changed'));
  batchSyncAllToFirestore({ sales }).catch((e) => console.warn('Firestore sync sales:', e));
};

export const addSaleRecord = (sale: Sale) => {
  const currentSales = getStoredSales();
  const updated = [sale, ...currentSales];
  saveStoredSales(updated);

  // Decrement inventory
  const products = getStoredProducts();
  const updatedProducts = products.map((p) => {
    const soldItem = sale.items.find((item) => item.productId === p.id);
    if (soldItem) {
      return {
        ...p,
        stock: Math.max(0, p.stock - soldItem.quantity),
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });
  saveStoredProducts(updatedProducts);

  if (sale.customerId) {
    const customers = getStoredCustomers();
    const updatedCustomers = customers.map((c) => {
      if (c.id === sale.customerId) {
        return {
          ...c,
          totalSpent: c.totalSpent + sale.total,
          purchasesCount: c.purchasesCount + 1,
        };
      }
      return c;
    });
    saveStoredCustomers(updatedCustomers);
  }
};

export const getStoredQuotes = (): Quote[] => {
  const data = safeGetItem(STORAGE_KEYS.QUOTES);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveStoredQuotes = (quotes: Quote[]) => {
  safeSetItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  window.dispatchEvent(new Event('odelot_quotes_changed'));
};

export const getStoredCustomers = (): Customer[] => {
  const data = safeGetItem(STORAGE_KEYS.CUSTOMERS);
  if (!data) {
    safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
    return DEFAULT_CUSTOMERS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_CUSTOMERS;
  }
};

export const saveStoredCustomers = (customers: Customer[]) => {
  safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  window.dispatchEvent(new Event('odelot_customers_changed'));
  batchSyncAllToFirestore({ customers }).catch((e) => console.warn('Firestore sync customers:', e));
};

export const getStoredOperators = (): Operator[] => {
  const data = safeGetItem(STORAGE_KEYS.OPERATORS);
  if (!data) {
    safeSetItem(STORAGE_KEYS.OPERATORS, JSON.stringify(DEFAULT_OPERATORS));
    return DEFAULT_OPERATORS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_OPERATORS;
  }
};

export const saveStoredOperators = (operators: Operator[]) => {
  safeSetItem(STORAGE_KEYS.OPERATORS, JSON.stringify(operators));
  window.dispatchEvent(new Event('odelot_operators_changed'));
  batchSyncAllToFirestore({ operators }).catch((e) => console.warn('Firestore sync operators:', e));
};

export const getCurrentOperator = (): Operator => {
  const data = safeGetItem(STORAGE_KEYS.CURRENT_OPERATOR);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  const ops = getStoredOperators();
  const def = ops[0] || DEFAULT_OPERATORS[0];
  safeSetItem(STORAGE_KEYS.CURRENT_OPERATOR, JSON.stringify(def));
  return def;
};

export const saveCurrentOperator = (operator: Operator) => {
  safeSetItem(STORAGE_KEYS.CURRENT_OPERATOR, JSON.stringify(operator));
  window.dispatchEvent(new Event('odelot_operator_changed'));
};

export const getStoredReturns = (): ReturnRecord[] => {
  const data = safeGetItem(STORAGE_KEYS.RETURNS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveStoredReturns = (returns: ReturnRecord[]) => {
  safeSetItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));
  window.dispatchEvent(new Event('odelot_returns_changed'));
};

export const getStoredSettings = (): StoreSettings => {
  const data = safeGetItem(STORAGE_KEYS.SETTINGS);
  if (!data) {
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  try {
    const parsed = JSON.parse(data);
    if (parsed.tradingName === 'Depósito Odelot Materiais & Bebidas Ltda') {
      parsed.tradingName = '';
      safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...parsed, tradingName: '' }));
    }
    if (parsed.document === '42.189.923/0001-55') {
      const updated = { ...DEFAULT_SETTINGS, ...parsed, ...DEFAULT_SETTINGS, tradingName: '' };
      safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    }
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      tradingName: parsed.tradingName === 'Depósito Odelot Materiais & Bebidas Ltda' ? '' : (parsed.tradingName || ''),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings: StoreSettings) => {
  safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  window.dispatchEvent(new Event('odelot_settings_changed'));
  saveSettingsToFirestore(settings).catch((e) => console.warn('Firestore sync settings:', e));
};

export const seedSampleData = () => {
  safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
  safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
  safeSetItem(STORAGE_KEYS.OPERATORS, JSON.stringify(DEFAULT_OPERATORS));
  safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));

  window.dispatchEvent(new Event('odelot_products_changed'));
  window.dispatchEvent(new Event('odelot_categories_changed'));
  window.dispatchEvent(new Event('odelot_customers_changed'));
  window.dispatchEvent(new Event('odelot_operators_changed'));
  window.dispatchEvent(new Event('odelot_settings_changed'));
};
