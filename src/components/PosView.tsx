import React, { useState } from 'react';
import { CartItem, EggGrade, FarmConfig, PaymentMethod, PaymentStatus, SaleTransaction, UnitType } from '../types';
import {
  calculateAgingStatus,
  cleanPhoneForWhatsApp,
  convertToButir,
  convertToKg,
  formatDateIndo,
  formatIDR,
  formatNumber,
  generateWhatsAppMessage,
  getTodayString,
} from '../utils/eggConversions';
import {
  Plus,
  Trash2,
  Printer,
  Share2,
  Search,
  ShoppingCart,
  Banknote,
  Receipt,
  User,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface PosViewProps {
  config: FarmConfig;
  currentStockKg: number;
  transactions: SaleTransaction[];
  onCompleteSale: (newTx: SaleTransaction) => void;
  onOpenReceipt: (tx: SaleTransaction) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  config,
  currentStockKg,
  transactions,
  onCompleteSale,
  onOpenReceipt,
}) => {
  const today = getTodayString();

  // Form states
  const [saleDate, setSaleDate] = useState(today);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('LUNAS');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [downPayment, setDownPayment] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState('');

  // Cart builder
  const [currentGrade, setCurrentGrade] = useState<EggGrade>('Standard');
  const [currentUnit, setCurrentUnit] = useState<UnitType>('KG');
  const [currentQty, setCurrentQty] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<string>('28000');

  const [cart, setCart] = useState<CartItem[]>([]);

  // Search & filter for past transactions
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LUNAS' | 'TEMPO'>('ALL');

  // Customer suggestions from previous transactions
  const uniqueCustomers = Array.from(
    new Map(
      transactions.map((t) => [
        t.customerName.toLowerCase(),
        { name: t.customerName, phone: t.customerPhone },
      ])
    ).values()
  ).slice(0, 5);

  // Default price suggest based on grade & unit
  const handleGradeChange = (grade: EggGrade) => {
    setCurrentGrade(grade);
    if (grade === 'Standard') {
      setCurrentPrice(currentUnit === 'KG' ? '28000' : currentUnit === 'TRAY' ? '53000' : '1800');
    } else if (grade === 'Omega') {
      setCurrentPrice(currentUnit === 'KG' ? '34000' : currentUnit === 'TRAY' ? '65000' : '2300');
    } else if (grade === 'Kampung') {
      setCurrentPrice(currentUnit === 'KG' ? '45000' : currentUnit === 'TRAY' ? '85000' : '3000');
    } else if (grade === 'Bentes') {
      setCurrentPrice(currentUnit === 'KG' ? '19000' : currentUnit === 'TRAY' ? '36000' : '1200');
    }
  };

  const handleUnitChange = (unit: UnitType) => {
    setCurrentUnit(unit);
    if (unit === 'KG') {
      setCurrentPrice(currentGrade === 'Omega' ? '34000' : currentGrade === 'Bentes' ? '19000' : '28000');
    } else if (unit === 'TRAY') {
      setCurrentPrice(currentGrade === 'Omega' ? '65000' : currentGrade === 'Bentes' ? '36000' : '53000');
    } else {
      setCurrentPrice(currentGrade === 'Omega' ? '2300' : currentGrade === 'Bentes' ? '1200' : '1800');
    }
  };

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(currentQty);
    const unitPrice = parseFloat(currentPrice);

    if (!qty || qty <= 0 || !unitPrice || unitPrice <= 0) {
      alert('Mohon masukkan jumlah dan harga satuan yang valid.');
      return;
    }

    const kgEquivalent = convertToKg(qty, currentUnit, config);
    const butirEquivalent = convertToButir(qty, currentUnit, config);
    const subtotal = qty * unitPrice;

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random()}`,
      grade: currentGrade,
      unit: currentUnit,
      qty,
      unitPrice,
      subtotal,
      kgEquivalent,
      butirEquivalent,
    };

    setCart([...cart, newItem]);
    setCurrentQty('');
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Cart calculations
  const totalCartAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalCartKg = cart.reduce((acc, item) => acc + item.kgEquivalent, 0);
  const totalCartButir = cart.reduce((acc, item) => acc + item.butirEquivalent, 0);

  const isStockInsufficient = totalCartKg > currentStockKg;

  // Tendered cash change
  const cashNum = parseFloat(cashTendered) || 0;
  const cashChange = paymentMethod === 'CASH' && cashNum > totalCartAmount ? cashNum - totalCartAmount : 0;

  // Quick cash buttons
  const setExactCash = () => setCashTendered(totalCartAmount.toString());
  const addCashAmount = (val: number) => setCashTendered(val.toString());

  // Handle Form Submission
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong! Tambahkan item telur terlebih dahulu.');
      return;
    }

    if (!customerName.trim()) {
      alert('Mohon masukkan nama pelanggan atau nama toko.');
      return;
    }

    if (isStockInsufficient) {
      const confirmProceed = confirm(
        `PERINGATAN: Berat pesanan (${totalCartKg.toFixed(1)} Kg) melebihi sisa stok di sistem (${currentStockKg.toFixed(1)} Kg).\n\nApakah Anda ingin tetap memproses transaksi ini?`
      );
      if (!confirmProceed) return;
    }

    const invoiceNo = `INV-${saleDate.replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

    let calculatedStatus: PaymentStatus = paymentStatus;
    let amountPaid = 0;
    let remaining = 0;

    if (paymentMethod === 'TEMPO') {
      calculatedStatus = downPayment > 0 ? 'CICILAN' : 'TEMPO';
      amountPaid = Math.min(downPayment, totalCartAmount);
      remaining = totalCartAmount - amountPaid;
    } else {
      calculatedStatus = 'LUNAS';
      amountPaid = totalCartAmount;
      remaining = 0;
    }

    const newTx: SaleTransaction = {
      id: `tx-${Date.now()}`,
      invoiceNo,
      date: saleDate,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: cart,
      totalAmount: totalCartAmount,
      cogsAmount: totalCartKg * config.hppPerKg,
      hppPerKgUsed: config.hppPerKg,
      totalKg: totalCartKg,
      totalButir: totalCartButir,
      paymentStatus: calculatedStatus,
      paymentMethod,
      dueDate: paymentMethod === 'TEMPO' ? dueDate : null,
      amountPaid,
      remainingBalance: remaining,
      paymentHistory:
        amountPaid > 0 && paymentMethod === 'TEMPO'
          ? [
              {
                id: `pay-${Date.now()}`,
                date: saleDate,
                amount: amountPaid,
                method: 'CASH',
                note: 'Uang Muka (DP)',
              },
            ]
          : [],
      notes: saleNotes,
      cashReceived: paymentMethod === 'CASH' ? cashNum : undefined,
      cashChange: paymentMethod === 'CASH' ? cashChange : undefined,
    };

    onCompleteSale(newTx);

    // Reset Form
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCashTendered('');
    setDownPayment(0);
    setSaleNotes('');

    // Open receipt modal directly
    onOpenReceipt(newTx);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'LUNAS'
        ? tx.paymentStatus === 'LUNAS'
        : tx.paymentStatus !== 'LUNAS';

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* SECTION 1: POS WORKSPACE (2 Columns on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Order Builder & Item Selection */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card: Customer Details */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <User className="h-4 w-4 text-amber-600" /> Informasi Pelanggan & Tanggal
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Calendar className="h-3.5 w-3.5" />
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="rounded border border-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-800 bg-neutral-50 focus:outline-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nama Pelanggan / Toko
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Toko Roti Manis / Bu Siti"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  No. WhatsApp (Untuk Nota / Tagihan)
                </label>
                <input
                  type="tel"
                  placeholder="0812xxxxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Quick customer pickers */}
            {uniqueCustomers.length > 0 && !customerName && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] text-neutral-400">Pilih cepat:</span>
                {uniqueCustomers.map((cust, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCustomerName(cust.name);
                      setCustomerPhone(cust.phone);
                    }}
                    className="rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-200 transition"
                  >
                    {cust.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Card: Add Item Form */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center justify-between border-b border-neutral-100 pb-3">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-amber-600" /> Tambah Item Telur ke Keranjang
              </span>
              <span className="text-xs text-neutral-500">
                Stok Fisik: <strong className="font-mono text-neutral-800">{currentStockKg.toFixed(1)} Kg</strong>
              </span>
            </h2>

            <form onSubmit={handleAddToCart} className="space-y-4">
              {/* Grade Selector */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                  Pilih Grade / Kualitas Telur
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Standard', 'Omega', 'Kampung', 'Bentes'] as EggGrade[]).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => handleGradeChange(grade)}
                      className={`p-2.5 rounded-xl text-left border transition text-xs font-semibold ${
                        currentGrade === grade
                          ? 'border-amber-600 bg-amber-50/70 text-amber-900 shadow-xs'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <div className="font-bold">
                        {grade === 'Standard'
                          ? 'Telur Horn (Std)'
                          : grade === 'Omega'
                          ? 'Telur Omega 3'
                          : grade === 'Kampung'
                          ? 'Telur Kampung'
                          : 'Telur Bentes (Retak)'}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-normal">
                        {grade === 'Standard'
                          ? 'Kulit coklat segar'
                          : grade === 'Omega'
                          ? 'Kuning pekat DHA'
                          : grade === 'Kampung'
                          ? 'Asli free-range'
                          : 'Retak halus / bentesan'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Satuan & Qty & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Satuan Penjualan
                  </label>
                  <select
                    value={currentUnit}
                    onChange={(e) => handleUnitChange(e.target.value as UnitType)}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden bg-white"
                  >
                    <option value="KG">Kilogram (Kg)</option>
                    <option value="TRAY">Tray (Isi 30 Butir)</option>
                    <option value="BUTIR">Butir (Eceran)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Jumlah ({currentUnit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="Contoh: 15"
                    value={currentQty}
                    onChange={(e) => setCurrentQty(e.target.value)}
                    required
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="100"
                    placeholder="Contoh: 28000"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    required
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-neutral-500 font-mono">
                  {currentQty && parseFloat(currentQty) > 0 ? (
                    <span>
                      Setara:{' '}
                      <strong className="text-neutral-800">
                        {convertToKg(parseFloat(currentQty), currentUnit, config).toFixed(1)} Kg
                      </strong>{' '}
                      (~{Math.round(convertToButir(parseFloat(currentQty), currentUnit, config))} butir)
                    </span>
                  ) : (
                    <span>Masukkan jumlah untuk kalkulasi</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-xs"
                >
                  <Plus className="h-4 w-4" /> Masukkan ke Keranjang
                </button>
              </div>
            </form>
          </div>

          {/* Cart Table */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center justify-between">
              <span>Daftar Item Belanja ({cart.length})</span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-rose-600 hover:text-rose-800 text-[11px] font-medium"
                >
                  Kosongkan
                </button>
              )}
            </h3>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 text-xs border border-dashed border-neutral-200 rounded-xl">
                Belum ada item telur di keranjang. Gunakan form di atas untuk menambahkan.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-neutral-800">
                        Telur {item.grade}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        {item.qty} {item.unit} x {formatIDR(item.unitPrice)} · ({item.kgEquivalent.toFixed(1)} Kg)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-neutral-900 font-mono text-sm">
                        {formatIDR(item.subtotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="rounded-lg p-1 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Checkout Summary, Payment & Final Action */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span>Ringkasan & Pembayaran</span>
              <Receipt className="h-5 w-5 text-amber-600" />
            </h2>

            {/* Total Display */}
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80 space-y-2">
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Total Berat (Kg):</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {totalCartKg.toFixed(1)} Kg
                </span>
              </div>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Total Butir:</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {formatNumber(totalCartButir, 0)} Butir
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="text-xs font-bold text-neutral-700">Total Tagihan:</span>
                <span className="text-2xl font-black text-amber-600 font-mono">
                  {formatIDR(totalCartAmount)}
                </span>
              </div>
            </div>

            {/* Warning if stock low */}
            {isStockInsufficient && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Berat pesanan ({totalCartKg.toFixed(1)} Kg) lebih besar dari sisa stok di sistem ({currentStockKg.toFixed(1)} Kg).
                </span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                Metode Pembayaran
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CASH');
                    setPaymentStatus('LUNAS');
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition flex items-center gap-2 ${
                    paymentMethod === 'CASH'
                      ? 'border-amber-600 bg-amber-50/80 text-amber-950 shadow-xs'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  <span>Tunai (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('TRANSFER');
                    setPaymentStatus('LUNAS');
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition flex items-center gap-2 ${
                    paymentMethod === 'TRANSFER'
                      ? 'border-amber-600 bg-amber-50/80 text-amber-950 shadow-xs'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span>Transfer Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('QRIS');
                    setPaymentStatus('LUNAS');
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition flex items-center gap-2 ${
                    paymentMethod === 'QRIS'
                      ? 'border-amber-600 bg-amber-50/80 text-amber-950 shadow-xs'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Receipt className="h-4 w-4 text-purple-600" />
                  <span>QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('TEMPO');
                    setPaymentStatus('TEMPO');
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition flex items-center gap-2 ${
                    paymentMethod === 'TEMPO'
                      ? 'border-rose-600 bg-rose-50/80 text-rose-950 shadow-xs'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Clock className="h-4 w-4 text-rose-600" />
                  <span>Tempo (Bon Piutang)</span>
                </button>
              </div>
            </div>

            {/* Conditional Sub-panels based on payment method */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-neutral-700">Uang Diterima:</label>
                  <button
                    type="button"
                    onClick={setExactCash}
                    className="text-[11px] text-amber-600 hover:underline font-semibold"
                  >
                    Uang Pas ({formatIDR(totalCartAmount)})
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="Rp 0"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-mono font-bold bg-white focus:outline-amber-500"
                />
                {/* Quick Nominal Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[50000, 100000, 200000, 500000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => addCashAmount(nominal)}
                      className="px-2 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono text-neutral-700 hover:bg-neutral-100"
                    >
                      {formatIDR(nominal)}
                    </button>
                  ))}
                </div>
                {cashNum > 0 && (
                  <div className="pt-2 flex justify-between text-xs font-bold text-neutral-800">
                    <span>Kembalian:</span>
                    <span className="font-mono text-emerald-600 text-sm">
                      {formatIDR(cashChange)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'TEMPO' && (
              <div className="space-y-3 bg-rose-50/60 p-3.5 rounded-xl border border-rose-200">
                <div>
                  <label className="block text-xs font-bold text-rose-950 mb-1">
                    Tanggal Jatuh Tempo Pembayaran
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    min={today}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-rose-300 px-3 py-1.5 text-sm bg-white font-mono focus:outline-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Uang Muka / DP Dibayar Hari Ini (Opsional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalCartAmount}
                    value={downPayment || ''}
                    placeholder="Rp 0"
                    onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-mono bg-white focus:outline-rose-500"
                  />
                  {downPayment > 0 && (
                    <p className="text-[11px] text-rose-700 font-mono mt-1">
                      Sisa Tagihan Tempo: {formatIDR(Math.max(0, totalCartAmount - downPayment))}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Catatan Transaksi (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Titip sopir / Langganan martabak"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Complete Sale Button */}
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={cart.length === 0}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-sm font-bold text-white shadow-md transition ${
                cart.length === 0
                  ? 'bg-neutral-300 cursor-not-allowed text-neutral-500'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <span>Selesaikan & Terbitkan Nota</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: SALES HISTORY & INVOICE ARCHIVE */}
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
    </div>
  );
};
