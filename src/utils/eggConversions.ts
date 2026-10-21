import { FarmConfig, SaleTransaction, UnitType } from '../types';

export const DEFAULT_CONFIG: FarmConfig = {
  farmName: 'Berkah Egg Farm & Distribusi',
  tagline: 'Supplier Telur Ayam Segar Terpercaya & Kualitas Pilihan',
  address: 'Kawasan Sentra Peternakan Unggas, Blok B-04',
  phone: '6281234567890',
  bankName: 'BCA',
  bankAccount: '8220198821',
  bankAccountHolder: 'CV Berkah Ternak Makmur',
  hppPerKg: 22500,
  populasiAyam: 4500,
  kgToButirRatio: 16,
  trayCapacity: 30,
};

export function convertToKg(qty: number, unit: UnitType, config: FarmConfig = DEFAULT_CONFIG): number {
  if (unit === 'KG') return qty;
  if (unit === 'BUTIR') return qty / config.kgToButirRatio;
  if (unit === 'TRAY') return (qty * config.trayCapacity) / config.kgToButirRatio;
  return qty;
}

export function convertToButir(qty: number, unit: UnitType, config: FarmConfig = DEFAULT_CONFIG): number {
  if (unit === 'BUTIR') return qty;
  if (unit === 'KG') return qty * config.kgToButirRatio;
  if (unit === 'TRAY') return qty * config.trayCapacity;
  return qty;
}

export function convertKgToTray(kg: number, config: FarmConfig = DEFAULT_CONFIG): number {
  const butir = kg * config.kgToButirRatio;
  return butir / config.trayCapacity;
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number, decimals: number = 1): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export type AgingCategory = 'Lunas' | 'Aman' | 'Mendekati' | 'Macet';

export function calculateAgingStatus(tx: SaleTransaction): {
  status: AgingCategory;
  diffDays: number;
  label: string;
} {
  if (tx.paymentStatus === 'LUNAS' || tx.remainingBalance <= 0) {
    return { status: 'Lunas', diffDays: 0, label: 'Lunas' };
  }

  if (!tx.dueDate) {
    return { status: 'Aman', diffDays: 0, label: 'Tanpa Tempo' };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [y, m, d] = tx.dueDate.split('-');
  const due = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'Macet',
      diffDays,
      label: `Lewat ${Math.abs(diffDays)} Hari`,
    };
  } else if (diffDays <= 2) {
    return {
      status: 'Mendekati',
      diffDays,
      label: diffDays === 0 ? 'Jatuh Tempo Hari Ini' : `${diffDays} Hari Lagi`,
    };
  } else {
    return {
      status: 'Aman',
      diffDays,
      label: `${diffDays} Hari Lagi`,
    };
  }
}

export function generateWhatsAppMessage(tx: SaleTransaction, config: FarmConfig): string {
  const itemsText = tx.items
    .map((item, idx) => `${idx + 1}. Telur ${item.grade} (${item.qty} ${item.unit}) = ${formatIDR(item.subtotal)}`)
    .join('\n');

  const aging = calculateAgingStatus(tx);
  let tempoNotice = '';
  if (aging.status === 'Macet') {
    tempoNotice = `⚠️ Tagihan ini telah melewati tanggal jatuh tempo (${formatDateIndo(tx.dueDate || '')}, telat ${Math.abs(aging.diffDays)} hari).`;
  } else if (aging.status === 'Mendekati') {
    tempoNotice = `⏳ Pengingat jatuh tempo: ${formatDateIndo(tx.dueDate || '')} (${aging.label}).`;
  } else if (tx.dueDate) {
    tempoNotice = `🗓️ Jatuh tempo: ${formatDateIndo(tx.dueDate)}.`;
  }

  const text = `Halo Yth. *${tx.customerName}*,\n\nSalam dari *${config.farmName}*.\nKami mengonfirmasi tagihan pesanan telur Anda sebagai berikut:\n\n` +
    `🧾 *No. Faktur:* ${tx.invoiceNo}\n` +
    `📅 *Tanggal:* ${formatDateIndo(tx.date)}\n` +
    `📦 *Rincian Pesanan:*\n${itemsText}\n\n` +
    `💰 *Total Belanja:* ${formatIDR(tx.totalAmount)}\n` +
    (tx.amountPaid > 0 ? `💵 *Sudah Dibayar:* ${formatIDR(tx.amountPaid)}\n` : '') +
    `🔴 *Sisa Tagihan:* *${formatIDR(tx.remainingBalance)}*\n` +
    `${tempoNotice}\n\n` +
    `Pembayaran dapat ditransfer melalui:\n` +
    `🏦 *${config.bankName}:* ${config.bankAccount}\n` +
    `a/n *${config.bankAccountHolder}*\n\n` +
    `Mohon kirimkan bukti transfer setelah pembayaran. Terima kasih banyak atas kerjasamanya! 🙏`;

  return text;
}

export function cleanPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}
