import React, { useState } from 'react';
import { FarmConfig } from '../types';
import {
  Building2,
  X,
  Save,
  Phone,
  MapPin,
  Landmark,
  Check,
  Store,
  Sparkles,
} from 'lucide-react';

interface FarmProfileProps {
  config: FarmConfig;
  onUpdateConfig: (updatedConfig: FarmConfig) => void;
}

export const FarmProfile: React.FC<FarmProfileProps> = ({ config, onUpdateConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [farmName, setFarmName] = useState(config.farmName);
  const [tagline, setTagline] = useState(config.tagline);
  const [phone, setPhone] = useState(config.phone);
  const [address, setAddress] = useState(config.address);
  const [bankName, setBankName] = useState(config.bankName);
  const [bankAccount, setBankAccount] = useState(config.bankAccount);
  const [bankAccountHolder, setBankAccountHolder] = useState(config.bankAccountHolder);

  const handleOpen = () => {
    setFarmName(config.farmName);
    setTagline(config.tagline);
    setPhone(config.phone);
    setAddress(config.address);
    setBankName(config.bankName);
    setBankAccount(config.bankAccount);
    setBankAccountHolder(config.bankAccountHolder);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: FarmConfig = {
      ...config,
      farmName: farmName.trim() || 'Berkah Egg Farm',
      tagline: tagline.trim(),
      phone: phone.trim(),
      address: address.trim(),
      bankName: bankName.trim(),
      bankAccount: bankAccount.trim(),
      bankAccountHolder: bankAccountHolder.trim(),
    };

    onUpdateConfig(updated);
    setIsOpen(false);
  };

  return (
    <>
      {/* Top-Left Quick Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 transition shadow-2xs group text-left max-w-[210px] sm:max-w-[260px]"
        title="Klik untuk ubah Nama Toko, Alamat, No. WA & Rekening Bank"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 shrink-0 group-hover:bg-amber-100 transition">
          <Store className="h-3.5 w-3.5" />
        </div>
        <div className="truncate flex-1 min-w-0">
          <span className="block text-xs font-bold text-neutral-900 truncate">
            {config.farmName}
          </span>
          <span className="block text-[10px] text-neutral-500 font-mono truncate">
            WA: {config.phone}
          </span>
        </div>
      </button>

      {/* Farm Profile Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900">
                    Profil Usaha & Kontak WhatsApp
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Atur nama toko, nomor WA, alamat, dan nomor rekening pembayaran
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Preview Banner */}
              <div className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Preview Kop Nota & Tagihan
                </span>
                <div className="mt-1 font-mono text-xs text-neutral-800">
                  <p className="font-bold text-sm text-neutral-900 uppercase">
                    {farmName || 'NAMA PETERNAKAN ANDA'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {tagline || 'Slogan atau keterangan peternakan'}
                  </p>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    WA: {phone || '-'} · {address || '-'}
                  </p>
                  <p className="text-[11px] text-neutral-600">
                    Bank: {bankName || 'BCA'} {bankAccount || '-'} a/n {bankAccountHolder || '-'}
                  </p>
                </div>
              </div>

              {/* Business Name & Tagline */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Nama Usaha / Peternakan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Berkah Egg Farm & Distribusi"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm font-semibold focus:border-amber-500 focus:outline-hidden"
                  />
                  <span className="text-[11px] text-neutral-500">
                    Nama ini akan tercantum di judul web, struk kasir, dan format WA
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-emerald-600" /> No. WhatsApp Usaha <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-mono font-bold focus:border-amber-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-neutral-400">
                      Format 08... atau 628...
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Slogan / Keterangan Usaha
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Supplier Telur Ayam Segar Terpercaya"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-neutral-500" /> Alamat Kandang / Gudang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jl. Peternakan Unggas No. 12, Blitar"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="space-y-3 pt-3 border-t border-neutral-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-emerald-600" /> Rekening Pembayaran (Untuk Pesan Tagihan WA)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      placeholder="BCA / BRI / Mandiri"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      placeholder="1234567890"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-mono font-bold focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Atas Nama Rekening
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Pemilik Rekening"
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs"
                >
                  <Save className="h-4 w-4" /> Simpan Profil Usaha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
