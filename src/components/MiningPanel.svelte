<script lang="ts">
import { miningState, tools, upgradeTool, triggerOverclock, upgradeEnergy, upgradeAutomation, buyMiningUpgrade, refineSingle } from '../modules/mining.svelte.js';
import type { MiningAutomationType, MiningUpgradeType } from '../modules/mining.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { Decimal } from '../systems/decimal.js';
import { basicOres, refinedOres, advancedOres } from '../data/resources.js';
import { uiStore, showToast } from '../stores/uiStore.svelte.js';
import { calculateBulkCost } from '../utils/bulkCost.js';
import { maxAffordable } from '../utils/maxAffordable.js';

let buyAmount = $derived(uiStore.buyAmount);

function handleUpgradeTool(): void { upgradeTool(); showToast('Drill upgraded!', 'success'); }
function handleOverclock(): void { triggerOverclock(); showToast('Overclock activated!', 'warn'); }

function calculateEnergyCost(amount: number | 'max'): Decimal {
  const getCost = (i: number): Decimal => {
    const currentMax = Number(miningState.maxEnergy) + (i * 100);
    return new Decimal((currentMax / 100) * 25);
  };
  const currentLv = (miningState.maxEnergy - 100) / 100;
  const count = amount === 'max' ? maxAffordable(miningState.resources.fuelX, currentLv, getCost) : amount;
  return calculateBulkCost(getCost, currentLv, count);
}

function calculateAutoCost(type: MiningAutomationType, amount: number | 'max'): Decimal {
  const getCost = (lv: number): Decimal => {
    return new Decimal(Math.floor(Math.pow(lv, 1.8) * 100));
  };
  const currentLv = type === 'drone' ? miningState.drones : miningState.autoExtractors;
  const resource = miningState.resources.alloyX;
  const count = amount === 'max' ? maxAffordable(resource, currentLv, getCost) : amount;
  return calculateBulkCost(getCost, currentLv, count);
}

function calculateMiningCost(type: MiningUpgradeType, amount: number | 'max'): Decimal {
  const getCost = (lv: number): Decimal => {
    if (type === 'sharpness')      return new Decimal(lv).mul(1000);
    if (type === 'extraction')     return new Decimal(lv).mul(200);
    if (type === 'discovery')      return new Decimal(10).pow(lv).mul(500);
    if (type === 'sensors')        return new Decimal(lv + 1).mul(2000);
    if (type === 'overclockPower') return new Decimal(lv + 1).mul(2500);
    if (type === 'efficiency')     return new Decimal(lv + 1).mul(1500);
    return new Decimal(0);
  };
  const currentLv = Number(miningState[type] || 0);
  const count = amount === 'max' ? maxAffordable(bestiaryState.dataFragments, currentLv, getCost) : amount;
  return calculateBulkCost(getCost, currentLv, count);
}

let currentDisplayTab = $state('basic');
</script>

<div class="mining-panel cyberpunk-container">
  <!-- Top Header Section -->
  <div class="panel-header">
    <div class="header-main">
      <div class="glitch-title" data-text="MINING RIG">MINING RIG</div>
      <div class="subtitle">DEEP EARTH EXTRACTION UNIT</div>
    </div>
    <div class="header-stats">
      <div class="stat-card">
        <span class="label">MINING RATE</span>
        <span class="value orange">{formatNumber(miningState.minesPerSecond)}/s</span>
      </div>
      <div class="stat-card">
        <span class="label">DATA</span>
        <span class="value gold">{formatNumber(bestiaryState.dataFragments)}</span>
      </div>
    </div>
  </div>

  {#if !miningState.unlocked}
    <div class="locked-overlay">
      <div class="lock-icon">⛏️</div>
      <div class="lock-text">RIG OFFLINE</div>
      <div class="lock-hint">UNLOCKS AT LEVEL 100</div>
    </div>
  {:else}
    <!-- Status Bars Section -->
    <div class="status-section">
      <div class="status-row">
        <div class="bar-info">
          <span class="bar-label">EXTRACTION PROGRESS</span>
          <span class="bar-value">{miningState.minesPerSecond >= 100 ? 'MAXED' : Math.floor(miningState.miningProgress) + '%'}</span>
        </div>
        <div class="progress-bar">
          <div class="fill gold" style="width: {miningState.minesPerSecond >= 100 ? 100 : miningState.miningProgress}%"></div>
        </div>
      </div>
      <div class="status-row">
        <div class="bar-info">
          <span class="bar-label">RIG ENERGY</span>
          <span class="bar-value">{Math.floor((miningState.energy / miningState.maxEnergy) * 100)}%</span>
        </div>
        <div class="progress-bar">
          <div class="fill blue" style="width: {(miningState.energy / miningState.maxEnergy) * 100}%"></div>
        </div>
      </div>
    </div>

    <!-- Main Grid Layout -->
    <div class="panel-grid">
      <!-- Left Column: Primary Actions & Upgrades -->
      <div class="grid-column">
        <div class="section-title">CORE SYSTEMS</div>
        <div class="action-buttons">
          <button onclick={handleUpgradeTool} class="cyber-btn tool-btn" disabled={miningState.toolTier >= 10}>
            <div class="btn-content">
              <span class="main">DRILL UPGRADE</span>
              <span class="sub">{miningState.toolTier >= 10 ? 'TIER MAX' : 'TIER ' + (miningState.toolTier + 1)}</span>
              <span class="cost">{miningState.toolTier >= 10 ? '-' : formatNumber(tools[miningState.toolTier]?.dataCost) + ' DATA'}</span>
            </div>
          </button>
          
          <button onclick={handleOverclock} class="cyber-btn oc-btn" disabled={miningState.isOverclocked}>
            <div class="btn-content">
              <span class="main">OVERCLOCK</span>
              <span class="sub">{miningState.isOverclocked ? 'ACTIVE' : 'READY'}</span>
              <span class="cost">25 FUEL-X</span>
            </div>
          </button>

          <button onclick={() => upgradeEnergy(buyAmount)} class="cyber-btn energy-btn">
            <div class="btn-content">
              <span class="main">+ENERGY CAP</span>
              <span class="sub">LVL {Math.floor((miningState.maxEnergy - 100) / 100)}</span>
              <span class="cost">{formatNumber(calculateEnergyCost(buyAmount))} FUEL-X</span>
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
          {#each ['sharpness', 'extraction', 'discovery', 'sensors', 'overclockPower', 'efficiency'] as type}
            <button onclick={() => buyMiningUpgrade(type as MiningUpgradeType, buyAmount)} class="upgrade-card" disabled={type === 'discovery' && miningState.discovery >= 10}>
              <div class="card-info">
                <span class="name">{type.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                <span class="level">LVL {miningState[type as MiningUpgradeType]}</span>
              </div>
              <div class="card-cost">{type === 'discovery' && miningState.discovery >= 10 ? 'MAX' : formatNumber(calculateMiningCost(type as MiningUpgradeType, buyAmount))} DATA</div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Right Column: Logistics & Resources -->
      <div class="grid-column">
        <div class="section-title">LOGISTICS</div>
        <div class="automation-grid">
          <button onclick={() => upgradeAutomation('drone', buyAmount)} class="auto-card">
            <span class="label">DRONES</span>
            <span class="value">{miningState.drones}</span>
            <span class="cost">{formatNumber(calculateAutoCost('drone', buyAmount))} ALLOY-X</span>
          </button>
          <button onclick={() => upgradeAutomation('extractor', buyAmount)} class="auto-card">
            <span class="label">EXTRACTORS</span>
            <span class="value">{miningState.autoExtractors}</span>
            <span class="cost">{formatNumber(calculateAutoCost('extractor', buyAmount))} ALLOY-X</span>
          </button>
        </div>

        <div class="section-title">ORE MATRIX</div>
        <div class="tab-header">
          <button class:active={currentDisplayTab === 'basic'} onclick={() => currentDisplayTab = 'basic'}>BASIC</button>
          <button class:active={currentDisplayTab === 'refined'} onclick={() => currentDisplayTab = 'refined'}>REFINED</button>
          <button class:active={currentDisplayTab === 'advanced'} onclick={() => currentDisplayTab = 'advanced'}>CORE</button>
        </div>

        <div class="resources-scroll-area">
          {#if currentDisplayTab === 'basic'}
            <div class="resource-grid">
              {#each basicOres as ore}
                <div class="res-card" class:locked={(ore.tier ?? 0) > miningState.discovery}>
                  <div class="res-main">
                    <span class="res-name">{ore.name}</span>
                    <span class="res-amt">{formatNumber(miningState.resources[ore.id] || 0)}</span>
                  </div>
                  <div class="res-actions">
                    <label class="auto-toggle">
                      <input type="checkbox" checked={miningState.autoRefine[ore.id]} onchange={(e) => miningState.autoRefine[ore.id] = e.currentTarget.checked}>
                      <span class="slider"></span>
                      <span class="label">AUTO</span>
                    </label>
                    <button class="refine-btn" onclick={() => refineSingle(ore.id)} disabled={!miningState.resources[ore.id] || miningState.resources[ore.id].lt(50)}>REFINE</button>
                  </div>
                </div>
              {/each}
            </div>
          {:else if currentDisplayTab === 'refined'}
            <div class="resource-grid">
              {#each refinedOres as ore}
                <div class="res-card">
                  <div class="res-main">
                    <span class="res-name">{ore.name}</span>
                    <span class="res-amt">{formatNumber(miningState.resources[ore.id] || 0)}</span>
                  </div>
                  <div class="res-actions">
                    <label class="auto-toggle">
                      <input type="checkbox" checked={miningState.autoRefine[ore.id]} onchange={(e) => miningState.autoRefine[ore.id] = e.currentTarget.checked}>
                      <span class="slider"></span>
                      <span class="label">AUTO</span>
                    </label>
                    <button class="refine-btn" onclick={() => refineSingle(ore.id)} disabled={!miningState.resources[ore.id] || miningState.resources[ore.id].lt(50)}>REFINE</button>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="resource-grid">
              {#each advancedOres as ore}
                <div class="res-card core-card">
                  <span class="res-name">{ore.name}</span>
                  <span class="res-amt highlight">{formatNumber(miningState.resources[ore.id] || 0)}</span>
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
  text-shadow: 0 0 10px rgba(255, 170, 0, 0.3);
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
.value.orange { color: #ff8800; text-shadow: 0 0 5px rgba(255, 136, 0, 0.4); }
.value.gold { color: #ffcc00; text-shadow: 0 0 5px rgba(255, 204, 0, 0.4); }

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
.fill.gold { background: linear-gradient(90deg, #443300, #ffcc00); box-shadow: 0 0 10px rgba(255, 204, 0, 0.4); }
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
  border-left: 3px solid #ffcc00;
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
.btn-content .cost { font-size: 0.75rem; color: #ffcc00; margin-top: 4px; font-family: monospace; }

.oc-btn { border-left: 3px solid #ff0055; }
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
  border-color: #ffcc00;
  color: #ffcc00;
  background: rgba(255, 204, 0, 0.05);
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
.card-cost { font-size: 0.8rem; color: #ffcc00; font-family: monospace; }

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
.auto-card:hover { border-top-color: #ffcc00; background: #111; }
.auto-card .label { font-size: 0.6rem; color: #666; }
.auto-card .value { font-size: 1.2rem; font-weight: bold; color: #fff; margin: 4px 0; }
.auto-card .cost { font-size: 0.7rem; color: #ffcc00; font-family: monospace; }

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
  color: #ffcc00;
  border-bottom: 2px solid #ffcc00;
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
.refine-btn:hover:not(:disabled) { border-color: #ffcc00; color: #ffcc00; }

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
input:checked + .slider { background: #443300; }
input:checked + .slider::before { background: #ffcc00; transform: translateX(12px); }
input:checked ~ .label { color: #ffcc00; }

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
.fill.gold { animation: pulse 2s infinite ease-in-out; }

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
