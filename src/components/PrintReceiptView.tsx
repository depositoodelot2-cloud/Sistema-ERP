import React from 'react';
import { Sale, StoreSettings } from '../types';
import { getPaymentMethodLabel } from '../utils/formatters';

interface PrintReceiptViewProps {
  sale: Sale;
  settings: StoreSettings;
}

export const PrintReceiptView: React.FC<PrintReceiptViewProps> = ({ sale, settings }) => {
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

  return (
    <div
      id="printable-receipt-area"
      className="w-[80mm] max-w-full mx-auto p-4 sm:p-5 bg-white text-black font-sans text-[11px] leading-tight select-none border border-slate-200 dark:border-slate-700 shadow-md rounded-xs"
      style={{
        width: '80mm',
        minHeight: 'auto',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Header: Store branding */}
      <div className="text-center pb-2">
        <h1 className="text-xl font-black tracking-wider uppercase text-black font-sans leading-none">
          {settings.name || 'ODELOT'}
        </h1>
        <p className="text-[11px] font-medium leading-tight text-black mt-1">
          {settings.tradingName || 'Depósito Odelot Materiais & Bebidas Ltda'}
        </p>
        <p className="text-[11px] font-medium leading-tight text-black">
          CNPJ: {settings.document || '03.989.211/0001-97'}
        </p>
        <p className="text-[11px] font-medium leading-tight text-black">
          {settings.address || 'Avenida JK,1240 - Jardim Panorama'}
        </p>
        <p className="text-[11px] font-medium leading-tight text-black">
          {settings.cityState || 'Ipatinga - MG'}
        </p>
        <p className="text-[11px] font-medium leading-tight text-black">
          Tel: {settings.phone || '(31)98372-7095'}
        </p>
      </div>

      {/* Dashed Line */}
      <div className="border-b border-dashed border-black/70 my-2" />

      {/* 2. Sale Info */}
      <div className="py-1 text-[11px] space-y-1 font-mono">
        <div className="flex justify-between items-center">
          <span className="font-bold">CUPOM NÃO FISCAL:</span>
          <span className="font-black italic">#{displayCode}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold">DATA / HORA:</span>
          <span>{formatSaleDateTime(sale.date)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold">VENDEDOR:</span>
          <span className="truncate max-w-[160px]">{sale.operatorName || 'Carlos Admin'}</span>
        </div>
        {sale.customerName && (
          <div className="flex justify-between items-center">
            <span className="font-bold">CLIENTE:</span>
            <span className="truncate max-w-[160px]">{sale.customerName}</span>
          </div>
        )}
        {sale.customerDocument && (
          <div className="flex justify-between items-center">
            <span className="font-bold">CPF/CNPJ:</span>
            <span>{sale.customerDocument}</span>
          </div>
        )}
      </div>

      {/* Dashed Line */}
      <div className="border-b border-dashed border-black/70 my-2" />

      {/* 3. Items Table */}
      <div className="py-1">
        <div className="grid grid-cols-12 text-[10px] font-black uppercase pb-1 mb-1 font-mono">
          <span className="col-span-6">ITEM / DESCRIÇÃO</span>
          <span className="col-span-2 text-center">QTD</span>
          <span className="col-span-2 text-right">VL.UN</span>
          <span className="col-span-2 text-right">TOTAL</span>
        </div>

        <div className="border-b border-dashed border-black/40 mb-1.5" />

        <div className="space-y-1 font-mono">
          {sale.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 text-[11px] items-start">
              <div className="col-span-6 pr-1 font-bold truncate leading-tight">
                {idx + 1}. {item.productName}
              </div>
              <div className="col-span-2 text-center font-medium">
                {item.quantity} {item.unit || 'un'}
              </div>
              <div className="col-span-2 text-right font-medium">
                {formatNumber(item.unitPrice)}
              </div>
              <div className="col-span-2 text-right font-black">
                {formatNumber(item.subtotal)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dashed Line */}
      <div className="border-b border-dashed border-black/70 my-2" />

      {/* 4. Subtotal, Discounts, Surcharge & Total */}
      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex justify-between items-center">
          <span className="font-bold">SUBTOTAL:</span>
          <span className="font-bold">R${formatNumber(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between items-center">
            <span className="font-bold">DESCONTO:</span>
            <span className="font-bold">- R${formatNumber(sale.discount)}</span>
          </div>
        )}
        {sale.surcharge !== undefined && sale.surcharge > 0 && (
          <div className="flex justify-between items-center">
            <span className="font-bold">ACRÉSCIMO:</span>
            <span className="font-bold">+ R${formatNumber(sale.surcharge)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-base font-black pt-1">
          <span>TOTAL:</span>
          <span>R$ {formatNumber(sale.total)}</span>
        </div>
      </div>

      {/* Dashed Line */}
      <div className="border-b border-dashed border-black/70 my-2" />

      {/* 5. Forma de Pagamento */}
      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex justify-between items-center">
          <span className="font-bold">FORMA DE PAGAMENTO:</span>
          <span className="font-medium">{getPaymentMethodLabel(sale.paymentMethod)}</span>
        </div>
        {sale.paymentMethod === 'money' && (
          <>
            <div className="flex justify-between items-center">
              <span className="font-bold">VALOR RECEBIDO:</span>
              <span className="font-medium">R${formatNumber(sale.amountPaid || sale.total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold">TROCO:</span>
              <span className="font-medium">R${formatNumber(sale.change || 0)}</span>
            </div>
          </>
        )}
        {sale.paymentMethod === 'credit' && sale.installments && sale.installments > 1 && (
          <div className="flex justify-between items-center">
            <span className="font-bold">PARCELAS:</span>
            <span className="font-medium">
              {sale.installments}x de R${formatNumber(sale.total / sale.installments)}
            </span>
          </div>
        )}
      </div>

      {/* Dashed Line */}
      <div className="border-b border-dashed border-black/70 my-2" />

      {/* 6. Footer message */}
      <div className="text-center pt-1 font-sans">
        <p className="text-[11px] italic font-semibold text-black">
          {settings.receiptFooter || 'Agradecemos a sua preferência! Volte sempre.'}
        </p>
      </div>
    </div>
  );
};
