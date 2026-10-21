import React, { useState } from 'react';
import { FarmConfig, PaymentInstallment, PaymentStatus, SaleTransaction } from '../types';
import {
  calculateAgingStatus,
  cleanPhoneForWhatsApp,
  formatDateIndo,
  formatIDR,
  generateWhatsAppMessage,
  getTodayString,
} from '../utils/eggConversions';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Share2,
  Search,
  DollarSign,
  UserCheck,
  ChevronRight,
  Printer,
  X,
  CreditCard,
  PlusCircle,
} from 'lucide-react';

interface ReceivablesViewProps {
  config: FarmConfig;
  transactions: SaleTransaction[];
  onUpdateTransaction: (updatedTx: SaleTransaction) => void;
  onOpenReceipt: (tx: SaleTransaction) => void;
}

export const ReceivablesView: React.FC<ReceivablesViewProps> = ({
  config,
  transactions,
  onUpdateTransaction,
  onOpenReceipt,
}) => {
  const today = getTodayString();

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [agingFilter, setAgingFilter] = useState<'ALL' | 'MACET' | 'MENDEKATI' | 'AMAN'>('ALL');

  // Modal for payment installment
  const [activeTx, setActiveTx] = useState<SaleTransaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(today);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS'>('CASH');
  const [paymentNote, setPaymentNote] = useState<string>('Pelunasan tagihan');

  // Active unpaid transactions
  const unpaidList = transactions.filter(
    (t) => t.paymentStatus !== 'LUNAS' && t.remainingBalance > 0
  );

  // Stats
  const totalReceivables = unpaidList.reduce((acc, t) => acc + t.remainingBalance, 0);

  const macetList = unpaidList.filter(
    (t) => calculateAgingStatus(t).status === 'Macet'
  );
  const totalMacet = macetList.reduce((acc, t) => acc + t.remainingBalance, 0);

  const mendekatiList = unpaidList.filter(
    (t) => calculateAgingStatus(t).status === 'Mendekati'
  );
  const totalMendekati = mendekatiList.reduce((acc, t) => acc + t.remainingBalance, 0);

  const amanList = unpaidList.filter(
    (t) => calculateAgingStatus(t).status === 'Aman'
  );
  const totalAman = amanList.reduce((acc, t) => acc + t.remainingBalance, 0);

  // Filtered rows
  const filteredList = unpaidList.filter((tx) => {
    const matchesSearch =
      tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.customerPhone.includes(searchQuery);

    const aging = calculateAgingStatus(tx);
    const matchesAging =
      agingFilter === 'ALL'
        ? true
        : agingFilter === 'MACET'
        ? aging.status === 'Macet'
        : agingFilter === 'MENDEKATI'
        ? aging.status === 'Mendekati'
        : aging.status === 'Aman';

    return matchesSearch && matchesAging;
  });

  // Customer debt aggregation (Customer Ledger)
  const customerDebts = Array.from(
    unpaidList.reduce((acc, tx) => {
      const key = tx.customerName;
      if (!acc.has(key)) {
        acc.set(key, {
          name: key,
          phone: tx.customerPhone,
          totalDebt: 0,
          invoicesCount: 0,
          oldestDueDate: tx.dueDate,
        });
      }
      const entry = acc.get(key)!;
      entry.totalDebt += tx.remainingBalance;
      entry.invoicesCount += 1;
      return acc;
    }, new Map<string, { name: string; phone: string; totalDebt: number; invoicesCount: number; oldestDueDate: string | null }>())
  ).map(([, val]) => val);

  // Handle WhatsApp bill
  const handleSendWhatsApp = (tx: SaleTransaction) => {
    const message = generateWhatsAppMessage(tx, config);
    const phone = cleanPhoneForWhatsApp(tx.customerPhone);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Open installment modal
  const openPaymentModal = (tx: SaleTransaction) => {
    setActiveTx(tx);
    setPaymentAmount(tx.remainingBalance.toString());
    setPaymentDate(today);
    setPaymentMethod('CASH');
    setPaymentNote('Pelunasan tagihan');
  };

  // Submit installment
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTx) return;

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Masukkan nominal pembayaran yang valid.');
      return;
    }

    if (amount > activeTx.remainingBalance) {
      alert('Nominal pembayaran melebihi sisa tagihan.');
      return;
    }

    const newPayment: PaymentInstallment = {
      id: `inst-${Date.now()}`,
      date: paymentDate,
      amount,
      method: paymentMethod,
      note: paymentNote,
    };

    const newAmountPaid = activeTx.amountPaid + amount;
    const newRemaining = Math.max(0, activeTx.totalAmount - newAmountPaid);
    const newStatus: PaymentStatus = newRemaining === 0 ? 'LUNAS' : 'CICILAN';

    const updatedTx: SaleTransaction = {
      ...activeTx,
      amountPaid: newAmountPaid,
      remainingBalance: newRemaining,
      paymentStatus: newStatus,
      paymentHistory: [...activeTx.paymentHistory, newPayment],
    };

    onUpdateTransaction(updatedTx);
    setActiveTx(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium mb-1">
            <span>Manajemen Piutang Usaha (AR)</span>
            <span aria-hidden="true">·</span>
            <span>Otomasi Follow-Up & Penagihan WhatsApp</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Pelacak Tagihan Telur Belum Dibayar
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-600">
              Total Piutang Menggantung
            </span>
            <span className="text-xl font-black text-rose-700 font-mono">
              {formatIDR(totalReceivables)}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Aging Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active */}
        <div
          onClick={() => setAgingFilter('ALL')}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs transition ${
            agingFilter === 'ALL'
              ? 'border-neutral-900 bg-neutral-900 text-white'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium mb-1">
            <span className={agingFilter === 'ALL' ? 'text-neutral-300' : 'text-neutral-500'}>
              Semua Piutang Aktif
            </span>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono">{formatIDR(totalReceivables)}</p>
          <p
            className={`text-xs mt-2 ${
              agingFilter === 'ALL' ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            {unpaidList.length} faktur pelanggan
          </p>
        </div>

        {/* Macet / Overdue */}
        <div
          onClick={() => setAgingFilter('MACET')}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs transition ${
            agingFilter === 'MACET'
              ? 'border-rose-600 bg-rose-600 text-white'
              : 'border-rose-200 bg-rose-50/50 hover:border-rose-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium mb-1">
            <span className={agingFilter === 'MACET' ? 'text-rose-100' : 'text-rose-700 font-bold'}>
              Macet / Lewat Tempo
            </span>
            <AlertTriangle className={`h-4 w-4 ${agingFilter === 'MACET' ? 'text-white' : 'text-rose-600'}`} />
          </div>
          <p className={`text-2xl font-black font-mono ${agingFilter === 'MACET' ? 'text-white' : 'text-rose-600'}`}>
            {formatIDR(totalMacet)}
          </p>
          <p
            className={`text-xs mt-2 ${
              agingFilter === 'MACET' ? 'text-rose-100' : 'text-rose-600'
            }`}
          >
            {macetList.length} faktur harus segera ditagih!
          </p>
        </div>

        {/* Mendekati Tempo */}
        <div
          onClick={() => setAgingFilter('MENDEKATI')}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs transition ${
            agingFilter === 'MENDEKATI'
              ? 'border-amber-600 bg-amber-600 text-white'
              : 'border-amber-200 bg-amber-50/50 hover:border-amber-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium mb-1">
            <span
              className={
                agingFilter === 'MENDEKATI' ? 'text-amber-100' : 'text-amber-800 font-bold'
              }
            >
              Mendekati Tempo (≤ 2 Hari)
            </span>
            <Clock className={`h-4 w-4 ${agingFilter === 'MENDEKATI' ? 'text-white' : 'text-amber-600'}`} />
          </div>
          <p
            className={`text-2xl font-black font-mono ${
              agingFilter === 'MENDEKATI' ? 'text-white' : 'text-amber-700'
            }`}
          >
            {formatIDR(totalMendekati)}
          </p>
          <p
            className={`text-xs mt-2 ${
              agingFilter === 'MENDEKATI' ? 'text-amber-100' : 'text-amber-700'
            }`}
          >
            {mendekatiList.length} faktur siap diingatkan
          </p>
        </div>

        {/* Aman */}
        <div
          onClick={() => setAgingFilter('AMAN')}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs transition ${
            agingFilter === 'AMAN'
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium mb-1">
            <span
              className={
                agingFilter === 'AMAN' ? 'text-emerald-100' : 'text-emerald-800 font-bold'
              }
            >
              Status Aman (&gt; 2 Hari)
            </span>
            <CheckCircle className={`h-4 w-4 ${agingFilter === 'AMAN' ? 'text-white' : 'text-emerald-600'}`} />
          </div>
          <p
            className={`text-2xl font-black font-mono ${
              agingFilter === 'AMAN' ? 'text-white' : 'text-emerald-700'
            }`}
          >
            {formatIDR(totalAman)}
          </p>
          <p
            className={`text-xs mt-2 ${
              agingFilter === 'AMAN' ? 'text-emerald-100' : 'text-emerald-700'
            }`}
          >
            {amanList.length} faktur masih bertempo wajar
          </p>
        </div>
      </div>

      {/* Customer Ledger Quick Strip (Ringkasan per Toko/Pelanggan) */}
      {customerDebts.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-amber-600" /> Buku Pembantu Piutang Per Pelanggan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {customerDebts.map((cust, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-xs text-neutral-900 truncate">{cust.name}</h4>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {cust.invoicesCount} nota
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{cust.phone || '-'}</p>
                <p className="text-sm font-extrabold text-rose-600 font-mono mt-2">
                  {formatIDR(cust.totalDebt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
        {/* Table Search & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari nama toko / no. invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 text-xs w-60 sm:w-72 focus:outline-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>Menampilkan <strong>{filteredList.length}</strong> tagihan belum lunas</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-3">Pelanggan / Toko</th>
                <th className="py-3 px-3">No. Faktur</th>
                <th className="py-3 px-3">Tgl Kirim</th>
                <th className="py-3 px-3">Pesanan</th>
                <th className="py-3 px-3">Jatuh Tempo</th>
                <th className="py-3 px-3">Status Aging</th>
                <th className="py-3 px-3">Total Belanja</th>
                <th className="py-3 px-3">Sisa Tagihan</th>
                <th className="py-3 px-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-neutral-400">
                    <p className="font-semibold text-sm text-neutral-700">Semua pesanan lunas!</p>
                    <p className="text-xs mt-1">Tidak ada piutang yang menggantung pada filter ini.</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((tx) => {
                  const aging = calculateAgingStatus(tx);
                  const isMacet = aging.status === 'Macet';
                  const isMendekati = aging.status === 'Mendekati';

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50/70 transition">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-neutral-900">{tx.customerName}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{tx.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-neutral-700">
                        {tx.invoiceNo}
                      </td>
                      <td className="py-3.5 px-3 text-neutral-500 whitespace-nowrap">
                        {formatDateIndo(tx.date)}
                      </td>
                      <td className="py-3.5 px-3 text-neutral-700">
                        <span className="font-semibold">{tx.totalKg.toFixed(1)} Kg</span>
                        <div className="text-[10px] text-neutral-400">
                          {tx.items.map((i) => `${i.qty} ${i.unit}`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-medium text-neutral-700 whitespace-nowrap">
                        {formatDateIndo(tx.dueDate || '')}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block font-mono font-bold text-[10px] px-2 py-0.5 rounded whitespace-nowrap ${
                            isMacet
                              ? 'bg-rose-100 text-rose-700'
                              : isMendekati
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {aging.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-neutral-600">
                        {formatIDR(tx.totalAmount)}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-extrabold text-sm text-rose-600 whitespace-nowrap">
                        {formatIDR(tx.remainingBalance)}
                        {tx.amountPaid > 0 && (
                          <div className="text-[10px] text-neutral-400 font-normal">
                            DP: {formatIDR(tx.amountPaid)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click WhatsApp reminder */}
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(tx)}
                            title="Kirim Pesan Tagihan Otomatis via WA"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            <span>Tagih WA</span>
                          </button>

                          {/* Record Payment */}
                          <button
                            type="button"
                            onClick={() => openPaymentModal(tx)}
                            title="Catat Cicilan / Pelunasan"
                            className="inline-flex items-center gap-1 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition"
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>Lunaskan</span>
                          </button>

                          {/* Receipt */}
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(tx)}
                            title="Buka Nota"
                            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
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

      {/* Payment / Installment Settlement Modal */}
      {activeTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Pencatatan Pembayaran / Pelunasan
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  {activeTx.invoiceNo} · {activeTx.customerName}
                </p>
              </div>
              <button
                onClick={() => setActiveTx(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              {/* Summary box */}
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Total Faktur:</span>
                  <span className="font-mono font-semibold text-neutral-800">
                    {formatIDR(activeTx.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Sudah Dibayar:</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {formatIDR(activeTx.amountPaid)}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-neutral-200 flex justify-between font-bold text-sm">
                  <span className="text-rose-700">Sisa Tagihan Saat Ini:</span>
                  <span className="font-mono text-rose-700">
                    {formatIDR(activeTx.remainingBalance)}
                  </span>
                </div>
              </div>

              {/* Installment History if any */}
              {activeTx.paymentHistory.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Riwayat Pembayaran Sebelumnya
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1 divide-y divide-neutral-100 text-xs">
                    {activeTx.paymentHistory.map((p, i) => (
                      <div key={i} className="flex justify-between pt-1">
                        <span className="text-neutral-500">
                          {formatDateIndo(p.date)} ({p.method}): {p.note || '-'}
                        </span>
                        <span className="font-mono font-bold text-neutral-800">
                          {formatIDR(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Payment Form */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Nominal Pembayaran Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    max={activeTx.remainingBalance}
                    min="1000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm font-mono font-bold focus:border-amber-500 focus:outline-hidden"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(activeTx.remainingBalance.toString())}
                      className="text-[11px] text-amber-600 font-semibold hover:underline"
                    >
                      Bayar Lunas Penuh ({formatIDR(activeTx.remainingBalance)})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Tanggal Pembayaran
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Metode Pembayaran
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as 'CASH' | 'TRANSFER' | 'QRIS')
                      }
                      className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs bg-white"
                    >
                      <option value="CASH">Tunai (Cash)</option>
                      <option value="TRANSFER">Transfer Bank</option>
                      <option value="QRIS">QRIS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Keterangan / Catatan Pembayaran
                  </label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Contoh: Titip lewat sopir / transfer BCA"
                    className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setActiveTx(null)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
