import { FarmConfig, HarvestLog, SaleTransaction, StockMutation } from '../types';
import { DEFAULT_CONFIG, getTodayString } from '../utils/eggConversions';

export const INITIAL_CONFIG: FarmConfig = {
  ...DEFAULT_CONFIG,
};

const today = getTodayString();

// Helper to get past dates
function getPastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get future dates
function getFutureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const INITIAL_TRANSACTIONS: SaleTransaction[] = [
  {
    id: 'tx-101',
    invoiceNo: 'INV-20261021-001',
    date: today,
    customerName: 'Bakery Roti Manis Jaya',
    customerPhone: '081234567801',
    items: [
      {
        id: 'item-1',
        grade: 'Standard',
        unit: 'KG',
        qty: 60,
        unitPrice: 28000,
        subtotal: 1680000,
        kgEquivalent: 60,
        butirEquivalent: 960,
      },
    ],
    totalAmount: 1680000,
    cogsAmount: 60 * 22500, // 1.350.000
    hppPerKgUsed: 22500,
    totalKg: 60,
    totalButir: 960,
    paymentStatus: 'TEMPO',
    paymentMethod: 'TEMPO',
    dueDate: getFutureDate(1), // Mendekati tempo (1 day left)
    amountPaid: 0,
    remainingBalance: 1680000,
    paymentHistory: [],
    notes: 'Kirim pagi, langganan toko roti',
  },
  {
    id: 'tx-102',
    invoiceNo: 'INV-20261020-002',
    date: getPastDate(1),
    customerName: 'Martabak Bang Ali 88',
    customerPhone: '081398765432',
    items: [
      {
        id: 'item-2',
        grade: 'Standard',
        unit: 'TRAY',
        qty: 15, // 15 tray = 450 butir ~ 28.1 kg
        unitPrice: 53000,
        subtotal: 795000,
        kgEquivalent: 28.125,
        butirEquivalent: 450,
      },
      {
        id: 'item-3',
        grade: 'Bentes',
        unit: 'BUTIR',
        qty: 60,
        unitPrice: 1200,
        subtotal: 72000,
        kgEquivalent: 3.75,
        butirEquivalent: 60,
      },
    ],
    totalAmount: 867000,
    cogsAmount: 31.875 * 22500,
    hppPerKgUsed: 22500,
    totalKg: 31.875,
    totalButir: 510,
    paymentStatus: 'TEMPO',
    paymentMethod: 'TEMPO',
    dueDate: getPastDate(2), // Overdue by 2 days! (Macet)
    amountPaid: 0,
    remainingBalance: 867000,
    paymentHistory: [],
    notes: 'Jatuh tempo setiap Senin',
  },
  {
    id: 'tx-103',
    invoiceNo: 'INV-20261019-003',
    date: getPastDate(2),
    customerName: 'Warung Sembako Barokah Bu Siti',
    customerPhone: '085712348899',
    items: [
      {
        id: 'item-4',
        grade: 'Standard',
        unit: 'TRAY',
        qty: 10,
        unitPrice: 52000,
        subtotal: 520000,
        kgEquivalent: 18.75,
        butirEquivalent: 300,
      },
    ],
    totalAmount: 520000,
    cogsAmount: 18.75 * 22500,
    hppPerKgUsed: 22500,
    totalKg: 18.75,
    totalButir: 300,
    paymentStatus: 'CICILAN',
    paymentMethod: 'TEMPO',
    dueDate: getFutureDate(3),
    amountPaid: 250000,
    remainingBalance: 270000,
    paymentHistory: [
      {
        id: 'pay-1',
        date: getPastDate(1),
        amount: 250000,
        method: 'CASH',
        note: 'Titip uang muka kasir',
      },
    ],
    notes: 'Cicilan ke-1 sudah masuk 250rb',
  },
  {
    id: 'tx-104',
    invoiceNo: 'INV-20261021-004',
    date: today,
    customerName: 'Katering Sejahtera Ny. Maria',
    customerPhone: '081288992211',
    items: [
      {
        id: 'item-5',
        grade: 'Omega',
        unit: 'KG',
        qty: 30,
        unitPrice: 34000,
        subtotal: 1020000,
        kgEquivalent: 30,
        butirEquivalent: 480,
      },
      {
        id: 'item-6',
        grade: 'Standard',
        unit: 'KG',
        qty: 70,
        unitPrice: 28000,
        subtotal: 1960000,
        kgEquivalent: 70,
        butirEquivalent: 1120,
      },
    ],
    totalAmount: 2980000,
    cogsAmount: 100 * 22500,
    hppPerKgUsed: 22500,
    totalKg: 100,
    totalButir: 1600,
    paymentStatus: 'LUNAS',
    paymentMethod: 'TRANSFER',
    dueDate: null,
    amountPaid: 2980000,
    remainingBalance: 0,
    paymentHistory: [
      {
        id: 'pay-2',
        date: today,
        amount: 2980000,
        method: 'TRANSFER',
        note: 'Transfer BCA lunas saat barang tiba',
      },
    ],
    notes: 'Pesanan telur catering hajatan',
  },
  {
    id: 'tx-105',
    invoiceNo: 'INV-20261018-005',
    date: getPastDate(3),
    customerName: 'Rumah Makan Padang Minang Saiyo',
    customerPhone: '082144556677',
    items: [
      {
        id: 'item-7',
        grade: 'Standard',
        unit: 'KG',
        qty: 50,
        unitPrice: 28000,
        subtotal: 1400000,
        kgEquivalent: 50,
        butirEquivalent: 800,
      },
    ],
    totalAmount: 1400000,
    cogsAmount: 50 * 22500,
    hppPerKgUsed: 22500,
    totalKg: 50,
    totalButir: 800,
    paymentStatus: 'TEMPO',
    paymentMethod: 'TEMPO',
    dueDate: getFutureDate(4), // Aman (4 days left)
    amountPaid: 0,
    remainingBalance: 1400000,
    paymentHistory: [],
    notes: 'Tagihan tempo rutin mingguan',
  },
];

// Generate 30 days of authentic daily harvest logs for Kandang A (2500 hens) & Kandang B (2000 hens)
const generate30DayHarvests = (): HarvestLog[] => {
  const logs: HarvestLog[] = [];
  
  // Daily production curve variations over 30 days (percentages and slight dips)
  const rateVariationsA = [
    87.5, 88.2, 88.9, 89.4, 90.1, 89.8, 88.5, 87.2, 86.8, 87.4,
    88.0, 89.2, 90.4, 90.8, 89.5, 88.6, 87.9, 85.4, 84.8, 86.2,
    87.5, 88.4, 89.1, 89.8, 90.2, 89.6, 88.9, 88.4, 88.9, 89.6
  ];

  const rateVariationsB = [
    81.2, 82.0, 82.5, 83.2, 84.0, 83.5, 82.8, 81.5, 80.8, 81.6,
    82.4, 83.0, 84.2, 84.6, 83.8, 82.9, 82.1, 79.5, 78.8, 80.4,
    81.8, 82.6, 83.4, 84.0, 84.5, 83.8, 83.0, 82.2, 82.4, 80.0
  ];

  for (let i = 29; i >= 0; i--) {
    const dayDate = getPastDate(i);
    const dayIndex = 29 - i;

    // Kandang A (Lohmann, 2500 hens)
    const rateA = rateVariationsA[dayIndex] || 88.5;
    const butirA = Math.round((rateA / 100) * 2500);
    const netKgA = parseFloat((butirA / 16).toFixed(1));
    const grossKgA = parseFloat((netKgA + 14).toFixed(1));
    const brokenA = Math.round(11 + (dayIndex % 7));

    logs.push({
      id: `hrv-a-${i}`,
      date: dayDate,
      timeOfDay: 'Pagi',
      flockId: 'flock-a',
      flockName: 'Kandang Layer A (Lohmann)',
      weightGrossKg: grossKgA,
      weightTareKg: 14,
      weightNetKg: netKgA,
      estimatedButir: butirA,
      brokenCount: brokenA,
      activeHenPopulation: 2500,
      henDayRate: rateA,
      shellQuality: rateA >= 88 ? 'Sangat Bagus' : 'Normal',
      collectorName: 'Kang Sukirman',
      notes: i === 0 ? 'Kondisi ayam sehat, pakan konsentrat batch baru' : undefined,
    });

    // Kandang B (Isa Brown, 2000 hens)
    const rateB = rateVariationsB[dayIndex] || 82.5;
    const butirB = Math.round((rateB / 100) * 2000);
    const netKgB = parseFloat((butirB / 16).toFixed(1));
    const grossKgB = parseFloat((netKgB + 10).toFixed(1));
    const brokenB = Math.round(8 + (dayIndex % 5));

    logs.push({
      id: `hrv-b-${i}`,
      date: dayDate,
      timeOfDay: 'Pagi',
      flockId: 'flock-b',
      flockName: 'Kandang Layer B (Isa Brown)',
      weightGrossKg: grossKgB,
      weightTareKg: 10,
      weightNetKg: netKgB,
      estimatedButir: butirB,
      brokenCount: brokenB,
      activeHenPopulation: 2000,
      henDayRate: rateB,
      shellQuality: 'Normal',
      collectorName: 'Pak Joko',
      notes: i === 0 ? 'Sirkulasi blower kandang optimal' : undefined,
    });
  }

  return logs;
};

export const INITIAL_HARVEST_LOGS: HarvestLog[] = generate30DayHarvests();

export const INITIAL_MUTATIONS: StockMutation[] = [
  {
    id: 'mut-01',
    timestamp: `${today} 07:30`,
    date: today,
    type: 'PANEN_IN',
    referenceId: 'hrv-101',
    description: 'Panen Masuk: Kandang Layer A (140.0 Kg)',
    kgChange: 140,
    butirChange: 2240,
    resultingStockKg: 1740,
  },
  {
    id: 'mut-02',
    timestamp: `${today} 08:15`,
    date: today,
    type: 'PANEN_IN',
    referenceId: 'hrv-102',
    description: 'Panen Masuk: Kandang Layer B (100.0 Kg)',
    kgChange: 100,
    butirChange: 1600,
    resultingStockKg: 1840,
  },
  {
    id: 'mut-03',
    timestamp: `${today} 09:30`,
    date: today,
    type: 'PENJUALAN_OUT',
    referenceId: 'INV-20261021-001',
    description: 'Penjualan ke Bakery Roti Manis Jaya (60.0 Kg)',
    kgChange: -60,
    butirChange: -960,
    resultingStockKg: 1780,
  },
  {
    id: 'mut-04',
    timestamp: `${today} 10:15`,
    date: today,
    type: 'PENJUALAN_OUT',
    referenceId: 'INV-20261021-004',
    description: 'Penjualan ke Katering Sejahtera Ny. Maria (100.0 Kg)',
    kgChange: -100,
    butirChange: -1600,
    resultingStockKg: 1680,
  },
];
