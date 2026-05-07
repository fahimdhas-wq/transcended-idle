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
import { maxAffordable } from '../utils/maxAffordable.js';
import { basicTrees, refinedTrees, advancedTrees } from '../data/resources.js';

let buyAmount = $derived(uiStore.buyAmount);

function calculateEnergyCost(amount: number | 'max'): Decimal {
  const getCost = (i: number): Decimal => {
    const currentMax = Number(forestryState.maxEnergy) + (i * 100);
    return new Decimal((currentMax / 100) * 25);
  };
  const currentLv = (Number(forestryState.maxEnergy) - 100) / 100;
  const count = amount === 'max' ? maxAffordable(forestryState.resources.reinforcedFiber || new Decimal(0), currentLv, getCost) : amount;
  return calculateBulkCost(getCost, currentLv, count);
}

function calculateForestryCost(type: ForestryUpgradeType, amount: number | 'max'): Decimal {
  const getCost = (lv: number): Decimal => {
    if (type === 'chainsawFuel')    return new Decimal(lv).mul(500);
    if (type === 'reforestation')   return new Decimal(lv).mul(200);
    if (type === 'ancientSaplings') return new Decimal(10).pow(lv).mul(100);
    if (type === 'mutationPower')   return new Decimal(lv + 1).mul(1500);
    if (type === 'overclockPower')  return new Decimal(lv + 1).mul(2000);
    if (type === 'efficiency')      return new Decimal(lv + 1).mul(1000);
    return new Decimal(0);
  };
  const currentLv = Number(forestryState[type] || 0);
  const count = amount === 'max' ? maxAffordable(forestryState.dnaFragments, currentLv, getCost) : amount;
  return calculateBulkCost(getCost, currentLv, count);
}

function calculateChamberCost(amount: number | 'max'): Decimal {
  const getCost = (lv: number): Decimal => {
    return new Decimal(Math.floor(Math.pow(lv, 1.5) * 50));
  };
  const currentLv = forestryState.growthChambers - 1;
  const count = amount === 'max' ? maxAffordable(forestryState.resources.biofiber || new Decimal(0), currentLv, getCost) : amount;
  return calculateBulkCost(getCost, currentLv, count);
}

function calculateMutationCost(amount: number | 'max'): Decimal {
  const getCost = (lv: number): Decimal => {
    return new Decimal(Math.floor(lv * 500));
  };
  const currentLv = (forestryState.mutationChance / 0.01) - 1;
  const count = amount === 'max' ? maxAffordable(forestryState.resources.resinGel || new Decimal(0), currentLv, getCost) : amount;
  return calculateBulkCost(getCost, currentLv, count);
}

function handleOverclock(): void {
  triggerForestryOverclock();
  showToast('Growth Surge activated!', 'warn');
}

let currentDisplayTab = $state('basic');
</script>

<div class="forestry-panel cyberpunk-container">
  <!-- Top Header Section -->
  <div class="panel-header">
    <div class="header-main">
      <div class="glitch-title" data-text="BIO HARVESTER">BIO HARVESTER</div>
      <div class="subtitle">GENETIC RECLAMATION PROTOCOL</div>
    </div>
    <div class="header-stats">
      <div class="stat-card">
        <span class="label">HARVEST</span>
        <span class="value cyan">{formatNumber(forestryState.harvestRate)}/s</span>
      </div>
      <div class="stat-card">
        <span class="label">DNA</span>
        <span class="value green">{formatNumber(forestryState.dnaFragments)}</span>
      </div>
    </div>
  </div>

  {#if !forestryState.unlocked}
    <div class="locked-overlay">
      <div class="lock-icon">🔒</div>
      <div class="lock-text">PROTOCOL ENCRYPTED</div>
      <div class="lock-hint">ACCESS GRANTED AT LEVEL 200</div>
    </div>
  {:else}
    <!-- Status Bars Section -->
    <div class="status-section">
      <div class="status-row">
        <div class="bar-info">
          <span class="bar-label">GROWTH PROGRESS</span>
          <span class="bar-value">{forestryState.harvestRate >= 100 ? 'MAXED' : Math.floor(forestryState.growthProgress) + '%'}</span>
        </div>
        <div class="progress-bar">
          <div class="fill green" style="width: {forestryState.harvestRate >= 100 ? 100 : forestryState.growthProgress}%"></div>
        </div>
      </div>
      <div class="status-row">
        <div class="bar-info">
          <span class="bar-label">NUTRIENT ENERGY</span>
          <span class="bar-value">{Math.floor((forestryState.energy / forestryState.maxEnergy) * 100)}%</span>
        </div>
        <div class="progress-bar">
          <div class="fill blue" style="width: {(forestryState.energy / forestryState.maxEnergy) * 100}%"></div>
        </div>
      </div>
    </div>

    <!-- Main Grid Layout -->
    <div class="panel-grid">
      <!-- Left Column: Primary Actions & Upgrades -->
      <div class="grid-column">
        <div class="section-title">SYSTEM CORE</div>
        <div class="action-buttons">
          <button onclick={upgradeBioTool} class="cyber-btn tool-btn" disabled={forestryState.toolTier >= 10}>
            <div class="btn-content">
              <span class="main">UPGRADE TOOL</span>
              <span class="sub">{forestryState.toolTier >= 10 ? 'TIER MAX' : 'TIER ' + (forestryState.toolTier + 1)}</span>
              <span class="cost">{forestryState.toolTier >= 10 ? '-' : formatNumber(bioTools[forestryState.toolTier]?.dataCost) + ' DNA'}</span>
            </div>
          </button>
          
          <button onclick={handleOverclock} class="cyber-btn surge-btn" disabled={forestryState.isOverclocked}>
            <div class="btn-content">
              <span class="main">GROWTH SURGE</span>
              <span class="sub">{forestryState.isOverclocked ? 'ACTIVE' : 'READY'}</span>
              <span class="cost">25 R-FIBER</span>
            </div>
          </button>

          <button onclick={() => upgradeForestryEnergy(buyAmount)} class="cyber-btn energy-btn">
            <div class="btn-content">
              <span class="main">+ENERGY CAP</span>
              <span class="sub">LVL {Math.floor((forestryState.maxEnergy - 100) / 100)}</span>
              <span class="cost">{formatNumber(calculateEnergyCost(buyAmount))} R-FIBER</span>
            </div>
          </button>
        </div>

        <div class="section-title">CALIBRATION</div>
        <div class="buy-selector-box">
          {#each [1, 10, 100, 1000] as amt}
            <button class="selector-btn" class:active={uiStore.buyAmount === amt} onclick={() => uiStore.buyAmount = amt}>x{amt}</button>
          {/each}
          <button class="selector-btn" class:active={uiStore.buyAmount === 'max'} onclick={() => uiStore.buyAmount = 'max'}>MAX</button>
        </div>

        <div class="upgrades-list">
          {#each ['chainsawFuel', 'ancientSaplings', 'mutationPower', 'overclockPower', 'efficiency', 'reforestation'] as type}
            <button onclick={() => buyForestryUpgrade(type as ForestryUpgradeType, buyAmount)} class="upgrade-card" disabled={type === 'ancientSaplings' && forestryState.ancientSaplings >= 10}>
              <div class="card-info">
                <span class="name">{type.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                <span class="level">LVL {forestryState[type as ForestryUpgradeType]}</span>
              </div>
              <div class="card-cost">{type === 'ancientSaplings' && forestryState.ancientSaplings >= 10 ? 'MAX' : formatNumber(calculateForestryCost(type as ForestryUpgradeType, buyAmount))} DNA</div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Right Column: Logistics & Resources -->
      <div class="grid-column">
        <div class="section-title">BIOME LOGISTICS</div>
        <div class="automation-grid">
          <button onclick={() => addGrowthChamber(buyAmount)} class="auto-card">
            <span class="label">CHAMBERS</span>
            <span class="value">{forestryState.growthChambers}</span>
            <span class="cost">{formatNumber(calculateChamberCost(buyAmount))} BIOFIBER</span>
          </button>
          <button onclick={() => upgradeMutationChance(buyAmount)} class="auto-card">
            <span class="label">MUTATION</span>
            <span class="value">{Math.floor(forestryState.mutationChance * 100)}%</span>
            <span class="cost">{formatNumber(calculateMutationCost(buyAmount))} RESIN</span>
          </button>
        </div>

        <div class="section-title">RESOURCE MATRIX</div>
        <div class="tab-header">
          <button class:active={currentDisplayTab === 'basic'} onclick={() => currentDisplayTab = 'basic'}>BASIC</button>
          <button class:active={currentDisplayTab === 'refined'} onclick={() => currentDisplayTab = 'refined'}>REFINED</button>
          <button class:active={currentDisplayTab === 'advanced'} onclick={() => currentDisplayTab = 'advanced'}>CORE</button>
        </div>

        <div class="resources-scroll-area">
          {#if currentDisplayTab === 'basic'}
            <div class="resource-grid">
              {#each basicTrees as tree}
                <div class="res-card" class:locked={(tree.tier ?? 0) > forestryState.ancientSaplings}>
                  <div class="res-main">
                    <span class="res-name">{tree.name}</span>
                    <span class="res-amt">{formatNumber(forestryState.resources[tree.id] || 0)}</span>
                  </div>
                  <div class="res-actions">
                    <label class="auto-toggle">
                      <input type="checkbox" checked={forestryState.autoRefine[tree.id]} onchange={(e) => forestryState.autoRefine[tree.id] = e.currentTarget.checked}>
                      <span class="slider"></span>
                      <span class="label">AUTO</span>
                    </label>
                    <button class="refine-btn" onclick={() => refineBioSingle(tree.id)} disabled={!forestryState.resources[tree.id] || forestryState.resources[tree.id].lt(25)}>EVOLVE</button>
                  </div>
                </div>
              {/each}
            </div>
          {:else if currentDisplayTab === 'refined'}
            <div class="resource-grid">
              {#each refinedTrees as res}
                <div class="res-card">
                  <div class="res-main">
                    <span class="res-name">{res.name}</span>
                    <span class="res-amt">{formatNumber(forestryState.resources[res.id] || 0)}</span>
                  </div>
                  <div class="res-actions">
                    <label class="auto-toggle">
                      <input type="checkbox" checked={forestryState.autoRefine[res.id]} onchange={(e) => forestryState.autoRefine[res.id] = e.currentTarget.checked}>
                      <span class="slider"></span>
                      <span class="label">AUTO</span>
                    </label>
                    <button class="refine-btn" onclick={() => refineBioSingle(res.id)} disabled={!forestryState.resources[res.id] || forestryState.resources[res.id].lt(25)}>EVOLVE</button>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="resource-grid">
              {#each advancedTrees as res}
                <div class="res-card core-card">
                  <span class="res-name">{res.name}</span>
                  <span class="res-amt highlight">{formatNumber(forestryState.resources[res.id] || 0)}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
.cyberpunk-container {
  background: #050505;
  color: #e0e0e0;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 15px;
  gap: 15px;
  overflow: hidden;
}

/* Header Styles */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #1a1a1a;
  padding-bottom: 10px;
}
.glitch-title {
  font-size: 1.8rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: 2px;
  position: relative;
  text-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
}
.subtitle {
  font-size: 0.7rem;
  color: #666;
  letter-spacing: 1px;
}
.header-stats {
  display: flex;
  gap: 15px;
}
.stat-card {
  background: #111;
  padding: 5px 12px;
  border: 1px solid #222;
  display: flex;
  flex-direction: column;
  min-width: 100px;
}
.stat-card .label { font-size: 0.6rem; color: #555; }
.stat-card .value { font-size: 1.1rem; font-weight: bold; }
.value.cyan { color: #00e5ff; text-shadow: 0 0 5px rgba(0, 229, 255, 0.4); }
.value.green { color: #00ff9d; text-shadow: 0 0 5px rgba(0, 255, 157, 0.4); }

/* Status Bars */
.status-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  background: #0a0a0a;
  padding: 12px;
  border: 1px solid #1a1a1a;
}
.status-row { display: flex; flex-direction: column; gap: 5px; }
.bar-info { display: flex; justify-content: space-between; font-size: 0.65rem; color: #888; }
.progress-bar {
  height: 8px;
  background: #000;
  border: 1px solid #222;
  overflow: hidden;
  border-radius: 2px;
}
.fill { height: 100%; transition: width 0.2s ease; }
.fill.green { background: linear-gradient(90deg, #004422, #00ff9d); box-shadow: 0 0 10px rgba(0, 255, 157, 0.4); }
.fill.blue { background: linear-gradient(90deg, #003366, #00e5ff); box-shadow: 0 0 10px rgba(0, 229, 255, 0.4); }

/* Main Grid */
.panel-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}
.grid-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}
.section-title {
  font-size: 0.75rem;
  font-weight: bold;
  color: #444;
  border-left: 3px solid #00ff9d;
  padding-left: 8px;
  margin-bottom: 4px;
}

/* Buttons */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
.cyber-btn {
  background: #111;
  border: 1px solid #222;
  color: #fff;
  padding: 10px;
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: all 0.2s;
}
.cyber-btn:hover:not(:disabled) {
  background: #161616;
  border-color: #444;
}
.cyber-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-content { display: flex; flex-direction: column; }
.btn-content .main { font-weight: bold; font-size: 0.9rem; }
.btn-content .sub { font-size: 0.65rem; color: #666; }
.btn-content .cost { font-size: 0.75rem; color: #00ff9d; margin-top: 4px; font-family: monospace; }

.surge-btn { border-left: 3px solid #ff0055; }
.energy-btn { border-left: 3px solid #00e5ff; }

/* Selector */
.buy-selector-box {
  display: flex;
  gap: 4px;
}
.selector-btn {
  flex: 1;
  background: #000;
  border: 1px solid #222;
  color: #666;
  font-size: 0.7rem;
  padding: 4px;
  cursor: pointer;
}
.selector-btn.active {
  border-color: #00ff9d;
  color: #00ff9d;
  background: rgba(0, 255, 157, 0.05);
}

/* Upgrades */
.upgrades-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  padding-right: 5px;
}
.upgrade-card {
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.upgrade-card:hover:not(:disabled) { border-color: #333; }
.card-info { display: flex; flex-direction: column; }
.card-info .name { font-size: 0.75rem; color: #ccc; }
.card-info .level { font-size: 0.6rem; color: #555; }
.card-cost { font-size: 0.8rem; color: #00ff9d; font-family: monospace; }

/* Right Column: Logistics & Resources */
.automation-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.auto-card {
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border-top: 2px solid #333;
}
.auto-card:hover { border-top-color: #00ff9d; background: #111; }
.auto-card .label { font-size: 0.6rem; color: #666; }
.auto-card .value { font-size: 1.2rem; font-weight: bold; color: #fff; margin: 4px 0; }
.auto-card .cost { font-size: 0.7rem; color: #00ff9d; font-family: monospace; }

.tab-header {
  display: flex;
  gap: 10px;
  border-bottom: 1px solid #222;
  margin-bottom: 10px;
}
.tab-header button {
  background: none;
  border: none;
  color: #555;
  padding: 6px 15px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
}
.tab-header button.active {
  color: #00ff9d;
  border-bottom: 2px solid #00ff9d;
}

.resources-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding-right: 5px;
}
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}
.res-card {
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.res-card.locked { opacity: 0.3; }
.res-main { display: flex; justify-content: space-between; align-items: baseline; }
.res-name { font-size: 0.75rem; color: #888; text-transform: uppercase; }
.res-amt { font-size: 1rem; font-weight: bold; color: #fff; }
.res-actions { display: flex; justify-content: space-between; align-items: center; }
.refine-btn {
  background: #000;
  border: 1px solid #333;
  color: #fff;
  font-size: 0.65rem;
  padding: 3px 10px;
  cursor: pointer;
}
.refine-btn:hover:not(:disabled) { border-color: #00ff9d; color: #00ff9d; }

.auto-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.6rem;
  color: #555;
}
.auto-toggle input { display: none; }
.auto-toggle .slider {
  width: 24px;
  height: 12px;
  background: #222;
  border-radius: 6px;
  position: relative;
  transition: 0.3s;
}
.auto-toggle .slider::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: #555;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: 0.3s;
}
input:checked + .slider { background: #004422; }
input:checked + .slider::before { background: #00ff9d; transform: translateX(12px); }
input:checked ~ .label { color: #00ff9d; }

.core-card {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-left: 2px solid #00e5ff;
}
.highlight { color: #00e5ff; }

/* Custom Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #050505; }
::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #333; }

/* Animations */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
.fill.green { animation: pulse 2s infinite ease-in-out; }

.locked-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.8);
  border: 1px dashed #333;
  gap: 10px;
}
.lock-icon { font-size: 3rem; }
.lock-text { font-weight: bold; color: #ff0055; letter-spacing: 2px; }
.lock-hint { font-size: 0.8rem; color: #666; }
</style>
