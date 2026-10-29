import { Sale, StoreSettings } from '../types';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from './formatters';
import { getStoredSettings } from './storage';

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

export const generateReceiptShareText = (sale: Sale, settings: StoreSettings): string => {
  const line = '--------------------------------';
  let text = `🧾 *COMPROVANTE DE VENDA*\n`;
  text += `*${settings.name || 'ODELOT'}*\n`;
  if (settings.phone) text += `Tel: ${settings.phone}\n`;
  text += `${line}\n`;
  text += `Cupom: #${sale.code}\n`;
  text += `Data: ${formatDateTime(sale.date)}\n`;
  text += `Vendedor: ${sale.operatorName || 'Carlos Admin'}\n`;
  if (sale.customerName) text += `Cliente: ${sale.customerName}\n`;
  text += `${line}\n`;
  text += `*ITENS DA VENDA:*\n`;

  (sale.items || []).forEach((item, idx) => {
    text += `${idx + 1}. ${item.productName}\n`;
    text += `   ${item.quantity} ${item.unit || 'un'} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.subtotal)}\n`;
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
  text += `${settings.receiptFooter || 'Agradecemos a sua preferência! Volte sempre.'}\n`;

  return encodeURIComponent(text);
};

const escapeHtml = (str: string | undefined | null): string => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatNumber = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0,00';
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Generates self-contained, clean HTML for receipt printing.
 * Works for 80mm thermal, 58mm thermal, or full A4 page.
 */
export const generateReceiptHtml = (
  sale: Sale,
  settings: StoreSettings,
  format: '80mm' | '58mm' = '80mm'
): string => {
  const displayCode = sale.code.startsWith('VND-') || sale.code.startsWith('VD-')
    ? sale.code
    : `VND-${sale.code}`;

  const formattedDateTime = formatDateTime(sale.date);
  const items = sale.items || [];

  if ((format as string) === 'a4') {
    // ==========================================
    // A4 PAPER FORMAT (Full Page Office / PDF)
    // ==========================================
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Comprovante de Venda #${escapeHtml(displayCode)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #1e293b;
      background: #ffffff;
      padding: 10px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #475569;
      font-weight: 500;
    }
    .doc-badge {
      text-align: right;
    }
    .doc-type {
      font-size: 16px;
      font-weight: 800;
      color: #1e40af;
      text-transform: uppercase;
    }
    .doc-code {
      font-family: monospace;
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .card-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 11px;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
    }
    .info-val {
      font-weight: 700;
      color: #0f172a;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .items-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 7px 10px;
      text-align: left;
    }
    .items-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }
    .items-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .financials {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 24px;
    }
    .payment-box {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .totals-box {
      width: 260px;
      border: 2px solid #0f172a;
      border-radius: 8px;
      padding: 12px 14px;
      background: #ffffff;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 12px;
    }
    .total-grand {
      border-top: 2px solid #0f172a;
      padding-top: 6px;
      margin-top: 6px;
      font-size: 16px;
      font-weight: 900;
      color: #1e40af;
    }
    .signature-area {
      border: 1px dashed #94a3b8;
      border-radius: 8px;
      padding: 16px;
      margin-top: 20px;
      margin-bottom: 16px;
    }
    .signature-text {
      font-size: 10px;
      color: #64748b;
      margin-bottom: 24px;
      text-align: center;
    }
    .signature-lines {
      display: flex;
      justify-content: space-around;
      gap: 20px;
      text-align: center;
    }
    .sig-line {
      width: 220px;
      border-top: 1px solid #0f172a;
      padding-top: 4px;
      font-size: 10px;
      font-weight: 600;
    }
    .footer-note {
      text-align: center;
      font-size: 11px;
      font-style: italic;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">${escapeHtml(settings.name || 'ODELOT')}</h1>
      ${settings.tradingName && settings.tradingName.trim() && settings.tradingName !== 'Depósito Odelot Materiais & Bebidas Ltda' ? `<div class="brand-subtitle">${escapeHtml(settings.tradingName.trim())}</div>` : ''}
      ${[
        settings.document && settings.document.trim() ? `CNPJ: ${escapeHtml(settings.document.trim())}` : '',
        settings.phone && settings.phone.trim() ? `Tel: ${escapeHtml(settings.phone.trim())}` : ''
      ].filter(Boolean).length > 0 ? `<div class="brand-subtitle">${[
        settings.document && settings.document.trim() ? `CNPJ: ${escapeHtml(settings.document.trim())}` : '',
        settings.phone && settings.phone.trim() ? `Tel: ${escapeHtml(settings.phone.trim())}` : ''
      ].filter(Boolean).join(' • ')}</div>` : ''}
      ${[
        settings.address && settings.address.trim() ? escapeHtml(settings.address.trim()) : '',
        settings.cityState && settings.cityState.trim() ? escapeHtml(settings.cityState.trim()) : ''
      ].filter(Boolean).length > 0 ? `<div class="brand-subtitle">${[
        settings.address && settings.address.trim() ? escapeHtml(settings.address.trim()) : '',
        settings.cityState && settings.cityState.trim() ? escapeHtml(settings.cityState.trim()) : ''
      ].filter(Boolean).join(' - ')}</div>` : ''}
    </div>
    <div class="doc-badge">
      <div class="doc-type">Comprovante de Venda</div>
      <div class="doc-code">#${escapeHtml(displayCode)}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Data: ${escapeHtml(formattedDateTime)}</div>
    </div>
  </div>

  <div class="grid-info">
    <div class="info-card">
      <div class="card-title">Dados da Transação</div>
      <div class="info-row"><span class="info-label">Cupom / Venda:</span><span class="info-val">#${escapeHtml(displayCode)}</span></div>
      <div class="info-row"><span class="info-label">Data e Hora:</span><span class="info-val">${escapeHtml(formattedDateTime)}</span></div>
      <div class="info-row"><span class="info-label">Operador / Vendedor:</span><span class="info-val">${escapeHtml(sale.operatorName || 'Carlos Admin')}</span></div>
      <div class="info-row"><span class="info-label">Status:</span><span class="info-val">${sale.status === 'completed' ? 'Concluída' : 'Cancelada'}</span></div>
    </div>
    <div class="info-card">
      <div class="card-title">Dados do Cliente</div>
      <div class="info-row"><span class="info-label">Nome:</span><span class="info-val">${escapeHtml(sale.customerName || 'Consumidor Final')}</span></div>
      ${sale.customerDocument ? `<div class="info-row"><span class="info-label">CPF / CNPJ:</span><span class="info-val">${escapeHtml(sale.customerDocument)}</span></div>` : ''}
      <div class="info-row"><span class="info-label">Atendimento:</span><span class="info-val">Balcão / PDV</span></div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">#</th>
        <th style="width: 70px;">CÓDIGO</th>
        <th>DESCRIÇÃO DO PRODUTO</th>
        <th style="width: 70px; text-align: center;">QTD</th>
        <th style="width: 90px; text-align: right;">VALOR UN.</th>
        ${sale.discount > 0 ? '<th style="width: 80px; text-align: right;">DESC.</th>' : ''}
        <th style="width: 100px; text-align: right;">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, idx) => `
        <tr>
          <td style="text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: 600;">${escapeHtml(item.productCode || `#${idx + 1}`)}</td>
          <td style="font-weight: 700;">${escapeHtml(item.productName)}</td>
          <td style="text-align: center; font-weight: 600;">${item.quantity} ${escapeHtml((item.unit || 'un').toUpperCase())}</td>
          <td style="text-align: right;">R$ ${formatNumber(item.unitPrice)}</td>
          ${sale.discount > 0 ? `<td style="text-align: right; color: #dc2626;">${item.discount > 0 ? `-R$ ${formatNumber(item.discount)}` : '-'}</td>` : ''}
          <td style="text-align: right; font-weight: 800;">R$ ${formatNumber(item.subtotal)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="financials">
    <div class="payment-box">
      <div class="card-title">Forma de Pagamento</div>
      <div class="info-row"><span class="info-label">Método:</span><span class="info-val">${escapeHtml(getPaymentMethodLabel(sale.paymentMethod))}</span></div>
      ${sale.paymentMethod === 'money' ? `
        <div class="info-row"><span class="info-label">Valor Recebido:</span><span class="info-val">R$ ${formatNumber(sale.amountPaid || sale.total)}</span></div>
        <div class="info-row"><span class="info-label">Troco:</span><span class="info-val">R$ ${formatNumber(sale.change || 0)}</span></div>
      ` : ''}
      ${sale.paymentMethod === 'credit' && sale.installments && sale.installments > 1 ? `
        <div class="info-row"><span class="info-label">Parcelamento:</span><span class="info-val">${sale.installments}x de R$ ${formatNumber(sale.total / sale.installments)}</span></div>
      ` : ''}
    </div>

    <div class="totals-box">
      <div class="totals-row">
        <span>Subtotal (${items.length} ${items.length === 1 ? 'item' : 'itens'}):</span>
        <span style="font-weight: 700;">R$ ${formatNumber(sale.subtotal)}</span>
      </div>
      ${sale.discount > 0 ? `
        <div class="totals-row" style="color: #dc2626;">
          <span>Desconto:</span>
          <span style="font-weight: 700;">- R$ ${formatNumber(sale.discount)}</span>
        </div>
      ` : ''}
      ${sale.surcharge && sale.surcharge > 0 ? `
        <div class="totals-row" style="color: #ea580c;">
          <span>Acréscimo:</span>
          <span style="font-weight: 700;">+ R$ ${formatNumber(sale.surcharge)}</span>
        </div>
      ` : ''}
      <div class="totals-row total-grand">
        <span>VALOR TOTAL:</span>
        <span>R$ ${formatNumber(sale.total)}</span>
      </div>
    </div>
  </div>

  <div class="signature-area">
    <div class="signature-text">Declaro que recebi os produtos constantes neste comprovante em perfeitas condições.</div>
    <div class="signature-lines">
      <div class="sig-line">Responsável pela Entrega</div>
      <div class="sig-line">Assinatura do Cliente</div>
    </div>
  </div>

  <div class="footer-note">
    ${escapeHtml(settings.receiptFooter || 'Agradecemos a sua preferência! Volte sempre.')} • ODELOT PDV
  </div>
</body>
</html>`;
  }

  // ==========================================
  // THERMAL RECEIPT FORMAT (80mm or 58mm)
  // ==========================================
  const is58mm = format === '58mm';
  const paperWidth = is58mm ? '58mm' : '80mm';
  const fontSize = is58mm ? '10px' : '11px';
  const sidePadding = is58mm ? '5mm' : '4mm';
  const fontTitleSize = is58mm ? '16px' : '18px';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Cupom #${escapeHtml(displayCode)}</title>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      margin: 0;
      padding: 2mm ${sidePadding};
      font-size: ${fontSize};
      line-height: 1.25;
      background: #ffffff;
      color: #000000;
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt-container {
      width: 100%;
      margin: 0;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    .store-name {
      font-size: ${fontTitleSize};
      font-weight: 900;
      letter-spacing: 0.5px;
      line-height: 1.1;
      margin-bottom: 2px;
      text-transform: uppercase;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      text-align: center;
    }
    .dashed-line {
      border-bottom: 1px dashed #000000;
      margin: 5px 0;
      width: 100%;
      height: 0;
    }
    .solid-line {
      border-top: 1px solid #000000;
      margin: 4px 0;
      width: 100%;
      height: 0;
    }
    table.line-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 1px 0;
    }
    table.line-table td {
      padding: 1px 0;
      vertical-align: top;
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
    }
    table.line-table td.col-left {
      text-align: left;
    }
    table.line-table td.col-right {
      text-align: right;
    }
    .footer-text {
      font-size: 10px;
      margin-top: 4px;
      text-align: center;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div class="receipt-container" style="width: 100%; font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: ${fontSize}; color: #000000; background: #ffffff;">
    
    <!-- 1. Header -->
    <div style="text-align: center; margin-bottom: 2px;">
      <div class="store-name" style="font-size: ${fontTitleSize}; font-weight: 900; text-transform: uppercase; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; text-align: center;">${escapeHtml(settings.name || 'ODELOT')}</div>
      ${settings.tradingName && settings.tradingName.trim() && settings.tradingName !== 'Depósito Odelot Materiais & Bebidas Ltda' ? `<div style="font-size: 10px; font-weight: 500;">${escapeHtml(settings.tradingName.trim())}</div>` : ''}
      ${settings.document && settings.document.trim() ? `<div style="font-size: 10px; font-weight: 500;">CNPJ: ${escapeHtml(settings.document.trim())}</div>` : ''}
      ${settings.address && settings.address.trim() ? `<div style="font-size: 10px; font-weight: 500;">${escapeHtml(settings.address.trim())}</div>` : ''}
      ${settings.cityState && settings.cityState.trim() ? `<div style="font-size: 10px; font-weight: 500;">${escapeHtml(settings.cityState.trim())}</div>` : ''}
      ${settings.phone && settings.phone.trim() ? `<div style="font-size: 10px; font-weight: 500;">Tel: ${escapeHtml(settings.phone.trim())}</div>` : ''}
    </div>

    <div class="dashed-line" style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>

    <!-- 2. Cupom Info -->
    <table class="line-table" style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 2px;">
      <tbody>
        <tr>
          <td class="col-left" style="text-align: left; font-weight: bold; width: 55%;">CUPOM NÃO FISCAL:</td>
          <td class="col-right" style="text-align: right; font-weight: 900; font-style: italic; width: 45%;">#${escapeHtml(displayCode)}</td>
        </tr>
        <tr>
          <td class="col-left" style="text-align: left; font-weight: bold;">DATA / HORA:</td>
          <td class="col-right" style="text-align: right;">${escapeHtml(formattedDateTime)}</td>
        </tr>
        <tr>
          <td class="col-left" style="text-align: left; font-weight: bold;">VENDEDOR:</td>
          <td class="col-right" style="text-align: right;">${escapeHtml(sale.operatorName || 'Carlos Admin')}</td>
        </tr>
        ${sale.customerName ? `
        <tr>
          <td class="col-left" style="text-align: left; font-weight: bold;">CLIENTE:</td>
          <td class="col-right" style="text-align: right;">${escapeHtml(sale.customerName)}</td>
        </tr>` : ''}
        ${sale.customerDocument ? `
        <tr>
          <td class="col-left" style="text-align: left; font-weight: bold;">CPF/CNPJ:</td>
          <td class="col-right" style="text-align: right;">${escapeHtml(sale.customerDocument)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <div class="dashed-line" style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>

    <!-- 3. Items List -->
    <table class="line-table" style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 2px;">
      <tbody>
        <tr>
          <td class="col-left" style="text-align: left; font-weight: 900; text-transform: uppercase;">ITEM / DESCRIÇÃO</td>
          <td class="col-right" style="text-align: right; font-weight: 900; text-transform: uppercase;">TOTAL</td>
        </tr>
      </tbody>
    </table>

    <div class="dashed-line" style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>

    <div style="margin: 2px 0;">
      ${items.map((item, idx) => `
        <div style="margin-bottom: 6px;">
          <div style="font-weight: 900; text-transform: uppercase; word-break: break-word; font-size: 10px; padding-bottom: 1px;">${idx + 1}. ${escapeHtml(item.productName.toUpperCase())}</div>
          <table class="line-table" style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <tbody>
              <tr>
                <td class="col-left" style="text-align: left; font-size: 10px;">${item.quantity} ${escapeHtml(item.unit || 'un')} x ${formatNumber(item.unitPrice)}</td>
                <td class="col-right" style="text-align: right; font-weight: 900; font-size: 10px;">${formatNumber(item.subtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>

    <div class="dashed-line" style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>

    <!-- 4. Totals -->
    <table class="line-table" style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 2px;">
      <tbody>
        <tr>
          <td class="col-left" style="text-align: left; font-weight: bold;">SUBTOTAL:</td>
          <td class="col-right" style="text-align: right; font-weight: bold;">${formatNumber(sale.subtotal)}</td>
        </tr>
        ${sale.discount > 0 ? `
        <tr>
          <td class="col-left" style="text-align: left; font-weight: bold;">DESCONTO:</td>
          <td class="col-right" style="text-align: right; font-weight: bold;">- ${formatNumber(sale.discount)}</td>
        </tr>` : ''}
        ${sale.surcharge && sale.surcharge > 0 ? `
        <tr>
          <td class="col-left" style="text-align: left; font-weight: bold;">ACRÉSCIMO:</td>
          <td class="col-right" style="text-align: right; font-weight: bold;">+ ${formatNumber(sale.surcharge)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <div class="solid-line" style="border-top: 1px solid #000; margin: 4px 0;"></div>

    <table class="line-table" style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 2px 0;">
      <tbody>
        <tr>
          <td class="col-left" style="text-align: left; font-weight: 900; font-size: 13px;">TOTAL:</td>
          <td class="col-right" style="text-align: right; font-weight: 900; font-size: 14px;">${formatNumber(sale.total)}</td>
        </tr>
      </tbody>
    </table>

    <div class="dashed-line" style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>

    <!-- 5. Payment -->
    <table class="line-table" style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 2px;">
      <tbody>
        <tr>
          <td class="col-left" style="text-align: left; font-weight: bold;">FORMA PAGAMENTO:</td>
          <td class="col-right" style="text-align: right; font-weight: 900; text-transform: uppercase;">${escapeHtml(getPaymentMethodLabel(sale.paymentMethod).toUpperCase())}</td>
        </tr>
        ${sale.paymentMethod === 'money' ? `
        <tr>
          <td class="col-left" style="text-align: left; font-weight: bold;">VALOR RECEBIDO:</td>
          <td class="col-right" style="text-align: right;">${formatNumber(sale.amountPaid || sale.total)}</td>
        </tr>
        <tr>
          <td class="col-left" style="text-align: left; font-weight: bold;">TROCO:</td>
          <td class="col-right" style="text-align: right;">${formatNumber(sale.change || 0)}</td>
        </tr>` : ''}
        ${sale.paymentMethod === 'credit' && sale.installments && sale.installments > 1 ? `
        <tr>
          <td class="col-left" style="text-align: left; font-weight: bold;">PARCELAS:</td>
          <td class="col-right" style="text-align: right;">${sale.installments}x de ${formatNumber(sale.total / sale.installments)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <div class="dashed-line" style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>

    <!-- 6. Footer -->
    <div class="footer-text" style="text-align: center; font-size: 10px; line-height: 1.3; margin-top: 4px;">
      <div style="font-weight: 500;">${escapeHtml(settings.receiptFooter || 'Agradecemos a sua preferência! Volte sempre.')}</div>
      <div style="font-size: 9px; margin-top: 4px; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; opacity: 0.85;">
        ODELOT PDV • SISTEMA DE GESTÃO
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Bulletproof receipt printing.
 * Works seamlessly across Android (Print Spooler), iOS (AirPrint), Windows/Mac Chrome/Edge.
 * Injects the exact thermal/A4 HTML and dynamic @page styles, then triggers native print dialog.
 */
export const printReceipt = (
  sale?: Sale | null,
  settings?: StoreSettings,
  format?: '80mm' | '58mm'
) => {
  if (!sale) {
    window.print();
    return;
  }

  const effectiveSettings = settings || getStoredSettings();
  const effectiveFormat = format || effectiveSettings.printerWidth || '80mm';

  const html = generateReceiptHtml(sale, effectiveSettings, effectiveFormat);

  // Clean up any rogue dynamic style tag that could pollute screen fonts
  document.getElementById('receipt-dynamic-print-style')?.remove();

  // Extract <body> content from html
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  // Inject body content into direct print container
  let printContainer = document.getElementById('direct-print-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'direct-print-container';
    document.body.appendChild(printContainer);
  }
  printContainer.innerHTML = bodyContent;

  // 5. Play printer beep if enabled
  if (effectiveSettings.enableSound) {
    playBeep();
  }

  // 6. Trigger native print.
  // Note: We leave printContainer in place so RawBT and Android Print Spooler
  // have full access to it during spooling without any race condition.
  setTimeout(() => {
    try {
      window.print();
    } catch (err) {
      console.error('Erro ao acionar janela de impressão:', err);
    }
  }, 100);
};
