
import { tiers } from '../modules/skills.svelte.js';
import { Decimal, type DecimalSource } from './decimal.js';

const POWER_CLASS_THRESHOLDS: number[] = [
  3, 6, 9, 12, 15, 18, 21, 24, 27, 33, 40, 50, 60, 70, 80, 90, 100, 150,
  250, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1e6, 5e6, 1e7, 1e8,
  1e9, 1e10, 1e12, 1e15, 1e20, 1e25, 1e30, 1e40, 1e50, 1e60, 1e70, 1e80,
  1e90, 1e100, 1e110, 1e120, 1e130, 1e150
];

export interface PowerTier {
  name: string;
  class: string;
}

export function getPowerTier(val: DecimalSource | null | undefined): PowerTier {
  if (val === undefined || val === null) return { name: tiers[0], class: 'tier-Fminus' };

  const d = new Decimal(val);
  if (d.lte(0)) return { name: tiers[0], class: 'tier-Fminus' };

  const power = d.log10();
  let tierIndex = tiers.length - 1;
  for (let i = 0; i < POWER_CLASS_THRESHOLDS.length; i++) {
    if (power < POWER_CLASS_THRESHOLDS[i]) {
      tierIndex = i;
      break;
    }
  }

  const tierName = tiers[tierIndex] || tiers[tiers.length - 1];
  const className = 'tier-' + tierName.replace(/\+/g, 'plus').replace(/-/g, 'minus');
  return { name: tierName, class: className };
}

