export type UnitType = 'un' | 'kg' | 'cx' | 'lt' | 'pct' | 'm' | 'par';

export interface Product {
  id: string;
  code: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: UnitType;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export type PaymentMethod = 
  | 'money' 
  | 'credit' 
  | 'debit' 
  | 'pix' 
  | 'credit_account' 
  | 'split' 
  | 'other';

export interface SaleItem {
  productId: string;
  productCode: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  subtotal: number;
  unit: UnitType;
}

export interface Sale {
  id: string;
  code: string; // e.g. "VND-1042"
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid?: number;
  change?: number;
  installments?: number;
  splitPayments?: Array<{
    method: PaymentMethod;
    amount: number;
  }>;
  customerId?: string;
  customerName?: string;
  customerDocument?: string;
  operatorId: string;
  operatorName: string;
  date: string; // ISO String
  status: 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  cancelReason?: string;
}

export interface Quote {
  id: string;
  code: string; // e.g. "ORC-0051"
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  operatorName: string;
  date: string;
  validUntil: string;
  notes?: string;
  status: 'draft' | 'sent' | 'converted' | 'expired';
}

export interface ReturnRecord {
  id: string;
  saleId: string;
  saleCode: string;
  date: string;
  operatorName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    amount: number;
  }>;
  reason: string;
  totalRefund: number;
  restocked: boolean;
}

export interface Customer {
  id: string;
  name: string;
  document: string; // CPF or CNPJ
  phone: string;
  email: string;
  address: string;
  notes?: string;
  totalSpent: number;
  purchasesCount: number;
  creditLimit?: number;
  outstandingBalance?: number;
  createdAt: string;
}

export interface Operator {
  id: string;
  name: string;
  role: 'admin' | 'cashier' | 'manager';
  pin: string;
  active: boolean;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface StoreSettings {
  name: string;
  tradingName?: string; // Razão Social / Nome Fantasia
  document: string; // CNPJ
  phone: string;
  address: string;
  cityState: string;
  receiptFooter: string;
  pixKey: string;
  pixKeyType: 'cnpj' | 'cpf' | 'email' | 'phone' | 'random';
  enableSound: boolean;
  printerWidth: '80mm' | '58mm';
  printerCopies?: 1 | 2;
  autoPrintOnSale?: boolean;
  condensedFont?: boolean;
}

export type DatePeriod = 
  | 'today' 
  | 'yesterday' 
  | '7days' 
  | '30days' 
  | 'this_month' 
  | 'last_month' 
  | 'all'
  | 'custom';

export interface DateRange {
  period: DatePeriod;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}
