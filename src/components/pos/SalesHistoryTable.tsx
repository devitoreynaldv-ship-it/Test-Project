import React, { useMemo, useState } from 'react';
import { FarmConfig, SaleTransaction } from '../../types';
import {
  calculateAgingStatus,
  cleanPhoneForWhatsApp,
  formatDateIndo,
  formatIDR,
  generateWhatsAppMessage,
} from '../../utils/eggConversions';
import { Printer, Search, Share2 } from 'lucide-react';

interface SalesHistoryTableProps {
  config: FarmConfig;
  transactions: SaleTransaction[];
  onOpenReceipt: (tx: SaleTransaction) => void;
}

type StatusFilter = 'ALL' | 'LUNAS' | 'TEMPO';

export const SalesHistoryTable: React.FC<SalesHistoryTableProps> = ({
  config,
  transactions,
  onOpenReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL');

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.customerName.toLowerCase().includes(q) || tx.invoiceNo.toLowerCase().includes(q);
      const matchesStatus =
        filterStatus === 'ALL'
          ? true
          : filterStatus === 'LUNAS'
          ? tx.paymentStatus === 'LUNAS'
          : tx.paymentStatus !== 'LUNAS';
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchQuery, filterStatus]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Riwayat Transaksi Penjualan
          </h2>
          <p className="text-xs text-neutral-500">
            Total {transactions.length} faktur transaksi tersimpan di database
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari pelanggan / invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 text-xs w-48 sm:w-56 focus:outline-amber-500"
            />
          </div>

          {/* Filter Status buttons */}
          <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                filterStatus === 'ALL'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('LUNAS')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                filterStatus === 'LUNAS'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Lunas
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('TEMPO')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                filterStatus === 'TEMPO'
                  ? 'bg-white text-rose-700 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Tempo
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-400 font-semibold uppercase text-[10px]">
              <th className="py-3 px-3">No. Faktur</th>
              <th className="py-3 px-3">Tanggal</th>
              <th className="py-3 px-3">Pelanggan</th>
              <th className="py-3 px-3">Pesanan</th>
              <th className="py-3 px-3">Total (Rp)</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-neutral-400">
                  Tidak ditemukan transaksi yang sesuai.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isUnpaid = tx.paymentStatus !== 'LUNAS';
                const aging = calculateAgingStatus(tx);

                return (
                  <tr key={tx.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-neutral-800">
                      {tx.invoiceNo}
                    </td>
                    <td className="py-3 px-3 text-neutral-500 whitespace-nowrap">
                      {formatDateIndo(tx.date)}
                    </td>
                    <td className="py-3 px-3 font-medium text-neutral-900">
                      <div>{tx.customerName}</div>
                      {tx.customerPhone && (
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {tx.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-neutral-600">
                      <span className="font-semibold text-neutral-800">
                        {tx.totalKg.toFixed(1)} Kg
                      </span>{' '}
                      <span className="text-[11px] text-neutral-400">
                        ({tx.items.map((i) => `${i.qty} ${i.unit}`).join(', ')})
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                      {formatIDR(tx.totalAmount)}
                    </td>
                    <td className="py-3 px-3">
                      {isUnpaid ? (
                        <div>
                          <span
                            className={`inline-block font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                              aging.status === 'Macet'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            Tempo (Sisa {formatIDR(tx.remainingBalance)})
                          </span>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            {aging.label}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-block font-mono font-bold text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                          LUNAS
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenReceipt(tx)}
                          title="Buka & Cetak Nota"
                          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        {tx.customerPhone && (
                          <button
                            onClick={() => {
                              const text = generateWhatsAppMessage(tx, config);
                              const phone = cleanPhoneForWhatsApp(tx.customerPhone);
                              window.open(
                                `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
                                '_blank'
                              );
                            }}
                            title="Kirim Struk via WA"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
