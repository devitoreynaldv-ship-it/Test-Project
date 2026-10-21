import React, { useState } from 'react';
import { FarmConfig, HarvestLog, LossLog, StockOpnameLog } from '../types';
import {
  convertToButir,
  convertToKg,
  formatDateIndo,
  formatNumber,
  getTodayString,
} from '../utils/eggConversions';
import {
  Egg,
  TrendingUp,
  AlertOctagon,
  ClipboardList,
  Plus,
  Scale,
  Calendar,
  CheckCircle2,
  Sliders,
  History,
} from 'lucide-react';

interface WarehouseViewProps {
  config: FarmConfig;
  currentStockKg: number;
  totalLossButir: number;
  harvestLogs: HarvestLog[];
  onAddHarvest: (log: HarvestLog) => void;
  onRecordLoss: (log: LossLog) => void;
  onStockOpname: (log: StockOpnameLog) => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({
  config,
  currentStockKg,
  totalLossButir,
  harvestLogs,
  onAddHarvest,
  onRecordLoss,
  onStockOpname,
}) => {
  const today = getTodayString();

  // Active Sub-tab
  const [activeWarehouseTab, setActiveWarehouseTab] = useState<'PANEN' | 'LOSS' | 'OPNAME'>('PANEN');

  // Form Panen States
  const [harvestDate, setHarvestDate] = useState(today);
  const [harvestTime, setHarvestTime] = useState<'Pagi' | 'Sore' | 'Siang'>('Pagi');
  const [flockName, setFlockName] = useState('Kandang Layer A (Lohmann)');
  const [weightGross, setWeightGross] = useState<string>('');
  const [weightTare, setWeightTare] = useState<string>('14');
  const [brokenCount, setBrokenCount] = useState<string>('0');
  const [shellQuality, setShellQuality] = useState<'Sangat Bagus' | 'Normal' | 'Kulit Tipis'>('Sangat Bagus');
  const [collectorName, setCollectorName] = useState('Kang Sukirman');
  const [harvestNotes, setHarvestNotes] = useState('');

  // Form Loss States
  const [lossDate, setLossDate] = useState(today);
  const [lossButir, setLossButir] = useState<string>('');
  const [lossCause, setLossCause] = useState<'Handling Gudang' | 'Sortir Telur Bentes' | 'Pecah di Peti' | 'Lainnya'>('Handling Gudang');
  const [lossNotes, setLossNotes] = useState('');

  // Form Opname States
  const [actualPhysicalKg, setActualPhysicalKg] = useState<string>('');
  const [opnameReason, setOpnameReason] = useState('Penyusutan timbangan rutin akhir pekan');
  const [operatorName, setOperatorName] = useState('Admin Gudang');

  // Live calculations for Harvest
  const grossNum = parseFloat(weightGross) || 0;
  const tareNum = parseFloat(weightTare) || 0;
  const netWeightKg = Math.max(0, grossNum - tareNum);
  const estimatedButir = Math.round(netWeightKg * config.kgToButirRatio);
  const liveHenDayRate =
    config.populasiAyam > 0 ? (estimatedButir / config.populasiAyam) * 100 : 0;

  // Handle Harvest Submit
  const handleHarvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (netWeightKg <= 0) {
      alert('Berat bersih telur harus lebih besar dari 0 Kg.');
      return;
    }

    const newLog: HarvestLog = {
      id: `hrv-${Date.now()}`,
      date: harvestDate,
      timeOfDay: harvestTime,
      flockId: flockName.toLowerCase().replace(/\s+/g, '-'),
      flockName,
      weightGrossKg: grossNum,
      weightTareKg: tareNum,
      weightNetKg: netWeightKg,
      estimatedButir,
      brokenCount: parseInt(brokenCount) || 0,
      activeHenPopulation: config.populasiAyam,
      henDayRate: liveHenDayRate,
      shellQuality,
      collectorName: collectorName.trim(),
      notes: harvestNotes,
    };

    onAddHarvest(newLog);

    // Reset Form
    setWeightGross('');
    setBrokenCount('0');
    setHarvestNotes('');
    alert(`Berhasil menyimpan panen ${netWeightKg.toFixed(1)} Kg (${estimatedButir} butir) ke stok gudang!`);
  };

  // Handle Loss Submit
  const handleLossSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const butir = parseInt(lossButir) || 0;
    if (butir <= 0) {
      alert('Masukkan jumlah butir rusak yang valid.');
      return;
    }

    const kgEq = butir / config.kgToButirRatio;

    if (kgEq > currentStockKg) {
      alert('Jumlah telur rusak melebihi sisa stok telur siap jual!');
      return;
    }

    const newLoss: LossLog = {
      id: `loss-${Date.now()}`,
      date: lossDate,
      brokenButir: butir,
      kgEquivalent: kgEq,
      cause: lossCause,
      notes: lossNotes,
    };

    onRecordLoss(newLoss);
    setLossButir('');
    setLossNotes('');
    alert(`Pencatatan ${butir} butir telur rusak tersimpan dan dipotong dari stok siap jual.`);
  };

  // Handle Opname Submit
  const handleOpnameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(actualPhysicalKg);
    if (isNaN(actual) || actual < 0) {
      alert('Masukkan angka timbangan fisik yang valid.');
      return;
    }

    const diff = actual - currentStockKg;

    const newOpname: StockOpnameLog = {
      id: `opn-${Date.now()}`,
      date: today,
      systemKg: currentStockKg,
      actualKg: actual,
      differenceKg: diff,
      reason: opnameReason,
      operator: operatorName,
    };

    onStockOpname(newOpname);
    setActualPhysicalKg('');
    alert(
      `Stock Opname berhasil diperbarui!\nStok sistem disesuaikan menjadi ${actual.toFixed(
        1
      )} Kg (Selisih: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)} Kg).`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium mb-1">
              <span>Manajemen Produksi & Persediaan Fisik</span>
              <span aria-hidden="true">·</span>
              <span>Kandang & Gudang Telur</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
              Penerimaan Panen, Kontrol Loss & Stok Fisik
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Stok Fisik Tersedia
              </span>
              <span className="text-xl font-black text-blue-900 font-mono">
                {currentStockKg.toFixed(1)} Kg
              </span>
              <span className="block text-[10px] text-blue-600 font-mono">
                ~{Math.round(currentStockKg * config.kgToButirRatio)} Butir
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Tabs: Input Panen | Catat Loss | Stock Opname */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => setActiveWarehouseTab('PANEN')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeWarehouseTab === 'PANEN'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Plus className="h-4 w-4" /> Catat Telur Masuk (Panen)
          </button>
          <button
            type="button"
            onClick={() => setActiveWarehouseTab('LOSS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeWarehouseTab === 'LOSS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <AlertOctagon className="h-4 w-4" /> Catat Telur Rusak / Pecah
          </button>
          <button
            type="button"
            onClick={() => setActiveWarehouseTab('OPNAME')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeWarehouseTab === 'OPNAME'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Scale className="h-4 w-4" /> Stock Opname Fisik
          </button>
        </div>
      </div>

      {/* CONDITIONAL SUB-PANELS */}
      {activeWarehouseTab === 'PANEN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Harvest Form (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Egg className="h-4 w-4 text-amber-600" /> Formulir Timbangan Telur Panen Masuk
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                Populasi: {formatNumber(config.populasiAyam, 0)} Ekor
              </span>
            </h2>

            <form onSubmit={handleHarvestSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Tanggal Panen
                  </label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Waktu / Shift Panen
                  </label>
                  <select
                    value={harvestTime}
                    onChange={(e) =>
                      setHarvestTime(e.target.value as 'Pagi' | 'Sore' | 'Siang')
                    }
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs bg-white"
                  >
                    <option value="Pagi">Pagi (Panen Utama)</option>
                    <option value="Sore">Sore</option>
                    <option value="Siang">Siang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Sumber Kandang / Flock
                  </label>
                  <input
                    type="text"
                    value={flockName}
                    onChange={(e) => setFlockName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Timbangan Kotor, Tara, Bersih */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Berat Kotor / Gross (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="Contoh: 154.5"
                    value={weightGross}
                    onChange={(e) => setWeightGross(e.target.value)}
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono font-bold bg-white focus:outline-amber-500"
                  />
                  <span className="text-[10px] text-neutral-400">Total peti + telur</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tara Peti / Krat (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={weightTare}
                    onChange={(e) => setWeightTare(e.target.value)}
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono font-bold bg-white focus:outline-amber-500"
                  />
                  <span className="text-[10px] text-neutral-400">Berat wadah kosong</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Berat Bersih / Netto (Kg)
                  </label>
                  <div className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-mono font-extrabold bg-neutral-100 text-neutral-900">
                    {netWeightKg.toFixed(1)} Kg
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ~{estimatedButir} butir telur
                  </span>
                </div>
              </div>

              {/* Quality & Shell */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Telur Pecah/Retak di Kandang
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={brokenCount}
                    onChange={(e) => setBrokenCount(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-mono"
                  />
                  <span className="text-[10px] text-rose-500">Jumlah butir reject</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Kualitas Kulit / Cangkang
                  </label>
                  <select
                    value={shellQuality}
                    onChange={(e) =>
                      setShellQuality(e.target.value as 'Sangat Bagus' | 'Normal' | 'Kulit Tipis')
                    }
                    className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs bg-white"
                  >
                    <option value="Sangat Bagus">Sangat Bagus / Tebal</option>
                    <option value="Normal">Normal</option>
                    <option value="Kulit Tipis">Kulit Tipis (Perlu Kalsium)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Petugas / Anak Kandang
                  </label>
                  <input
                    type="text"
                    value={collectorName}
                    onChange={(e) => setCollectorName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Catatan Panen (Pakan, Suhu, Kondisi Ayam)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Batch pakan baru, konsumsi air normal"
                  value={harvestNotes}
                  onChange={(e) => setHarvestNotes(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-1.5 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={netWeightKg <= 0}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold text-white transition shadow-xs ${
                  netWeightKg <= 0
                    ? 'bg-neutral-300 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Plus className="h-4 w-4" /> Masukkan ke Stok Gudang
              </button>
            </form>
          </div>

          {/* Hen-Day Live Diagnostic Card (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" /> Analisa Produktivitas (Hen-Day Rate)
            </h3>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Estimasi Hen-Day Batch Ini
              </span>
              <div className="text-4xl font-black text-amber-900 font-mono">
                {liveHenDayRate.toFixed(1)}%
              </div>
              <p className="text-xs text-amber-700">
                {estimatedButir} butir panen / {config.populasiAyam} ekor ayam
              </p>
            </div>

            <div className="text-xs text-neutral-600 space-y-2 leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-200/80">
              <p className="font-bold text-neutral-800">Standar Hen-Day Peternakan Layer:</p>
              <ul className="list-disc pl-4 space-y-1 text-neutral-600 text-[11px]">
                <li><strong>&gt; 85% :</strong> Sangat Prima (Puncak Produksi / Peak).</li>
                <li><strong>75% - 85% :</strong> Normal / Stabil.</li>
                <li><strong>&lt; 70% :</strong> Perlu evaluasi nutrisi pakan, air minum, atau tanda penyakit kandang.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeWarehouseTab === 'LOSS' && (
        <div className="max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-base font-bold text-rose-700 flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-rose-600" /> Catat Telur Rusak / Pecah (Loss Gudang)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Telur yang pecah, retak saat sortir, atau busuk akan langsung dipotong dari stok siap jual.
            </p>
          </div>

          <form onSubmit={handleLossSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Tanggal Ditemukan
                </label>
                <input
                  type="date"
                  value={lossDate}
                  onChange={(e) => setLossDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Jumlah Telur Rusak (Butir)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Contoh: 12"
                  value={lossButir}
                  onChange={(e) => setLossButir(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-mono font-bold focus:border-rose-500 focus:outline-hidden"
                />
                {lossButir && parseInt(lossButir) > 0 && (
                  <span className="text-[11px] text-rose-600 font-mono mt-1 block">
                    Setara pengurangan: {(parseInt(lossButir) / config.kgToButirRatio).toFixed(2)} Kg
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Penyebab Kerusakan
              </label>
              <select
                value={lossCause}
                onChange={(e) =>
                  setLossCause(
                    e.target.value as 'Handling Gudang' | 'Sortir Telur Bentes' | 'Pecah di Peti' | 'Lainnya'
                  )
                }
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs bg-white"
              >
                <option value="Handling Gudang">Handling Petugas Gudang (Jatuh/Terbentur)</option>
                <option value="Sortir Telur Bentes">Sortiran Cangkang Bentes / Retak Rambut</option>
                <option value="Pecah di Peti">Pecah Saat Transportasi / Dalam Peti</option>
                <option value="Lainnya">Lainnya / Busuk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Keterangan Tambahan
              </label>
              <input
                type="text"
                placeholder="Catatan untuk evaluasi anak kandang / sopir"
                value={lossNotes}
                onChange={(e) => setLossNotes(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-rose-600 py-3 text-xs font-bold text-white hover:bg-rose-700 transition shadow-xs"
            >
              Potong Dari Stok Normal
            </button>
          </form>
        </div>
      )}

      {activeWarehouseTab === 'OPNAME' && (
        <div className="max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Scale className="h-5 w-5 text-neutral-700" /> Penyesuaian Fisik Gudang (Stock Opname)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Gunakan fitur ini saat menimbang seluruh persediaan fisik riil di gudang untuk menyinkronkan data sistem.
            </p>
          </div>

          <form onSubmit={handleOpnameSubmit} className="space-y-4">
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 flex justify-between items-center text-xs">
              <span className="text-neutral-500">Stok Saat Ini Menurut Sistem:</span>
              <span className="text-base font-bold text-neutral-900 font-mono">
                {currentStockKg.toFixed(1)} Kg
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Hasil Timbangan Fisik Riil di Gudang (Kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="Contoh: 1845.0"
                value={actualPhysicalKg}
                onChange={(e) => setActualPhysicalKg(e.target.value)}
                required
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-mono font-bold focus:border-amber-500 focus:outline-hidden"
              />
              {actualPhysicalKg && (
                <div className="mt-2 text-xs font-mono font-bold flex justify-between">
                  <span>Selisih Timbangan:</span>
                  <span
                    className={
                      parseFloat(actualPhysicalKg) - currentStockKg >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }
                  >
                    {parseFloat(actualPhysicalKg) - currentStockKg >= 0 ? '+' : ''}
                    {(parseFloat(actualPhysicalKg) - currentStockKg).toFixed(1)} Kg
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Alasan / Berita Acara Selisih
              </label>
              <input
                type="text"
                value={opnameReason}
                onChange={(e) => setOpnameReason(e.target.value)}
                required
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Nama Petugas Pemeriksa
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                required
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-neutral-900 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition shadow-xs"
            >
              Simpan & Sinkronkan Stok Gudang
            </button>
          </form>
        </div>
      )}

      {/* SECTION 2: HISTORY LOG OF HARVESTS */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-amber-600" /> Riwayat Log Panen & Penerimaan Telur
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            {harvestLogs.length} catatan panen
          </span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-3">Tanggal & Shift</th>
                <th className="py-3 px-3">Kandang</th>
                <th className="py-3 px-3">Berat Bersih</th>
                <th className="py-3 px-3">Estimasi Butir</th>
                <th className="py-3 px-3">Hen-Day %</th>
                <th className="py-3 px-3">Reject/Pecah</th>
                <th className="py-3 px-3">Kualitas Kulit</th>
                <th className="py-3 px-3">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {harvestLogs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50/70 transition">
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-bold text-neutral-800">{formatDateIndo(log.date)}</div>
                    <div className="text-[10px] text-neutral-400 font-medium">{log.timeOfDay}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-neutral-900">
                    {log.flockName}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                    {log.weightNetKg.toFixed(1)} Kg
                  </td>
                  <td className="py-3 px-3 font-mono text-neutral-700">
                    {log.estimatedButir} butir
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                        log.henDayRate >= 85
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.henDayRate >= 70
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.henDayRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-rose-600 font-semibold">
                    {log.brokenCount > 0 ? `${log.brokenCount} btr` : '-'}
                  </td>
                  <td className="py-3 px-3 text-neutral-600">
                    {log.shellQuality}
                  </td>
                  <td className="py-3 px-3 text-neutral-500">
                    {log.collectorName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
