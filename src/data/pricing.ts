import { EggGrade, UnitType } from '../types';

/** Suggested default selling price per grade & unit (Rp). Single source of truth for POS. */
export const DEFAULT_PRICES: Record<EggGrade, Record<UnitType, number>> = {
  Standard: { KG: 28000, TRAY: 53000, BUTIR: 1800 },
  Omega: { KG: 34000, TRAY: 65000, BUTIR: 2300 },
  Kampung: { KG: 45000, TRAY: 85000, BUTIR: 3000 },
  Bentes: { KG: 19000, TRAY: 36000, BUTIR: 1200 },
};

export function suggestPrice(grade: EggGrade, unit: UnitType): string {
  return String(DEFAULT_PRICES[grade][unit]);
}
