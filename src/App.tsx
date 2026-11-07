/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { SaleTransaction } from './types';
import { useOvoStore } from './hooks/useOvoStore';
import { Header, TabId } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { OfflineBadge } from './components/OfflineBadge';

// Each screen is code-split so the cashier loads fast on slow farm connections
// (charts library only downloads when the dashboard is opened).
const loaders = {
  dashboard: () => import('./components/DashboardView').then((m) => ({ default: m.DashboardView })),
  pos: () => import('./components/PosView').then((m) => ({ default: m.PosView })),
  piutang: () => import('./components/ReceivablesView').then((m) => ({ default: m.ReceivablesView })),
  pelanggan: () => import('./components/CustomerInsightsView').then((m) => ({ default: m.CustomerInsightsView })),
  warehouse: () => import('./components/WarehouseView').then((m) => ({ default: m.WarehouseView })),
  mutasi: () => import('./components/AuditLogView').then((m) => ({ default: m.AuditLogView })),
};
const DashboardView = lazy(loaders.dashboard);
const PosView = lazy(loaders.pos);
const ReceivablesView = lazy(loaders.piutang);
const CustomerInsightsView = lazy(loaders.pelanggan);
const WarehouseView = lazy(loaders.warehouse);
const AuditLogView = lazy(loaders.mutasi);

function ViewFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-neutral-400">
      <span className="h-4 w-4 mr-2 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      Memuat halaman…
    </div>
  );
}

export default function App() {
  const store = useOvoStore();
  const { config, transactions } = store;

  const [currentTab, setCurrentTab] = useState<TabId>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<SaleTransaction | null>(null);

  // Once the first screen is up, quietly download the others so every menu
  // still opens when the connection drops (the service worker caches them).
  useEffect(() => {
    const id = window.setTimeout(() => Object.values(loaders).forEach((load) => load().catch(() => {})), 2500);
    return () => window.clearTimeout(id);
  }, []);

  const unpaidCount = transactions.filter((t) => t.paymentStatus !== 'LUNAS' && t.remainingBalance > 0).length;
  const navigate = (tab: string) => setCurrentTab(tab as TabId);

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans">
      <Header
        currentTab={currentTab}
        onSelectTab={navigate}
        unpaidCount={unpaidCount}
        config={config}
        onUpdateConfig={store.setConfig}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Suspense fallback={<ViewFallback />}>
          {currentTab === 'dashboard' && (
            <DashboardView
              config={config}
              onUpdateConfig={store.setConfig}
              transactions={transactions}
              harvestLogs={store.harvestLogs}
              currentStockKg={store.currentStockKg}
              totalLossButir={store.totalLossButir}
              onNavigate={navigate}
              onOpenReceipt={setReceiptTx}
            />
          )}

          {currentTab === 'pos' && (
            <PosView
              config={config}
              currentStockKg={store.currentStockKg}
              transactions={transactions}
              masterCustomers={store.masterCustomers}
              onCompleteSale={store.completeSale}
              onOpenReceipt={setReceiptTx}
            />
          )}

          {currentTab === 'piutang' && (
            <ReceivablesView
              config={config}
              transactions={transactions}
              onUpdateTransaction={store.updateTransaction}
              onOpenReceipt={setReceiptTx}
            />
          )}

          {currentTab === 'pelanggan' && <CustomerInsightsView config={config} transactions={transactions} />}

          {currentTab === 'warehouse' && (
            <WarehouseView
              config={config}
              currentStockKg={store.currentStockKg}
              totalLossButir={store.totalLossButir}
              harvestLogs={store.harvestLogs}
              onAddHarvest={store.addHarvest}
              onRecordLoss={store.recordLoss}
              onStockOpname={store.stockOpname}
            />
          )}

          {currentTab === 'mutasi' && (
            <AuditLogView
              config={config}
              mutations={store.mutations}
              transactions={transactions}
              harvestLogs={store.harvestLogs}
              onImportAllData={store.importAllData}
              onResetAllData={() => {
                if (store.resetAllData()) setCurrentTab('dashboard');
              }}
            />
          )}
        </Suspense>
      </main>

      <footer className="border-t border-neutral-200/80 bg-white py-4 text-center text-xs text-neutral-400">
        <p>{config.farmName} · Sistem Manajemen Inventori & Finansial Perteluran © 2026</p>
      </footer>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={store.setConfig}
        masterCustomers={store.masterCustomers}
        onSaveCustomers={store.setMasterCustomers}
        onResetPartition={store.resetPartition}
      />

      <ThermalReceiptModal
        isOpen={Boolean(receiptTx)}
        onClose={() => setReceiptTx(null)}
        transaction={receiptTx}
        config={config}
      />

      <OfflineBadge />
    </div>
  );
}
