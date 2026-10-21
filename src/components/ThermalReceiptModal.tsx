import React from 'react';
import { FarmConfig, SaleTransaction } from '../types';
import { formatDateIndo, formatIDR, generateWhatsAppMessage, cleanPhoneForWhatsApp } from '../utils/eggConversions';
import { X, Printer, Share2, Check } from 'lucide-react';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: SaleTransaction | null;
  config: FarmConfig;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  config,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppMessage(transaction, config);
    const phone = cleanPhoneForWhatsApp(transaction.customerPhone);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = generateWhatsAppMessage(transaction, config);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Screen Modal for User */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 bg-neutral-50">
            <h3 className="text-sm font-bold text-neutral-800">Preview Nota Penjualan</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Receipt Canvas */}
          <div className="p-6 bg-neutral-100/60 overflow-y-auto max-h-[60vh] flex justify-center">
            <div className="w-[300px] bg-white p-5 rounded-lg border border-neutral-200 shadow-xs font-mono text-xs text-neutral-800 leading-relaxed">
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-neutral-300">
                <p className="font-bold text-sm tracking-wide text-neutral-900 uppercase">
                  {config.farmName}
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">{config.address}</p>
                <p className="text-[10px] text-neutral-500">WA: {config.phone}</p>
              </div>

              {/* Meta */}
              <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500">No. Faktur:</span>
                  <span className="font-semibold">{transaction.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tanggal:</span>
                  <span>{formatDateIndo(transaction.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Pelanggan:</span>
                  <span className="font-semibold text-neutral-900">{transaction.customerName}</span>
                </div>
                {transaction.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Kontak:</span>
                    <span>{transaction.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="py-3 border-b border-dashed border-neutral-300 space-y-2">
                <div className="flex justify-between font-bold text-[10px] uppercase text-neutral-400">
                  <span>Item / Qty</span>
                  <span>Subtotal</span>
                </div>
                {transaction.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div>
                      <p className="font-medium text-neutral-900">Telur {item.grade}</p>
                      <p className="text-[10px] text-neutral-500">
                        {item.qty} {item.unit} x {formatIDR(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-semibold text-neutral-900 pt-0.5">
                      {formatIDR(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-3 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Belanja:</span>
                  <span className="font-bold text-sm text-neutral-900">
                    {formatIDR(transaction.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Status Pembayaran:</span>
                  <span
                    className={`font-bold ${
                      transaction.paymentStatus === 'LUNAS' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {transaction.paymentStatus === 'LUNAS'
                      ? 'LUNAS'
                      : transaction.paymentStatus === 'CICILAN'
                      ? 'CICILAN'
                      : 'TEMPO (BON)'}
                  </span>
                </div>
                {transaction.amountPaid > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Dibayar:</span>
                    <span>{formatIDR(transaction.amountPaid)}</span>
                  </div>
                )}
                {transaction.remainingBalance > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold pt-1">
                    <span>Sisa Tagihan:</span>
                    <span>{formatIDR(transaction.remainingBalance)}</span>
                  </div>
                )}
                {transaction.dueDate && (
                  <div className="flex justify-between text-[10px] text-amber-700 pt-0.5">
                    <span>Jatuh Tempo:</span>
                    <span>{formatDateIndo(transaction.dueDate)}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 text-center text-[10px] text-neutral-400 space-y-1">
                <p>Transfer: {config.bankName} - {config.bankAccount}</p>
                <p>a/n {config.bankAccountHolder}</p>
                <p className="pt-1 font-sans">Terima kasih atas kepercayaan Anda!</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-neutral-200 p-4 bg-white flex flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 py-2.5 px-3 text-xs font-semibold text-white hover:bg-neutral-800 transition"
            >
              <Printer className="h-4 w-4" /> Cetak Thermal (80mm)
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 px-3 text-xs font-semibold text-white hover:bg-emerald-700 transition"
            >
              <Share2 className="h-4 w-4" /> Tagih via WA
            </button>
            <button
              onClick={handleCopyText}
              className="flex items-center justify-center rounded-lg border border-neutral-300 py-2.5 px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition"
              title="Salin Pesan WA"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : 'Salin'}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Print Container specifically targeted by CSS media query */}
      <div id="thermal-receipt-printable" className="hidden font-mono text-[11px] leading-snug">
        <center>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{config.farmName}</div>
          <div style={{ fontSize: '9px' }}>{config.address}</div>
          <div style={{ fontSize: '9px' }}>WA: {config.phone}</div>
        </center>
        <div style={{ borderBottom: '1px dashed black', margin: '6px 0' }} />
        <div>No: {transaction.invoiceNo}</div>
        <div>Tgl: {transaction.date}</div>
        <div>Kpd: {transaction.customerName}</div>
        <div style={{ borderBottom: '1px dashed black', margin: '6px 0' }} />
        {transaction.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>{item.qty} {item.unit} T.{item.grade}</span>
            <span>{formatIDR(item.subtotal)}</span>
          </div>
        ))}
        <div style={{ borderBottom: '1px dashed black', margin: '6px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>TOTAL:</span>
          <span>{formatIDR(transaction.totalAmount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Status:</span>
          <span>{transaction.paymentStatus}</span>
        </div>
        {transaction.remainingBalance > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Sisa Bon:</span>
            <span>{formatIDR(transaction.remainingBalance)}</span>
          </div>
        )}
        {transaction.dueDate && (
          <div style={{ fontSize: '9px' }}>Tempo: {transaction.dueDate}</div>
        )}
        <div style={{ borderBottom: '1px dashed black', margin: '6px 0' }} />
        <center style={{ fontSize: '9px', marginTop: '6px' }}>
          BCA {config.bankAccount} a/n {config.bankAccountHolder}<br />
          Terima kasih!
        </center>
      </div>
    </>
  );
};
