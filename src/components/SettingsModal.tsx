import React, { useState } from 'react';
import { CustomerMaster, FarmConfig } from '../types';
import { getStorageStats } from '../utils/storage';
import {
  X,
  Sliders,
  Users,
  Plus,
  Trash2,
  Edit2,
  Database,
  Phone,
  MapPin,
  Check,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FarmConfig;
  onSaveConfig: (newConfig: FarmConfig) => void;
  masterCustomers: CustomerMaster[];
  onSaveCustomers: (newCustomers: CustomerMaster[]) => void;
  onResetPartition?: (partitionKey: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  masterCustomers,
  onSaveCustomers,
  onResetPartition,
}) => {
  const [activeTab, setActiveTab] = useState<'pelanggan' | 'parameter' | 'storage'>('pelanggan');

  // Form states for Farm Parameter Config
  const [formData, setFormData] = useState<FarmConfig>({ ...config });

  // Customers states
  const [customers, setCustomers] = useState<CustomerMaster[]>([...masterCustomers]);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // New / Editing customer form
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cNotes, setCNotes] = useState('');

  // Storage partition stats
  const [storageList, setStorageList] = useState(getStorageStats());

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingCustomerId(null);
    setCName('');
    setCPhone('');
    setCAddress('');
    setCNotes('');
    setIsAddingCustomer(true);
  };

  const handleStartEdit = (cust: CustomerMaster) => {
    setEditingCustomerId(cust.id);
    setCName(cust.name);
    setCPhone(cust.phone);
    setCAddress(cust.address || '');
    setCNotes(cust.notes || '');
    setIsAddingCustomer(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;

    let updated: CustomerMaster[];
    if (editingCustomerId) {
      updated = customers.map((c) =>
        c.id === editingCustomerId
          ? {
              ...c,
              name: cName.trim(),
              phone: cPhone.trim(),
              address: cAddress.trim(),
              notes: cNotes.trim(),
            }
          : c
      );
    } else {
      const newCust: CustomerMaster = {
        id: `cust-${Date.now()}`,
        name: cName.trim(),
        phone: cPhone.trim(),
        address: cAddress.trim(),
        notes: cNotes.trim(),
      };
      updated = [...customers, newCust];
    }

    setCustomers(updated);
    onSaveCustomers(updated);
    setIsAddingCustomer(false);
    setEditingCustomerId(null);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Hapus pelanggan "${name}" dari daftar master langganan?`)) {
      const updated = customers.filter((c) => c.id !== id);
      setCustomers(updated);
      onSaveCustomers(updated);
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onSaveCustomers(customers);
    onClose();
  };

  const handleResetSpecificPartition = (partitionKey: string, partitionName: string) => {
    if (
      confirm(
        `PERINGATAN: Apakah Anda yakin ingin mereset partisi "${partitionName}"?\nData lainnya (seperti master pelanggan/profil toko) akan tetap AMAN dan tidak terhapus.`
      )
    ) {
      if (onResetPartition) {
        onResetPartition(partitionKey);
        setStorageList(getStorageStats());
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Pusat Pengaturan & Data Master Usaha
              </h2>
              <p className="text-xs text-neutral-500">
                Kelola profil peternakan, daftar toko pelanggan, dan partisi data tanpa utak-atik kode
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 4 Clean Navigation Tabs */}
        <div className="flex border-b border-neutral-200 px-6 gap-1 bg-white overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pelanggan')}
            className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'pelanggan'
                ? 'border-amber-600 text-amber-900 font-extrabold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Users className="h-4 w-4" /> Master Pelanggan ({customers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parameter')}
            className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'parameter'
                ? 'border-amber-600 text-amber-900 font-extrabold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Sliders className="h-4 w-4" /> Parameter HPP & Produksi
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('storage');
              setStorageList(getStorageStats());
            }}
            className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'storage'
                ? 'border-amber-600 text-amber-900 font-extrabold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Database className="h-4 w-4" /> Partisi Storage Terpisah
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: MASTER PELANGGAN TETAP */}
          {activeTab === 'pelanggan' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Daftar Master Pelanggan & Toko Langganan
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Nama pelanggan ini akan otomatis muncul sebagai tombol pilihan cepat di Kasir POS dan buku piutang
                  </p>
                </div>
                {!isAddingCustomer && (
                  <button
                    type="button"
                    onClick={handleStartAdd}
                    className="flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> + Tambah Pelanggan Baru
                  </button>
                )}
              </div>

              {/* Add / Edit Inline Form */}
              {isAddingCustomer && (
                <form
                  onSubmit={handleSaveCustomer}
                  className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-amber-200/80 pb-2">
                    <span className="text-xs font-bold text-amber-950">
                      {editingCustomerId ? 'Edit Data Pelanggan' : 'Form Tambah Pelanggan Baru'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomer(false)}
                      className="text-xs text-neutral-500 hover:text-neutral-800"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Nama Pelanggan / Toko <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Martabak Bang Ali / Bakery Jaya"
                        value={cName}
                        onChange={(e) => setCName(e.target.value)}
                        required
                        className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs bg-white focus:outline-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        No. WhatsApp (Untuk Tagihan Otomatis)
                      </label>
                      <input
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        value={cPhone}
                        onChange={(e) => setCPhone(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-mono bg-white focus:outline-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Alamat / Lokasi Toko
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Jl. Sudirman No. 12"
                        value={cAddress}
                        onChange={(e) => setCAddress(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs bg-white focus:outline-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Catatan Khusus Langganan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Rutin ambil 20 tray / telur bentes"
                        value={cNotes}
                        onChange={(e) => setCNotes(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs bg-white focus:outline-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomer(false)}
                      className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-600 bg-white"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
                    >
                      Simpan Data Pelanggan
                    </button>
                  </div>
                </form>
              )}

              {/* Customers List */}
              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden bg-white">
                {customers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400">
                    Belum ada data pelanggan tetap. Klik tombol "+ Tambah Pelanggan Baru" di atas.
                  </div>
                ) : (
                  customers.map((cust) => (
                    <div
                      key={cust.id}
                      className="p-3.5 flex items-center justify-between hover:bg-neutral-50/70 transition text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                          <span>{cust.name}</span>
                          {cust.phone && (
                            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-normal flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {cust.phone}
                            </span>
                          )}
                        </div>
                        {cust.address && (
                          <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-neutral-400" /> {cust.address}
                          </p>
                        )}
                        {cust.notes && (
                          <p className="text-[11px] text-neutral-400 italic">
                            Catatan: {cust.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cust)}
                          title="Edit Pelanggan"
                          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                          title="Hapus Pelanggan"
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PARAMETER PRODUKSI & HPP */}
          {activeTab === 'parameter' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Kalkulasi HPP & Hen-Day Rate
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1">
                  <label className="block text-xs font-bold text-neutral-800">
                    HPP Pokok Telur per Kg (Rp)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="100"
                    value={formData.hppPerKg}
                    onChange={(e) =>
                      setFormData({ ...formData, hppPerKg: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-mono font-bold bg-white"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Digunakan untuk menghitung Modal Pokok (COGS) dan Laba Bersih harian.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1">
                  <label className="block text-xs font-bold text-neutral-800">
                    Populasi Ayam Aktif (Ekor)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.populasiAyam}
                    onChange={(e) =>
                      setFormData({ ...formData, populasiAyam: parseInt(e.target.value) || 1 })
                    }
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-mono font-bold bg-white"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Untuk rumus Hen-Day Rate: (Butir Panen / Populasi) × 100%.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1">
                  <label className="block text-xs font-bold text-neutral-800">
                    Rasio Butir per Kg
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="25"
                    value={formData.kgToButirRatio}
                    onChange={(e) =>
                      setFormData({ ...formData, kgToButirRatio: parseFloat(e.target.value) || 16 })
                    }
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-mono font-bold bg-white"
                  />
                  <p className="text-[11px] text-neutral-500">Rata-rata 1 Kg telur = 16 butir.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1">
                  <label className="block text-xs font-bold text-neutral-800">
                    Kapasitas 1 Tray / Karpet
                  </label>
                  <input
                    type="number"
                    value={formData.trayCapacity}
                    onChange={(e) =>
                      setFormData({ ...formData, trayCapacity: parseInt(e.target.value) || 30 })
                    }
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-mono font-bold bg-white"
                  />
                  <p className="text-[11px] text-neutral-500">Standar isi 30 butir per tray.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PARTISI STORAGE TERPISAH */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 pb-2">
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <Database className="h-4 w-4 text-amber-600" /> Status Partisi Penyimpanan (Separated Storage)
                </h3>
                <p className="text-xs text-neutral-500">
                  Data Anda telah dipisahkan menjadi partisi independen. Anda bisa mereset atau mengosongkan partisi tertentu tanpa mengganggu data lainnya.
                </p>
              </div>

              <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden bg-white">
                {storageList.map((part) => (
                  <div
                    key={part.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-neutral-50 transition"
                  >
                    <div>
                      <div className="font-bold text-neutral-900 flex items-center gap-2">
                        <span>{part.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600">
                          {part.key}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{part.description}</p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="font-mono font-semibold text-neutral-700">
                          {(part.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                        <span className="block text-[10px] text-emerald-600 font-semibold">
                          {part.status}
                        </span>
                      </div>

                      {onResetPartition && (
                        <button
                          type="button"
                          onClick={() => handleResetSpecificPartition(part.key, part.name)}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition"
                        >
                          Reset Partisi
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 bg-neutral-50">
          <span className="text-[11px] text-neutral-500">
            Perubahan otomatis tersimpan ke memori browser
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 transition"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs"
            >
              <Check className="h-4 w-4" /> Simpan Semua Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
