/**
 * Command Dispatcher — Centralized mutation layer for game state.
 *
 * All state mutations go through here. This enables:
 * - Replay systems (store command history)
 * - Undo systems (reverse commands)
 * - Multiplayer (network commands)
 * - Determinism (same commands = same state)
 * - Debugging (inspect command flow)
 *
 * Usage:
 *   dispatch({ type: 'ADD_KILLS', amount: 5 });
 *   dispatch({ type: 'UPGRADE_SKILL', skillId: 'emp_strike', count: 1 });
 */

import { character, updateDerivedStats } from '../../modules/character.svelte.js';
import { combatState, flushStatCache } from '../../modules/combat.svelte.js';
import { skillsState, upgradeAllSkills } from '../../modules/skills.svelte.js';
import { miningState } from '../../modules/mining.svelte.js';
import { forestryState } from '../../modules/forestry.svelte.js';
import { bestiaryState, recordKill, updateGlobalBoost } from '../../modules/bestiary.svelte.js';
import { rewardSystem } from '../../systems/rewardSystem.js';
import { eventBus } from '../events/EventBus.js';
import { addLog } from '../../ui/LogPanelState.svelte.js';
import { Decimal, type DecimalSource } from '../../systems/decimal.js';
import { showToast } from '../../stores/uiStore.svelte.js';
import type { EnemyRef } from '../events/EventBus.js';
import type * as aiSystem from '../../systems/aiSystem.js';
import { calculateBulkCost, type CostFormula } from '../../utils/bulkCost.js';
import { getAffordableAmount } from '../../utils/adjustUpgradeAmount.js';
import { maxAffordable } from '../../utils/maxAffordable.js';
import { tools } from '../../modules/mining.svelte.js';
import { bioTools } from '../../modules/forestry.svelte.js';

// ============================================================
// Command Types
// ============================================================

export type GameCommand =
  // Combat commands
  | { type: 'SPAWN_ENEMY' }
  | { type: 'KILL_ENEMY'; enemy: EnemyRef; multiplier?: DecimalSource }
  | { type: 'PLAYER_TAKE_DAMAGE'; damage: DecimalSource }
  | { type: 'PLAYER_HEAL'; amount: DecimalSource }

  // Resource commands
  | { type: 'ADD_XP'; amount: DecimalSource }
  | { type: 'ADD_KILLS'; amount: DecimalSource }
  | { type: 'ADD_FRAGMENTS'; fragmentType: 'skill' | 'data' | 'dna'; amount: DecimalSource }
  | { type: 'ADD_MINING_RESOURCE'; resourceId: string; amount: number }
  | { type: 'ADD_FORESTRY_RESOURCE'; resourceId: string; amount: number }

  // Upgrade commands
  | { type: 'BUY_SKILL'; skillId: string; count?: number }
  | { type: 'UPGRADE_ALL_SKILLS' }
  | { type: 'BUY_MINING_UPGRADE'; upgradeType: string; count: number | 'max' }
  | { type: 'BUY_FORESTRY_UPGRADE'; upgradeType: string; count: number | 'max' }
  | { type: 'UPGRADE_MINING_TOOL' }
  | { type: 'UPGRADE_FORESTRY_TOOL' }
  | { type: 'ADD_GROWTH_CHAMBER'; amount: number | 'max' }
  | { type: 'UPGRADE_MUTATION_CHANCE'; amount: number | 'max' }
  | { type: 'UPGRADE_FORESTRY_ENERGY'; amount: number | 'max' }
  | { type: 'ADD_GROWTH_CHAMBER'; amount: number | 'max' }
  | { type: 'UPGRADE_MUTATION_CHANCE'; amount: number | 'max' }
  | { type: 'UPGRADE_FORESTRY_ENERGY'; amount: number | 'max' }
  | { type: 'UPGRADE_MINING_ENERGY'; amount: number | 'max' }
  | { type: 'UPGRADE_FORESTRY_ENERGY'; amount: number | 'max' }
  | { type: 'ADD_MINING_CHAMBER'; amount: number | 'max' }
  | { type: 'UPGRADE_MUTATION_CHANCE'; amount: number | 'max' }
  | { type: 'BUY_MINING_AUTOMATION'; automationType: 'drone' | 'extractor'; count: number | 'max' }
  | { type: 'TOGGLE_MINING_AUTO_REFINE'; resourceId: string; enabled: boolean }
  | { type: 'TOGGLE_FORESTRY_AUTO_REFINE'; resourceId: string; enabled: boolean }



  // Bestiary commands
  | { type: 'RECORD_KILL'; mobId: string; kills: DecimalSource }

  // UI commands (don't mutate game state, just trigger visual feedback)
  | { type: 'SHOW_TOAST'; message: string; toastType: string }
  | { type: 'ADD_LOG'; message: string; category: 'system' | 'loot' | 'awakening' | 'combat' };

// ============================================================
// Command Handlers
// ============================================================

type CommandResult =
  | { success: true; message?: string }
  | { success: false; reason: string };

function handleAddXP(amount: DecimalSource): CommandResult {
  const xpGain = new Decimal(amount);
  if (xpGain.lte(0)) return { success: false, reason: 'Invalid XP amount' };

  character.xp = character.xp.add(xpGain);
  character.totalXp = character.totalXp.add(xpGain);
  eventBus.emit({ type: 'XP_GAINED', amount: xpGain });

  return { success: true };
}

function handleAddKills(amount: DecimalSource): CommandResult {
  const kills = new Decimal(amount);
  if (kills.lte(0)) return { success: false, reason: 'Invalid kill amount' };

  character.kills = character.kills.add(kills);
  eventBus.emit({ type: 'MOMENTUM_CHANGED', value: character.momentum });

  return { success: true };
}

function handleBuySkill(skillId: string, count: number = 1): CommandResult {
  const skill = skillsState.skills.find(s => s.id === skillId);
  if (!skill) return { success: false, reason: 'Skill not found' };

  if (skill.tierIndex >= 99) return { success: false, reason: 'Skill maxed' };

  if (count === 1) {
    if (!character.skillFragments.gte(skill.fragmentsNeeded)) {
      return { success: false, reason: 'Not enough fragments' };
    }
    character.skillFragments = character.skillFragments.sub(skill.fragmentsNeeded);
    skill.tierIndex++;
    skill.fragmentsNeeded = skill.fragmentsNeeded.mul(2.5).floor();
    flushStatCache();
    eventBus.emit({ type: 'SKILL_UPGRADED', skillId, newTier: skill.tierIndex });
    return { success: true };
  } else {
    // Bulk buy
    let purchased = 0;
    while (
      purchased < count &&
      skill.tierIndex < 99 &&
      character.skillFragments.gte(skill.fragmentsNeeded)
    ) {
      character.skillFragments = character.skillFragments.sub(skill.fragmentsNeeded);
      skill.tierIndex++;
      skill.fragmentsNeeded = skill.fragmentsNeeded.mul(2.5).floor();
      purchased++;
    }
    if (purchased > 0) {
      flushStatCache();
      eventBus.emit({ type: 'SKILL_UPGRADED', skillId, newTier: skill.tierIndex });
      return { success: true, message: `Upgraded ${skill.name} x${purchased}` };
    }
    return { success: false, reason: 'No skills purchased' };
  }
}

function handleUpgradeAllSkills(): CommandResult {
  const result = upgradeAllSkills();
  if (result.includes('0')) return { success: false, reason: 'No skills upgraded' };
  eventBus.emit({ type: 'SKILLS_AUTOMATED', totalUpgrades: 0 });
  return { success: true, message: result };
}

function handleKillEnemy(enemy: aiSystem.Enemy, multiplier: DecimalSource = 1): CommandResult {
  rewardSystem.grantRewards(enemy, multiplier);
  combatState.kills += new Decimal(multiplier).toNumber();

  eventBus.emit({
    type: 'ENEMY_KILLED',
    enemy,
    kills: multiplier,
    isInstakill: new Decimal(multiplier).gt(1)
  });

  return { success: true };
}

function handleBuyMiningUpgrade(upgradeType: string, count: number | 'max'): CommandResult {
  const formula = getMiningUpgradeFormula(upgradeType);
  if (!formula) return { success: false, reason: 'Invalid upgrade type' };

  const currentLv = Number(miningState[upgradeType as keyof typeof miningState] || 0);
  let maxBuy = 1000000000000;

  let actualCount: number;
  if (count === 'max') {
    actualCount = maxAffordable(bestiaryState.dataFragments, currentLv, formula, maxBuy).toNumber();
  } else {
    actualCount = getAffordableAmount(bestiaryState.dataFragments, currentLv, formula, Math.min(count, maxBuy));
  }

  if (actualCount <= 0) return { success: false, reason: 'Cannot afford' };

  const totalCost = calculateBulkCost(formula, currentLv, actualCount);
  if (!bestiaryState.dataFragments.gte(totalCost)) return { success: false, reason: 'Not enough fragments' };

  bestiaryState.dataFragments = bestiaryState.dataFragments.sub(totalCost);
  (miningState as any)[upgradeType] = currentLv + actualCount;

  eventBus.emit({ type: 'MINING_UPGRADED', upgradeType, count: actualCount });
  return { success: true, message: `Upgraded ${upgradeType} x${actualCount}` };
}

function handleUpgradeMiningTool(): CommandResult {
  if (miningState.toolTier >= tools.length) {
    return { success: false, reason: 'Tool maxed' };
  }
  const next = tools[miningState.toolTier];
  if (!bestiaryState.dataFragments.gte(next.dataCost)) {
    return { success: false, reason: 'Not enough data fragments' };
  }

  bestiaryState.dataFragments = bestiaryState.dataFragments.sub(next.dataCost);
  miningState.toolTier++;
  miningState.toolName = next.name;

  eventBus.emit({ type: 'TOOL_UPGRADED', system: 'mining', newTier: miningState.toolTier });
  addLog(`[MINING] Tool upgraded to ${next.name}!`, 'system');
  return { success: true };
}

function handleAddMiningResource(resourceId: string, amount: number): CommandResult {
  if (amount <= 0) return { success: false, reason: 'Invalid amount' };
  miningState.resources.add(resourceId, amount);
  eventBus.emit({ type: 'RESOURCE_MINED', resourceId, amount });
  return { success: true };
}

function handleAddForestryResource(resourceId: string, amount: number): CommandResult {
  if (amount <= 0) return { success: false, reason: 'Invalid amount' };
  forestryState.resources.add(resourceId, amount);
  eventBus.emit({ type: 'RESOURCE_FORESTED', resourceId, amount });
  return { success: true };
}

function handleRecordKill(mobId: string, kills: DecimalSource): CommandResult {
  recordKill({ id: mobId } as aiSystem.Enemy, new Decimal(kills));
  eventBus.emit({ type: 'BESTIARY_ENTRY_KILLED', mobId, kills });
  return { success: true };
}

function handleAddFragments(fragmentType: 'skill' | 'data' | 'dna', amount: DecimalSource): CommandResult {
  const amountDec = new Decimal(amount);
  if (amountDec.lte(0)) return { success: false, reason: 'Invalid amount' };

  switch (fragmentType) {
    case 'skill':
      character.skillFragments = character.skillFragments.add(amountDec);
      character.totalFragments = character.totalFragments.add(amountDec);
      break;
    case 'data':
      bestiaryState.dataFragments = bestiaryState.dataFragments.add(amountDec);
      break;
    case 'dna':
      forestryState.dnaFragments = forestryState.dnaFragments.add(amountDec);
      break;
  }

  eventBus.emit({ type: 'FRAGMENT_GAINED', fragmentType, amount: amountDec });
  return { success: true };
}

// ============================================================
// Command Dispatcher
// ============================================================

interface CommandLog {
  command: GameCommand;
  result: CommandResult;
  timestamp: number;
}

class CommandDispatcher {
  private history: CommandLog[] = [];
  private maxHistory = 1000;
  private dryRun = false;

  /**
   * Dispatch a command to the engine.
   * @param command The command to execute
   * @returns Whether the command succeeded
   */
  dispatch(command: GameCommand): CommandResult {
    const result = this.execute(command);

    // Log to history (unless silent)
    if (!this.dryRun) {
      this.history.push({ command, result, timestamp: Date.now() });
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }

    return result;
  }

  /**
   * Execute a command without logging.
   * Useful for validation/preview.
   */
  validate(command: GameCommand): CommandResult {
    const prevDryRun = this.dryRun;
    this.dryRun = true;
    const result = this.execute(command);
    this.dryRun = prevDryRun;
    return result;
  }

  private execute(command: GameCommand): CommandResult {
    switch (command.type) {
      // Combat
      case 'SPAWN_ENEMY':
        return { success: true };

      case 'KILL_ENEMY':
        return handleKillEnemy(command.enemy as aiSystem.Enemy, command.multiplier);

      case 'PLAYER_TAKE_DAMAGE':
        // Handled in combat system
        return { success: true };

      case 'PLAYER_HEAL':
        const heal = new Decimal(command.amount);
        character.stats.hp = character.stats.hp.add(heal).min(character.stats.maxHp);
        return { success: true };

      // Resources
      case 'ADD_XP':
        return handleAddXP(command.amount);

      case 'ADD_KILLS':
        return handleAddKills(command.amount);

      case 'ADD_FRAGMENTS':
        return handleAddFragments(command.fragmentType, command.amount);

      case 'ADD_MINING_RESOURCE':
        return handleAddMiningResource(command.resourceId, command.amount);

      case 'ADD_FORESTRY_RESOURCE':
        return handleAddForestryResource(command.resourceId, command.amount);

      // Skills
      case 'BUY_SKILL':
        return handleBuySkill(command.skillId, command.count);

      case 'UPGRADE_ALL_SKILLS':
        return handleUpgradeAllSkills();

      // Mining
      case 'BUY_MINING_UPGRADE':
        return handleBuyMiningUpgrade(command.upgradeType, command.count);

      case 'UPGRADE_MINING_TOOL':
        return handleUpgradeMiningTool();

      case 'TOGGLE_MINING_AUTO_REFINE':
        miningState.autoRefine[command.resourceId] = command.enabled;
        return { success: true };

      case 'BUY_MINING_AUTOMATION':
        return { success: true }; // TODO: implement

      // Forestry
      case 'BUY_FORESTRY_UPGRADE':
        return { success: true }; // TODO: implement

      case 'UPGRADE_FORESTRY_TOOL':
        return { success: true }; // TODO: implement

      case 'TOGGLE_FORESTRY_AUTO_REFINE':
        forestryState.autoRefine[command.resourceId] = command.enabled;
        return { success: true };

      case 'ADD_GROWTH_CHAMBER':
        // TODO: implement addGrowthChamber
        return { success: true };

      case 'UPGRADE_MUTATION_CHANCE':
        // TODO: implement upgradeMutationChance
        return { success: true };

      case 'UPGRADE_FORESTRY_ENERGY':
        // TODO: implement upgradeForestryEnergy
        return { success: true };

      case 'UPGRADE_MINING_ENERGY':
        // TODO: implement upgradeEnergy
        return { success: true };

      case 'ADD_GROWTH_CHAMBER':
        // TODO: implement addGrowthChamber
        return { success: true };

      case 'UPGRADE_MUTATION_CHANCE':
        // TODO: implement upgradeMutationChance
        return { success: true };

      case 'UPGRADE_FORESTRY_ENERGY':
        // TODO: implement upgradeForestryEnergy
        return { success: true };

      case 'UPGRADE_MINING_ENERGY':
        // TODO: implement upgradeEnergy
        return { success: true };

      // Bestiary
      case 'RECORD_KILL':
        return handleRecordKill(command.mobId, command.kills);

      // UI
      case 'SHOW_TOAST':
        showToast(command.message, command.toastType);
        return { success: true };

      case 'ADD_LOG':
        addLog(command.message, command.category);
        return { success: true };

      default:
        return { success: false, reason: 'Unknown command' };
    }
  }

  /**
   * Get command history.
   */
  getHistory(): ReadonlyArray<CommandLog> {
    return this.history;
  }

  /**
   * Clear command history.
   */
  clearHistory(): void {
    this.history = [];
  }
}

// ============================================================
// Helper Functions
// ============================================================

function getMiningUpgradeFormula(type: string): CostFormula | null {
  switch (type) {
    case 'sharpness':
      return { type: 'linear', base: 0, gain: 1000 };
    case 'extraction':
      return { type: 'linear', base: 0, gain: 200 };
    case 'discovery':
      return { type: 'geometric', base: 500, multiplier: 10 };
    case 'sensors':
      return { type: 'linear', base: 2000, gain: 2000 };
    case 'efficiency':
      return { type: 'linear', base: 1500, gain: 1500 };
    default:
      return null;
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const commandDispatcher = new CommandDispatcher();

export const dispatch = (commandDispatcher.dispatch).bind(commandDispatcher);
export const validate = (commandDispatcher.validate).bind(commandDispatcher);
