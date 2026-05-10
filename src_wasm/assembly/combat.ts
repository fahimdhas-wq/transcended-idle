// ============================================================
// COMBAT — Damage, enemy management
// Zero allocations, flat memory layout
// ============================================================

// Memory layout offsets (same as ecs.ts)
const OFF_GOLD: i32 = 0;
const OFF_XP: i32 = 8;
const OFF_LEVEL: i32 = 16;
const OFF_KILLS: i32 = 24;
const OFF_MOMENTUM: i32 = 32;
const OFF_OVERCHARGE: i32 = 40;
const OFF_SEALS: i32 = 48;
const OFF_AWAKENING: i32 = 52;
const OFF_ATK: i32 = 64;
const OFF_DEF: i32 = 72;
const OFF_HP: i32 = 80;
const OFF_MAX_HP: i32 = 88;
const OFF_CRIT: i32 = 96;
const OFF_ENEMY_HP: i32 = 104;
const OFF_ENEMY_MAX_HP: i32 = 112;
const OFF_ENEMY_ATK: i32 = 120;
const OFF_ENEMY_DEF: i32 = 128;
const OFF_ENEMY_LEVEL: i32 = 136;
const OFF_COMBAT_ACTIVE: i32 = 140;
const OFF_TICK_COUNT: i32 = 144;

// Minimal wasmPow for combat module
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

// RNG state
let _rng0: u64 = 123456789;
let _rng1: u64 = 987654321;

function rngNext(): u64 {
  const s0 = _rng0;
  const s1 = _rng1;
  const result = rotl<u64>(s0 * 5, 7) * 9;
  const newS1 = s1 ^ s0;
  _rng0 = rotl<u64>(s0, 24) ^ newS1 ^ (newS1 << 16);
  _rng1 = newS1;
  return result;
}

function rngFloat(): f64 {
  return <f64>(rngNext() >> 1) / <f64>(9223372036854775808);
}

function rngInt(max: i32): i32 {
  return <i32>(rngNext() % <u64>max);
}

function rotl<T>(x: T, k: i32): T {
  return (x << k) | (x >> (32 - k));
}

// ============================================================
// ENEMY SPAWN
// ============================================================

export function combat_spawnEnemy(playerLevel: i32): i32 {
  const level = playerLevel + rngInt(5) - 2;
  const effectiveLevel = level > 0 ? level : 1;

  // HP = 50 * 1.15^level
  const hpGrowth = wasmPow(1.15, <f64>effectiveLevel);
  const hp = 50.0 * hpGrowth;

  // ATK = 5 * 1.12^level
  const atkGrowth = wasmPow(1.12, <f64>effectiveLevel);
  const atk = 5.0 * atkGrowth;

  // DEF = 2 * 1.10^level
  const defGrowth = wasmPow(1.10, <f64>effectiveLevel);
  const def = 2.0 * defGrowth;

  f64.store(OFF_ENEMY_HP, hp);
  f64.store(OFF_ENEMY_MAX_HP, hp);
  f64.store(OFF_ENEMY_ATK, atk);
  f64.store(OFF_ENEMY_DEF, def);
  i32.store(OFF_ENEMY_LEVEL, effectiveLevel);
  i32.store(OFF_COMBAT_ACTIVE, 1);

  return 1; // success
}

// ============================================================
// COMBAT TICK
// Returns: 0 = no combat, 1 = ongoing, 2 = killed
// ============================================================

export function combat_tick(): i32 {
  const isActive = i32.load(OFF_COMBAT_ACTIVE);
  if (isActive == 0) return 0;

  const enemyHP = f64.load(OFF_ENEMY_HP);
  if (enemyHP <= 0.0) {
    i32.store(OFF_COMBAT_ACTIVE, 0);
    return 2; // already dead
  }

  // Player attacks
  const playerAtk = f64.load(OFF_ATK);
  const playerCrit = f64.load(OFF_CRIT);
  const momentum = f64.load(OFF_MOMENTUM);

  // Damage = atk * (1 + momentum * 0.1) * crit_multiplier
  const isCrit = rngFloat() < playerCrit;
  let damage = playerAtk * (1.0 + momentum * 0.1);
  if (isCrit) damage *= 2.0;

  // Apply damage to enemy
  const newEnemyHP = enemyHP - damage;
  f64.store(OFF_ENEMY_HP, newEnemyHP);

  if (newEnemyHP <= 0.0) {
    // Enemy killed!
    f64.store(OFF_ENEMY_HP, 0.0);
    i32.store(OFF_COMBAT_ACTIVE, 0);

    // Rewards
    const enemyLevel = i32.load(OFF_ENEMY_LEVEL);
    const xpReward = 10.0 * <f64>enemyLevel;
    const goldReward = <f64>enemyLevel * 1.0;

    // Add XP
    const curXP = f64.load(OFF_XP);
    f64.store(OFF_XP, curXP + xpReward);

    // Add gold
    const curGold = f64.load(OFF_GOLD);
    f64.store(OFF_GOLD, curGold + goldReward);

    // Increment kills
    const curKills = i64.load(OFF_KILLS);
    i64.store(OFF_KILLS, curKills + 1);

    // Add momentum
    const curMomentum = f64.load(OFF_MOMENTUM);
    f64.store(OFF_MOMENTUM, curMomentum + 0.01);

    // Check level up
    checkLevelUp();

    return 2;
  }

  return 1;
}

// ============================================================
// LEVEL UP CHECK
// ============================================================

function checkLevelUp(): void {
  const level = i32.load(OFF_LEVEL);
  const xpNeeded = wasmPow(1.5, <f64>level) * 100.0;
  const curXP = f64.load(OFF_XP);

  if (curXP >= xpNeeded) {
    // Level up!
    i32.store(OFF_LEVEL, level + 1);
    f64.store(OFF_XP, curXP - xpNeeded);
  }
}

// ============================================================
// STAT AGGREGATION
// Called once per tick to recalculate all stats
// ============================================================

export function stats_aggregate(
  baseAtk: f64,
  baseDef: f64,
  baseHP: f64,
  baseCrit: f64,
  omniMult: f64,
  soulMult: f64,
  awakenMult: f64,
  bestiaryMult: f64,
  overclockMult: f64,
  sealCount: i32
): void {
  // Combined multiplier
  const sealMult = wasmPow(10.0, <f64>sealCount);
  const totalMult = sealMult * omniMult * soulMult * awakenMult * bestiaryMult * overclockMult;

  const momentum = f64.load(OFF_MOMENTUM);

  // ATK = base * mult * (1 + momentum * 0.1)
  const atk = baseAtk * totalMult * (1.0 + momentum * 0.1);
  f64.store(OFF_ATK, atk);

  // DEF = base * mult
  const def = baseDef * totalMult;
  f64.store(OFF_DEF, def);

  // HP = base * mult
  const hp = baseHP * totalMult;
  f64.store(OFF_HP, hp);
  f64.store(OFF_MAX_HP, hp);

  // Crit = baseCrit + momentum * 0.01 (capped at 0.5)
  const crit = minF(baseCrit + momentum * 0.01, 0.5);
  f64.store(OFF_CRIT, crit);
}

// ============================================================
// WORLD TICK (main simulation loop)
// ============================================================

export function world_tick(ticks: i32): i32 {
  if (ticks <= 0) return 0;

  let result: i32 = 0;

  for (let i = 0; i < ticks; i++) {
    // Increment tick counter
    const tc = i64.load(OFF_TICK_COUNT);
    i64.store(OFF_TICK_COUNT, tc + 1);

    // Momentum accumulation
    const mom = f64.load(OFF_MOMENTUM);
    f64.store(OFF_MOMENTUM, mom + 0.01);
    // Softcap at 1000
    if (f64.load(OFF_MOMENTUM) > 1000.0) {
      f64.store(OFF_MOMENTUM, 1000.0);
    }

    // Overcharge accumulation (if XP >= needed)
    const xp = f64.load(OFF_XP);
    const level = i32.load(OFF_LEVEL);
    const xpNeeded = wasmPow(1.5, <f64>level) * 100.0;
    if (xp >= xpNeeded) {
      const oc = f64.load(OFF_OVERCHARGE);
      f64.store(OFF_OVERCHARGE, oc + 0.05);
      if (f64.load(OFF_OVERCHARGE) > 100.0) {
        f64.store(OFF_OVERCHARGE, 100.0);
      }
    }

    // Combat tick
    result = combat_tick();

    if (result == 2) {
      // Enemy killed, spawn next
      combat_spawnEnemy(level);
      result = 1;
    }
  }

  return result;
}

// ============================================================
// HELPERS
// ============================================================

function minF(a: f64, b: f64): f64 { return a < b ? a : b; }