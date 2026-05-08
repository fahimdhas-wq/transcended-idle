<script lang="ts">
import {
  miningState, tools, upgradeTool, triggerOverclock,
  upgradeEnergy, upgradeAutomation, buyMiningUpgrade, refineSingle,
  autoUpgradeMining
} from '../modules/mining.svelte.js';
import type { MiningAutomationType, MiningUpgradeType } from '../modules/mining.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { Decimal } from '../systems/decimal.js';
import { basicOres, refinedOres, advancedOres } from '../data/resources.js';
import { uiStore, showToast } from '../stores/uiStore.svelte.js';
import { calculateBulkCost, invalidateBulkCostCache } from '../utils/bulkCost.js';

let buyAmount = $derived(uiStore.buyAmount);

// Accordion open state
let openSections = $state<Record<string, boolean>>({
  status: true,
  upgrades: true,
  automation: false,
  resources: false,
});
function toggle(key: string) { openSections[key] = !openSections[key]; }

let resourceTab = $state<'basic' | 'refined' | 'advanced'>('basic');

// Derived costs — using optimized formulas where possible to prevent lag
let costs = $derived.by(() => {
  const a = buyAmount;
  return {
    sharpness:    calculateBulkCost({ type: 'linear', base: 0, gain: 1000 }, miningState.sharpness, a),
    extraction:   calculateBulkCost({ type: 'linear', base: 0, gain: 200 }, miningState.extraction, a),
    discovery:    calculateBulkCost({ type: 'geometric', base: 500, multiplier: 10 }, miningState.discovery, Math.min(a, 10 - miningState.discovery)),
    sensors:      calculateBulkCost({ type: 'linear', base: 0, gain: 2000 }, miningState.sensors, a),
    ocPower:      calculateBulkCost({ type: 'linear', base: 0, gain: 2500 }, miningState.overclockPower, a),
    efficiency:   calculateBulkCost({ type: 'linear', base: 0, gain: 1500 }, miningState.efficiency, a),
    energy:       calculateBulkCost({ type: 'linear', base: (miningState.maxEnergy / 100) * 25, gain: 25 }, 0, a),
    drone:        calculateBulkCost({ type: 'linear', base: 0, gain: 50 }, miningState.drones, a),
    extractor:    calculateBulkCost({ type: 'linear', base: 0, gain: 100 }, miningState.autoExtractors, a),
    nextTool:     tools[miningState.toolTier]?.dataCost ?? Infinity,
  };
});

function canAfford(cost: Decimal | number): boolean {
  return bestiaryState.dataFragments.gte(cost);
}
function canAffordRes(res: string, cost: Decimal | number): boolean {
  return (miningState.resources[res] ?? new Decimal(0)).gte(cost);
}

function doBuy(type: MiningUpgradeType) {
  buyMiningUpgrade(type, buyAmount);
  invalidateBulkCostCache();
}
function doUpgradeTool() { upgradeTool(); invalidateBulkCostCache(); showToast('Drill upgraded!', 'success'); }
function doOverclock() { triggerOverclock(); showToast('Overclock active!', 'warn'); }
function doEnergy() { upgradeEnergy(buyAmount); invalidateBulkCostCache(); }
function doAuto(t: MiningAutomationType) { upgradeAutomation(t, buyAmount); invalidateBulkCostCache(); }
function doMax() { autoUpgradeMining(); invalidateBulkCostCache(); showToast('Mining maxed!', 'success'); }

let energyPct = $derived(Math.max(0, Math.min(100,
  (Number(miningState.energy) / Math.max(1, Number(miningState.maxEnergy))) * 100
)));
</script>

<div class="panel">
  <!-- ── HEADER ── -->
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
        <span class="stat-label">RATE</span>
        <span class="stat-value" style="color:var(--neon-blue)">{formatNumber(miningState.minesPerSecond)}/s</span>
      </div>
      <div class="header-stat-box">
        <span class="stat-label">DATA</span>
        <span class="stat-value" style="color:var(--neon-gold)">{formatNumber(bestiaryState.dataFragments)}</span>
      </div>
    </div>
  </div>

  {#if !miningState.unlocked}
    <div class="lock-screen">
      <div class="lock-icon-big">⛏️</div>
      <p>Unlocks at Level 100</p>
    </div>
  {:else}
    <!-- ── BUY SELECTOR + MAX ── -->
    <div class="control-bar">
      <div class="buy-selector">
        {#each [1, 10, 100, 1000, 10000] as amt}
          <button class="amt-btn" class:active={uiStore.buyAmount === amt}
            onclick={() => { uiStore.buyAmount = amt; invalidateBulkCostCache(); }}>
            x{amt}
          </button>
        {/each}
      </div>
      <button class="max-btn" onclick={doMax}>⚡ MAX</button>
    </div>

    <div class="sections">

      <!-- ── STATUS ── -->
      <div class="accordion" class:open={openSections.status}>
        <button class="acc-head" onclick={() => toggle('status')}>
          <span>DRILL STATUS</span>
          <span class="acc-arrow">{openSections.status ? '▲' : '▼'}</span>
        </button>
        {#if openSections.status}
          <div class="acc-body">
            <div class="tool-row">
              <span class="muted">TOOL</span>
              <span class="highlight">{miningState.toolName}</span>
            </div>

            <div class="bar-group">
              <div class="bar-label-row">
                <span>PROGRESS</span>
                {#if miningState.minesPerSecond >= 100}
                  <span style="color:var(--neon-gold)">{formatNumber(miningState.minesPerSecond)}/s</span>
                {:else}
                  <span>{Math.floor(miningState.miningProgress)}%</span>
                {/if}
              </div>
              <div class="bar-track">
                <div class="bar-fill gold" style="width:{miningState.minesPerSecond >= 100 ? 100 : miningState.miningProgress}%"></div>
              </div>
            </div>

            <div class="bar-group">
              <div class="bar-label-row"><span>ENERGY</span><span>{energyPct.toFixed(0)}%</span></div>
              <div class="bar-track">
                <div class="bar-fill blue" style="width:{energyPct}%"></div>
              </div>
            </div>

            <div class="three-col">
              <button class="act-btn" onclick={doUpgradeTool}
                disabled={miningState.toolTier >= 10 || !canAfford(costs.nextTool)}>
                <span class="act-name">UPGRADE DRILL</span>
                <small>{miningState.toolTier >= 10 ? 'MAX' : formatNumber(costs.nextTool) + ' DATA'}</small>
              </button>
              <button class="act-btn" onclick={doOverclock} disabled={miningState.isOverclocked}>
                <span class="act-name">{miningState.isOverclocked ? 'OC ACTIVE' : 'OVERCLOCK'}</span>
                <small>25 Fuel-X</small>
              </button>
              <button class="act-btn" onclick={doEnergy}
                disabled={!canAffordRes('fuelX', costs.energy)}>
                <span class="act-name">+ENERGY CAP</span>
                <small>{formatNumber(costs.energy)} Fuel-X</small>
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- ── UPGRADES ── -->
      <div class="accordion" class:open={openSections.upgrades}>
        <button class="acc-head" onclick={() => toggle('upgrades')}>
          <span>CALIBRATION</span>
          <span class="acc-arrow">{openSections.upgrades ? '▲' : '▼'}</span>
        </button>
        {#if openSections.upgrades}
          <div class="acc-body">
            <div class="upg-grid">
              <button class="upg-btn" onclick={() => doBuy('sharpness')}
                disabled={!canAfford(costs.sharpness)}>
                <span class="upg-name">Sharpness <span class="upg-lv">Lv.{miningState.sharpness}</span></span>
                <small class="upg-cost">{formatNumber(costs.sharpness)} DATA</small>
              </button>

              <button class="upg-btn" onclick={() => doBuy('extraction')}
                disabled={!canAfford(costs.extraction)}>
                <span class="upg-name">Extraction <span class="upg-lv">Lv.{miningState.extraction}</span></span>
                <small class="upg-cost">{formatNumber(costs.extraction)} DATA</small>
              </button>

              <button class="upg-btn" onclick={() => doBuy('discovery')}
                disabled={miningState.discovery >= 10 || !canAfford(costs.discovery)}>
                <span class="upg-name">Discovery <span class="upg-lv">Lv.{miningState.discovery}/10</span></span>
                <small class="upg-cost">{miningState.discovery >= 10 ? 'MAX' : formatNumber(costs.discovery) + ' DATA'}</small>
              </button>

              <button class="upg-btn" onclick={() => doBuy('sensors')}
                disabled={!canAfford(costs.sensors)}>
                <span class="upg-name">Sensors <span class="upg-lv">Lv.{miningState.sensors}</span></span>
                <small class="upg-cost">{formatNumber(costs.sensors)} DATA</small>
              </button>

              <button class="upg-btn" onclick={() => doBuy('overclockPower')}
                disabled={!canAfford(costs.ocPower)}>
                <span class="upg-name">OC Capacitor <span class="upg-lv">Lv.{miningState.overclockPower}</span></span>
                <small class="upg-cost">{formatNumber(costs.ocPower)} DATA</small>
              </button>

              <button class="upg-btn" onclick={() => doBuy('efficiency')}
                disabled={!canAfford(costs.efficiency)}>
                <span class="upg-name">Efficiency <span class="upg-lv">Lv.{miningState.efficiency}</span></span>
                <small class="upg-cost">{formatNumber(costs.efficiency)} DATA</small>
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- ── AUTOMATION ── -->
      <div class="accordion" class:open={openSections.automation}>
        <button class="acc-head" onclick={() => toggle('automation')}>
          <span>LOGISTICS</span>
          <span class="acc-arrow">{openSections.automation ? '▲' : '▼'}</span>
        </button>
        {#if openSections.automation}
          <div class="acc-body">
            <div class="two-col">
              <button class="upg-btn" onclick={() => doAuto('drone')}
                disabled={!canAffordRes('alloyX', costs.drone)}>
                <span class="upg-name">Drones <span class="upg-lv">({miningState.drones})</span></span>
                <small class="upg-cost">{formatNumber(costs.drone)} Alloy-X</small>
              </button>
              <button class="upg-btn" onclick={() => doAuto('extractor')}
                disabled={!canAffordRes('alloyX', costs.extractor)}>
                <span class="upg-name">Extractors <span class="upg-lv">({miningState.autoExtractors})</span></span>
                <small class="upg-cost">{formatNumber(costs.extractor)} Alloy-X</small>
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- ── RESOURCES ── -->
      <div class="accordion" class:open={openSections.resources}>
        <button class="acc-head" onclick={() => toggle('resources')}>
          <span>RESOURCES</span>
          <span class="acc-arrow">{openSections.resources ? '▲' : '▼'}</span>
        </button>
        {#if openSections.resources}
          <div class="acc-body">
            <div class="res-tabs">
              {#each (['basic','refined','advanced'] as const) as t}
                <button class:active={resourceTab === t} onclick={() => resourceTab = t}>
                  {t.toUpperCase()}
                </button>
              {/each}
            </div>

            <div class="res-grid">
              {#if resourceTab === 'basic'}
                {#each basicOres as ore (ore.id)}
                  <div class="res-card" class:locked={(ore.tier ?? 0) > miningState.discovery}>
                    <span class="res-name">{ore.name}</span>
                    <span class="res-amt">{formatNumber(miningState.resources[ore.id] ?? 0)}</span>
                    <div class="res-actions">
                      <label class="mini-toggle">
                        <input type="checkbox"
                          checked={miningState.autoRefine[ore.id]}
                          onchange={(e) => miningState.autoRefine[ore.id] = (e.currentTarget as HTMLInputElement).checked}>
                        <span class="mini-slider"></span>
                      </label>
                      <button class="refine-btn"
                        onclick={() => refineSingle(ore.id)}
                        disabled={(miningState.resources[ore.id] ?? new Decimal(0)).lt(50)}>
                        REFINE
                      </button>
                    </div>
                  </div>
                {/each}
              {:else if resourceTab === 'refined'}
                {#each refinedOres as ore (ore.id)}
                  <div class="res-card">
                    <span class="res-name">{ore.name}</span>
                    <span class="res-amt">{formatNumber(miningState.resources[ore.id] ?? 0)}</span>
                    <div class="res-actions">
                      <label class="mini-toggle">
                        <input type="checkbox"
                          checked={miningState.autoRefine[ore.id]}
                          onchange={(e) => miningState.autoRefine[ore.id] = (e.currentTarget as HTMLInputElement).checked}>
                        <span class="mini-slider"></span>
                      </label>
                      <button class="refine-btn"
                        onclick={() => refineSingle(ore.id)}
                        disabled={(miningState.resources[ore.id] ?? new Decimal(0)).lt(50)}>
                        REFINE
                      </button>
                    </div>
                  </div>
                {/each}
              {:else}
                {#each advancedOres as ore (ore.id)}
                  <div class="res-card">
                    <span class="res-name">{ore.name}</span>
                    <span class="res-amt">{formatNumber(miningState.resources[ore.id] ?? 0)}</span>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        {/if}
      </div>

    </div>
  {/if}
</div>

<style>
.panel { display:flex; flex-direction:column; height:100%; }

.lock-screen {
  flex:1; display:flex; flex-direction:column; align-items:center;
  justify-content:center; color:var(--color-muted); gap:8px;
}
.lock-icon-big { font-size:3rem; }

/* ── Controls ── */
.control-bar {
  display:flex; align-items:center; justify-content:space-between;
  padding:6px 0 8px; border-bottom:1px solid var(--border-subtle); margin-bottom:4px;
  flex-shrink:0;
}
.buy-selector { display:flex; gap:3px; }
.amt-btn {
  background:#111; border:1px solid #333; color:#666;
  font-size:0.6rem; padding:3px 8px; cursor:pointer;
  font-family:var(--font-cyber); transition:0.1s;
}
.amt-btn.active { border-color:var(--neon-blue); color:var(--neon-blue); }
.max-btn {
  background:rgba(0,190,255,0.1); border:1px solid var(--neon-blue);
  color:var(--neon-blue); font-family:var(--font-cyber); font-size:0.7rem;
  padding:4px 14px; cursor:pointer; font-weight:bold; transition:0.15s;
}
.max-btn:hover { background:rgba(0,190,255,0.22); color:#fff; }

/* ── Sections scrollable container ── */
.sections { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:6px; padding-right:2px; }

/* ── Accordion ── */
.accordion { border:1px solid var(--border-subtle); background:rgba(0,0,0,0.35); }
.acc-head {
  width:100%; display:flex; justify-content:space-between; align-items:center;
  background:rgba(0,190,255,0.06); border:none; color:var(--neon-blue);
  font-family:var(--font-cyber); font-size:0.68rem; letter-spacing:1px;
  padding:8px 12px; cursor:pointer; text-transform:uppercase;
}
.acc-head:hover { background:rgba(0,190,255,0.12); }
.acc-arrow { font-size:0.55rem; }
.acc-body { padding:10px; display:flex; flex-direction:column; gap:8px; }

/* ── Tool status ── */
.tool-row { display:flex; justify-content:space-between; font-size:0.72rem; }
.muted { color:var(--color-muted); }
.highlight { color:var(--neon-blue); font-family:var(--font-cyber); font-weight:bold; }

.bar-group { display:flex; flex-direction:column; gap:3px; }
.bar-label-row { display:flex; justify-content:space-between; font-size:0.6rem; color:var(--color-muted); font-family:var(--font-cyber); }
.bar-track { height:8px; background:#000; border:1px solid #222; border-radius:2px; overflow:hidden; }
.bar-fill { height:100%; transition:width 0.15s linear; border-radius:1px; }
.bar-fill.gold { background:var(--neon-gold); box-shadow:0 0 6px var(--neon-gold); }
.bar-fill.blue { background:var(--neon-blue); box-shadow:0 0 6px var(--neon-blue); }

.three-col { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; }
.two-col   { display:grid; grid-template-columns:1fr 1fr; gap:6px; }

.act-btn {
  background:#0d0d0d; border:1px solid #333; padding:8px 6px;
  display:flex; flex-direction:column; gap:2px; cursor:pointer; transition:0.1s; text-align:left;
}
.act-btn:hover:not(:disabled) { border-color:var(--neon-blue); background:#141414; }
.act-btn:disabled { opacity:0.4; cursor:not-allowed; }
.act-name { font-size:0.68rem; font-weight:bold; color:#e0e0e0; font-family:var(--font-cyber); }
.act-btn small { font-size:0.58rem; color:#777; }

/* ── Upgrade grid ── */
.upg-grid { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
.upg-btn {
  background:#0d0d0d; border:1px solid #2a2a2a; padding:9px 8px;
  display:flex; flex-direction:column; gap:3px; cursor:pointer; transition:0.1s; text-align:left;
}
.upg-btn:hover:not(:disabled) { border-color:var(--neon-gold); background:#141414; }
.upg-btn:disabled { opacity:0.38; cursor:not-allowed; }
.upg-name { font-size:0.7rem; font-weight:bold; color:#ddd; font-family:var(--font-cyber); }
.upg-lv { color:var(--neon-blue); font-size:0.62rem; }
.upg-cost { font-size:0.58rem; color:#888; margin-top:1px; }

/* ── Resources ── */
.res-tabs { display:flex; gap:4px; margin-bottom:6px; }
.res-tabs button {
  background:transparent; border:1px solid transparent;
  color:#555; font-size:0.65rem; padding:3px 10px; cursor:pointer;
  font-family:var(--font-cyber); transition:0.1s;
}
.res-tabs button.active { border-color:var(--neon-gold); color:var(--neon-gold); background:rgba(255,200,0,0.05); }

.res-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; }
.res-card {
  background:#0a0a0a; border:1px solid #222; padding:7px 6px;
  display:flex; flex-direction:column; align-items:center; gap:3px;
}
.res-card.locked { opacity:0.2; pointer-events:none; }
.res-name { font-size:0.58rem; color:#777; text-align:center; text-transform:uppercase; }
.res-amt { font-size:0.82rem; color:#fff; font-weight:bold; font-family:var(--font-cyber); }
.res-actions { display:flex; gap:5px; align-items:center; }

.mini-toggle { display:inline-block; width:22px; height:12px; position:relative; cursor:pointer; }
.mini-toggle input { display:none; }
.mini-slider {
  position:absolute; inset:0; background:#2a2a2a;
  border-radius:6px; transition:0.2s;
}
.mini-slider::before {
  content:''; position:absolute; width:8px; height:8px;
  background:#fff; border-radius:50%; top:2px; left:2px; transition:0.2s;
}
.mini-toggle input:checked + .mini-slider { background:var(--neon-blue); }
.mini-toggle input:checked + .mini-slider::before { transform:translateX(10px); }

.refine-btn {
  background:#000; border:1px solid #333; color:#aaa;
  font-size:0.55rem; padding:2px 6px; cursor:pointer; transition:0.1s;
  font-family:var(--font-cyber);
}
.refine-btn:hover:not(:disabled) { border-color:#fff; color:#fff; }
.refine-btn:disabled { opacity:0.3; cursor:not-allowed; }
</style>
