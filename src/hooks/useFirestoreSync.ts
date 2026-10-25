import { useEffect, useState } from 'react';
import {
  batchSyncAllToFirestore,
  COLLECTIONS,
  initFirestoreSyncListeners,
} from '../lib/firestoreSync';
import { Category, Customer, Operator, Product, Sale, StoreSettings } from '../types';
import { safeSetItem } from '../utils/safeStorage';
import {
  getStoredCategories,
  getStoredCustomers,
  getStoredOperators,
  getStoredProducts,
  getStoredSales,
  getStoredSettings,
  STORAGE_KEYS,
} from '../utils/storage';

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
        try {
          safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
          window.dispatchEvent(new Event('odelot_products_changed'));
          setLastSyncTime(new Date());
        } catch (err) {
          console.warn('[Sync] Failed to process products update:', err);
        }
      },
      onCategoriesSync: (categories: Category[]) => {
        try {
          safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
          window.dispatchEvent(new Event('odelot_categories_changed'));
          setLastSyncTime(new Date());
        } catch (err) {
          console.warn('[Sync] Failed to process categories update:', err);
        }
      },
      onCustomersSync: (customers: Customer[]) => {
        try {
          safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
          window.dispatchEvent(new Event('odelot_customers_changed'));
          setLastSyncTime(new Date());
        } catch (err) {
          console.warn('[Sync] Failed to process customers update:', err);
        }
      },
      onOperatorsSync: (operators: Operator[]) => {
        try {
          safeSetItem(STORAGE_KEYS.OPERATORS, JSON.stringify(operators));
          window.dispatchEvent(new Event('odelot_operators_changed'));
          setLastSyncTime(new Date());
        } catch (err) {
          console.warn('[Sync] Failed to process operators update:', err);
        }
      },
      onSalesSync: (sales: Sale[]) => {
        try {
          safeSetItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
          window.dispatchEvent(new Event('odelot_sales_changed'));
          setLastSyncTime(new Date());
        } catch (err) {
          console.warn('[Sync] Failed to process sales update:', err);
        }
      },
      onSettingsSync: (settings: StoreSettings) => {
        try {
          safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
          window.dispatchEvent(new Event('odelot_settings_changed'));
          setLastSyncTime(new Date());
        } catch (err) {
          console.warn('[Sync] Failed to process settings update:', err);
        }
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
