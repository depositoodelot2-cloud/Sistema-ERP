/**
 * Resilient Storage wrapper that prevents QuotaExceededError crashes.
 * Combines an in-memory fallback store with safe localStorage operations,
 * intelligent cleanup, and image compaction when storage quota is reached.
 */

const memoryStore = new Map<string, string>();

/**
 * Strips huge base64 data URLs from JSON strings for localStorage fallback,
 * while the full rich data stays in memory and in Firestore.
 */
function compactDataForLocalStorage(key: string, rawJson: string): string {
  try {
    if (key.includes('products')) {
      const items = JSON.parse(rawJson);
      if (Array.isArray(items)) {
        const compacted = items.map((item) => {
          // If image is a large base64 string (> 15KB), drop it for localStorage cache
          if (item && item.imageUrl && item.imageUrl.startsWith('data:') && item.imageUrl.length > 15000) {
            return { ...item, imageUrl: undefined };
          }
          return item;
        });
        return JSON.stringify(compacted);
      }
    }
    if (key.includes('sales')) {
      const sales = JSON.parse(rawJson);
      if (Array.isArray(sales) && sales.length > 50) {
        // Keep latest 50 sales in localStorage cache (full history remains in Firestore and memory)
        return JSON.stringify(sales.slice(0, 50));
      }
    }
  } catch {
    // Return original if parsing fails
  }
  return rawJson;
}

/**
 * Attempts to clear non-essential storage to free quota.
 */
function freeLocalStorageQuota(): void {
  try {
    // Remove obsolete keys
    const obsolete = [
      'odelot_pdv_products_v1', 'odelot_pdv_products_v2',
      'odelot_pdv_categories_v1', 'odelot_pdv_categories_v2',
      'odelot_pdv_sales_v1', 'odelot_pdv_sales_v2',
      'odelot_seeded_cart_v2', 'odelot_pdv_quotes_v1',
    ];
    for (const k of obsolete) {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    }

    // Trim sales in localStorage if large
    const salesKey = 'odelot_pdv_sales_v3';
    const salesVal = localStorage.getItem(salesKey);
    if (salesVal) {
      try {
        const sales = JSON.parse(salesVal);
        if (Array.isArray(sales) && sales.length > 30) {
          localStorage.setItem(salesKey, JSON.stringify(sales.slice(0, 30)));
        }
      } catch {
        localStorage.removeItem(salesKey);
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Safely writes a value to memory and localStorage without ever throwing QuotaExceededError.
 */
export function safeSetItem(key: string, value: string): void {
  // Always update in-memory store so the app functions seamlessly
  memoryStore.set(key, value);

  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[SafeStorage] LocalStorage quota exceeded writing key "${key}". Initiating compaction/cleanup...`);

    try {
      freeLocalStorageQuota();

      // Try with compacted data
      const compacted = compactDataForLocalStorage(key, value);
      localStorage.setItem(key, compacted);
    } catch (secondErr) {
      console.warn(`[SafeStorage] Could not persist key "${key}" to localStorage even after compaction. Keeping in memory.`, secondErr);
      // Suppress error - the application will use the in-memory store seamlessly
    }
  }
}

/**
 * Safely reads a value, prioritizing memoryStore then localStorage.
 */
export function safeGetItem(key: string): string | null {
  if (memoryStore.has(key)) {
    return memoryStore.get(key) ?? null;
  }

  try {
    const val = localStorage.getItem(key);
    if (val !== null) {
      memoryStore.set(key, val);
    }
    return val;
  } catch (err) {
    console.warn(`[SafeStorage] Error reading key "${key}" from localStorage:`, err);
    return null;
  }
}

/**
 * Safely removes a key from both stores.
 */
export function safeRemoveItem(key: string): void {
  memoryStore.delete(key);
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Error removing key "${key}" from localStorage:`, err);
  }
}
