import React from 'react';
import { Sale, StoreSettings } from '../types';
import { getPaymentMethodLabel } from '../utils/formatters';

interface PrintReceiptViewProps {
  sale: Sale;
  settings: StoreSettings;
  format?: '80mm' | '58mm';
}

export const PrintReceiptView: React.FC<PrintReceiptViewProps> = ({
  sale,
  settings,
  format = '80mm',
}) => {
  // Format numbers to Brazilian currency format without 'R$' prefix: '1,20'
  const formatNumber = (val: number | undefined | null): string => {
    if (val === undefined || val === null || isNaN(val)) return '0,00';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format date and time: 13/10/2026, 07:56
  const formatSaleDateTime = (isoString: string): string => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const datePart = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
      const timePart = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
      return `${datePart}, ${timePart}`;
    } catch {
      return '';
    }
  };

  // Format code to #VND-8677 or #VD-8677
  const displayCode = sale.code.startsWith('VND-') || sale.code.startsWith('VD-')
    ? sale.code
    : `VND-${sale.code}`;

  const items = sale.items || [];
  const is58mm = format === '58mm';
  const widthClass = is58mm ? 'w-[58mm]' : 'w-[80mm]';

  return (
    <div
      id="printable-receipt-area"
      className={`${widthClass} max-w-full mx-auto p-3 sm:p-4 bg-white text-black font-mono text-[11px] leading-tight select-none border border-slate-200 dark:border-slate-700 shadow-md rounded-xs`}
      style={{
        width: is58mm ? '58mm' : '80mm',
        minHeight: 'auto',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Header: Store branding */}
      <div className="text-center pb-2">
        <h1 className="text-lg font-black tracking-wider uppercase text-black font-sans leading-none">
          {settings.name || 'ODELOT'}
        </h1>
        {settings.tradingName && settings.tradingName.trim() && settings.tradingName !== 'Depósito Odelot Materiais & Bebidas Ltda' && (
          <p className="text-[10px] font-medium leading-tight text-black mt-1">
            {settings.tradingName.trim()}
          </p>
        )}
        {settings.document && settings.document.trim() && (
          <p className="text-[10px] font-medium leading-tight text-black">
            CNPJ: {settings.document.trim()}
          </p>
        )}
        {settings.address && settings.address.trim() && (
          <p className="text-[10px] font-medium leading-tight text-black">
            {settings.address.trim()}
          </p>
        )}
        {settings.cityState && settings.cityState.trim() && (
          <p className="text-[10px] font-medium leading-tight text-black">
            {settings.cityState.trim()}
          </p>
        )}
        {settings.phone && settings.phone.trim() && (
          <p className="text-[10px] font-medium leading-tight text-black">
            Tel: {settings.phone.trim()}
          </p>
        )}
      </div>

      {/* Dashed Line */}
      <div className="border-b border-dashed border-black/70 my-1.5" />

      {/* 2. Sale Info */}
      <table className="w-full border-collapse text-[10px] my-1">
        <tbody>
          <tr>
            <td className="text-left font-bold py-0.5">CUPOM NÃO FISCAL:</td>
            <td className="text-right font-black italic py-0.5">#{displayCode}</td>
          </tr>
          <tr>
            <td className="text-left font-bold py-0.5">DATA / HORA:</td>
            <td className="text-right py-0.5">{formatSaleDateTime(sale.date)}</td>
          </tr>
          <tr>
            <td className="text-left font-bold py-0.5">VENDEDOR:</td>
            <td className="text-right py-0.5">{sale.operatorName || 'Carlos Admin'}</td>
          </tr>
          {sale.customerName && (
            <tr>
              <td className="text-left font-bold py-0.5">CLIENTE:</td>
              <td className="text-right font-medium py-0.5 truncate max-w-[140px]">{sale.customerName}</td>
            </tr>
          )}
          {sale.customerDocument && (
            <tr>
              <td className="text-left font-bold py-0.5">CPF/CNPJ:</td>
              <td className="text-right py-0.5">{sale.customerDocument}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Dashed Line */}
      <div className="border-b border-dashed border-black/70 my-1.5" />

      {/* 3. Items List */}
      <div className="py-0.5">
        <table className="w-full border-collapse text-[10px] font-black uppercase mb-1">
          <tbody>
            <tr>
              <td className="text-left">ITEM / DESCRIÇÃO</td>
              <td className="text-right">TOTAL</td>
            </tr>
          </tbody>
        </table>

        {/* Dashed Line */}
        <div className="border-b border-dashed border-black/70 my-1" />

        <div className="space-y-1.5 pt-0.5">
          {items.map((item, index) => (
            <div key={item.productId || index} className="text-[10px] leading-tight">
              <div className="font-black text-black break-words uppercase">
                {index + 1}. {item.productName.toUpperCase()}
              </div>
              <table className="w-full border-collapse text-[10px] pt-0.5 text-black">
                <tbody>
                  <tr>
                    <td className="text-left">
                      {item.quantity} {item.unit || 'un'} x {formatNumber(item.unitPrice)}
                    </td>
                    <td className="text-right font-black font-mono">
                      {formatNumber(item.subtotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* Dashed Line */}
      <div className="border-b border-dashed border-black/70 my-1.5" />

      {/* 4. Totals */}
      <div className="py-0.5 text-[10px]">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="text-left font-bold py-0.5">SUBTOTAL:</td>
              <td className="text-right font-mono font-bold py-0.5">{formatNumber(sale.subtotal)}</td>
            </tr>
            {sale.discount > 0 && (
              <tr>
                <td className="text-left font-bold py-0.5">DESCONTO:</td>
                <td className="text-right font-mono py-0.5">- {formatNumber(sale.discount)}</td>
              </tr>
            )}
            {sale.surcharge !== undefined && sale.surcharge > 0 && (
              <tr>
                <td className="text-left font-bold py-0.5">ACRÉSCIMO:</td>
                <td className="text-right font-mono py-0.5">+ {formatNumber(sale.surcharge)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Solid line above TOTAL */}
        <div className="border-t border-black/70 my-1" />

        <table className="w-full border-collapse pt-0.5">
          <tbody>
            <tr>
              <td className="text-left font-black text-xs">TOTAL:</td>
              <td className="text-right font-mono text-sm font-black">{formatNumber(sale.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dashed Line */}
      <div className="border-b border-dashed border-black/70 my-1.5" />

      {/* 5. Payment details */}
      <div className="py-0.5 text-[10px]">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="text-left font-bold py-0.5">FORMA PAGAMENTO:</td>
              <td className="text-right font-black uppercase py-0.5">{getPaymentMethodLabel(sale.paymentMethod).toUpperCase()}</td>
            </tr>
            {sale.paymentMethod === 'money' && (
              <>
                <tr>
                  <td className="text-left font-bold py-0.5">VALOR RECEBIDO:</td>
                  <td className="text-right font-mono py-0.5">{formatNumber(sale.amountPaid || sale.total)}</td>
                </tr>
                <tr>
                  <td className="text-left font-bold py-0.5">TROCO:</td>
                  <td className="text-right font-mono py-0.5">{formatNumber(sale.change || 0)}</td>
                </tr>
              </>
            )}
            {sale.paymentMethod === 'credit' && sale.installments && sale.installments > 1 && (
              <tr>
                <td className="text-left font-bold py-0.5">PARCELAS:</td>
                <td className="text-right py-0.5">{sale.installments}x de {formatNumber(sale.total / sale.installments)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dashed Line */}
      <div className="border-b border-dashed border-black/70 my-1.5" />

      {/* 6. Footer message */}
      <div className="pt-2 text-center text-[10px] leading-tight">
        <p className="font-medium text-black">
          {settings.receiptFooter || 'Agradecemos a sua preferência! Volte sempre.'}
        </p>
        <p className="text-[9px] text-black/70 mt-1 uppercase font-mono">
          ODELOT PDV • SISTEMA DE GESTÃO
        </p>
      </div>
    </div>
  );
};
