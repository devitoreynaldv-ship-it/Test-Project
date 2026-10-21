import React, { useState } from 'react';
import { FarmConfig, HarvestLog, SaleTransaction, StockMutation } from '../types';
import { formatDateIndo, formatIDR, getTodayString } from '../utils/eggConversions';
import {
  FileText,
  Download,
  Upload,
  Calendar,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Scale,
  DollarSign,
  Database,
  RefreshCw,
} from 'lucide-react';

interface AuditLogViewProps {
  config: FarmConfig;
  mutations: StockMutation[];
  transactions: SaleTransaction[];
  harvestLogs: HarvestLog[];
  onImportAllData: (jsonData: string) => void;
  onResetAllData: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  config,
  mutations,
  transactions,
  harvestLogs,
  onImportAllData,
  onResetAllData,
}) => {
  const today = getTodayString();
  const [filterDate, setFilterDate] = useState<string>(today);
  const [filterType, setFilterType] = useState<string>('ALL');

  // Filtered mutation records
  const filteredMutations = mutations.filter((m) => {
    const matchesDate = filterDate ? m.date === filterDate : true;
    const matchesType = filterType === 'ALL' ? true : m.type === filterType;
    return matchesDate && matchesType;
  });

  // Calculate day financial metrics based on filterDate
  const targetDate = filterDate || today;
  const daySales = transactions.filter((t) => t.date === targetDate);
  const dayHarvests = harvestLogs.filter((h) => h.date === targetDate);

  const dayRevenue = daySales.reduce((acc, t) => acc + t.totalAmount, 0);
  const dayKgSold = daySales.reduce((acc, t) => acc + t.totalKg, 0);
  const dayCOGS = daySales.reduce((acc, t) => acc + t.cogsAmount, 0);
  const dayProfit = dayRevenue - dayCOGS;
  const dayMargin = dayRevenue > 0 ? (dayProfit / dayRevenue) * 100 : 0;
  const dayKgHarvest = dayHarvests.reduce((acc, h) => acc + h.weightNetKg, 0);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Waktu', 'Tipe Mutasi', 'Keterangan', 'Perubahan Kg', 'Perubahan Butir', 'Stok Akhir Kg'];
    const rows = mutations.map((m) => [
      m.timestamp,
      m.type,
      `"${m.description.replace(/"/g, '""')}"`,
      m.kgChange.toFixed(2),
      m.butirChange,
      m.resultingStockKg.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OvoTrack_Mutasi_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Full Database Backup JSON
  const handleExportJSON = () => {
    const dataToExport = {
      config,
      mutations,
      transactions,
      harvestLogs,
      exportDate: new Date().toISOString(),
      version: '2.0',
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `OvoTrack_Backup_${today}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        onImportAllData(content);
        alert('Berhasil memulihkan (restore) seluruh data peternakan dari file backup!');
      } catch (err) {
        alert('Format file JSON tidak sesuai atau rusak.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium mb-1">
            <span>Audit Trail & Buku Kas Harian</span>
            <span aria-hidden="true">·</span>
            <span>Jurnal Transaksi Peternakan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Jurnal Mutasi Harian & Laba Rugi
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition shadow-xs"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition shadow-xs"
          >
            <Database className="h-4 w-4 text-amber-600" /> Backup Data (JSON)
          </button>
          <label className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition shadow-xs cursor-pointer">
            <Upload className="h-4 w-4" /> Restore Data
            <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Daily P&L Analysis for the selected date */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" /> Analisa Laba Rugi Harian: {formatDateIndo(targetDate)}
          </h2>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-mono bg-neutral-50"
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate('')}
                className="text-xs text-amber-600 font-semibold hover:underline"
              >
                Lihat Semua
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Telur Panen Masuk
            </span>
            <p className="text-lg font-black font-mono text-neutral-900 mt-1">
              {dayKgHarvest.toFixed(1)} Kg
            </p>
            <p className="text-[10px] text-neutral-500">{dayHarvests.length} sesi timbangan</p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Telur Terjual Keluar
            </span>
            <p className="text-lg font-black font-mono text-neutral-900 mt-1">
              {dayKgSold.toFixed(1)} Kg
            </p>
            <p className="text-[10px] text-neutral-500">{daySales.length} faktur penjualan</p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Omset Penjualan
            </span>
            <p className="text-lg font-black font-mono text-neutral-900 mt-1">
              {formatIDR(dayRevenue)}
            </p>
            <p className="text-[10px] text-neutral-500">
              Rata-rata: {dayKgSold > 0 ? formatIDR(dayRevenue / dayKgSold) : 'Rp 0'}/Kg
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Modal Pokok (COGS)
            </span>
            <p className="text-lg font-black font-mono text-neutral-700 mt-1">
              {formatIDR(dayCOGS)}
            </p>
            <p className="text-[10px] text-neutral-500">HPP: {formatIDR(config.hppPerKg)}/Kg</p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Laba Bersih Hari Itu
            </span>
            <p className="text-lg font-black font-mono text-emerald-800 mt-1">
              {formatIDR(dayProfit)}
            </p>
            <p className="text-[10px] text-emerald-600 font-bold font-mono">
              Margin: {dayMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Chronological Mutations Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold text-neutral-900">
              Log Riwayat Keluar-Masuk Telur ({filteredMutations.length} entri)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-neutral-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-1 text-xs bg-white text-neutral-700"
            >
              <option value="ALL">Semua Tipe Mutasi</option>
              <option value="PANEN_IN">Panen Masuk (IN)</option>
              <option value="PENJUALAN_OUT">Penjualan (OUT)</option>
              <option value="LOSS_RUSAK">Telur Rusak (LOSS)</option>
              <option value="OPNAME_ADJUST">Stock Opname (ADJUST)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3">Tipe Mutasi</th>
                <th className="py-3 px-3">Keterangan / Referensi</th>
                <th className="py-3 px-3">Perubahan Berat</th>
                <th className="py-3 px-3">Estimasi Butir</th>
                <th className="py-3 px-3 text-right">Sisa Stok Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredMutations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400">
                    Tidak ada mutasi yang tercatat pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredMutations.map((m) => {
                  const isPositive = m.kgChange > 0;
                  const isNegative = m.kgChange < 0;

                  return (
                    <tr key={m.id} className="hover:bg-neutral-50/70 transition">
                      <td className="py-3 px-3 font-mono text-neutral-500 whitespace-nowrap">
                        {m.timestamp}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {m.type === 'PANEN_IN' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            <ArrowDownLeft className="h-3 w-3" /> PANEN IN
                          </span>
                        )}
                        {m.type === 'PENJUALAN_OUT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            <ArrowUpRight className="h-3 w-3" /> JUAL OUT
                          </span>
                        )}
                        {m.type === 'LOSS_RUSAK' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="h-3 w-3" /> RUSAK / LOSS
                          </span>
                        )}
                        {m.type === 'OPNAME_ADJUST' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            <Scale className="h-3 w-3" /> OPNAME
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-neutral-900">
                        {m.description}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-600'
                              : isNegative
                              ? 'text-rose-600'
                              : 'text-neutral-700'
                          }
                        >
                          {isPositive ? '+' : ''}
                          {m.kgChange.toFixed(1)} Kg
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-600 whitespace-nowrap">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-600'
                              : isNegative
                              ? 'text-rose-600'
                              : 'text-neutral-700'
                          }
                        >
                          {isPositive ? '+' : ''}
                          {m.butirChange} butir
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-neutral-900 text-right whitespace-nowrap">
                        {m.resultingStockKg.toFixed(1)} Kg
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Zone: Reset to Demo */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-neutral-900">Reset Data Demo ke Template Awal</h4>
          <p className="text-[11px] text-neutral-500">
            Mengembalikan seluruh data transaksi, mutasi, dan stok ke kondisi awal demonstrasi.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetAllData}
          className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reset Database Demo
        </button>
      </div>
    </div>
  );
};
