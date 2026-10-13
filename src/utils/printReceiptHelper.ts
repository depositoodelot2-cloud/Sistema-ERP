import { Sale, StoreSettings } from '../types';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from './formatters';

// Web Audio API synthesized sounds (zero network latency, never breaks)
export const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {
    console.debug('Audio not allowed yet or not supported', e);
  }
};

export const playCashSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    // First high ping
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5
    gain1.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.2);

    // Second chime
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.1); // E6
    gain2.gain.setValueAtTime(0.25, audioCtx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(audioCtx.currentTime + 0.1);
    osc2.stop(audioCtx.currentTime + 0.45);
  } catch (e) {
    console.debug('Audio playback note', e);
  }
};

export const printReceipt = () => {
  window.print();
};

export const generateReceiptShareText = (sale: Sale, settings: StoreSettings): string => {
  const line = '--------------------------------';
  let text = `🧾 *COMPROVANTE DE VENDA*\n`;
  text += `*${settings.name}*\n`;
  if (settings.phone) text += `Tel: ${settings.phone}\n`;
  text += `${line}\n`;
  text += `Cupom: #${sale.code}\n`;
  text += `Data: ${formatDateTime(sale.date)}\n`;
  text += `Operador: ${sale.operatorName}\n`;
  if (sale.customerName) text += `Cliente: ${sale.customerName}\n`;
  text += `${line}\n`;
  text += `*ITENS:*\n`;

  sale.items.forEach((item, idx) => {
    text += `${idx + 1}. ${item.productName}\n`;
    text += `   ${item.quantity} ${item.unit} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.subtotal)}\n`;
  });

  text += `${line}\n`;
  text += `Subtotal: ${formatCurrency(sale.subtotal)}\n`;
  if (sale.discount > 0) {
    text += `Desconto: -${formatCurrency(sale.discount)}\n`;
  }
  if (sale.surcharge && sale.surcharge > 0) {
    text += `Acréscimo: +${formatCurrency(sale.surcharge)}\n`;
  }
  text += `*TOTAL: ${formatCurrency(sale.total)}*\n`;
  text += `Pagamento: ${getPaymentMethodLabel(sale.paymentMethod)}\n`;
  if (sale.paymentMethod === 'money' && sale.amountPaid) {
    text += `Valor Recebido: ${formatCurrency(sale.amountPaid)}\n`;
    text += `Troco: ${formatCurrency(sale.change || 0)}\n`;
  }
  text += `${line}\n`;
  text += `${settings.receiptFooter || 'Obrigado pela preferência! Volte sempre.'}\n`;

  return encodeURIComponent(text);
};
