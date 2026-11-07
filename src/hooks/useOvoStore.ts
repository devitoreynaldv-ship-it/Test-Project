import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CustomerMaster,
  FarmConfig,
  HarvestLog,
  LossLog,
  MutationType,
  SaleTransaction,
  StockMutation,
  StockOpnameLog,
} from '../types';
import {
  DEFAULT_MASTER_CUSTOMERS,
  STORAGE_KEYS,
  clearAllOvoStorage,
  clearSpecificStoragePartition,
  loadFarmConfig,
  loadHarvestLogs,
  loadMasterCustomers,
  loadMutations,
  loadSalesTransactions,
  loadStockKg,
  loadTotalLossButir,
  saveFarmConfig,
  saveHarvestLogs,
  saveMasterCustomers,
  saveMutations,
  saveSalesTransactions,
  saveStockKg,
  saveTotalLossButir,
} from '../utils/storage';
import {
  INITIAL_CONFIG,
  INITIAL_HARVEST_LOGS,
  INITIAL_LOSS_BUTIR,
  INITIAL_MUTATIONS,
  INITIAL_STOCK_KG,
  INITIAL_TRANSACTIONS,
} from '../data/initialData';
import { stampFor, uid } from '../utils/id';

/** Persist a piece of state to its own storage partition whenever it changes. */
function usePersisted<T>(load: () => T, save: (value: T) => void) {
  const [value, setValue] = useState<T>(load);
  useEffect(() => save(value), [value, save]);
  return [value, setValue] as const;
}

/**
 * Single source of truth for all OvoTrack data + domain actions.
 * Every stock-changing action goes through `applyStockChange`, so the stock
 * balance and the audit-trail mutation ledger can never drift apart.
 */
export function useOvoStore() {
  const [config, setConfig] = usePersisted(loadFarmConfig, saveFarmConfig);
  const [masterCustomers, setMasterCustomers] = usePersisted(loadMasterCustomers, saveMasterCustomers);
  const [transactions, setTransactions] = usePersisted(loadSalesTransactions, saveSalesTransactions);
  const [harvestLogs, setHarvestLogs] = usePersisted(loadHarvestLogs, saveHarvestLogs);
  const [currentStockKg, setCurrentStockKg] = usePersisted(loadStockKg, saveStockKg);
  const [totalLossButir, setTotalLossButir] = usePersisted(loadTotalLossButir, saveTotalLossButir);
  const [mutations, setMutations] = usePersisted(loadMutations, saveMutations);

  const stockRef = useRef(currentStockKg);
  useEffect(() => {
    stockRef.current = currentStockKg;
  }, [currentStockKg]);

  const applyStockChange = useCallback(
    (params: {
      date: string;
      type: MutationType;
      referenceId: string;
      description: string;
      /** Either a delta (kgChange) or an absolute new balance (setStockKg). */
      kgChange?: number;
      setStockKg?: number;
      butirChange: number;
    }) => {
      // Read the latest balance from a ref (not a state updater) so the
      // ledger write stays a pure, single side effect even under StrictMode.
      const prevStock = stockRef.current;
      const newStock =
        params.setStockKg !== undefined
          ? params.setStockKg
          : Math.max(0, prevStock + (params.kgChange ?? 0));
      stockRef.current = newStock;

      const mutation: StockMutation = {
        id: uid('mut'),
        timestamp: stampFor(params.date),
        date: params.date,
        type: params.type,
        referenceId: params.referenceId,
        description: params.description,
        kgChange: params.setStockKg !== undefined ? newStock - prevStock : params.kgChange ?? 0,
        butirChange: params.butirChange,
        resultingStockKg: newStock,
      };
      setCurrentStockKg(newStock);
      setMutations((prev) => [mutation, ...prev]);
    },
    [setCurrentStockKg, setMutations]
  );

  const completeSale = useCallback(
    (tx: SaleTransaction) => {
      setTransactions((prev) => [tx, ...prev]);
      applyStockChange({
        date: tx.date,
        type: 'PENJUALAN_OUT',
        referenceId: tx.invoiceNo,
        description: `Penjualan ${tx.customerName} (${tx.totalKg.toFixed(1)} Kg)`,
        kgChange: -tx.totalKg,
        butirChange: -tx.totalButir,
      });
    },
    [setTransactions, applyStockChange]
  );

  const updateTransaction = useCallback(
    (updated: SaleTransaction) =>
      setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t))),
    [setTransactions]
  );

  const addHarvest = useCallback(
    (h: HarvestLog) => {
      setHarvestLogs((prev) => [h, ...prev]);
      applyStockChange({
        date: h.date,
        type: 'PANEN_IN',
        referenceId: h.id,
        description: `Panen Masuk: ${h.flockName} (${h.weightNetKg.toFixed(1)} Kg)`,
        kgChange: h.weightNetKg,
        butirChange: h.estimatedButir,
      });
    },
    [setHarvestLogs, applyStockChange]
  );

  const recordLoss = useCallback(
    (loss: LossLog) => {
      setTotalLossButir((prev) => prev + loss.brokenButir);
      applyStockChange({
        date: loss.date,
        type: 'LOSS_RUSAK',
        referenceId: loss.id,
        description: `Telur Pecah/Loss: ${loss.cause} (${loss.brokenButir} butir)`,
        kgChange: -loss.kgEquivalent,
        butirChange: -loss.brokenButir,
      });
    },
    [setTotalLossButir, applyStockChange]
  );

  const stockOpname = useCallback(
    (opname: StockOpnameLog) => {
      applyStockChange({
        date: opname.date,
        type: 'OPNAME_ADJUST',
        referenceId: opname.id,
        description: `Opname Fisik: ${opname.reason}`,
        setStockKg: opname.actualKg,
        butirChange: Math.round(opname.differenceKg * config.kgToButirRatio),
      });
    },
    [applyStockChange, config.kgToButirRatio]
  );

  const importAllData = useCallback(
    (jsonStr: string) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(jsonStr);
      } catch {
        alert('Format file JSON tidak sesuai.');
        return;
      }
      if (!data || typeof data !== 'object') {
        alert('Isi file backup tidak dikenali.');
        return;
      }
      const isArr = Array.isArray;
      if (data.config && typeof data.config === 'object')
        setConfig({ ...INITIAL_CONFIG, ...(data.config as FarmConfig) });
      if (isArr(data.masterCustomers)) setMasterCustomers(data.masterCustomers as CustomerMaster[]);
      if (isArr(data.transactions)) setTransactions(data.transactions as SaleTransaction[]);
      if (isArr(data.harvestLogs)) setHarvestLogs(data.harvestLogs as HarvestLog[]);
      if (isArr(data.mutations)) setMutations(data.mutations as StockMutation[]);
      if (typeof data.currentStockKg === 'number') setCurrentStockKg(data.currentStockKg);
      if (typeof data.totalLossButir === 'number') setTotalLossButir(data.totalLossButir);
    },
    [setConfig, setMasterCustomers, setTransactions, setHarvestLogs, setMutations, setCurrentStockKg, setTotalLossButir]
  );

  const resetPartition = useCallback(
    (partitionKey: string) => {
      clearSpecificStoragePartition(partitionKey);
      switch (partitionKey) {
        case STORAGE_KEYS.CUSTOMERS:
          setMasterCustomers(DEFAULT_MASTER_CUSTOMERS);
          break;
        case STORAGE_KEYS.TRANSACTIONS:
          setTransactions(INITIAL_TRANSACTIONS);
          break;
        case STORAGE_KEYS.HARVESTS:
          setHarvestLogs(INITIAL_HARVEST_LOGS);
          break;
        case STORAGE_KEYS.STOCK:
          setCurrentStockKg(INITIAL_STOCK_KG);
          break;
        case STORAGE_KEYS.LOSS:
          setTotalLossButir(INITIAL_LOSS_BUTIR);
          break;
        case STORAGE_KEYS.MUTATIONS:
          setMutations(INITIAL_MUTATIONS);
          break;
        case STORAGE_KEYS.FARM_PROFILE:
          setConfig(INITIAL_CONFIG);
          break;
      }
      alert(`Partisi "${partitionKey}" telah direset ke bawaan. Data lainnya tetap aman!`);
    },
    [setMasterCustomers, setTransactions, setHarvestLogs, setCurrentStockKg, setTotalLossButir, setMutations, setConfig]
  );

  /** Returns true if the user confirmed and data was reset. */
  const resetAllData = useCallback((): boolean => {
    if (!confirm('Apakah Anda yakin ingin mengembalikan semua data ke template contoh awal?')) return false;
    clearAllOvoStorage();
    setConfig(INITIAL_CONFIG);
    setMasterCustomers(DEFAULT_MASTER_CUSTOMERS);
    setTransactions(INITIAL_TRANSACTIONS);
    setHarvestLogs(INITIAL_HARVEST_LOGS);
    setMutations(INITIAL_MUTATIONS);
    setCurrentStockKg(INITIAL_STOCK_KG);
    setTotalLossButir(INITIAL_LOSS_BUTIR);
    return true;
  }, [setConfig, setMasterCustomers, setTransactions, setHarvestLogs, setMutations, setCurrentStockKg, setTotalLossButir]);

  return {
    // data
    config,
    masterCustomers,
    transactions,
    harvestLogs,
    currentStockKg,
    totalLossButir,
    mutations,
    // setters used directly by settings screens
    setConfig: setConfig as (c: FarmConfig) => void,
    setMasterCustomers: setMasterCustomers as (c: CustomerMaster[]) => void,
    // domain actions
    completeSale,
    updateTransaction,
    addHarvest,
    recordLoss,
    stockOpname,
    importAllData,
    resetPartition,
    resetAllData,
  };
}

export type OvoStore = ReturnType<typeof useOvoStore>;
