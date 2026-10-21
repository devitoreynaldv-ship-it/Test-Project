import React, { useState, useMemo } from 'react';
import { FarmConfig, HarvestLog, SaleTransaction } from '../types';
import {
  calculateAgingStatus,
  cleanPhoneForWhatsApp,
  convertKgToTray,
  convertToButir,
  formatDateIndo,
  formatIDR,
  formatNumber,
  generateWhatsAppMessage,
  getTodayString,
} from '../utils/eggConversions';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Share2,
  DollarSign,
  Layers,
  ChevronRight,
  CheckCircle2,
  Sliders,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface DashboardViewProps {
  config: FarmConfig;
  onUpdateConfig: (newConfig: FarmConfig) => void;
  transactions: SaleTransaction[];
  harvestLogs: HarvestLog[];
  currentStockKg: number;
  totalLossButir: number;
  onNavigate: (tab: string) => void;
  onOpenReceipt: (tx: SaleTransaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  config,
  onUpdateConfig,
  transactions,
  harvestLogs,
  currentStockKg,
  totalLossButir,
  onNavigate,
  onOpenReceipt,
}) => {
  const today = getTodayString();

  // 1. Panen Hari Ini & Hen-Day Rate
  const todayHarvests = harvestLogs.filter((h) => h.date === today);
  const todayHarvestKg = todayHarvests.reduce((acc, h) => acc + h.weightNetKg, 0);
  const todayHarvestButir = todayHarvests.reduce((acc, h) => acc + h.estimatedButir, 0);
  const todayHarvestLoss = todayHarvests.reduce((acc, h) => acc + h.brokenCount, 0);

  const henDayRate =
    config.populasiAyam > 0 ? (todayHarvestButir / config.populasiAyam) * 100 : 0;

  // 2. Keuangan Hari Ini
  const todaySales = transactions.filter((t) => t.date === today);
  const todayRevenue = todaySales.reduce((acc, t) => acc + t.totalAmount, 0);
  const todayKgSold = todaySales.reduce((acc, t) => acc + t.totalKg, 0);
  const todayCOGS = todayKgSold * config.hppPerKg;
  const todayProfit = todayRevenue - todayCOGS;
  const todayMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;

  // 3. Status Piutang
  const unpaidSales = transactions.filter(
    (t) => t.paymentStatus !== 'LUNAS' && t.remainingBalance > 0
  );
  const totalReceivables = unpaidSales.reduce((acc, t) => acc + t.remainingBalance, 0);
  const overdueSales = unpaidSales.filter(
    (t) => calculateAgingStatus(t).status === 'Macet'
  );
  const dueSoonSales = unpaidSales.filter(
    (t) => calculateAgingStatus(t).status === 'Mendekati'
  );

  // 4. Stock breakdowns
  const currentStockButir = convertToButir(currentStockKg, 'KG', config);
  const currentStockTray = convertKgToTray(currentStockKg, config);

  // 5. 30-Day Hen-Day Production Rate Historical Trend Data
  const [trendDaysRange, setTrendDaysRange] = useState<7 | 14 | 30>(30);

  const past30DaysHenDay = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayLogs = harvestLogs.filter((h) => h.date === dateStr);
      const totalButir = dayLogs.reduce((acc, h) => acc + h.estimatedButir, 0);
      const totalNetKg = dayLogs.reduce((acc, h) => acc + h.weightNetKg, 0);
      const totalBroken = dayLogs.reduce((acc, h) => acc + h.brokenCount, 0);

      const rate =
        config.populasiAyam > 0
          ? Number(((totalButir / config.populasiAyam) * 100).toFixed(1))
          : 0;

      const shortLabel = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });

      return {
        dateStr,
        shortLabel,
        fullDate: formatDateIndo(dateStr),
        henDayRate: rate,
        totalButir,
        totalNetKg,
        totalBroken,
        hasLog: dayLogs.length > 0,
      };
    });
  }, [harvestLogs, config.populasiAyam]);

  const displayedTrendData = useMemo(() => {
    return past30DaysHenDay.slice(30 - trendDaysRange);
  }, [past30DaysHenDay, trendDaysRange]);

  const activeDaysWithData = displayedTrendData.filter((d) => d.hasLog);
  const avgHenDay =
    activeDaysWithData.length > 0
      ? (
          activeDaysWithData.reduce((acc, d) => acc + d.henDayRate, 0) /
          activeDaysWithData.length
        ).toFixed(1)
      : '0.0';

  const peakHenDay =
    activeDaysWithData.length > 0
      ? Math.max(...activeDaysWithData.map((d) => d.henDayRate)).toFixed(1)
      : '0.0';

  const lowestHenDay =
    activeDaysWithData.length > 0
      ? Math.min(...activeDaysWithData.map((d) => d.henDayRate)).toFixed(1)
      : '0.0';

  const daysAboveTarget = activeDaysWithData.filter((d) => d.henDayRate >= 85).length;

  // 6. 7 Days Volume Trend Data
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const harvestDayKg = harvestLogs
      .filter((h) => h.date === dateStr)
      .reduce((acc, h) => acc + h.weightNetKg, 0);

    const salesDayKg = transactions
      .filter((t) => t.date === dateStr)
      .reduce((acc, t) => acc + t.totalKg, 0);

    const dateLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

    return {
      dateStr,
      dateLabel,
      harvestKg: harvestDayKg,
      salesKg: salesDayKg,
    };
  });

  const maxTrendKg = Math.max(
    ...past7Days.map((d) => Math.max(d.harvestKg, d.salesKg)),
    100
  );

  const handleQuickWhatsApp = (tx: SaleTransaction) => {
    const text = generateWhatsAppMessage(tx, config);
    const phone = cleanPhoneForWhatsApp(tx.customerPhone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Custom Recharts Tooltip for Hen-Day
  const CustomHenDayTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isAboveTarget = data.henDayRate >= 85;

      return (
        <div className="rounded-xl border border-neutral-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-xs text-xs space-y-2 min-w-[210px]">
          <div className="border-b border-neutral-100 pb-1.5 flex items-center justify-between">
            <span className="font-bold text-neutral-800">{data.fullDate}</span>
            <span
              className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                isAboveTarget
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isAboveTarget ? '≥ 85% Target' : '< 85% Target'}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-neutral-500 font-medium">Hen-Day Rate:</span>
            <span className="text-base font-black font-mono text-amber-600">
              {data.henDayRate}%
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-neutral-500 pt-1 border-t border-neutral-100 font-mono">
            <div className="flex justify-between">
              <span>Butir Panen:</span>
              <span className="font-semibold text-neutral-800">
                {formatNumber(data.totalButir, 0)} butir
              </span>
            </div>
            <div className="flex justify-between">
              <span>Berat Bersih:</span>
              <span className="font-semibold text-neutral-800">
                {data.totalNetKg.toFixed(1)} Kg
              </span>
            </div>
            {data.totalBroken > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Telur Pecah/Loss:</span>
                <span className="font-semibold">{data.totalBroken} butir</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Tuning Strip */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium mb-1">
              <span>{config.farmName}</span>
              <span aria-hidden="true">·</span>
              <span>Hari ini, {formatDateIndo(today)}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
              Dashboard Kontrol Peternakan & Finansial
            </h1>
          </div>

          {/* Quick Tuning for HPP and Flock Population */}
          <div className="flex flex-wrap items-center gap-3 bg-neutral-50 border border-neutral-200/80 rounded-xl p-2.5">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-600" />
              <div className="text-left">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  HPP Pokok / Kg
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-neutral-500">Rp</span>
                  <input
                    type="number"
                    step="100"
                    min="1000"
                    value={config.hppPerKg}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        hppPerKg: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 bg-white border border-neutral-200 rounded px-2 py-0.5 text-xs font-bold font-mono text-neutral-800 focus:outline-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="h-7 w-px bg-neutral-200" />

            <div className="text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Populasi Ayam
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={config.populasiAyam}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      populasiAyam: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-20 bg-white border border-neutral-200 rounded px-2 py-0.5 text-xs font-bold font-mono text-neutral-800 focus:outline-amber-500"
                />
                <span className="text-xs text-neutral-500 font-medium">ekor</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Hen-Day Production Rate */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500 mb-2">
              <span>Hen-Day Rate Hari Ini</span>
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-neutral-900 font-mono tabular-nums">
                {henDayRate > 0 ? henDayRate.toFixed(1) : '0.0'}%
              </span>
              <span className="text-xs font-medium text-neutral-500">
                (Target: &gt;85%)
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5">
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  henDayRate >= 85
                    ? 'bg-emerald-500'
                    : henDayRate >= 70
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(henDayRate, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>{formatNumber(todayHarvestButir, 0)} butir panen</span>
              <span>{formatNumber(config.populasiAyam, 0)} ekor ayam</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Estimasi Laba Bersih Hari Ini */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500 mb-2">
              <span>Estimasi Laba Hari Ini</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-black tracking-tight font-mono tabular-nums ${
                  todayProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatIDR(todayProfit)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] space-y-1 text-neutral-500">
            <div className="flex justify-between">
              <span>Omset ({formatNumber(todayKgSold, 1)} Kg):</span>
              <span className="font-semibold text-neutral-800 font-mono">
                {formatIDR(todayRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Modal Pokok (COGS):</span>
              <span className="font-semibold text-neutral-800 font-mono">
                {formatIDR(todayCOGS)}
              </span>
            </div>
            <div className="flex justify-between pt-0.5 text-neutral-700">
              <span>Margin Keuntungan:</span>
              <span className="font-bold text-emerald-600 font-mono">
                {todayMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Sisa Stok Gudang Siap Jual */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500 mb-2">
              <span>Stok Gudang Siap Jual</span>
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-neutral-900 font-mono tabular-nums">
                {formatNumber(currentStockKg, 1)}
              </span>
              <span className="text-sm font-semibold text-neutral-500">Kg</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] space-y-1 text-neutral-500">
            <div className="flex justify-between">
              <span>Konversi Tray (30-an):</span>
              <span className="font-semibold text-neutral-800 font-mono">
                {formatNumber(currentStockTray, 1)} Tray
              </span>
            </div>
            <div className="flex justify-between">
              <span>Konversi Butir:</span>
              <span className="font-semibold text-neutral-800 font-mono">
                {formatNumber(currentStockButir, 0)} Butir
              </span>
            </div>
            <div className="flex justify-between text-rose-600 pt-0.5">
              <span>Loss (Telur Rusak/Pecah):</span>
              <span className="font-bold font-mono">{totalLossButir} Butir</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Piutang Menggantung */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500 mb-2">
              <span>Piutang Belum Dibayar</span>
              <Clock className="h-4 w-4 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-rose-600 font-mono tabular-nums">
                {formatIDR(totalReceivables)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] space-y-1 text-neutral-500">
            <div className="flex justify-between">
              <span>Total Faktur Tempo:</span>
              <span className="font-semibold text-neutral-800 font-mono">
                {unpaidSales.length} pelanggan
              </span>
            </div>
            <div className="flex justify-between">
              <span>Macet / Lewat Tempo:</span>
              <span
                className={`font-bold font-mono ${
                  overdueSales.length > 0 ? 'text-rose-600' : 'text-neutral-700'
                }`}
              >
                {overdueSales.length} faktur
              </span>
            </div>
            <div className="flex justify-between text-amber-600 pt-0.5">
              <span>Mendekati Tempo (1-2 hr):</span>
              <span className="font-bold font-mono">{dueSoonSales.length} faktur</span>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Piutang Follow-up Strip (If any overdue or approaching) */}
      {unpaidSales.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <h3 className="text-sm font-bold text-neutral-900">
                Peringatan Piutang & Jatuh Tempo Pembayaran
              </h3>
            </div>
            <button
              onClick={() => onNavigate('piutang')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1"
            >
              Lihat Semua Piutang <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unpaidSales.slice(0, 3).map((tx) => {
              const aging = calculateAgingStatus(tx);
              const isOverdue = aging.status === 'Macet';

              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-xl p-3.5 border border-rose-100 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-neutral-800 truncate">
                        {tx.customerName}
                      </span>
                      <span
                        className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {aging.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Inv: {tx.invoiceNo} · Tempo: {formatDateIndo(tx.dueDate || '')}
                    </p>
                    <p className="text-sm font-extrabold text-neutral-900 mt-2 font-mono">
                      Sisa: {formatIDR(tx.remainingBalance)}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center gap-2">
                    <button
                      onClick={() => handleQuickWhatsApp(tx)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Tagih WhatsApp
                    </button>
                    <button
                      onClick={() => onOpenReceipt(tx)}
                      className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      Nota
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 30-Day Hen-Day Production Rate Recharts Line Chart */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-bold text-neutral-900">
                Tren Produktivitas Kandang (Hen-Day Rate 30 Hari Terakhir)
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Rasio persentase produksi telur harian terhadap populasi {formatNumber(config.populasiAyam, 0)} ekor ayam bertelur aktif
            </p>
          </div>

          {/* Timeframe Switcher [ 7 Hari | 14 Hari | 30 Hari ] */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTrendDaysRange(7)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                trendDaysRange === 7
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setTrendDaysRange(14)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                trendDaysRange === 14
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              14 Hari
            </button>
            <button
              type="button"
              onClick={() => setTrendDaysRange(30)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                trendDaysRange === 30
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              30 Hari Penuh
            </button>
          </div>
        </div>

        {/* 4 Summary Micro-KPIs for Hen-Day Range */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-neutral-50 border border-neutral-200/80 p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Rata-rata Hen-Day ({trendDaysRange} Hari)
            </span>
            <div className="text-lg font-black font-mono text-neutral-900 mt-0.5">
              {avgHenDay}%
            </div>
            <span className="text-[10px] text-neutral-500">
              Standar target: ≥85.0%
            </span>
          </div>

          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Puncak Tertinggi (Peak)
            </span>
            <div className="text-lg font-black font-mono text-emerald-800 mt-0.5">
              {peakHenDay}%
            </div>
            <span className="text-[10px] text-emerald-600">
              Performa telur maksimal
            </span>
          </div>

          <div className="rounded-xl bg-neutral-50 border border-neutral-200/80 p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Titik Terendah
            </span>
            <div className="text-lg font-black font-mono text-neutral-800 mt-0.5">
              {lowestHenDay}%
            </div>
            <span className="text-[10px] text-neutral-500">
              Batas toleransi kandang
            </span>
          </div>

          <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Kepatuhan Target (≥85%)
            </span>
            <div className="text-lg font-black font-mono text-amber-900 mt-0.5">
              {daysAboveTarget} / {activeDaysWithData.length} hari
            </div>
            <span className="text-[10px] text-amber-700 font-semibold font-mono">
              {activeDaysWithData.length > 0
                ? ((daysAboveTarget / activeDaysWithData.length) * 100).toFixed(0)
                : 0}
              % hari di atas target
            </span>
          </div>
        </div>

        {/* Recharts LineChart Component */}
        <div className="h-[290px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={displayedTrendData}
              margin={{ top: 14, right: 16, left: -14, bottom: 6 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                interval={trendDaysRange === 30 ? 2 : 0}
              />
              <YAxis
                domain={[65, 100]}
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomHenDayTooltip />} />
              <ReferenceLine
                y={85}
                stroke="#10B981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Target Puncak 85%',
                  fill: '#059669',
                  fontSize: 10,
                  position: 'insideTopRight',
                  fontWeight: 600,
                }}
              />
              <Line
                type="monotone"
                dataKey="henDayRate"
                stroke="#D97706"
                strokeWidth={2.5}
                dot={{
                  r: trendDaysRange === 30 ? 2.5 : 3.5,
                  fill: '#D97706',
                  stroke: '#FFFFFF',
                  strokeWidth: 1,
                }}
                activeDot={{
                  r: 6,
                  fill: '#B45309',
                  stroke: '#FEF3C7',
                  strokeWidth: 2,
                }}
                name="Hen-Day Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
              <span>Hen-Day Rate Harian (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-emerald-500 border-t border-dashed border-emerald-500" />
              <span>Garis Batas Target Puncak (85%)</span>
            </div>
          </div>
          <span className="font-mono">
            Rumus: (Total Butir Panen ÷ {formatNumber(config.populasiAyam, 0)} Ekor Ayam) × 100%
          </span>
        </div>
      </div>

      {/* 2-Column Section: 7-Day Trend Chart & Recent Sales Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 7 Days Production vs Sales Trend */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Tren Produksi Panen vs Penjualan (7 Hari)
              </h3>
              <p className="text-xs text-neutral-500">
                Monitoring volume panen masuk dibanding volume telur terjual keluar
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-neutral-600">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-amber-500" />
                <span>Panen (Kg)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-neutral-800" />
                <span>Terjual (Kg)</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 h-48 items-end pt-4 pb-2 border-b border-neutral-200">
            {past7Days.map((day, idx) => {
              const harvestHeight = Math.max((day.harvestKg / maxTrendKg) * 100, 4);
              const salesHeight = Math.max((day.salesKg / maxTrendKg) * 100, 4);
              const isToday = day.dateStr === today;

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex justify-center gap-1 sm:gap-2 items-end h-full">
                    {/* Harvest Bar */}
                    <div
                      className="w-3.5 sm:w-5 bg-amber-500 rounded-t transition-all group-hover:bg-amber-600"
                      style={{ height: `${harvestHeight}%` }}
                      title={`Panen: ${day.harvestKg} Kg`}
                    />
                    {/* Sales Bar */}
                    <div
                      className="w-3.5 sm:w-5 bg-neutral-800 rounded-t transition-all group-hover:bg-neutral-950"
                      style={{ height: `${salesHeight}%` }}
                      title={`Terjual: ${day.salesKg} Kg`}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <span
                      className={`block text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                        isToday ? 'font-bold text-amber-600' : 'text-neutral-500'
                      }`}
                    >
                      {day.dateLabel}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 hidden sm:block">
                      {day.harvestKg.toFixed(0)}/{day.salesKg.toFixed(0)}k
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-neutral-500">
            <span>Rata-rata panen harian: {(past7Days.reduce((a, b) => a + b.harvestKg, 0) / 7).toFixed(1)} Kg/hari</span>
            <button
              onClick={() => onNavigate('warehouse')}
              className="text-amber-600 font-semibold hover:underline flex items-center gap-1"
            >
              Lihat Buku Panen & Produksi <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Recent Sales Transactions */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-neutral-900">
                Aktivitas Kasir Terakhir
              </h3>
              <button
                onClick={() => onNavigate('pos')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-800"
              >
                Buka Kasir POS
              </button>
            </div>

            <div className="divide-y divide-neutral-100">
              {transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => onOpenReceipt(tx)}
                  className="py-3 flex items-center justify-between hover:bg-neutral-50 rounded-lg px-2 -mx-2 cursor-pointer transition"
                >
                  <div>
                    <p className="text-xs font-bold text-neutral-800">{tx.customerName}</p>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      {tx.totalKg.toFixed(1)} Kg · {formatDateIndo(tx.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-neutral-900">
                      {formatIDR(tx.totalAmount)}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-semibold font-mono ${
                        tx.paymentStatus === 'LUNAS'
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {tx.paymentStatus === 'LUNAS' ? 'LUNAS' : 'TEMPO'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100">
            <button
              onClick={() => onNavigate('pos')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition"
            >
              + Buat Penjualan Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
