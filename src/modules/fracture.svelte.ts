
import { Decimal } from '../systems/decimal.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { getEffectiveCombatStats } from './combat.svelte.js';
import { getAscensionTier } from '../data/ascensionUpgrades.js';
import { ascensionState } from './ascension.svelte.js';
import {
  THEMES, MODIFIERS, SHOP_ITEMS,
  BASE_FLOORS, FLOORS_PER_TIER, BASE_CURRENCY_PER_FLOOR,
  ENEMY_SCALE_PER_FLOOR, BASE_ENEMY_HP, BASE_ENEMY_ATK, BASE_ENEMY_DEF,
  ENEMY_NAMES, getShopCost,
  type FractureTheme, type FractureModifier, type FractureShopItem,
} from '../data/fractureData.js';

export interface FractureFloor {
  floor: number;
  theme: FractureTheme;
  modifiers: FractureModifier[];
  enemyName: string;
  enemyHp: number;
  enemyAtk: number;
  enemyDef: number;
}

export interface FractureDungeon {
  floors: FractureFloor[];
  totalFloors: number;
  currentFloor: number;
  completed: boolean;
  failed: boolean;
}

export interface FractureState {
  unlocked: boolean;
  currency: number;
  lifetimeCurrency: number;
  shopLevels: Record<string, number>;
  dungeon: FractureDungeon | null;
  highestFloor: number;
  totalRuns: number;
  totalFloorsCleared: number;
}

export const fractureState: FractureState = $state({
  unlocked: false,
  currency: 0,
  lifetimeCurrency: 0,
  shopLevels: {},
  dungeon: null,
  highestFloor: 0,
  totalRuns: 0,
  totalFloorsCleared: 0,
});

export function isFractureUnlocked(): boolean {
  return getAscensionTier(ascensionState.lifetimeShards) >= 1;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickNRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

export function generateDungeon(): void {
  const tier = getAscensionTier(ascensionState.lifetimeShards);
  const deepStart = fractureState.shopLevels['deepStart'] || 0;
  const startFloor = deepStart * 3;
  const totalFloors = BASE_FLOORS + tier * FLOORS_PER_TIER;
  const floors: FractureFloor[] = [];

  for (let i = startFloor; i < totalFloors; i++) {
    const theme = pickRandom(THEMES);
    const modCount = (i + 1) % 5 === 0 ? 2 : 1;
    const modifiers = pickNRandom(MODIFIERS, modCount);

    const floorMult = 1 + i * ENEMY_SCALE_PER_FLOOR;
    const themeHp = theme.enemyHpMult;
    const modHp = modifiers.reduce((a, m) => a * m.enemyHpMult, 1);
    const themeAtk = theme.enemyAtkMult;
    const modAtk = modifiers.reduce((a, m) => a * m.enemyAtkMult, 1);
    const themeDef = theme.enemyDefMult;
    const modDef = modifiers.reduce((a, m) => a * m.enemyDefMult, 1);

    const names = ENEMY_NAMES[theme.id] || ENEMY_NAMES.data;
    const enemyName = names[i % names.length];

    floors.push({
      floor: i + 1,
      theme,
      modifiers,
      enemyName,
      enemyHp: Math.floor(BASE_ENEMY_HP * floorMult * themeHp * modHp),
      enemyAtk: Math.floor(BASE_ENEMY_ATK * floorMult * themeAtk * modAtk),
      enemyDef: Math.floor(BASE_ENEMY_DEF * floorMult * themeDef * modDef),
    });
  }

  fractureState.dungeon = {
    floors,
    totalFloors: floors.length,
    currentFloor: 0,
    completed: false,
    failed: false,
  };
  fractureState.totalRuns++;
  addLog(`[FRACTURE] Dungeon generated: ${floors.length} floors`, 'system');
}

export function getFractureHpMult(): number {
  return 1 + ((fractureState.shopLevels['fractureHp'] || 0) * 0.05);
}

export function getFractureAtkMult(): number {
  return 1 + ((fractureState.shopLevels['fractureAtk'] || 0) * 0.05);
}

export function getCurrencyMult(): number {
  let mult = 1;
  mult *= 1 + ((fractureState.shopLevels['currencyGain'] || 0) * 0.10);
  mult *= 1 + ((fractureState.shopLevels['rewardMult'] || 0) * 0.10);
  return mult;
}

export function fightFloor(): { won: boolean; currencyEarned: number; floor: number } {
  const dungeon = fractureState.dungeon;
  if (!dungeon || dungeon.completed || dungeon.failed) {
    return { won: false, currencyEarned: 0, floor: 0 };
  }

  const floor = dungeon.floors[dungeon.currentFloor];
  if (!floor) {
    dungeon.completed = true;
    addLog(`[FRACTURE] Dungeon completed!`, 'awakening');
    return { won: false, currencyEarned: 0, floor: 0 };
  }

  const stats = getEffectiveCombatStats();
  const hpMult = getFractureHpMult();
  const atkMult = getFractureAtkMult();

  const playerDps = stats.atk.mul(atkMult).toNumber();
  const playerHp = stats.hp.mul(hpMult).toNumber();
  const playerRegen = stats.regenHp.toNumber();

  const effEnemyDef = Math.max(0, floor.enemyDef - (playerDps * 0.01));

  const ticksToKill = floor.enemyHp / Math.max(1, playerDps - effEnemyDef);
  const ticksToDie = playerHp / Math.max(1, floor.enemyAtk - playerRegen);

  const won = ticksToKill <= ticksToDie;

  if (won) {
    const rewardMult = floor.modifiers.reduce((a, m) => a * m.rewardMult, 1);
    const baseCurrency = Math.floor(BASE_CURRENCY_PER_FLOOR * (floor.floor) * rewardMult * getCurrencyMult());
    const healPct = (fractureState.shopLevels['floorHeal'] || 0) * 0.05;
    const healAmt = Math.floor(playerHp * healPct);

    fractureState.currency += baseCurrency;
    fractureState.lifetimeCurrency += baseCurrency;
    fractureState.totalFloorsCleared++;

    if (floor.floor > fractureState.highestFloor) {
      fractureState.highestFloor = floor.floor;
    }

    dungeon.currentFloor++;

    if (dungeon.currentFloor >= dungeon.totalFloors) {
      dungeon.completed = true;
      addLog(`[FRACTURE] Dungeon completed! Cleared all ${dungeon.totalFloors} floors.`, 'awakening');
    }

    return { won: true, currencyEarned: baseCurrency, floor: floor.floor };
  } else {
    dungeon.failed = true;
    addLog(`[FRACTURE] Failed on floor ${floor.floor}`, 'system');
    return { won: false, currencyEarned: 0, floor: floor.floor };
  }
}

export function getShopLevel(id: string): number {
  return fractureState.shopLevels[id] || 0;
}

export function getShopCostFor(item: FractureShopItem): number {
  return getShopCost(item, getShopLevel(item.id));
}

export function canBuyShopItem(item: FractureShopItem): boolean {
  return getShopLevel(item.id) < item.maxLevel && fractureState.currency >= getShopCostFor(item);
}

export function buyShopItem(item: FractureShopItem, count: number = 1): number {
  let bought = 0;
  for (let i = 0; i < count; i++) {
    if (getShopLevel(item.id) >= item.maxLevel) break;
    const cost = getShopCostFor(item);
    if (fractureState.currency < cost) break;
    fractureState.currency -= cost;
    fractureState.shopLevels[item.id] = (fractureState.shopLevels[item.id] || 0) + 1;
    bought++;
  }
  return bought;
}

export function getRewardMult(): number {
  return 1 + ((fractureState.shopLevels['rewardMult'] || 0) * 0.10);
}
