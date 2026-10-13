import { useEffect, useState } from 'react';
import {
  batchSyncAllToFirestore,
  COLLECTIONS,
  initFirestoreSyncListeners,
} from '../lib/firestoreSync';
import { Category, Customer, Operator, Product, Sale, StoreSettings } from '../types';
import {
  getStoredCategories,
  getStoredCustomers,
  getStoredOperators,
  getStoredProducts,
  getStoredSales,
  getStoredSettings,
} from '../utils/storage';

const STORAGE_KEYS = {
  PRODUCTS: 'odelot_pdv_products_v3',
  CATEGORIES: 'odelot_pdv_categories_v3',
  SALES: 'odelot_pdv_sales_v3',
  CUSTOMERS: 'odelot_pdv_customers_v3',
  OPERATORS: 'odelot_pdv_operators_v3',
  SETTINGS: 'odelot_pdv_settings_v3',
};

export function useFirestoreSync() {
  const [isCloudSyncActive, setIsCloudSyncActive] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());

  useEffect(() => {
    // 1. Initial push to Firestore if local has initial defaults
    const initialSyncToCloud = async () => {
      try {
        const products = getStoredProducts();
        const categories = getStoredCategories();
        const customers = getStoredCustomers();
        const operators = getStoredOperators();
        const sales = getStoredSales();
        const settings = getStoredSettings();

        await batchSyncAllToFirestore({
          products: products.length > 0 ? products : undefined,
          categories: categories.length > 0 ? categories : undefined,
          customers: customers.length > 0 ? customers : undefined,
          operators: operators.length > 0 ? operators : undefined,
          sales: sales.length > 0 ? sales : undefined,
          settings,
        });
        setLastSyncTime(new Date());
      } catch (err) {
        console.warn('Initial Firestore push notice:', err);
      }
    };

    initialSyncToCloud();

    // 2. Real-time subscriptions from Firestore
    const unsubscribe = initFirestoreSyncListeners({
      onProductsSync: (products: Product[]) => {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        window.dispatchEvent(new Event('odelot_products_changed'));
        setLastSyncTime(new Date());
      },
      onCategoriesSync: (categories: Category[]) => {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
        window.dispatchEvent(new Event('odelot_categories_changed'));
        setLastSyncTime(new Date());
      },
      onCustomersSync: (customers: Customer[]) => {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        window.dispatchEvent(new Event('odelot_customers_changed'));
        setLastSyncTime(new Date());
      },
      onOperatorsSync: (operators: Operator[]) => {
        localStorage.setItem(STORAGE_KEYS.OPERATORS, JSON.stringify(operators));
        window.dispatchEvent(new Event('odelot_operators_changed'));
        setLastSyncTime(new Date());
      },
      onSalesSync: (sales: Sale[]) => {
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
        window.dispatchEvent(new Event('odelot_sales_changed'));
        setLastSyncTime(new Date());
      },
      onSettingsSync: (settings: StoreSettings) => {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        window.dispatchEvent(new Event('odelot_settings_changed'));
        setLastSyncTime(new Date());
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isCloudSyncActive,
    lastSyncTime,
  };
}
