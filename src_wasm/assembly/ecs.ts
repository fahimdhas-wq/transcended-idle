// ============================================================
// ECS — Entity Component System
// Sparse Set + Structure-of-Arrays layout
// Zero allocations, zero GC, cache-friendly
// ============================================================

// ----- Pool sizes -----
const MAX_UPGRADES: i32 = 512;
const MAX_RESOURCES: i32 = 256;
const MAX_ENEMIES: i32 = 128;

// ---- Player state (flat memory layout, 1MB WASM memory) ----
const OFF_GOLD: i32 = 0;        // f64
const OFF_XP: i32 = 8;          // f64
const OFF_LEVEL: i32 = 16;     // i32
const OFF_KILLS: i32 = 24;     // i64
const OFF_MOMENTUM: i32 = 32;  // f64
const OFF_OVERCHARGE: i32 = 40; // f64
const OFF_SEALS: i32 = 48;     // i32
const OFF_AWAKENING: i32 = 52; // i32
const OFF_ATK: i32 = 64;       // f64
const OFF_DEF: i32 = 72;       // f64
const OFF_HP: i32 = 80;        // f64
const OFF_MAX_HP: i32 = 88;    // f64
const OFF_CRIT: i32 = 96;      // f64
const OFF_ENEMY_HP: i32 = 104; // f64
const OFF_ENEMY_MAX_HP: i32 = 112; // f64
const OFF_ENEMY_ATK: i32 = 120; // f64
const OFF_ENEMY_DEF: i32 = 128; // f64
const OFF_ENEMY_LEVEL: i32 = 136; // i32
const OFF_COMBAT_ACTIVE: i32 = 140; // i32
const OFF_TICK_COUNT: i32 = 144; // i64
const OFF_DIRTY_FLAGS: i32 = 152; // i32[16]

// Upgrade pool starts at 256
const UPGRADE_OFF: i32 = 256;
const UPGRADE_STRIDE: i32 = 32; // level(i32) + cost_base(f64) + cost_gain(f64) + type(i32)
const MAX_UPGRADE_ID: i32 = 512;

// Resource pool
const RESOURCE_OFF: i32 = UPGRADE_OFF + UPGRADE_STRIDE * MAX_UPGRADE_ID;
const RESOURCE_STRIDE: i32 = 24; // amount(f64) + rate(f64)
const MAX_RESOURCE_ID: i32 = 256;

// Dirty flag indices
const DIRTY_GOLD: i32 = 0;
const DIRTY_XP: i32 = 1;
const DIRTY_LEVEL: i32 = 2;
const DIRTY_KILLS: i32 = 3;
const DIRTY_STATS: i32 = 4;
const DIRTY_ENEMY: i32 = 5;
const DIRTY_UPGRADE_BASE: i32 = 8;

// ============================================================
// PLAYER API
// ============================================================

export function ecs_player_getGold(): f64 {
  return f64.load(OFF_GOLD);
}

export function ecs_player_setGold(value: f64): void {
  f64.store(OFF_GOLD, value);
  i32.store(OFF_DIRTY_FLAGS + DIRTY_GOLD * 4, 1);
}

export function ecs_player_addGold(value: f64): void {
  const cur = f64.load(OFF_GOLD);
  f64.store(OFF_GOLD, cur + value);
  i32.store(OFF_DIRTY_FLAGS + DIRTY_GOLD * 4, 1);
}

export function ecs_player_getXP(): f64 {
  return f64.load(OFF_XP);
}

export function ecs_player_setXP(value: f64): void {
  f64.store(OFF_XP, value);
  i32.store(OFF_DIRTY_FLAGS + DIRTY_XP * 4, 1);
}

export function ecs_player_addXP(value: f64): void {
  const cur = f64.load(OFF_XP);
  f64.store(OFF_XP, cur + value);
  i32.store(OFF_DIRTY_FLAGS + DIRTY_XP * 4, 1);
}

export function ecs_player_getLevel(): i32 {
  return i32.load(OFF_LEVEL);
}

export function ecs_player_incLevel(): void {
  const lv = i32.load(OFF_LEVEL) + 1;
  i32.store(OFF_LEVEL, lv);
  i32.store(OFF_DIRTY_FLAGS + DIRTY_LEVEL * 4, 1);
}

export function ecs_player_getKills(): i64 {
  return i64.load(OFF_KILLS);
}

export function ecs_player_incKills(amount: i64): void {
  const cur = i64.load(OFF_KILLS);
  i64.store(OFF_KILLS, cur + amount);
  i32.store(OFF_DIRTY_FLAGS + DIRTY_KILLS * 4, 1);
}

export function ecs_player_getMomentum(): f64 {
  return f64.load(OFF_MOMENTUM);
}

export function ecs_player_setMomentum(value: f64): void {
  f64.store(OFF_MOMENTUM, value);
}

export function ecs_player_getOvercharge(): f64 {
  return f64.load(OFF_OVERCHARGE);
}

export function ecs_player_setOvercharge(value: f64): void {
  f64.store(OFF_OVERCHARGE, value);
}

export function ecs_player_getAtk(): f64 {
  return f64.load(OFF_ATK);
}

export function ecs_player_setAtk(value: f64): void {
  f64.store(OFF_ATK, value);
  i32.store(OFF_DIRTY_FLAGS + DIRTY_STATS * 4, 1);
}

export function ecs_player_getDef(): f64 {
  return f64.load(OFF_DEF);
}

export function ecs_player_setDef(value: f64): void {
  f64.store(OFF_DEF, value);
  i32.store(OFF_DIRTY_FLAGS + DIRTY_STATS * 4, 1);
}

export function ecs_player_getHP(): f64 {
  return f64.load(OFF_HP);
}

export function ecs_player_setHP(value: f64): void {
  f64.store(OFF_HP, value);
  i32.store(OFF_DIRTY_FLAGS + DIRTY_STATS * 4, 1);
}

export function ecs_player_getCrit(): f64 {
  return f64.load(OFF_CRIT);
}

export function ecs_player_setCrit(value: f64): void {
  f64.store(OFF_CRIT, value);
}

// ============================================================
// UPGRADE API
// ============================================================

export function ecs_upgrade_getLevel(id: i32): i32 {
  if (id < 0 || id >= MAX_UPGRADE_ID) return 0;
  return i32.load(UPGRADE_OFF + id * UPGRADE_STRIDE);
}

export function ecs_upgrade_setLevel(id: i32, level: i32): void {
  if (id < 0 || id >= MAX_UPGRADE_ID) return;
  i32.store(UPGRADE_OFF + id * UPGRADE_STRIDE, level);
  i32.store(OFF_DIRTY_FLAGS + (DIRTY_UPGRADE_BASE + id) * 4, 1);
}

export function ecs_upgrade_incLevel(id: i32, amount: i32): i32 {
  if (id < 0 || id >= MAX_UPGRADE_ID) return 0;
  const off = UPGRADE_OFF + id * UPGRADE_STRIDE;
  const cur = i32.load(off);
  const next = cur + amount;
  i32.store(off, next);
  i32.store(OFF_DIRTY_FLAGS + (DIRTY_UPGRADE_BASE + id) * 4, 1);
  return next;
}

export function ecs_upgrade_getCostBase(id: i32): f64 {
  if (id < 0 || id >= MAX_UPGRADE_ID) return 0.0;
  return f64.load(UPGRADE_OFF + id * UPGRADE_STRIDE + 4);
}

export function ecs_upgrade_getCostGain(id: i32): f64 {
  if (id < 0 || id >= MAX_UPGRADE_ID) return 0.0;
  return f64.load(UPGRADE_OFF + id * UPGRADE_STRIDE + 12);
}

export function ecs_upgrade_getCostType(id: i32): i32 {
  if (id < 0 || id >= MAX_UPGRADE_ID) return 0;
  return i32.load(UPGRADE_OFF + id * UPGRADE_STRIDE + 20);
}

export function ecs_upgrade_setCostParams(id: i32, base: f64, gain: f64, type: i32): void {
  if (id < 0 || id >= MAX_UPGRADE_ID) return;
  const off = UPGRADE_OFF + id * UPGRADE_STRIDE + 4;
  f64.store(off, base);
  f64.store(off + 8, gain);
  i32.store(off + 16, type);
}

// ============================================================
// RESOURCE API
// ============================================================

export function ecs_resource_getAmount(id: i32): f64 {
  if (id < 0 || id >= MAX_RESOURCE_ID) return 0.0;
  return f64.load(RESOURCE_OFF + id * RESOURCE_STRIDE);
}

export function ecs_resource_setAmount(id: i32, value: f64): void {
  if (id < 0 || id >= MAX_RESOURCE_ID) return;
  f64.store(RESOURCE_OFF + id * RESOURCE_STRIDE, value);
}

export function ecs_resource_addAmount(id: i32, value: f64): void {
  if (id < 0 || id >= MAX_RESOURCE_ID) return;
  const off = RESOURCE_OFF + id * RESOURCE_STRIDE;
  const cur = f64.load(off);
  f64.store(off, cur + value);
}

export function ecs_resource_getRate(id: i32): f64 {
  if (id < 0 || id >= MAX_RESOURCE_ID) return 0.0;
  return f64.load(RESOURCE_OFF + id * RESOURCE_STRIDE + 8);
}

export function ecs_resource_setRate(id: i32, value: f64): void {
  if (id < 0 || id >= MAX_RESOURCE_ID) return;
  f64.store(RESOURCE_OFF + id * RESOURCE_STRIDE + 8, value);
}

// ============================================================
// ENEMY API
// ============================================================

export function ecs_enemy_getHP(): f64 {
  return f64.load(OFF_ENEMY_HP);
}

export function ecs_enemy_setHP(value: f64): void {
  f64.store(OFF_ENEMY_HP, value);
  i32.store(OFF_DIRTY_FLAGS + DIRTY_ENEMY * 4, 1);
}

export function ecs_enemy_getMaxHP(): f64 {
  return f64.load(OFF_ENEMY_MAX_HP);
}

export function ecs_enemy_setMaxHP(value: f64): void {
  f64.store(OFF_ENEMY_MAX_HP, value);
}

export function ecs_enemy_getAtk(): f64 {
  return f64.load(OFF_ENEMY_ATK);
}

export function ecs_enemy_getDef(): f64 {
  return f64.load(OFF_ENEMY_DEF);
}

export function ecs_enemy_getLevel(): i32 {
  return i32.load(OFF_ENEMY_LEVEL);
}

export function ecs_combat_isActive(): i32 {
  return i32.load(OFF_COMBAT_ACTIVE);
}

export function ecs_combat_setActive(value: i32): void {
  i32.store(OFF_COMBAT_ACTIVE, value);
}

// ============================================================
// WORLD API
// ============================================================

export function world_getTickCount(): i64 {
  return i64.load(OFF_TICK_COUNT);
}

export function world_incTick(): void {
  const cur = i64.load(OFF_TICK_COUNT);
  i64.store(OFF_TICK_COUNT, cur + 1);
}

export function world_getDirtyFlags(): i32 {
  // Returns OR of all dirty flags (inline, no loop)
  let flags: i32 = 0;
  flags |= i32.load(OFF_DIRTY_FLAGS + 0);
  flags |= i32.load(OFF_DIRTY_FLAGS + 4);
  flags |= i32.load(OFF_DIRTY_FLAGS + 8);
  flags |= i32.load(OFF_DIRTY_FLAGS + 12);
  flags |= i32.load(OFF_DIRTY_FLAGS + 16);
  flags |= i32.load(OFF_DIRTY_FLAGS + 20);
  flags |= i32.load(OFF_DIRTY_FLAGS + 24);
  flags |= i32.load(OFF_DIRTY_FLAGS + 28);
  flags |= i32.load(OFF_DIRTY_FLAGS + 32);
  flags |= i32.load(OFF_DIRTY_FLAGS + 36);
  flags |= i32.load(OFF_DIRTY_FLAGS + 40);
  flags |= i32.load(OFF_DIRTY_FLAGS + 44);
  flags |= i32.load(OFF_DIRTY_FLAGS + 48);
  flags |= i32.load(OFF_DIRTY_FLAGS + 52);
  flags |= i32.load(OFF_DIRTY_FLAGS + 56);
  flags |= i32.load(OFF_DIRTY_FLAGS + 60);
  return flags;
}

export function world_clearDirty(flag: i32): void {
  if (flag >= 0 && flag < 16) {
    i32.store(OFF_DIRTY_FLAGS + flag * 4, 0);
  }
}

export function world_clearAllDirty(): void {
  i32.store(OFF_DIRTY_FLAGS + 0, 0);
  i32.store(OFF_DIRTY_FLAGS + 4, 0);
  i32.store(OFF_DIRTY_FLAGS + 8, 0);
  i32.store(OFF_DIRTY_FLAGS + 12, 0);
  i32.store(OFF_DIRTY_FLAGS + 16, 0);
  i32.store(OFF_DIRTY_FLAGS + 20, 0);
  i32.store(OFF_DIRTY_FLAGS + 24, 0);
  i32.store(OFF_DIRTY_FLAGS + 28, 0);
  i32.store(OFF_DIRTY_FLAGS + 32, 0);
  i32.store(OFF_DIRTY_FLAGS + 36, 0);
  i32.store(OFF_DIRTY_FLAGS + 40, 0);
  i32.store(OFF_DIRTY_FLAGS + 44, 0);
  i32.store(OFF_DIRTY_FLAGS + 48, 0);
  i32.store(OFF_DIRTY_FLAGS + 52, 0);
  i32.store(OFF_DIRTY_FLAGS + 56, 0);
  i32.store(OFF_DIRTY_FLAGS + 60, 0);
}

// Initialize world state
export function world_init(): void {
  // Zero all player state (inline, no loop)
  i32.store(0, 0);
  i32.store(4, 0);
  i32.store(8, 0);
  i32.store(12, 0);
  i32.store(16, 1);  // Level = 1
  i32.store(20, 0);
  i32.store(24, 0);
  i32.store(28, 0);
  i32.store(32, 0);
  i32.store(36, 0);
  i32.store(40, 0);
  i32.store(44, 0);
  i32.store(48, 0);
  i32.store(52, 0);
  i32.store(56, 0);
  i32.store(60, 0);
  i32.store(64, 0);
  i32.store(68, 0);
  i32.store(72, 0);
  i32.store(76, 0);
  i32.store(80, 0);
  i32.store(84, 0);
  i32.store(88, 100); // HP = 100
  i32.store(92, 0);
  i32.store(96, 0);
  i32.store(100, 0);
  i32.store(104, 0);
  i32.store(108, 0);
  i32.store(112, 0);
  i32.store(116, 0);
  i32.store(120, 0);
  i32.store(124, 0);
  i32.store(128, 0);
  i32.store(132, 0);
  i32.store(136, 0);
  i32.store(140, 0);
  i32.store(144, 0);
  i32.store(148, 0);
  i32.store(152, 0);
  i32.store(156, 0);
  i32.store(160, 0);
  i32.store(164, 0);
  i32.store(168, 0);
  i32.store(172, 0);
  i32.store(176, 0);
  i32.store(180, 0);
  i32.store(184, 0);
  i32.store(188, 0);
  i32.store(192, 0);
  i32.store(196, 0);
  i32.store(200, 0);
  i32.store(204, 0);
  i32.store(208, 0);
  i32.store(212, 0);
  i32.store(216, 0);
  i32.store(220, 0);
  i32.store(224, 0);
  i32.store(228, 0);
  i32.store(232, 0);
  i32.store(236, 0);
  i32.store(240, 0);
  i32.store(244, 0);
  i32.store(248, 0);
  i32.store(252, 0);
  i32.store(256, 0);
  // Crit starts at 0.01
  f64.store(96, 0.01);
  // HP = 100
  f64.store(80, 100.0);
  f64.store(88, 100.0);
}

// ============================================================
// COST CALCULATIONS
// ============================================================

export function cost_linear(level: i32, amount: i32, base: f64, gain: f64): f64 {
  if (amount <= 0) return 0.0;
  const k = <f64>amount;
  const L = <f64>level;
  return k * base + gain * (k * L + k * (k - 1.0) * 0.5);
}

export function cost_geometric(level: i32, amount: i32, base: f64, mult: f64): f64 {
  if (amount <= 0) return 0.0;
  if (absD(mult - 1.0) < 1e-10) return base * <f64>amount;
  const L = <f64>level;
  const k = <f64>amount;
  return base * wasmPow(mult, L) * (wasmPow(mult, k) - 1.0) / (mult - 1.0);
}

export function cost_maxAffordable_linear(budget: f64, level: i32, base: f64, gain: f64): i32 {
  if (budget <= 0.0 || gain <= 0.0) return 0;
  const L = <f64>level;
  const a = 0.5 * gain;
  const b = gain * L + base - 0.5 * gain;
  const disc = b * b + 2.0 * gain * budget;
  if (disc < 0.0) return 0;
  const kFloat = floor((-b + sqrt(disc)) / gain);
  const k = <i32>(kFloat > 0.0 ? kFloat : 0.0);
  const cost = cost_linear(level, k, base, gain);
  if (cost > budget) return k - 1;
  return k;
}

// ============================================================
// HELPERS
// ============================================================

function wasmPow(base: f64, exp: f64): f64 {
  if (exp == 0.0) return 1.0;
  if (base == 0.0) return 0.0;
  if (exp == 1.0) return base;
  if (exp == floor(exp)) {
    let result: f64 = 1.0;
    let e = <i32>exp;
    if (e < 0) { base = 1.0 / base; e = -e; }
    while (e > 0) {
      if ((e & 1) != 0) result *= base;
      base *= base;
      e >>= 1;
    }
    return result;
  }
  return <f64>Math.pow(<f64>base, <f64>exp);
}

function floor(x: f64): f64 {
  return <f64>Math.floor(<f64>x);
}

function absD(x: f64): f64 { return x < 0.0 ? -x : x; }

function sqrt(x: f64): f64 {
  return <f64>Math.sqrt(<f64>x);
}
