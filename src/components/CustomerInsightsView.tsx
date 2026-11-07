import React, { useMemo, useState } from 'react';
import { AlertTriangle, HeartHandshake, MessageCircle, Search, ShieldCheck, UserMinus, Users } from 'lucide-react';
import { FarmConfig, SaleTransaction } from '../types';
import { cleanPhoneForWhatsApp, formatDateIndo, formatIDR, getTodayString } from '../utils/eggConversions';
import { CustomerInsight, GRADE_STYLE, buildCustomerInsights } from '../utils/customerInsights';

interface CustomerInsightsViewProps {
  config: FarmConfig;
  transactions: SaleTransaction[];
}

type Filter = 'ALL' | 'RISK' | 'CHURN' | 'TOP';

function openWhatsApp(phone: string, text: string) {
  window.open(`https://wa.me/${cleanPhoneForWhatsApp(phone)}?text=${encodeURIComponent(text)}`, '_blank');
}

function reminderMessage(c: CustomerInsight, config: FarmConfig): string {
  return [
    `Halo ${c.name}, salam dari ${config.farmName} 🙏`,
    ``,
    `Kami ingin mengingatkan sisa tagihan telur sebesar *${formatIDR(c.outstanding)}*` +
      (c.maxOverdueDays > 0 ? ` (sudah lewat jatuh tempo ${c.maxOverdueDays} hari).` : '.'),
    ``,
    `Pembayaran dapat ditransfer ke:`,
    `${config.bankName} ${config.bankAccount} a.n. ${config.bankAccountHolder}`,
    ``,
    `Terima kasih atas kerja samanya 🥚`,
  ].join('\n');
}

function winBackMessage(c: CustomerInsight, config: FarmConfig): string {
  return [
    `Halo ${c.name}, apa kabar? 😊`,
    ``,
    `Sudah ${c.daysSinceLast} hari kami tidak kirim telur ke tempat Anda. Stok telur segar di ${config.farmName} sedang tersedia.`,
    `Mau kami siapkan pesanan seperti biasa? Cukup balas jumlahnya saja ya.`,
    ``,
    `Terima kasih 🥚`,
  ].join('\n');
}

export const CustomerInsightsView: React.FC<CustomerInsightsViewProps> = ({ config, transactions }) => {
  const today = getTodayString();
  const insights = useMemo(() => buildCustomerInsights(transactions, today), [transactions, today]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');

  const risky = insights.filter((c) => c.grade === 'C' || c.grade === 'D');
  const churning = insights.filter((c) => c.isChurning);
  const dueToOrder = insights.filter(
    (c) => !c.isChurning && c.expectedNextPurchase !== null && c.expectedNextPurchase <= today
  );

  const visible = insights
    .filter((c) => {
      if (filter === 'RISK') return c.grade === 'C' || c.grade === 'D';
      if (filter === 'CHURN') return c.isChurning;
      if (filter === 'TOP') return c.grade === 'A';
      return true;
    })
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'ALL', label: 'Semua', count: insights.length },
    { id: 'TOP', label: 'Grade A', count: insights.filter((c) => c.grade === 'A').length },
    { id: 'RISK', label: 'Berisiko', count: risky.length },
    { id: 'CHURN', label: 'Mulai Hilang', count: churning.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Skor & Analisa Pelanggan</h1>
        <p className="text-sm text-neutral-500">
          Dihitung otomatis dari riwayat transaksi: kelayakan tempo, batas bon yang disarankan, dan pelanggan
          yang mulai jarang order.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Users className="h-4 w-4" />} label="Pelanggan Aktif" value={String(insights.length)} tone="neutral" />
        <Kpi
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Berisiko (Grade C/D)"
          value={String(risky.length)}
          sub={formatIDR(risky.reduce((s, c) => s + c.outstanding, 0)) + ' tertahan'}
          tone="rose"
        />
        <Kpi
          icon={<UserMinus className="h-4 w-4" />}
          label="Mulai Hilang"
          value={String(churning.length)}
          sub="Lama tidak order dari biasanya"
          tone="amber"
        />
        <Kpi
          icon={<HeartHandshake className="h-4 w-4" />}
          label="Waktunya Order Lagi"
          value={String(dueToOrder.length)}
          sub="Sesuai pola belanja mereka"
          tone="emerald"
        />
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex flex-wrap gap-1 p-0.5 bg-neutral-100 rounded-lg w-fit">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                filter === f.id ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {f.label} <span className="font-mono text-neutral-400">({f.count})</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pelanggan..."
            className="pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 text-xs w-full sm:w-60 focus:outline-amber-500"
          />
        </div>
      </div>

      {/* Customer cards */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-400">
          Tidak ada pelanggan pada filter ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((c) => (
            <CustomerCard key={c.key} c={c} config={config} />
          ))}
        </div>
      )}

      <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        Skor = 100 − penalti tunggakan (maks 40) − penalti telat bayar (maks 25) − porsi bon belum lunas (maks 20) +
        bonus kesetiaan (maks 10). Batas tempo = rata-rata nilai nota × (A:3, B:2, C:1, D:0).
      </p>
    </div>
  );
};

const KPI_TONES = {
  neutral: 'bg-neutral-100 text-neutral-700',
  rose: 'bg-rose-100 text-rose-700',
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
} as const;

const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string; tone: keyof typeof KPI_TONES }> = ({
  icon,
  label,
  value,
  sub,
  tone,
}) => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
    <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
      <span className={`p-1.5 rounded-lg ${KPI_TONES[tone]}`}>{icon}</span>
      {label}
    </div>
    <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">{value}</div>
    {sub && <div className="text-[11px] text-neutral-400 mt-0.5">{sub}</div>}
  </div>
);

const CustomerCard: React.FC<{ c: CustomerInsight; config: FarmConfig }> = ({ c, config }) => {
  const style = GRADE_STYLE[c.grade];
  const barColor =
    c.grade === 'A' ? 'bg-emerald-500' : c.grade === 'B' ? 'bg-sky-500' : c.grade === 'C' ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-neutral-900 truncate">{c.name}</div>
          <div className="text-[11px] text-neutral-400 font-mono">{c.phone || 'Tanpa nomor WA'}</div>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded ${style.badge}`}>
            {c.grade} · {c.score}
          </span>
          <div className="text-[10px] text-neutral-400 mt-0.5">{style.label}</div>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${c.score}%` }} />
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <dt className="text-neutral-400">Total belanja</dt>
        <dd className="text-right font-mono font-semibold">{formatIDR(c.totalSpend)}</dd>
        <dt className="text-neutral-400">Transaksi</dt>
        <dd className="text-right font-mono">
          {c.txCount}x · {c.totalKg.toFixed(1)} Kg
        </dd>
        <dt className="text-neutral-400">Sisa bon</dt>
        <dd className={`text-right font-mono ${c.outstanding > 0 ? 'text-rose-600 font-semibold' : ''}`}>
          {formatIDR(c.outstanding)}
        </dd>
        <dt className="text-neutral-400">Batas tempo disarankan</dt>
        <dd className="text-right font-mono">
          {c.suggestedCreditLimit > 0 ? formatIDR(c.suggestedCreditLimit) : 'Tunai saja'}
        </dd>
        <dt className="text-neutral-400">Order terakhir</dt>
        <dd className="text-right">
          {formatDateIndo(c.lastPurchase)} <span className="text-neutral-400">({c.daysSinceLast} hr)</span>
        </dd>
        {c.avgIntervalDays !== null && (
          <>
            <dt className="text-neutral-400">Pola order</dt>
            <dd className="text-right">tiap ±{Math.max(1, Math.round(c.avgIntervalDays))} hari</dd>
          </>
        )}
      </dl>

      <ul className="text-[11px] text-neutral-500 space-y-0.5">
        {c.reasons.map((r) => (
          <li key={r}>• {r}</li>
        ))}
        {c.isChurning && <li className="text-amber-700 font-medium">• Lebih lama dari biasanya tidak order</li>}
      </ul>

      {c.phone && (c.outstanding > 0 || c.isChurning) && (
        <div className="flex gap-2 pt-1 mt-auto">
          {c.outstanding > 0 && (
            <button
              type="button"
              onClick={() => openWhatsApp(c.phone, reminderMessage(c, config))}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold py-2 transition"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Tagih via WA
            </button>
          )}
          {c.isChurning && (
            <button
              type="button"
              onClick={() => openWhatsApp(c.phone, winBackMessage(c, config))}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold py-2 transition"
            >
              <HeartHandshake className="h-3.5 w-3.5" /> Sapa Lagi
            </button>
          )}
        </div>
      )}
    </div>
  );
};
