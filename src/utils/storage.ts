import { CustomerMaster, FarmConfig, HarvestLog, SaleTransaction, StockMutation } from '../types';
import {
  INITIAL_CONFIG,
  INITIAL_HARVEST_LOGS,
  INITIAL_LOSS_BUTIR,
  INITIAL_MUTATIONS,
  INITIAL_STOCK_KG,
  INITIAL_TRANSACTIONS,
} from '../data/initialData';

// Modular Separate Storage Keys
export const STORAGE_KEYS = {
  FARM_PROFILE: 'ovotrack_storage_farm_profile_v3',
  CUSTOMERS: 'ovotrack_storage_customers_master_v3',
  TRANSACTIONS: 'ovotrack_storage_sales_transactions_v3',
  HARVESTS: 'ovotrack_storage_harvest_logs_v3',
  STOCK: 'ovotrack_storage_stock_kg_v3',
  LOSS: 'ovotrack_storage_loss_butir_v3',
  MUTATIONS: 'ovotrack_storage_mutations_v3',
} as const;

export const DEFAULT_MASTER_CUSTOMERS: CustomerMaster[] = [
  {
    id: 'cust-1',
    name: 'Bakery Roti Manis Jaya',
    phone: '081234567801',
    address: 'Jl. Surya Kencana No. 18',
    notes: 'Langganan telur horn regular untuk adonan roti',
  },
  {
    id: 'cust-2',
    name: 'Martabak Bang Ali 88',
    phone: '081398765432',
    address: 'Kawasan Kuliner Malam Pasar Lama',
    notes: 'Ambil per tray + telur bentesan/retak',
  },
  {
    id: 'cust-3',
    name: 'Warung Sembako Barokah Bu Siti',
    phone: '085712348899',
    address: 'Komplek Griya Indah Blok C',
    notes: 'Eceran warung sembako tempo mingguan',
  },
  {
    id: 'cust-4',
    name: 'Katering Sejahtera Ny. Maria',
    phone: '081288992211',
    address: 'Jl. Anggrek Melati No. 45',
    notes: 'Katering hajatan dan box makan siang',
  },
  {
    id: 'cust-5',
    name: 'Rumah Makan Padang Minang Saiyo',
    phone: '082144556677',
    address: 'Ruko Simpang Raya No. 12',
    notes: 'Rutin ambil 50 Kg per minggu',
  },
];

/**
 * localStorage can throw (quota full, private mode). A failed save must never
 * crash the cashier screen, but the user should know data wasn't persisted.
 */
let quotaWarned = false;
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.error(`[OvoTrack] Gagal menyimpan ${key}`, err);
    if (!quotaWarned) {
      quotaWarned = true;
      alert('Penyimpanan browser penuh / tidak tersedia. Segera ekspor backup data dari menu Jurnal Mutasi.');
    }
  }
}

/** Removes only OvoTrack keys — never wipe other apps sharing this origin. */
export function clearAllOvoStorage(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

// 1. Farm Profile & Config Storage
export function loadFarmConfig(): FarmConfig {
  const saved = localStorage.getItem(STORAGE_KEYS.FARM_PROFILE);
  if (saved) {
    try {
      // Merge so fields added in newer versions get sensible defaults
      return { ...INITIAL_CONFIG, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
  }
  return INITIAL_CONFIG;
}

export function saveFarmConfig(config: FarmConfig): void {
  safeSetItem(STORAGE_KEYS.FARM_PROFILE, JSON.stringify(config));
}

// 2. Master Customers Storage (Separated)
export function loadMasterCustomers(): CustomerMaster[] {
  const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback
    }
  }
  return DEFAULT_MASTER_CUSTOMERS;
}

export function saveMasterCustomers(customers: CustomerMaster[]): void {
  safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
}

// 3. Sales & Accounts Receivable Storage (Separated)
export function loadSalesTransactions(): SaleTransaction[] {
  const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return INITIAL_TRANSACTIONS;
}

export function saveSalesTransactions(transactions: SaleTransaction[]): void {
  safeSetItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

// 4. Harvest Logs Storage (Separated)
export function loadHarvestLogs(): HarvestLog[] {
  const saved = localStorage.getItem(STORAGE_KEYS.HARVESTS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Any saved array is the user's real data — never swap it for demo data.
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback
    }
  }
  return INITIAL_HARVEST_LOGS;
}

export function saveHarvestLogs(logs: HarvestLog[]): void {
  safeSetItem(STORAGE_KEYS.HARVESTS, JSON.stringify(logs));
}

// 5. Stock Physical Inventory Storage (Separated)
export function loadStockKg(): number {
  const saved = localStorage.getItem(STORAGE_KEYS.STOCK);
  if (saved) {
    const parsed = parseFloat(saved);
    if (!isNaN(parsed)) return parsed;
  }
  return INITIAL_STOCK_KG;
}

export function saveStockKg(stockKg: number): void {
  safeSetItem(STORAGE_KEYS.STOCK, stockKg.toString());
}

// 6. Loss Egg Storage (Separated)
export function loadTotalLossButir(): number {
  const saved = localStorage.getItem(STORAGE_KEYS.LOSS);
  if (saved) {
    const parsed = parseInt(saved);
    if (!isNaN(parsed)) return parsed;
  }
  return INITIAL_LOSS_BUTIR;
}

export function saveTotalLossButir(lossButir: number): void {
  safeSetItem(STORAGE_KEYS.LOSS, lossButir.toString());
}

// 7. Mutations Ledger Storage (Separated)
export function loadMutations(): StockMutation[] {
  const saved = localStorage.getItem(STORAGE_KEYS.MUTATIONS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return INITIAL_MUTATIONS;
}

export function saveMutations(mutations: StockMutation[]): void {
  safeSetItem(STORAGE_KEYS.MUTATIONS, JSON.stringify(mutations));
}

// Storage Diagnostics & Partition Clear
export function getStorageStats() {
  const getSizeBytes = (key: string) => (localStorage.getItem(key) || '').length * 2;

  return [
    {
      id: 'FARM_PROFILE',
      key: STORAGE_KEYS.FARM_PROFILE,
      name: 'Profil Peternakan & Rekening',
      description: 'Nama toko, alamat, kontak WA, rekening pembayaran',
      sizeBytes: getSizeBytes(STORAGE_KEYS.FARM_PROFILE),
      status: localStorage.getItem(STORAGE_KEYS.FARM_PROFILE) ? 'Tersimpan' : 'Default',
    },
    {
      id: 'CUSTOMERS',
      key: STORAGE_KEYS.CUSTOMERS,
      name: 'Master Data Pelanggan Tetap',
      description: 'Daftar nama toko langganan & nomor WA pembeli',
      sizeBytes: getSizeBytes(STORAGE_KEYS.CUSTOMERS),
      status: localStorage.getItem(STORAGE_KEYS.CUSTOMERS) ? 'Tersimpan' : 'Default',
    },
    {
      id: 'TRANSACTIONS',
      key: STORAGE_KEYS.TRANSACTIONS,
      name: 'Data Transaksi Penjualan & Piutang',
      description: 'Seluruh riwayat faktur kasir & status tempo bon',
      sizeBytes: getSizeBytes(STORAGE_KEYS.TRANSACTIONS),
      status: localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) ? 'Tersimpan' : 'Default',
    },
    {
      id: 'HARVESTS',
      key: STORAGE_KEYS.HARVESTS,
      name: 'Data Rekaman Panen Harian',
      description: 'Data timbangan panen & tren Hen-Day 30 hari',
      sizeBytes: getSizeBytes(STORAGE_KEYS.HARVESTS),
      status: localStorage.getItem(STORAGE_KEYS.HARVESTS) ? 'Tersimpan' : 'Default',
    },
    {
      id: 'STOCK',
      key: STORAGE_KEYS.STOCK,
      name: 'Persediaan Stok Fisik (Kg)',
      description: 'Sisa kilogram persediaan telur di gudang',
      sizeBytes: getSizeBytes(STORAGE_KEYS.STOCK),
      status: localStorage.getItem(STORAGE_KEYS.STOCK) ? 'Tersimpan' : 'Default',
    },
    {
      id: 'LOSS',
      key: STORAGE_KEYS.LOSS,
      name: 'Akumulasi Telur Pecah / Loss',
      description: 'Total butir telur rusak yang tercatat',
      sizeBytes: getSizeBytes(STORAGE_KEYS.LOSS),
      status: localStorage.getItem(STORAGE_KEYS.LOSS) ? 'Tersimpan' : 'Default',
    },
    {
      id: 'MUTATIONS',
      key: STORAGE_KEYS.MUTATIONS,
      name: 'Jurnal Log Mutasi Keluar-Masuk',
      description: 'Audit trail mutasi keluar, masuk, dan penyesuaian',
      sizeBytes: getSizeBytes(STORAGE_KEYS.MUTATIONS),
      status: localStorage.getItem(STORAGE_KEYS.MUTATIONS) ? 'Tersimpan' : 'Default',
    },
  ];
}

export function clearSpecificStoragePartition(key: string): void {
  localStorage.removeItem(key);
}
