import { tiers } from '../modules/skills.svelte.js';
import { Decimal } from './decimal.js';

const POWER_CLASS_THRESHOLDS = [
  3,     // F-
  6,     // F
  9,     // F+
  12,    // E-
  15,    // E
  18,    // E+
  21,    // D-
  24,    // D
  27,    // D+
  33,    // C-
  40,    // C
  50,    // C+
  60,    // B-
  70,    // B
  80,    // B+
  90,    // A-
  100,   // A
  150,   // A+
  250,   // S-
  500,   // S
  1000,  // S+
  5000,  // SS-
  10000, // SS
  50000, // SS+
  100000,// SSS-
  500000,// SSS
  1e6,   // SSS+
  5e6,   // SSR
  1e7,   // SSR+
  1e8,   // UR
  1e9,   // UR+
  1e10,  // URR
  1e12,  // EX
  1e15,  // Transcendent
  1e20,  // Ethereal
  1e25,  // Cosmic
  1e30,  // Omni
  1e40,  // Singularity
  1e50,  // Continuum
  1e60,  // Paradox
  1e70,  // Reality
  1e80,  // Chronos
  1e90,  // Eternal
  1e100, // Absolute
  1e110, // Omega
  1e120, // Zenith
  1e130, // Apotheosis
  1e150  // Infinite
];

export function getPowerTier(val) {
  if (val === undefined || val === null) return { name: tiers[0], class: 'tier-Fminus' };
  
  const d = new Decimal(val);
  if (d.lte(0)) return { name: tiers[0], class: 'tier-Fminus' };

  let tierIndex = 0;
  for (let i = 0; i < POWER_CLASS_THRESHOLDS.length; i++) {
    if (d.e < POWER_CLASS_THRESHOLDS[i]) {
      tierIndex = i;
      break;
    }
    if (i === POWER_CLASS_THRESHOLDS.length - 1) {
      tierIndex = tiers.length - 1; // Infinite
    }
  }

  const tierName = tiers[tierIndex];
  const className = 'tier-' + tierName.replace(/\+/g, 'plus').replace(/-/g, 'minus');

  return { name: tierName, class: className };
}
