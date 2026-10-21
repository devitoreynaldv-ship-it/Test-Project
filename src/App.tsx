/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FarmConfig,
  HarvestLog,
  LossLog,
  SaleTransaction,
  StockMutation,
  StockOpnameLog,
} from './types';
import {
  INITIAL_CONFIG,
  INITIAL_HARVEST_LOGS,
  INITIAL_MUTATIONS,
  INITIAL_TRANSACTIONS,
} from './data/initialData';
import { getTodayString } from './utils/eggConversions';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { ReceivablesView } from './components/ReceivablesView';
import { WarehouseView } from './components/WarehouseView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsModal } from './components/SettingsModal';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';

const STORAGE_KEY_CONFIG = 'ovotrack_config_v2';
const STORAGE_KEY_TRANSACTIONS = 'ovotrack_transactions_v2';
const STORAGE_KEY_HARVESTS = 'ovotrack_harvests_v2';
const STORAGE_KEY_STOCK = 'ovotrack_stock_kg_v2';
const STORAGE_KEY_LOSS = 'ovotrack_loss_butir_v2';
const STORAGE_KEY_MUTATIONS = 'ovotrack_mutations_v2';

export default function App() {
  // 1. Core States with LocalStorage Initialization
  const [config, setConfig] = useState<FarmConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [harvestLogs, setHarvestLogs] = useState<HarvestLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HARVESTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 20) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_HARVEST_LOGS;
  });

  const [currentStockKg, setCurrentStockKg] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STOCK);
    return saved ? parseFloat(saved) : 1680.0;
  });

  const [totalLossButir, setTotalLossButir] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOSS);
    return saved ? parseInt(saved) : 38;
  });

  const [mutations, setMutations] = useState<StockMutation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MUTATIONS);
    return saved ? JSON.parse(saved) : INITIAL_MUTATIONS;
  });

  // 2. Navigation & UI States
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [receiptTx, setReceiptTx] = useState<SaleTransaction | null>(null);

  // 3. Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HARVESTS, JSON.stringify(harvestLogs));
  }, [harvestLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STOCK, currentStockKg.toString());
  }, [currentStockKg]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOSS, totalLossButir.toString());
  }, [totalLossButir]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MUTATIONS, JSON.stringify(mutations));
  }, [mutations]);

  // Total unpaid orders for header badge
  const unpaidCount = transactions.filter(
    (t) => t.paymentStatus !== 'LUNAS' && t.remainingBalance > 0
  ).length;

  // 4. Action Handlers
  const handleCompleteSale = (newTx: SaleTransaction) => {
    const newStock = Math.max(0, currentStockKg - newTx.totalKg);
    setCurrentStockKg(newStock);

    const now = new Date();
    const timeStr = `${newTx.date} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMutation: StockMutation = {
      id: `mut-${Date.now()}`,
      timestamp: timeStr,
      date: newTx.date,
      type: 'PENJUALAN_OUT',
      referenceId: newTx.invoiceNo,
      description: `Penjualan ${newTx.customerName} (${newTx.totalKg.toFixed(1)} Kg)`,
      kgChange: -newTx.totalKg,
      butirChange: -newTx.totalButir,
      resultingStockKg: newStock,
    };

    setTransactions([newTx, ...transactions]);
    setMutations([newMutation, ...mutations]);
  };

  const handleUpdateTransaction = (updatedTx: SaleTransaction) => {
    setTransactions(transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
  };

  const handleAddHarvest = (newHarvest: HarvestLog) => {
    const newStock = currentStockKg + newHarvest.weightNetKg;
    setCurrentStockKg(newStock);

    const now = new Date();
    const timeStr = `${newHarvest.date} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMutation: StockMutation = {
      id: `mut-${Date.now()}`,
      timestamp: timeStr,
      date: newHarvest.date,
      type: 'PANEN_IN',
      referenceId: newHarvest.id,
      description: `Panen Masuk: ${newHarvest.flockName} (${newHarvest.weightNetKg.toFixed(1)} Kg)`,
      kgChange: newHarvest.weightNetKg,
      butirChange: newHarvest.estimatedButir,
      resultingStockKg: newStock,
    };

    setHarvestLogs([newHarvest, ...harvestLogs]);
    setMutations([newMutation, ...mutations]);
  };

  const handleRecordLoss = (newLoss: LossLog) => {
    const newStock = Math.max(0, currentStockKg - newLoss.kgEquivalent);
    setCurrentStockKg(newStock);
    setTotalLossButir((prev) => prev + newLoss.brokenButir);

    const now = new Date();
    const timeStr = `${newLoss.date} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMutation: StockMutation = {
      id: `mut-${Date.now()}`,
      timestamp: timeStr,
      date: newLoss.date,
      type: 'LOSS_RUSAK',
      referenceId: newLoss.id,
      description: `Telur Pecah/Loss: ${newLoss.cause} (${newLoss.brokenButir} butir)`,
      kgChange: -newLoss.kgEquivalent,
      butirChange: -newLoss.brokenButir,
      resultingStockKg: newStock,
    };

    setMutations([newMutation, ...mutations]);
  };

  const handleStockOpname = (opname: StockOpnameLog) => {
    setCurrentStockKg(opname.actualKg);

    const now = new Date();
    const timeStr = `${opname.date} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMutation: StockMutation = {
      id: `mut-${Date.now()}`,
      timestamp: timeStr,
      date: opname.date,
      type: 'OPNAME_ADJUST',
      referenceId: opname.id,
      description: `Opname Fisik: ${opname.reason}`,
      kgChange: opname.differenceKg,
      butirChange: Math.round(opname.differenceKg * config.kgToButirRatio),
      resultingStockKg: opname.actualKg,
    };

    setMutations([newMutation, ...mutations]);
  };

  const handleImportAllData = (jsonStr: string) => {
    const data = JSON.parse(jsonStr);
    if (data.config) setConfig(data.config);
    if (data.transactions) setTransactions(data.transactions);
    if (data.harvestLogs) setHarvestLogs(data.harvestLogs);
    if (data.mutations) setMutations(data.mutations);
    if (data.currentStockKg !== undefined) setCurrentStockKg(data.currentStockKg);
  };

  const handleResetAllData = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan semua data ke template contoh awal?')) {
      localStorage.clear();
      setConfig(INITIAL_CONFIG);
      setTransactions(INITIAL_TRANSACTIONS);
      setHarvestLogs(INITIAL_HARVEST_LOGS);
      setMutations(INITIAL_MUTATIONS);
      setCurrentStockKg(1680.0);
      setTotalLossButir(38);
      setCurrentTab('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans">
      {/* 3-Zone Top Bar Contract */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        unpaidCount={unpaidCount}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            config={config}
            onUpdateConfig={setConfig}
            transactions={transactions}
            harvestLogs={harvestLogs}
            currentStockKg={currentStockKg}
            totalLossButir={totalLossButir}
            onNavigate={setCurrentTab}
            onOpenReceipt={setReceiptTx}
          />
        )}

        {currentTab === 'pos' && (
          <PosView
            config={config}
            currentStockKg={currentStockKg}
            transactions={transactions}
            onCompleteSale={handleCompleteSale}
            onOpenReceipt={setReceiptTx}
          />
        )}

        {currentTab === 'piutang' && (
          <ReceivablesView
            config={config}
            transactions={transactions}
            onUpdateTransaction={handleUpdateTransaction}
            onOpenReceipt={setReceiptTx}
          />
        )}

        {currentTab === 'warehouse' && (
          <WarehouseView
            config={config}
            currentStockKg={currentStockKg}
            totalLossButir={totalLossButir}
            harvestLogs={harvestLogs}
            onAddHarvest={handleAddHarvest}
            onRecordLoss={handleRecordLoss}
            onStockOpname={handleStockOpname}
          />
        )}

        {currentTab === 'mutasi' && (
          <AuditLogView
            config={config}
            mutations={mutations}
            transactions={transactions}
            harvestLogs={harvestLogs}
            onImportAllData={handleImportAllData}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 bg-white py-4 text-center text-xs text-neutral-400">
        <p>
          {config.farmName} · Sistem Manajemen Inventori & Finansial Perteluran © 2026
        </p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={setConfig}
      />

      {/* Thermal Receipt & WhatsApp Modal */}
      <ThermalReceiptModal
        isOpen={Boolean(receiptTx)}
        onClose={() => setReceiptTx(null)}
        transaction={receiptTx}
        config={config}
      />
    </div>
  );
}
