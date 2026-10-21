import React, { useState } from 'react';
import { FarmConfig } from '../types';
import { X, Save, Sliders, Building, Landmark } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FarmConfig;
  onSave: (newConfig: FarmConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [formData, setFormData] = useState<FarmConfig>({ ...config });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold text-neutral-900">Pengaturan Peternakan & Finansial</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Produksi & HPP */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Parameter Produksi & HPP Telur
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  HPP Pokok Telur per Kg (Rp)
                </label>
                <input
                  type="number"
                  min="5000"
                  step="100"
                  value={formData.hppPerKg}
                  onChange={(e) =>
                    setFormData({ ...formData, hppPerKg: parseFloat(e.target.value) || 0 })
                  }
                  required
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden font-mono"
                />
                <span className="text-[11px] text-neutral-500">Acuan kalkulasi laba kotor harian</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Populasi Ayam Bertelur Aktif (Ekor)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.populasiAyam}
                  onChange={(e) =>
                    setFormData({ ...formData, populasiAyam: parseInt(e.target.value) || 1 })
                  }
                  required
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden font-mono"
                />
                <span className="text-[11px] text-neutral-500">Untuk rumus Hen-Day Production Rate</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Standar Rasio Butir per Kg
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
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden font-mono"
                />
                <span className="text-[11px] text-neutral-500">Rata-rata industri: 16 butir/kg</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Kapasitas 1 Tray / Karpet (Butir)
                </label>
                <input
                  type="number"
                  value={formData.trayCapacity}
                  onChange={(e) =>
                    setFormData({ ...formData, trayCapacity: parseInt(e.target.value) || 30 })
                  }
                  required
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden font-mono"
                />
                <span className="text-[11px] text-neutral-500">Standar isi 30 butir</span>
              </div>
            </div>
          </div>

          {/* Section 2: Profil Peternakan */}
          <div className="space-y-3 pt-3 border-t border-neutral-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <Building className="h-4 w-4" /> Profil Peternakan (Untuk Nota & Tagihan)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nama Peternakan / Usaha
                </label>
                <input
                  type="text"
                  value={formData.farmName}
                  onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  required
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    No. WhatsApp / Kontak
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Slogan / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Alamat Farm / Gudang
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Rekening Pembayaran */}
          <div className="space-y-3 pt-3 border-t border-neutral-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <Landmark className="h-4 w-4" /> Rekening Pembayaran (Tercantum di Tagihan WA)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  placeholder="BCA / BRI / Mandiri"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Atas Nama
                </label>
                <input
                  type="text"
                  value={formData.bankAccountHolder}
                  onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-amber-700 transition"
            >
              <Save className="h-4 w-4" /> Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
