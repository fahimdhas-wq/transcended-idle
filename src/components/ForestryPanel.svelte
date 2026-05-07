<script lang="ts">
import { 
  forestryState, 
  bioTools,
  upgradeBioTool, 
  buyForestryUpgrade,
  refineBioSingle,
  addGrowthChamber,
  upgradeMutationChance,
  triggerForestryOverclock,
  upgradeForestryEnergy
} from '../modules/forestry.svelte.js';
import type { ForestryUpgradeType } from '../modules/forestry.svelte.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { uiStore, showToast } from '../stores/uiStore.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { calculateBulkCost } from '../utils/bulkCost.js';
import { basicTrees, refinedTrees, advancedTrees } from '../data/resources.js';

let buyAmount = $derived(uiStore.buyAmount);

function handleOverclock(): void { 
  triggerForestryOverclock(); 
  showToast('Growth Surge activated!', 'warn'); 
}

function calculateForestryCost(type: ForestryUpgradeType, amount: number): Decimal {
  const getCost = (lv: number): Decimal => {
    if (type === 'chainsawFuel')    return new Decimal(lv).mul(500);
    if (type === 'reforestation')   return new Decimal(lv).mul(150);
    if (type === 'ancientSaplings') {
      if (lv >= 10) return new Decimal(Infinity); 
      return new Decimal(10).pow(lv).mul(100);
    }
    if (type === 'mutationPower')   return new Decimal(lv).mul(1500);
    if (type === 'overclockPower')  return new Decimal(lv).mul(2000);
    if (type === 'efficiency')      return new Decimal(lv).mul(1000);
    return new Decimal(0);
  };
  return calculateBulkCost(getCost, Number(forestryState[type] || 0), amount);
}

function calculateEnergyCost(amount: number): Decimal {
  const getCost = (i: number): Decimal => {
    const currentMax = Number(forestryState.maxEnergy) + (i * 100);
    return new Decimal((currentMax / 100) * 25);
  };
  return calculateBulkCost(getCost, 0, amount);
}

function calculateChamberCost(amount: number): Decimal {
  const getCost = (lv: number): Decimal => new Decimal(Math.floor(Math.pow(lv, 1.5) * 20));
  return calculateBulkCost(getCost, Number(forestryState.growthChambers || 0), amount);
}

function calculateMutationCost(amount: number): Decimal {
  const getCost = (i: number): Decimal => {
    const currentMut = Number(forestryState.mutationChance) + (i * 0.02);
    return new Decimal(Math.floor(currentMut * 200));
  };
  return calculateBulkCost(getCost, 0, amount);
}

let currentDisplayTab = $state('basic');
</script>

<div class="forestry-panel">
  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">🌿</div>
      <div class="header-title-box">
        <h2 class="transcended-text">BIO HARVESTER</h2>
        <div class="header-subtitle">ORGANIC SYNTHESIS</div>
      </div>
    </div>
    <div class="header-stats">
      <div class="header-stat-box">
        <span class="stat-label">HARVEST RATE</span>
        <span class="stat-value" style="color: var(--neon-blue);">
          {formatNumber(forestryState.harvestRate)}/s
        </span>
      </div>
      <div class="header-stat-box">
        <span class="stat-label">DNA FRAGS</span>
        <span class="stat-value" style="color: var(--neon-green);">{formatNumber(forestryState.dnaFragments)}</span>
      </div>
      <div class="header-stat-box">
        <span class="stat-label">DNA/s</span>
        <span class="stat-value" style="color: var(--neon-green);">{formatNumber(forestryState.dnaRate)}/s</span>
      </div>
    </div>
  </div>
  
  <div class="content-container">
    {#if !forestryState.unlocked}
    <div class="locked-msg">
      <div class="lock-icon">🌿</div>
      <div>Unlocks at Level 200</div>
    </div>
  {:else}
    <div class="forestry-status">
      <div class="tool-info">
        <span class="stat-label" style="color: var(--color-muted);">ACTIVE HARVESTER:</span>
        <span class="highlight" style="font-family: var(--font-cyber); font-size: 0.8rem;">{forestryState.toolName}</span>
      </div>

      <div class="bar-group">
        <div class="bar-label">
          <span>HARVEST PROGRESS</span>
          {#if forestryState.harvestRate >= 100}
            <span style="color: #4CAF50;">{formatNumber(forestryState.harvestRate)}/s</span>
          {:else}
            <span>{Math.floor(forestryState.growthProgress)}%</span>
          {/if}
        </div>
        <div class="progress-bar-container">
          {#if forestryState.harvestRate >= 100}
            <div class="progress-fill progress-maxed" style="width: 100%"></div>
          {:else}
            <div class="progress-fill" style="width: {forestryState.growthProgress}%"></div>
          {/if}
        </div>
      </div>

      <div class="bar-group">
        <div class="bar-label">
          <span>NUTRIENT ENERGY</span>
          <span>{Math.floor((Number(forestryState.energy) / Math.max(1, Number(forestryState.maxEnergy))) * 100)}%</span>
        </div>
        <div class="energy-bar-container">
          <div class="energy-fill" style="width: {Math.max(0, Math.min(100, (Number(forestryState.energy) / Math.max(1, Number(forestryState.maxEnergy))) * 100))}%"></div>
        </div>
      </div>
    </div>

    <div class="action-grid">
      <button onclick={upgradeBioTool} class="btn-u" disabled={forestryState.toolTier >= 10}>
        <span class="u-name">TOOL UPGRADE</span>
        <small>{forestryState.toolTier >= 10 ? 'MAX' : 'Cost: ' + formatNumber(bioTools[forestryState.toolTier]?.dataCost) + ' DNA'}</small>
      </button>
      <button onclick={handleOverclock} class="btn-u" disabled={forestryState.isOverclocked}>
        <span class="u-name">{forestryState.isOverclocked ? 'SURGE ACTIVE' : 'GROWTH SURGE'}</span>
        <small>Cost: 25 Reinforced Fiber</small>
      </button>
      <button onclick={() => upgradeForestryEnergy(buyAmount)} class="btn-u">
        <span class="u-name">+NUTRIENT CAP</span>
        <small>Cost: {formatNumber(calculateEnergyCost(buyAmount))} Reinforced Fiber</small>
      </button>
    </div>

    <div class="upgrades-section">
      <div class="section-header">
        <h4 class="transcended-sub">SYSTEM CALIBRATION</h4>
        <div class="buy-selector">
          {#each [1, 10, 100, 1000, 10000] as amt}
            <button class="amt-btn" class:active={uiStore.buyAmount === amt} onclick={() => uiStore.buyAmount = amt}>x{amt}</button>
          {/each}
        </div>
      </div>
      
      <div class="upgrade-row">
        <button onclick={() => buyForestryUpgrade('chainsawFuel', buyAmount)} class="btn-u">
            <span class="u-name">Harvest Efficiency [Lv.{forestryState.chainsawFuel}]</span>
            <small>+Speed Mult | Cost: {formatNumber(calculateForestryCost('chainsawFuel', buyAmount))} DNA</small>
        </button>
        <button onclick={() => buyForestryUpgrade('ancientSaplings', buyAmount)} class="btn-u" disabled={forestryState.ancientSaplings >= 10}>
            <span class="u-name">Vein Discovery [Lv.{forestryState.ancientSaplings}]</span>
            <small>Unlock Trees | Cost: {forestryState.ancientSaplings >= 10 ? 'MAX' : formatNumber(calculateForestryCost('ancientSaplings', buyAmount)) + ' DNA'}</small>
        </button>
        <button onclick={() => buyForestryUpgrade('mutationPower', buyAmount)} class="btn-u">
            <span class="u-name">Mutation Power [Lv.{forestryState.mutationPower || 0}]</span>
            <small>+Mut Power | Cost: {formatNumber(calculateForestryCost('mutationPower', buyAmount))} DNA</small>
        </button>
        <button onclick={() => buyForestryUpgrade('overclockPower', buyAmount)} class="btn-u">
            <span class="u-name">OC Capacitor [Lv.{forestryState.overclockPower || 0}]</span>
            <small>+OC Power | Cost: {formatNumber(calculateForestryCost('overclockPower', buyAmount))} DNA</small>
        </button>
        <button onclick={() => buyForestryUpgrade('efficiency', buyAmount)} class="btn-u">
            <span class="u-name">Energy Efficiency [Lv.{forestryState.efficiency || 0}]</span>
            <small>-Energy Cost | Cost: {formatNumber(calculateForestryCost('efficiency', buyAmount))} DNA</small>
        </button>
        <button onclick={() => buyForestryUpgrade('reforestation', buyAmount)} class="btn-u">
            <span class="u-name">Reforestation [Lv.{forestryState.reforestation || 1}]</span>
            <small>+Growth Mult | Cost: {formatNumber(calculateForestryCost('reforestation', buyAmount))} DNA</small>
        </button>
      </div>
    </div>

    <div class="automation-section">
      <div class="section-header">
        <h4 class="transcended-sub">BIOME LOGISTICS</h4>
      </div>
      <div class="auto-row">
        <button onclick={() => addGrowthChamber(buyAmount)} class="btn-u">
          <span class="u-name">Growth Chambers ({forestryState.growthChambers})</span>
          <small>+Speed/Regen | Cost: {formatNumber(calculateChamberCost(buyAmount))} Biofiber</small>
        </button>
        <button onclick={() => upgradeMutationChance(buyAmount)} class="btn-u">
          <span class="u-name">Mutation Chance ({Math.floor(forestryState.mutationChance * 100)}%)</span>
          <small>+Mut Chance | Cost: {formatNumber(calculateMutationCost(buyAmount))} Resin Gel</small>
        </button>
      </div>
    </div>

    <div class="resource-tabs">
        <button class:active={currentDisplayTab === 'basic'} onclick={() => currentDisplayTab = 'basic'}>BASIC</button>
        <button class:active={currentDisplayTab === 'refined'} onclick={() => currentDisplayTab = 'refined'}>REFINED</button>
        <button class:active={currentDisplayTab === 'advanced'} onclick={() => currentDisplayTab = 'advanced'}>ADVANCED</button>
    </div>

    <div class="resources-grid">
      {#if currentDisplayTab === 'basic'}
        {#each basicTrees as tree (tree.id)}
          <div class="res-item" class:inactive={(tree.tier ?? 0) > forestryState.ancientSaplings}>
            <div class="res-name">{tree.name}</div>
            <div class="res-amount">{formatNumber(forestryState.resources[tree.id] || 0)}</div>
            <div class="res-actions">
              <label class="toggle-sm">
                <input type="checkbox" checked={forestryState.autoRefine[tree.id]} onchange={(e) => forestryState.autoRefine[tree.id] = (e.currentTarget as HTMLInputElement).checked}>
                <span class="slider"></span>
              </label>
              <button class="refine-item-btn" onclick={() => refineBioSingle(tree.id)} disabled={!forestryState.resources[tree.id] || forestryState.resources[tree.id].lt(25)}>EVOLVE</button>
            </div>
          </div>
        {/each}
      {:else if currentDisplayTab === 'refined'}
        {#each refinedTrees as res (res.id)}
          <div class="res-item">
            <div class="res-name">{res.name}</div>
            <div class="res-amount">{formatNumber(forestryState.resources[res.id] || 0)}</div>
            <div class="res-actions">
              <label class="toggle-sm">
                <input type="checkbox" checked={forestryState.autoRefine[res.id]} onchange={(e) => forestryState.autoRefine[res.id] = (e.currentTarget as HTMLInputElement).checked}>
                <span class="slider"></span>
              </label>
              <button class="refine-item-btn" onclick={() => refineBioSingle(res.id)} disabled={!forestryState.resources[res.id] || forestryState.resources[res.id].lt(25)}>EVOLVE</button>
            </div>
          </div>
        {/each}
      {:else}
        {#each advancedTrees as res (res.id)}
          <div class="res-item">
            <div class="res-name">{res.name}</div>
            <div class="res-amount">{formatNumber(forestryState.resources[res.id] || 0)}</div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
</div>

<style>
.forestry-panel { display: flex; flex-direction: column; height: 100%; overflow-y: auto; padding: 10px; }
.content-container { display: flex; flex-direction: column; gap: 10px; }
.locked-msg { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--color-muted); }
.lock-icon { font-size: 3rem; margin-bottom: 10px; }

.forestry-status { display: flex; flex-direction: column; gap: 12px; background: rgba(0,0,0,0.3); padding: 12px; border: 1px solid var(--border-subtle); border-radius: 4px; }
.tool-info { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-bottom: 4px; }
.bar-group { display: flex; flex-direction: column; gap: 4px; }
.bar-label { display: flex; justify-content: space-between; font-size: 0.65rem; font-family: var(--font-cyber); color: var(--color-muted); letter-spacing: 1px; }
.progress-bar-container, .energy-bar-container { height: 10px; background: #000; border: 1px solid #333; position: relative; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: #4CAF50; transition: width 0.1s linear; box-shadow: 0 0 10px #4CAF50; }

.progress-maxed {
  transition: none;
  animation: maxed-pulse 1s ease-in-out infinite;
}

@keyframes maxed-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.energy-fill { height: 100%; background: var(--neon-blue); transition: width 0.1s linear; box-shadow: 0 0 10px var(--neon-blue); }
.highlight { color: #4CAF50; font-weight: bold; }

.action-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.upgrades-section, .automation-section { background: rgba(0,0,0,0.2); padding: 10px; border: 1px solid var(--border-subtle); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.buy-selector { display: flex; gap: 2px; }
.amt-btn { background: #111; border: 1px solid #333; color: #666; font-size: 0.6rem; padding: 2px 6px; cursor: pointer; }
.amt-btn.active { border-color: #4CAF50; color: #4CAF50; }
.upgrade-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.auto-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }

.btn-u { background: #1a1a1a; border: 1px solid #333; color: #ccc; padding: 8px; cursor: pointer; display: flex; flex-direction: column; text-align: left; transition: 0.1s; }
.btn-u:hover:not(:disabled) { border-color: #4CAF50; background: #222; }
.btn-u:disabled { opacity: 0.5; cursor: not-allowed; }
.u-name { font-size: 0.75rem; font-weight: bold; color: #fff; }
.btn-u small { font-size: 0.6rem; color: #888; margin-top: 2px; }

.resource-tabs { display: flex; gap: 5px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 5px; }
.resource-tabs button { background: transparent; border: 1px solid transparent; color: #666; font-size: 0.7rem; padding: 4px 10px; cursor: pointer; }
.resource-tabs button.active { border-color: #4CAF50; color: #4CAF50; background: rgba(76,175,80,0.05); }

.resources-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.res-item { background: var(--panel-bg); padding: 8px; border: 1px solid var(--border-subtle); display: flex; flex-direction: column; align-items: center; }
.res-item.inactive { opacity: 0.2; }
.res-name { font-size: 0.7rem; color: var(--color-muted); text-transform: uppercase; }
.res-amount { font-size: 0.9rem; color: #fff; font-weight: bold; margin: 4px 0; }
.res-actions { display: flex; align-items: center; gap: 8px; width: 100%; justify-content: center; }

.toggle-sm { cursor: pointer; height: 14px; }
.toggle-sm input { display: none; }
.toggle-sm .slider { width: 24px; height: 12px; background: #333; display: block; border-radius: 6px; position: relative; }
.toggle-sm .slider:before { content: ''; position: absolute; width: 8px; height: 8px; background: #fff; border-radius: 50%; top: 2px; left: 2px; transition: 0.2s; }
input:checked + .slider { background: #4CAF50; }
input:checked + .slider:before { transform: translateX(12px); }
.refine-item-btn { background: #000; border: 1px solid #444; color: #fff; font-size: 0.6rem; padding: 2px 8px; cursor: pointer; }
.refine-item-btn:hover:not(:disabled) { border-color: #fff; }
</style>
