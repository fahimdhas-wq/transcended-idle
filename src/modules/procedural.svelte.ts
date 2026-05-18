
import { Decimal } from '../systems/decimal.js';
import { getAscensionTier } from '../data/ascensionUpgrades.js';
import { ascensionState } from './ascension.svelte.js';
import { character } from './character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import type { Enemy } from '../systems/aiSystem.js';
import type { MobType } from '../data/mobs.js';

// ============================================================
// Procedural Name Generation
// ============================================================

const PREFIXES = [
  'Corrupted', 'Ancient', 'Void', 'Crimson', 'Fractured',
  'Radiant', 'Shadow', 'Cyber', 'Chaos', 'Phase',
  'Flux', 'Primal', 'Nexus', 'Omega', 'Proto',
];

const SUFFIXES = [
  'Reaver', 'Phantom', 'Stalker', 'Marauder', 'Wraith',
  'Colossus', 'Sentinel', 'Predator', 'Tyrant', 'Seeker',
  'Harbinger', 'Overlord', 'Devourer', 'Apex', 'Paragon',
];

const RESOURCE_PREFIXES = [
  'Void', 'Crystal', 'Chrono', 'Neutron', 'Quantum',
  'Phase', 'Flux', 'Solar', 'Dark', 'Primal',
];

const RESOURCE_SUFFIXES = [
  'Crystal', 'Ore', 'Shard', 'Node', 'Vein',
  'Cluster', 'Deposit', 'Geode', 'Core', 'Matrix',
];

let seed = 0;

function seededRandom(): number {
  seed = (seed * 16807 + 1) % 2147483647;
  return seed / 2147483647;
}

export function generateProceduralName(prefixes: string[], suffixes: string[]): string {
  seed = Math.floor(Date.now() + Math.random() * 10000) % 2147483647;
  const p = prefixes[Math.floor(seededRandom() * prefixes.length)];
  const s = suffixes[Math.floor(seededRandom() * suffixes.length)];
  return `${p} ${s}`;
}

export function generateResourceName(): string {
  seed = Math.floor(Date.now() + Math.random() * 10000) % 2147483647;
  const p = RESOURCE_PREFIXES[Math.floor(seededRandom() * RESOURCE_PREFIXES.length)];
  const s = RESOURCE_SUFFIXES[Math.floor(seededRandom() * RESOURCE_SUFFIXES.length)];
  return `${p} ${s}`;
}

// ============================================================
// Procedural Enemy Generation
// ============================================================

export function generateProceduralEnemy(playerLevel: Decimal): Enemy | null {
  const tier = getAscensionTier(ascensionState.lifetimeShards);
  if (tier < 1) return null;

  seed = Math.floor(Date.now() + Math.random() * 10000) % 2147483647;

  const name = generateProceduralName(PREFIXES, SUFFIXES);
  const types: MobType[] = ['organic', 'robotic', 'spectral'];
  const type = types[Math.floor(seededRandom() * types.length)];

  const variation = 0.8 + seededRandom() * 0.4;
  const lvl = playerLevel;
  const growth = new Decimal(1.15).pow(lvl.sub(1).max(0));

  const hpBase = new Decimal(50).mul(growth).mul(variation);
  const atkBase = new Decimal(5).mul(growth).mul(variation);

  return {
    id: `proc_${name.toLowerCase().replace(/\s+/g, '_')}`,
    name,
    type,
    maxHp: hpBase,
    hp: hpBase,
    attack: atkBase,
    level: lvl,
  };
}

// ============================================================
// Procedural Resource Yield
// ============================================================

export function getProceduralYieldBonus(resourceName: string): number {
  const hash = resourceName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return 0.5 + (hash % 100) / 100;
}

export function getProceduralRarity(resourceName: string): number {
  const hash = resourceName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (hash % 10) + 1;
}

// ============================================================
// Procedural System State
// ============================================================

export interface ProceduralState {
  unlocked: boolean;
  totalProceduralKills: number;
  discoveredResources: string[];
}

export const proceduralState: ProceduralState = $state({
  unlocked: false,
  totalProceduralKills: 0,
  discoveredResources: [],
});

export function recordProceduralKill(): void {
  proceduralState.totalProceduralKills++;
}
