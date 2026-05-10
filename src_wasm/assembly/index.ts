// ============================================================
// IDLE ENGINE v2 — AssemblyScript Entry Point
// All exports for WASM binding
// ============================================================

// Re-export all functions from modules
export {
  decimal_add, decimal_add_exp,
  decimal_sub, decimal_sub_exp,
  decimal_mul, decimal_mul_exp,
  decimal_div, decimal_div_exp,
  decimal_wasmPow, decimal_wasmPow_exp,
  decimal_abs, decimal_wasmFloor,
  decimal_wasmSqrt, decimal_wasmSqrt_exp,
  decimal_wasmLog10,
  decimal_gte, decimal_lt, decimal_eq,
  decimal_isZero
} from './decimal';

export {
  ecs_player_getGold, ecs_player_setGold, ecs_player_addGold,
  ecs_player_getXP, ecs_player_setXP, ecs_player_addXP,
  ecs_player_getLevel, ecs_player_incLevel,
  ecs_player_getKills, ecs_player_incKills,
  ecs_player_getMomentum, ecs_player_setMomentum,
  ecs_player_getOvercharge, ecs_player_setOvercharge,
  ecs_player_getAtk, ecs_player_setAtk,
  ecs_player_getDef, ecs_player_setDef,
  ecs_player_getHP, ecs_player_setHP,
  ecs_player_getCrit, ecs_player_setCrit,
  ecs_upgrade_getLevel, ecs_upgrade_setLevel, ecs_upgrade_incLevel,
  ecs_upgrade_getCostBase, ecs_upgrade_getCostGain, ecs_upgrade_getCostType,
  ecs_upgrade_setCostParams,
  ecs_resource_getAmount, ecs_resource_setAmount, ecs_resource_addAmount,
  ecs_resource_getRate, ecs_resource_setRate,
  ecs_enemy_getHP, ecs_enemy_setHP,
  ecs_enemy_getMaxHP, ecs_enemy_setMaxHP,
  ecs_enemy_getAtk, ecs_enemy_getDef, ecs_enemy_getLevel,
  ecs_combat_isActive, ecs_combat_setActive,
  world_getTickCount, world_incTick,
  world_getDirtyFlags, world_clearDirty, world_clearAllDirty,
  world_init,
  cost_linear, cost_geometric, cost_maxAffordable_linear
} from './ecs';

export {
  combat_spawnEnemy, combat_tick,
  stats_aggregate, world_tick
} from './combat';

// ============================================================
// WORLD INIT — called once on startup
// ============================================================

// Import for use in init()
import { world_init } from './ecs';
import { combat_spawnEnemy } from './combat';

export function init(): void {
  world_init();
  combat_spawnEnemy(1);
}