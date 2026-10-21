export type UnitType = 'KG' | 'TRAY' | 'BUTIR';

export type EggGrade = 'Standard' | 'Omega' | 'Kampung' | 'Bentes';

export type PaymentStatus = 'LUNAS' | 'TEMPO' | 'CICILAN';

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS' | 'TEMPO';

export interface CartItem {
  id: string;
  grade: EggGrade;
  unit: UnitType;
  qty: number;
  unitPrice: number;
  subtotal: number;
  kgEquivalent: number;
  butirEquivalent: number;
}

export interface PaymentInstallment {
  id: string;
  date: string;
  amount: number;
  method: 'CASH' | 'TRANSFER' | 'QRIS';
  note?: string;
}

export interface SaleTransaction {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  totalAmount: number;
  cogsAmount: number; // Cost of goods sold based on HPP at sale time
  hppPerKgUsed: number;
  totalKg: number;
  totalButir: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  dueDate: string | null; // ISO YYYY-MM-DD
  amountPaid: number;
  remainingBalance: number;
  paymentHistory: PaymentInstallment[];
  notes?: string;
  cashReceived?: number;
  cashChange?: number;
}

export interface HarvestLog {
  id: string;
  date: string; // YYYY-MM-DD
  timeOfDay: 'Pagi' | 'Sore' | 'Siang';
  flockId: string;
  flockName: string;
  weightGrossKg: number;
  weightTareKg: number;
  weightNetKg: number;
  estimatedButir: number;
  brokenCount: number; // Retak / pecah saat panen
  activeHenPopulation: number;
  henDayRate: number; // (estimatedButir / activeHenPopulation) * 100
  shellQuality: 'Sangat Bagus' | 'Normal' | 'Kulit Tipis';
  collectorName: string;
  notes?: string;
}

export interface LossLog {
  id: string;
  date: string;
  brokenButir: number;
  kgEquivalent: number;
  cause: 'Handling Gudang' | 'Sortir Telur Bentes' | 'Pecah di Peti' | 'Lainnya';
  notes?: string;
}

export interface StockOpnameLog {
  id: string;
  date: string;
  systemKg: number;
  actualKg: number;
  differenceKg: number;
  reason: string;
  operator: string;
}

export type MutationType = 'PANEN_IN' | 'PENJUALAN_OUT' | 'LOSS_RUSAK' | 'OPNAME_ADJUST' | 'PELUNASAN_PIUTANG';

export interface StockMutation {
  id: string;
  timestamp: string;
  date: string;
  type: MutationType;
  referenceId: string;
  description: string;
  kgChange: number; // positive or negative
  butirChange: number; // positive or negative
  resultingStockKg: number;
}

export interface FarmConfig {
  farmName: string;
  tagline: string;
  address: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  bankAccountHolder: string;
  hppPerKg: number;
  populasiAyam: number;
  kgToButirRatio: number; // default 16
  trayCapacity: number; // default 30 butir
}

export interface CustomerMaster {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
}
