<script>
import { miningState, tools, upgradeTool, triggerOverclock, upgradeEnergy, upgradeAutomation, buyMiningUpgrade, refineSingle } from '../modules/mining.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { Decimal } from '../systems/decimal.js';
import { basicOres, refinedOres, advancedOres } from '../data/resources.js';
import { uiStore, showToast } from '../stores/uiStore.svelte.js';
import { calculateBulkCost } from '../utils/bulkCost.js';

// Use shared buy amount so it persists across tab switches
let buyAmount = $derived(uiStore.buyAmount);

function handleUpgradeTool() { upgradeTool(); showToast('Drill upgraded!', 'success'); }
function handleOverclock()    { triggerOverclock(); showToast('Overclock activated!', 'warn'); }

function calculateMiningCost(type, amount) {
  const getCost = (lv) => {
    if (type === 'sharpness')      return new Decimal(lv).mul(1000);
    if (type === 'discovery')      return new Decimal(10).pow(lv).mul(500);
    if (type === 'sensors')        return new Decimal(lv).mul(2000);
    if (type === 'overclockPower') return new Decimal(lv).mul(2500);
    if (type === 'efficiency')     return new Decimal(lv).mul(1500);
    return new Decimal(0);
  };
  return calculateBulkCost(getCost, Number(miningState[type] || 0), amount);
}

function calculateEnergyCost(amount) {
  const getCost = (i) => {
    const currentMax = Number(miningState.maxEnergy) + (i * 100);
    return new Decimal((currentMax / 100) * 25);
  };
  return calculateBulkCost(getCost, 0, amount);
}

function calculateAutoCost(type, amount) {
  const isDrone = type === 'drone';
  const getCost = (lv) => new Decimal(lv).mul(isDrone ? 50 : 100);
  return calculateBulkCost(getCost, Number(isDrone ? miningState.drones : miningState.autoExtractors), amount);
}


let currentDisplayTab = $state('basic');
</script>

<div class="panel">
  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">⛏️</div>
      <div class="header-title-box">
        <h2 class="transcended-text">MINING RIG</h2>
        <div class="header-subtitle">RESOURCE EXTRACTION</div>
      </div>
    </div>
    <div class="header-stats">
      <div class="header-stat-box">
        <span class="stat-label">MINING RATE</span>
        <span class="stat-value" style="color: var(--neon-blue);">{formatNumber(miningState.minesPerSecond)}/s</span>
      </div>
      <div class="header-stat-box">
        <span class="stat-label">DATA FRAGS</span>
        <span class="stat-value" style="color: var(--neon-gold);">{formatNumber(bestiaryState.dataFragments)}</span>
      </div>
    </div>
  </div>

  <div class="content-container">
    {#if !miningState.unlocked}
      <div class="locked-msg">
        <div class="lock-icon">⛏️</div>
        <div>Unlocks at Level 100</div>
      </div>
    {:else}
      <div class="mining-status">
        <div class="tool-info">
          <span class="stat-label" style="color: var(--color-muted);">ACTIVE DRILL:</span>
          <span class="highlight" style="font-family: var(--font-cyber); font-size: 0.8rem;">{miningState.toolName}</span>
        </div>

        <div class="bar-group">
          <div class="bar-label">
            <span>EXTRACTION PROGRESS</span>
            {#if miningState.minesPerSecond >= 100}
              <span style="color: var(--neon-gold);">{formatNumber(miningState.minesPerSecond)}/s</span>
            {:else}
              <span>{Math.floor(miningState.miningProgress)}%</span>
            {/if}
          </div>
          <div class="progress-bar-container">
            {#if miningState.minesPerSecond >= 100}
              <div class="progress-fill progress-maxed" style="width: 100%"></div>
            {:else}
              <div class="progress-fill" style="width: {miningState.miningProgress}%"></div>
            {/if}
          </div>
        </div>

        <div class="bar-group">
          <div class="bar-label">
            <span>RIG ENERGY</span>
            <span>{Math.floor((Number(miningState.energy) / Math.max(1, Number(miningState.maxEnergy))) * 100)}%</span>
          </div>
          <div class="energy-bar-container">
            <div class="energy-fill" style="width: {Math.max(0, Math.min(100, (Number(miningState.energy) / Math.max(1, Number(miningState.maxEnergy))) * 100))}%"></div>
          </div>
        </div>
      </div>

      <div class="action-grid">
        <button onclick={handleUpgradeTool} class="btn-u" disabled={miningState.toolTier >= 10}>
          <span class="u-name">DRILL UPGRADE</span>
          <small>{miningState.toolTier >= 10 ? 'MAX' : 'Cost: ' + formatNumber(tools[miningState.toolTier]?.dataCost) + ' DATA'}</small>
        </button>
        <button onclick={handleOverclock} class="btn-u" disabled={miningState.isOverclocked}>
          <span class="u-name">{miningState.isOverclocked ? 'OC ACTIVE' : 'OVERCLOCK'}</span>
          <small>Cost: 25 Fuel-X</small>
        </button>
        <button onclick={() => upgradeEnergy(buyAmount)} class="btn-u">
          <span class="u-name">+ENERGY CAP</span>
          <small>Cost: {formatNumber(calculateEnergyCost(buyAmount))} Fuel-X</small>
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
          <button onclick={() => buyMiningUpgrade('sharpness', buyAmount)} class="btn-u">
            <span class="u-name">Drill Sharpness [Lv.{miningState.sharpness}]</span>
            <small>+Speed Mult | Cost: {formatNumber(calculateMiningCost('sharpness', buyAmount))} Data</small>
          </button>
          <button onclick={() => buyMiningUpgrade('discovery', buyAmount)} class="btn-u" disabled={miningState.discovery >= 10}>
            <span class="u-name">Vein Discovery [Lv.{miningState.discovery}]</span>
            <small>Unlock Ores | Cost: {miningState.discovery >= 10 ? 'MAX' : formatNumber(calculateMiningCost('discovery', buyAmount)) + ' Data'}</small>
          </button>
          <button onclick={() => buyMiningUpgrade('sensors', buyAmount)} class="btn-u">
            <span class="u-name">Resonance Sensors [Lv.{miningState.sensors}]</span>
            <small>+Yield/Crit | Cost: {formatNumber(calculateMiningCost('sensors', buyAmount))} Data</small>
          </button>
          <button onclick={() => buyMiningUpgrade('overclockPower', buyAmount)} class="btn-u">
            <span class="u-name">OC Capacitor [Lv.{miningState.overclockPower}]</span>
            <small>+OC Power | Cost: {formatNumber(calculateMiningCost('overclockPower', buyAmount))} Data</small>
          </button>
          <button onclick={() => buyMiningUpgrade('efficiency', buyAmount)} class="btn-u">
            <span class="u-name">Energy Efficiency [Lv.{miningState.efficiency}]</span>
            <small>-Energy Cost | Cost: {formatNumber(calculateMiningCost('efficiency', buyAmount))} Data</small>
          </button>
        </div>
      </div>

      <div class="automation-section">
        <div class="section-header"><h4 class="transcended-sub">LOGISTICS</h4></div>
        <div class="auto-row">
          <button onclick={() => upgradeAutomation('drone', buyAmount)} class="btn-u">
            <span class="u-name">Drones ({miningState.drones})</span>
            <small>+Flat Speed | Cost: {formatNumber(calculateAutoCost('drone', buyAmount))} Alloy-X</small>
          </button>
          <button onclick={() => upgradeAutomation('extractor', buyAmount)} class="btn-u">
            <span class="u-name">Auto-Extractors ({miningState.autoExtractors})</span>
            <small>+Flat Yield | Cost: {formatNumber(calculateAutoCost('extractor', buyAmount))} Alloy-X</small>
          </button>
        </div>
      </div>

      <div class="resource-tabs">
          <button class:active={currentDisplayTab === 'basic'} onclick={() => currentDisplayTab = 'basic'}>BASIC ORES</button>
          <button class:active={currentDisplayTab === 'refined'} onclick={() => currentDisplayTab = 'refined'}>REFINED</button>
          <button class:active={currentDisplayTab === 'advanced'} onclick={() => currentDisplayTab = 'advanced'}>CORES</button>
      </div>

      <div class="resources-grid">
        {#if currentDisplayTab === 'basic'}
          {#each basicOres as ore (ore.id)}
            <div class="res-item" class:inactive={ore.tier > miningState.discovery}>
              <div class="res-name">{ore.name}</div>
              <div class="res-amount">{formatNumber(miningState.resources[ore.id])}</div>
              <div class="res-actions">
                <label class="toggle-sm">
                  <input type="checkbox" checked={miningState.autoRefine[ore.id]} onchange={(e) => miningState.autoRefine[ore.id] = e.target.checked}>
                  <span class="slider"></span>
                </label>
                <button class="refine-item-btn" onclick={() => refineSingle(ore.id)} disabled={miningState.resources[ore.id].lt(50)}>REFINE</button>
              </div>
            </div>
          {/each}
        {:else if currentDisplayTab === 'refined'}
          {#each refinedOres as ore (ore.id)}
            <div class="res-item">
              <div class="res-name">{ore.name}</div>
              <div class="res-amount">{formatNumber(miningState.resources[ore.id])}</div>
              <div class="res-actions">
                <label class="toggle-sm">
                  <input type="checkbox" checked={miningState.autoRefine[ore.id]} onchange={(e) => miningState.autoRefine[ore.id] = e.target.checked}>
                  <span class="slider"></span>
                </label>
                <button class="refine-item-btn" onclick={() => refineSingle(ore.id)} disabled={miningState.resources[ore.id].lt(50)}>REFINE</button>
              </div>
            </div>
          {/each}
        {:else}
          {#each advancedOres as ore (ore.id)}
            <div class="res-item">
              <div class="res-name">{ore.name}</div>
              <div class="res-amount">{formatNumber(miningState.resources[ore.id])}</div>
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
.content-container { display: flex; flex-direction: column; padding: 10px; gap: 10px; height: 100%; overflow-y: auto; }
.locked-msg { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--color-muted); }
.lock-icon { font-size: 3rem; margin-bottom: 10px; }
.mining-status { display: flex; flex-direction: column; gap: 12px; background: rgba(0,0,0,0.3); padding: 12px; border: 1px solid var(--border-subtle); border-radius: 4px; }
.tool-info { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-bottom: 4px; }
.bar-group { display: flex; flex-direction: column; gap: 4px; }
.bar-label { display: flex; justify-content: space-between; font-size: 0.65rem; font-family: var(--font-cyber); color: var(--color-muted); letter-spacing: 1px; }
.progress-bar-container, .energy-bar-container { height: 10px; background: #000; border: 1px solid #333; position: relative; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--neon-gold); transition: width 0.1s linear; box-shadow: 0 0 10px var(--neon-gold); }
.energy-fill { height: 100%; background: var(--neon-blue); transition: width 0.1s linear; box-shadow: 0 0 10px var(--neon-blue); }
.highlight { color: var(--color-primary); font-weight: bold; }
.action-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.upgrades-section, .automation-section { background: rgba(0,0,0,0.2); padding: 10px; border: 1px solid var(--border-subtle); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.buy-selector { display: flex; gap: 2px; }
.amt-btn { background: #111; border: 1px solid #333; color: #666; font-size: 0.6rem; padding: 2px 6px; cursor: pointer; }
.amt-btn.active { border-color: var(--color-primary); color: var(--color-primary); }
.upgrade-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.auto-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.btn-u { background: #1a1a1a; border: 1px solid #333; color: #ccc; padding: 8px; cursor: pointer; display: flex; flex-direction: column; text-align: left; transition: 0.1s; }
.btn-u:hover:not(:disabled) { border-color: var(--color-primary); background: #222; }
.btn-u:disabled { opacity: 0.5; cursor: not-allowed; }
.u-name { font-size: 0.75rem; font-weight: bold; color: #fff; }
.btn-u small { font-size: 0.6rem; color: #888; margin-top: 2px; }
.resource-tabs { display: flex; gap: 5px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 5px; }
.resource-tabs button { background: transparent; border: 1px solid transparent; color: #666; font-size: 0.7rem; padding: 4px 10px; cursor: pointer; }
.resource-tabs button.active { border-color: var(--color-primary); color: var(--color-primary); background: rgba(0,204,255,0.05); }
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
input:checked + .slider { background: var(--color-primary); }
input:checked + .slider:before { transform: translateX(12px); }
.refine-item-btn { background: #000; border: 1px solid #444; color: #fff; font-size: 0.6rem; padding: 2px 8px; cursor: pointer; }
.refine-item-btn:hover:not(:disabled) { border-color: #fff; }
</style>
