import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { Category, Customer, Operator, Product, Sale, StoreSettings } from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';

// Collections paths
export const COLLECTIONS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  CUSTOMERS: 'customers',
  SALES: 'sales',
  OPERATORS: 'operators',
  SETTINGS: 'settings',
};

// --- Product Firestore Actions ---
export async function saveProductToFirestore(product: Product): Promise<void> {
  const path = `${COLLECTIONS.PRODUCTS}/${product.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), product);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `${COLLECTIONS.PRODUCTS}/${productId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Category Firestore Actions ---
export async function saveCategoryToFirestore(category: Category): Promise<void> {
  const path = `${COLLECTIONS.CATEGORIES}/${category.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.CATEGORIES, category.id), category);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  const path = `${COLLECTIONS.CATEGORIES}/${categoryId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, categoryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Customer Firestore Actions ---
export async function saveCustomerToFirestore(customer: Customer): Promise<void> {
  const path = `${COLLECTIONS.CUSTOMERS}/${customer.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, customer.id), customer);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCustomerFromFirestore(customerId: string): Promise<void> {
  const path = `${COLLECTIONS.CUSTOMERS}/${customerId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Sale Firestore Actions ---
export async function saveSaleToFirestore(sale: Sale): Promise<void> {
  const path = `${COLLECTIONS.SALES}/${sale.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.SALES, sale.id), sale);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// --- Operator Firestore Actions ---
export async function saveOperatorToFirestore(operator: Operator): Promise<void> {
  const path = `${COLLECTIONS.OPERATORS}/${operator.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.OPERATORS, operator.id), operator);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteOperatorFromFirestore(operatorId: string): Promise<void> {
  const path = `${COLLECTIONS.OPERATORS}/${operatorId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.OPERATORS, operatorId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- Settings Firestore Actions ---
export async function saveSettingsToFirestore(settings: StoreSettings): Promise<void> {
  const path = `${COLLECTIONS.SETTINGS}/general`;
  try {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'general'), settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// --- Batch initial sync helper ---
export async function batchSyncAllToFirestore(payload: {
  products?: Product[];
  categories?: Category[];
  customers?: Customer[];
  operators?: Operator[];
  sales?: Sale[];
  settings?: StoreSettings;
}): Promise<void> {
  const batch = writeBatch(db);

  if (payload.products) {
    payload.products.forEach((p) => {
      batch.set(doc(db, COLLECTIONS.PRODUCTS, p.id), p);
    });
  }
  if (payload.categories) {
    payload.categories.forEach((c) => {
      batch.set(doc(db, COLLECTIONS.CATEGORIES, c.id), c);
    });
  }
  if (payload.customers) {
    payload.customers.forEach((c) => {
      batch.set(doc(db, COLLECTIONS.CUSTOMERS, c.id), c);
    });
  }
  if (payload.operators) {
    payload.operators.forEach((o) => {
      batch.set(doc(db, COLLECTIONS.OPERATORS, o.id), o);
    });
  }
  if (payload.sales) {
    payload.sales.forEach((s) => {
      batch.set(doc(db, COLLECTIONS.SALES, s.id), s);
    });
  }
  if (payload.settings) {
    batch.set(doc(db, COLLECTIONS.SETTINGS, 'general'), payload.settings);
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'batch_sync');
  }
}

/**
 * Initializes real-time listeners for all Firestore collections.
 * Automatically mirrors cloud data to local storage and dispatches UI events.
 */
export function initFirestoreSyncListeners(callbacks: {
  onProductsSync: (products: Product[]) => void;
  onCategoriesSync: (categories: Category[]) => void;
  onCustomersSync: (customers: Customer[]) => void;
  onOperatorsSync: (operators: Operator[]) => void;
  onSalesSync: (sales: Sale[]) => void;
  onSettingsSync: (settings: StoreSettings) => void;
}): () => void {
  const unsubs: Array<() => void> = [];

  // Products listener
  try {
    const unsubProducts = onSnapshot(
      collection(db, COLLECTIONS.PRODUCTS),
      (snap) => {
        if (!snap.empty) {
          const list: Product[] = [];
          snap.forEach((d) => list.push(d.data() as Product));
          callbacks.onProductsSync(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.PRODUCTS);
      }
    );
    unsubs.push(unsubProducts);
  } catch {
    // ignore
  }

  // Categories listener
  try {
    const unsubCats = onSnapshot(
      collection(db, COLLECTIONS.CATEGORIES),
      (snap) => {
        if (!snap.empty) {
          const list: Category[] = [];
          snap.forEach((d) => list.push(d.data() as Category));
          callbacks.onCategoriesSync(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.CATEGORIES);
      }
    );
    unsubs.push(unsubCats);
  } catch {
    // ignore
  }

  // Customers listener
  try {
    const unsubCusts = onSnapshot(
      collection(db, COLLECTIONS.CUSTOMERS),
      (snap) => {
        if (!snap.empty) {
          const list: Customer[] = [];
          snap.forEach((d) => list.push(d.data() as Customer));
          callbacks.onCustomersSync(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.CUSTOMERS);
      }
    );
    unsubs.push(unsubCusts);
  } catch {
    // ignore
  }

  // Operators listener
  try {
    const unsubOps = onSnapshot(
      collection(db, COLLECTIONS.OPERATORS),
      (snap) => {
        if (!snap.empty) {
          const list: Operator[] = [];
          snap.forEach((d) => list.push(d.data() as Operator));
          callbacks.onOperatorsSync(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.OPERATORS);
      }
    );
    unsubs.push(unsubOps);
  } catch {
    // ignore
  }

  // Sales listener
  try {
    const unsubSales = onSnapshot(
      collection(db, COLLECTIONS.SALES),
      (snap) => {
        if (!snap.empty) {
          const list: Sale[] = [];
          snap.forEach((d) => list.push(d.data() as Sale));
          callbacks.onSalesSync(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.SALES);
      }
    );
    unsubs.push(unsubSales);
  } catch {
    // ignore
  }

  // Settings listener
  try {
    const unsubSettings = onSnapshot(
      collection(db, COLLECTIONS.SETTINGS),
      (snap) => {
        if (!snap.empty) {
          const docItem = snap.docs.find((d) => d.id === 'general');
          if (docItem) {
            callbacks.onSettingsSync(docItem.data() as StoreSettings);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.SETTINGS);
      }
    );
    unsubs.push(unsubSettings);
  } catch {
    // ignore
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}
