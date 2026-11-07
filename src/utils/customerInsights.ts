import { SaleTransaction } from '../types';
import { calculateAgingStatus } from './eggConversions';

export type CreditGrade = 'A' | 'B' | 'C' | 'D';

export interface CustomerInsight {
  key: string;
  name: string;
  phone: string;
  txCount: number;
  totalSpend: number;
  totalKg: number;
  avgTicket: number;
  firstPurchase: string;
  lastPurchase: string;
  daysSinceLast: number;
  /** Average days between purchases (null when < 2 purchases). */
  avgIntervalDays: number | null;
  outstanding: number;
  overdueAmount: number;
  maxOverdueDays: number;
  /** Average days paid after due date, over settled credit invoices. */
  avgLateDays: number;
  score: number;
  grade: CreditGrade;
  /** Suggested max open credit (Rp). 0 = cash only. */
  suggestedCreditLimit: number;
  isChurning: boolean;
  /** When we expect them to order next (YYYY-MM-DD), if they have a rhythm. */
  expectedNextPurchase: string | null;
  reasons: string[];
}

const DAY = 24 * 60 * 60 * 1000;

function parseDate(d: string): Date {
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, day);
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / DAY);
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function customerKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

const GRADE_LIMIT_MULTIPLIER: Record<CreditGrade, number> = { A: 3, B: 2, C: 1, D: 0 };

function gradeFor(score: number): CreditGrade {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

/**
 * Turns raw sales history into a per-customer credit & loyalty profile.
 * Pure function — safe to memoize and unit-test.
 */
export function buildCustomerInsights(
  transactions: SaleTransaction[],
  today: string
): CustomerInsight[] {
  const groups = new Map<string, SaleTransaction[]>();
  for (const tx of transactions) {
    const key = customerKey(tx.customerName);
    if (!key) continue;
    const list = groups.get(key);
    if (list) list.push(tx);
    else groups.set(key, [tx]);
  }

  const insights: CustomerInsight[] = [];

  for (const [key, txs] of groups) {
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];

    const totalSpend = sorted.reduce((s, t) => s + t.totalAmount, 0);
    const totalKg = sorted.reduce((s, t) => s + t.totalKg, 0);
    const outstanding = sorted.reduce((s, t) => s + Math.max(0, t.remainingBalance), 0);

    let overdueAmount = 0;
    let maxOverdueDays = 0;
    const lateDays: number[] = [];

    for (const t of sorted) {
      const aging = calculateAgingStatus(t);
      if (aging.status === 'Macet') {
        overdueAmount += t.remainingBalance;
        maxOverdueDays = Math.max(maxOverdueDays, Math.abs(aging.diffDays));
      }
      // Settled credit invoice: how late was the final payment?
      if (t.dueDate && t.paymentMethod === 'TEMPO' && t.remainingBalance <= 0 && t.paymentHistory.length) {
        const lastPay = t.paymentHistory.reduce((m, p) => (p.date > m ? p.date : m), t.paymentHistory[0].date);
        lateDays.push(Math.max(0, daysBetween(t.dueDate, lastPay)));
      }
    }

    const avgLateDays = lateDays.length ? lateDays.reduce((a, b) => a + b, 0) / lateDays.length : 0;

    const uniqueDates = Array.from(new Set(sorted.map((t) => t.date.slice(0, 10))));
    let avgIntervalDays: number | null = null;
    if (uniqueDates.length >= 2) {
      avgIntervalDays = daysBetween(uniqueDates[0], uniqueDates[uniqueDates.length - 1]) / (uniqueDates.length - 1);
    }

    const daysSinceLast = Math.max(0, daysBetween(latest.date, today));
    const avgTicket = totalSpend / sorted.length;

    // --- Scoring (0-100) ---
    const reasons: string[] = [];
    let score = 100;

    const overduePenalty = Math.min(40, maxOverdueDays * 2);
    if (overduePenalty > 0) reasons.push(`Ada tagihan lewat jatuh tempo ${maxOverdueDays} hari`);
    score -= overduePenalty;

    const latePenalty = Math.min(25, avgLateDays * 3);
    if (latePenalty >= 3) reasons.push(`Rata-rata telat bayar ${avgLateDays.toFixed(1)} hari`);
    score -= latePenalty;

    const exposure = totalSpend > 0 ? outstanding / totalSpend : 0;
    const exposurePenalty = Math.min(20, exposure * 40);
    if (exposure >= 0.3) reasons.push(`${Math.round(exposure * 100)}% dari total belanja belum dibayar`);
    score -= exposurePenalty;

    const loyaltyBonus = Math.min(10, sorted.length - 1);
    if (sorted.length >= 5) reasons.push(`Pelanggan setia (${sorted.length}x transaksi)`);
    score += loyaltyBonus;

    score = Math.round(Math.max(0, Math.min(100, score)));
    const grade = gradeFor(score);
    if (reasons.length === 0) reasons.push('Riwayat pembayaran bersih');

    // --- Rhythm & churn detection ---
    let expectedNextPurchase: string | null = null;
    let isChurning = false;
    if (avgIntervalDays !== null && avgIntervalDays > 0) {
      const next = parseDate(latest.date);
      next.setDate(next.getDate() + Math.round(avgIntervalDays));
      expectedNextPurchase = toISODate(next);
      isChurning = daysSinceLast > Math.max(7, avgIntervalDays * 2);
    }

    const suggestedCreditLimit = Math.max(
      0,
      Math.round((avgTicket * GRADE_LIMIT_MULTIPLIER[grade]) / 1000) * 1000
    );

    insights.push({
      key,
      name: latest.customerName,
      phone: [...sorted].reverse().find((t) => t.customerPhone)?.customerPhone ?? '',
      txCount: sorted.length,
      totalSpend,
      totalKg,
      avgTicket,
      firstPurchase: sorted[0].date,
      lastPurchase: latest.date,
      daysSinceLast,
      avgIntervalDays,
      outstanding,
      overdueAmount,
      maxOverdueDays,
      avgLateDays,
      score,
      grade,
      suggestedCreditLimit,
      isChurning,
      expectedNextPurchase,
      reasons,
    });
  }

  return insights.sort((a, b) => b.totalSpend - a.totalSpend);
}

export const GRADE_STYLE: Record<CreditGrade, { label: string; badge: string }> = {
  A: { label: 'Sangat Layak Tempo', badge: 'bg-emerald-100 text-emerald-700' },
  B: { label: 'Layak Tempo', badge: 'bg-sky-100 text-sky-700' },
  C: { label: 'Tempo Terbatas', badge: 'bg-amber-100 text-amber-700' },
  D: { label: 'Wajib Tunai', badge: 'bg-rose-100 text-rose-700' },
};
