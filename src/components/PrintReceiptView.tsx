import React from 'react';
import { Sale, StoreSettings } from '../types';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../utils/formatters';

interface PrintReceiptViewProps {
  sale: Sale;
  settings: StoreSettings;
}

export const PrintReceiptView: React.FC<PrintReceiptViewProps> = ({ sale, settings }) => {
  return (
    <div
      id="printable-receipt-area"
      className="w-full max-w-[340px] mx-auto p-4 bg-white text-black font-mono text-[12px] leading-tight select-none border border-slate-200 shadow-sm"
    >
      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-black/40">
        <h2 className="text-base font-black tracking-tight uppercase">
          {settings.name}
        </h2>
        {settings.tradingName && (
          <p className="text-[10px] text-black/70">{settings.tradingName}</p>
        )}
        {settings.document && (
          <p className="text-[10px]">CNPJ: {settings.document}</p>
        )}
        {settings.address && (
          <p className="text-[10px]">{settings.address}</p>
        )}
        {settings.cityState && (
          <p className="text-[10px]">{settings.cityState}</p>
        )}
        {settings.phone && (
          <p className="text-[10px]">Tel: {settings.phone}</p>
        )}
      </div>

      {/* Sale Info */}
      <div className="py-2 border-b border-dashed border-black/40 text-[11px] space-y-0.5">
        <div className="flex justify-between">
          <span>CUPOM NÃO FISCAL:</span>
          <span className="font-bold">#{sale.code}</span>
        </div>
        <div className="flex justify-between">
          <span>DATA / HORA:</span>
          <span>{formatDateTime(sale.date)}</span>
        </div>
        <div className="flex justify-between">
          <span>OPERADOR:</span>
          <span className="truncate max-w-[160px]">{sale.operatorName}</span>
        </div>
        {sale.customerName && (
          <div className="flex justify-between">
            <span>CLIENTE:</span>
            <span className="truncate max-w-[160px]">{sale.customerName}</span>
          </div>
        )}
        {sale.customerDocument && (
          <div className="flex justify-between">
            <span>DOC:</span>
            <span>{sale.customerDocument}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="py-2 border-b border-dashed border-black/40">
        <div className="grid grid-cols-12 font-bold text-[10px] uppercase border-b border-black/20 pb-1 mb-1">
          <span className="col-span-6">ITEM / DESCRIÇÃO</span>
          <span className="col-span-2 text-center">QTD</span>
          <span className="col-span-2 text-right">VL.UN</span>
          <span className="col-span-2 text-right">TOTAL</span>
        </div>

        <div className="space-y-1">
          {sale.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 text-[11px] items-start">
              <div className="col-span-6 pr-1">
                <span className="font-semibold block truncate leading-tight">
                  {idx + 1}. {item.productName}
                </span>
                {item.barcode && (
                  <span className="text-[9px] text-black/60 block">{item.barcode}</span>
                )}
              </div>
              <span className="col-span-2 text-center">
                {item.quantity} {item.unit}
              </span>
              <span className="col-span-2 text-right">
                {formatCurrency(item.unitPrice).replace('R$', '').trim()}
              </span>
              <span className="col-span-2 text-right font-bold">
                {formatCurrency(item.subtotal).replace('R$', '').trim()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals & Payments */}
      <div className="py-2 border-b border-dashed border-black/40 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-black/80">
            <span>DESCONTO:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-black pt-1 border-t border-black/20">
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
      </div>

      {/* Payment details */}
      <div className="py-2 border-b border-dashed border-black/40 text-[11px] space-y-0.5">
        <div className="flex justify-between font-bold">
          <span>FORMA DE PAGAMENTO:</span>
          <span>{getPaymentMethodLabel(sale.paymentMethod)}</span>
        </div>
        {sale.paymentMethod === 'money' && sale.amountPaid !== undefined && (
          <>
            <div className="flex justify-between">
              <span>VALOR RECEBIDO:</span>
              <span>{formatCurrency(sale.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>TROCO:</span>
              <span>{formatCurrency(sale.change || 0)}</span>
            </div>
          </>
        )}
        {sale.paymentMethod === 'credit' && sale.installments && sale.installments > 1 && (
          <div className="flex justify-between">
            <span>PARCELAMENTO:</span>
            <span>{sale.installments}x de {formatCurrency(sale.total / sale.installments)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-3 space-y-2">
        <p className="text-[11px] italic font-semibold">
          {settings.receiptFooter || 'Obrigado pela preferência! Volte sempre.'}
        </p>

        {/* Barcode visual representation */}
        <div className="pt-2 flex flex-col items-center">
          <div className="flex items-center justify-center gap-0.5 h-10 w-48 bg-black/5 px-2 py-1">
            {Array.from({ length: 36 }).map((_, i) => (
              <span
                key={i}
                className="bg-black inline-block h-full"
                style={{
                  width: i % 3 === 0 ? '3px' : i % 2 === 0 ? '2px' : '1px',
                  marginRight: i % 4 === 0 ? '2px' : '1px',
                }}
              />
            ))}
          </div>
          <span className="text-[9px] tracking-widest mt-0.5">{sale.code}</span>
        </div>

        <p className="text-[9px] text-black/50">Sistema PDV Depósito Odelot</p>
      </div>
    </div>
  );
};
