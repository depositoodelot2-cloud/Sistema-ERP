/**
 * Barcode validation and sound utilities for Odelot ERP
 * Validates check digits for EAN-13, EAN-8, UPC-A, UPC-E and CODE-128
 */

/**
 * Validates EAN-13 check digit
 * Format: 13 numeric digits
 * Algorithm: sum of odd positions (x1) + even positions (x3) mod 10
 */
export function isValidEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(code[12], 10);
}

/**
 * Validates EAN-8 check digit
 * Format: 8 numeric digits
 * Algorithm: sum of odd positions (x3) + even positions (x1) mod 10
 */
export function isValidEan8(code: string): boolean {
  if (!/^\d{8}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(code[i], 10);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(code[7], 10);
}

/**
 * Validates UPC-A check digit
 * Format: 12 numeric digits
 * Algorithm: sum of odd positions (x3) + even positions (x1) mod 10
 */
export function isValidUpcA(code: string): boolean {
  if (!/^\d{12}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(code[i], 10);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(code[11], 10);
}

/**
 * Validates UPC-E format (6 to 8 digits)
 */
export function isValidUpcE(code: string): boolean {
  return /^\d{6,8}$/.test(code);
}

/**
 * Validates Code 128 format (printable ASCII characters, minimum 2 chars)
 */
export function isValidCode128(code: string): boolean {
  return code.length >= 2 && /^[\x20-\x7E]+$/.test(code);
}

export interface BarcodeValidationResult {
  isValid: boolean;
  format: 'EAN-13' | 'EAN-8' | 'UPC-A' | 'UPC-E' | 'CODE-128' | 'UNKNOWN';
  cleaned: string;
}

/**
 * Validates a scanned barcode against supported retail barcode standards
 */
export function validateBarcode(raw: string): BarcodeValidationResult {
  const cleaned = raw.trim();
  if (!cleaned) {
    return { isValid: false, format: 'UNKNOWN', cleaned: '' };
  }

  // 1. EAN-13 (Standard retail packaging)
  if (cleaned.length === 13 && /^\d{13}$/.test(cleaned)) {
    return {
      isValid: isValidEan13(cleaned),
      format: 'EAN-13',
      cleaned,
    };
  }

  // 2. EAN-8 (Small retail items)
  if (cleaned.length === 8 && /^\d{8}$/.test(cleaned)) {
    return {
      isValid: isValidEan8(cleaned),
      format: 'EAN-8',
      cleaned,
    };
  }

  // 3. UPC-A (12 digits standard)
  if (cleaned.length === 12 && /^\d{12}$/.test(cleaned)) {
    return {
      isValid: isValidUpcA(cleaned),
      format: 'UPC-A',
      cleaned,
    };
  }

  // 4. UPC-E (Compressed 6-8 digits)
  if (/^\d{6,8}$/.test(cleaned)) {
    return {
      isValid: isValidUpcE(cleaned),
      format: 'UPC-E',
      cleaned,
    };
  }

  // 5. Code 128 (Logistics, boxes, labels)
  if (isValidCode128(cleaned)) {
    return {
      isValid: true,
      format: 'CODE-128',
      cleaned,
    };
  }

  return {
    isValid: false,
    format: 'UNKNOWN',
    cleaned,
  };
}

/**
 * Synthesizes a crisp, professional POS terminal barcode reader beep
 * Uses standard Web Audio API with zero external file dependencies
 */
export function playScannerBeep(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // 1950 Hz pure tone for 85ms gives the classic commercial handheld scanner beep
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1950, ctx.currentTime);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.085);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.085);
  } catch (err) {
    console.debug('Barcode scanner audio feedback note:', err);
  }
}
