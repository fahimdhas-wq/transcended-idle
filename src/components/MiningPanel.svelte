<script lang="ts">
import {
  miningState, tools, upgradeTool, triggerOverclock,
  upgradeEnergy, upgradeAutomation, buyMiningUpgrade, refineSingle
} from '../modules/mining.svelte.js';
import { autoUpgradeMining } from '../utils/globalMaxUpgrade.js';
import type { MiningAutomationType, MiningUpgradeType } from '../modules/mining.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { Decimal } from '../systems/decimal.js';
import { basicOres, refinedOres, advancedOres } from '../data/resources.js';
import { uiStore, showToast } from '../stores/uiStore.svelte.js';
import { calculateBulkCost, invalidateBulkCostCache, type CostFormula } from '../utils/bulkCost.js';
import { maxAffordable } from '../utils/maxAffordable.js';

let buyAmount = $derived(uiStore.buyAmount);

let openSections = $state<Record<string, boolean>>({
  status: true,
  upgrades: true,
  automation: false,
  resources: false,
});
function toggle(key: string) { openSections[key] = !openSections[key]; }

let resourceTab = $state<'basic' | 'refined' | 'advanced'>('basic');

function fmt(v: any) { return formatValue(v); }

function resolveCost(formula: CostFormula, currentLevel: number, amount: number | 'max', budget: Decimal): { cost: Decimal, count: number } {
  const count = amount === 'max' ? maxAffordable(budget, currentLevel, formula).toNumber() : amount;
  const cost = calculateBulkCost(formula, currentLevel, count);
  return { cost, count };
}

function buyMax(type: MiningUpgradeType) {
  buyMiningUpgrade(type, 'max');
  invalidateBulkCostCache();
}

let costs = $derived.by(() => {
  const a = buyAmount;
  const data = bestiaryState.dataFragments;
  const fuel = miningState.resources.fuelX;
  const alloy = miningState.resources.alloyX;

  return {
    sharpness:      resolveCost({ type: 'linear', base: 0, gain: 1000 }, miningState.sharpness, a, data),
    extraction:     resolveCost({ type: 'linear', base: 0, gain: 200 }, miningState.extraction, a, data),
    discovery:      resolveCost({ type: 'geometric', base: 500, multiplier: 10 }, miningState.discovery, a === 'max' ? Math.min(100, 10 - miningState.discovery) : Math.min(typeof a === 'number' ? a : 10 - miningState.discovery, 10 - miningState.discovery), data),
    sensors:        resolveCost({ type: 'linear', base: 2000, gain: 2000 }, miningState.sensors, a, data),
    overclockPower: resolveCost({ type: 'linear', base: 2500, gain: 2500 }, miningState.overclockPower, a, data),
    efficiency:     resolveCost({ type: 'linear', base: 1500, gain: 1500 }, miningState.efficiency, a, data),
    energy:         resolveCost({ type: 'linear', base: ((miningState.maxEnergy - 100) / 100 + 1) * 25, gain: 25 }, 0, a, fuel),
    drone:          resolveCost({ type: 'linear', base: 0, gain: 50 }, miningState.drones, a, alloy),
    extractor:      resolveCost({ type: 'linear', base: 0, gain: 100 }, miningState.autoExtractors, a, alloy),
    nextTool:       tools[miningState.toolTier]?.dataCost ?? Infinity,
  };
});

function canAfford(cost: Decimal | number): boolean { return bestiaryState.dataFragments.gte(cost); }
function canAffordRes(res: string, cost: Decimal | number): boolean { return (miningState.resources[res] ?? new Decimal(0)).gte(cost); }

function doBuy(type: MiningUpgradeType) { buyMiningUpgrade(type, buyAmount); invalidateBulkCostCache(); }
function doUpgradeTool() { upgradeTool(); invalidateBulkCostCache(); showToast('Drill upgraded!', 'success'); }
function doOverclock() { triggerOverclock(); showToast('Overclock active!', 'warn'); }
function doEnergy() { upgradeEnergy(buyAmount); invalidateBulkCostCache(); }
function doAuto(t: MiningAutomationType) { upgradeAutomation(t, buyAmount); invalidateBulkCostCache(); }
function doMax() { autoUpgradeMining(); invalidateBulkCostCache(); showToast('Mining Rig optimized!', 'success'); }

const UPGRADE_DEFS: Array<{ key: MiningUpgradeType; label: string; cap?: number }> = [
  { key: 'sharpness',      label: 'Sharpness'       },
  { key: 'extraction',     label: 'Extraction'      },
  { key: 'discovery',      label: 'Discovery',  cap: 10 },
  { key: 'sensors',        label: 'Sensors'         },
  { key: 'overclockPower', label: 'OC Power'        },
  { key: 'efficiency',     label: 'Efficiency'      },
];

let energyPct = $derived(Math.max(0, Math.min(100,
  (Number(miningState.energy) / Math.max(1, Number(miningState.maxEnergy))) * 100
)));

const DISCOVERY_FORMULA = { type: 'geometric', base: 500, multiplier: 10 };
</script>

<div class="mining-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#9935;</div>
      <div class="header-text">
        <h2 class="transcended-text">MINING RIG</h2>
        <span class="transcended-sub">RESOURCE EXTRACTION</span>
      </div>
    </div>
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">RATE</span>
        <span class="stat-value accent-steel">{fmt(miningState.minesPerSecond)}/s</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">DATA</span>
        <span class="stat-value accent-warning">{fmt(bestiaryState.dataFragments)}</span>
      </div>
    </div>
  </div>

  {#if !miningState.unlocked}
    <div class="lock-screen">
      <div class="lock-icon">&#9935;</div>
      <p class="lock-title">LOCKED</p>
      <p class="lock-sub">Unlocks at Level 100</p>
    </div>
  {:else}
    <div class="control-strip">
      <div class="buy-selector">
        {#each [1, 10, 100, 1000, 10000] as amt}
          <button class="amt-btn" class:active={uiStore.buyAmount === amt}
            onclick={() => { uiStore.buyAmount = amt; invalidateBulkCostCache(); }}>
            x{amt}
          </button>
        {/each}
      </div>
      <button class="auto-up-btn" onclick={doMax}>AUTO UP</button>
    </div>

    <div class="sections">

      <!-- STATUS -->
      <div class="accordion" class:open={openSections.status}>
        <button class="acc-head" onclick={() => toggle('status')}>
          <span>DRILL STATUS</span>
          <span class="acc-arrow">{openSections.status ? '&#9650;' : '&#9660;'}</span>
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
                  <span class="accent-warning">{fmt(miningState.minesPerSecond)}/s</span>
                {:else}
                  <span>{Math.floor(miningState.miningProgress)}%</span>
                {/if}
              </div>
              <div class="bar-track">
                <div class="bar-fill accent-warning" style="width:{miningState.minesPerSecond >= 100 ? 100 : miningState.miningProgress}%"></div>
              </div>
            </div>

            <div class="bar-group">
              <div class="bar-label-row"><span>ENERGY</span><span>{energyPct.toFixed(0)}%</span></div>
              <div class="bar-track">
                <div class="bar-fill accent-steel" style="width:{energyPct}%"></div>
              </div>
            </div>

            <div class="three-col">
              <button class="act-btn" onclick={doUpgradeTool}
                disabled={miningState.toolTier >= 10 || !canAfford(costs.nextTool)}>
                <span class="act-name">UPGRADE DRILL</span>
                <small>{miningState.toolTier >= 10 ? 'MAX' : fmt(costs.nextTool) + ' DATA'}</small>
              </button>
              <button class="act-btn" onclick={doOverclock} disabled={miningState.isOverclocked}>
                <span class="act-name">{miningState.isOverclocked ? 'OC ACTIVE' : 'OVERCLOCK'}</span>
                <small>25 Fuel-X</small>
              </button>
              <button class="act-btn" onclick={doEnergy}
                disabled={!canAffordRes('fuelX', costs.energy.cost)}>
                <span class="act-name">+ENERGY CAP</span>
                <small>{fmt(costs.energy.cost)} Fuel-X</small>
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- UPGRADES -->
      <div class="accordion" class:open={openSections.upgrades}>
        <button class="acc-head" onclick={() => toggle('upgrades')}>
          <span>CALIBRATION</span>
          <span class="acc-arrow">{openSections.upgrades ? '&#9650;' : '&#9660;'}</span>
        </button>
        {#if openSections.upgrades}
          <div class="acc-body">
            <div class="upg-list">
              {#each UPGRADE_DEFS as def (def.key)}
                {@const costData = costs[def.key as keyof typeof costs]}
                {@const lv = miningState[def.key]}
                {@const atCap = def.cap !== undefined && lv >= def.cap}
                {#if costData && typeof costData === 'object' && 'cost' in costData}
                  <div class="upg-row" class:at-cap={atCap}>
                    <div class="upg-info">
                      <span class="upg-name">{def.label}</span>
                      <span class="upg-lv">Lv.{fmt(miningState[def.key])}{atCap ? ' MAX' : ''}</span>
                    </div>
                    <div class="upg-btns">
                      {#if !atCap}
                        <button class="upg-buy-btn"
                          onclick={() => doBuy(def.key)}
                          disabled={!canAfford(costData.cost)}>
                          +{buyAmount === 'max' ? costData.count : buyAmount}
                          <span class="btn-cost">{fmt(costData.cost)}</span>
                        </button>
                        <button class="upg-max-btn"
                          onclick={() => buyMax(def.key)}
                          disabled={!canAfford(resolveCost(
                            def.key === 'sharpness' ? { type: 'linear', base: 0, gain: 1000 } :
                            def.key === 'extraction' ? { type: 'linear', base: 0, gain: 200 } :
                            def.key === 'discovery' ? DISCOVERY_FORMULA :
                            def.key === 'sensors' ? { type: 'linear', base: 2000, gain: 2000 } :
                            def.key === 'overclockPower' ? { type: 'linear', base: 2500, gain: 2500 } :
                            { type: 'linear', base: 1500, gain: 1500 },
                            lv, 1, bestiaryState.dataFragments).cost)}>
                          MAX
                        </button>
                      {:else}
                        <span class="cap-badge">MAXED</span>
                      {/if}
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- AUTOMATION -->
      <div class="accordion" class:open={openSections.automation}>
        <button class="acc-head" onclick={() => toggle('automation')}>
          <span>LOGISTICS</span>
          <span class="acc-arrow">{openSections.automation ? '&#9650;' : '&#9660;'}</span>
        </button>
        {#if openSections.automation}
          <div class="acc-body">
            <div class="upg-list">
              <div class="upg-row">
                <div class="upg-info">
                  <span class="upg-name">Drones</span>
                  <span class="upg-lv">Lv.{fmt(miningState.drones)}</span>
                </div>
                <div class="upg-btns">
                  <button class="upg-buy-btn" onclick={() => doAuto('drone')}
                    disabled={!canAffordRes('alloyX', costs.drone.cost)}>
                    +{buyAmount === 'max' ? costs.drone.count : buyAmount}
                    <span class="btn-cost">{fmt(costs.drone.cost)} Alloy-X</span>
                  </button>
                  <button class="upg-max-btn" onclick={() => { upgradeAutomation('drone', 'max'); invalidateBulkCostCache(); }}
                    disabled={!canAffordRes('alloyX', calculateBulkCost({ type: 'linear', base: 0, gain: 50 }, miningState.drones, 1))}>
                    MAX
                  </button>
                </div>
              </div>
              <div class="upg-row">
                <div class="upg-info">
                  <span class="upg-name">Extractors</span>
                  <span class="upg-lv">Lv.{fmt(miningState.autoExtractors)}</span>
                </div>
                <div class="upg-btns">
                  <button class="upg-buy-btn" onclick={() => doAuto('extractor')}
                    disabled={!canAffordRes('alloyX', costs.extractor.cost)}>
                    +{buyAmount === 'max' ? costs.extractor.count : buyAmount}
                    <span class="btn-cost">{fmt(costs.extractor.cost)} Alloy-X</span>
                  </button>
                  <button class="upg-max-btn" onclick={() => { upgradeAutomation('extractor', 'max'); invalidateBulkCostCache(); }}
                    disabled={!canAffordRes('alloyX', calculateBulkCost({ type: 'linear', base: 0, gain: 100 }, miningState.autoExtractors, 1))}>
                    MAX
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- RESOURCES -->
      <div class="accordion" class:open={openSections.resources}>
        <button class="acc-head" onclick={() => toggle('resources')}>
          <span>RESOURCES</span>
          <span class="acc-arrow">{openSections.resources ? '&#9650;' : '&#9660;'}</span>
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
                    <span class="res-amt">{fmt(miningState.resources[ore.id] ?? 0)}</span>
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
                    <span class="res-amt">{fmt(miningState.resources[ore.id] ?? 0)}</span>
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
                    <span class="res-amt">{fmt(miningState.resources[ore.id] ?? 0)}</span>
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
  .mining-panel { display:flex; flex-direction:column; height:100%; }

  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0; flex-wrap: wrap; gap: 8px;
  }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-icon { font-size: 1rem; color: var(--accent-steel); }
  .header-text { display: flex; flex-direction: column; gap: 1px; }
  .header-stats { display: flex; gap: 16px; }
  .stat-item { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .stat-label { font-family: var(--font-display); font-size: 0.56rem; font-weight: 600; letter-spacing: 0.14em; color: var(--color-muted); }
  .stat-value { font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; font-variant-numeric: tabular-nums; }
  .accent-steel { color: var(--accent-steel); }
  .accent-warning { color: var(--accent-warning); }

  .lock-screen { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--color-muted); gap:8px; }
  .lock-icon { font-size:3rem; color: var(--color-dim); }
  .lock-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; letter-spacing: 0.12em; color: var(--color-dim); margin: 0; }
  .lock-sub { font-size: 0.7rem; color: var(--color-dim); margin: 0; }

  .control-strip {
    display:flex; align-items:center; justify-content:space-between;
    padding:8px 14px; border-bottom:1px solid var(--border-subtle); flex-shrink:0;
  }
  .buy-selector { display:flex; gap:2px; }
  .amt-btn {
    background:transparent; border:1px solid var(--border-subtle); color:var(--color-muted);
    font-family:var(--font-display); font-size:0.6rem; font-weight:600; letter-spacing:0.08em;
    padding:3px 8px; cursor:pointer; transition:border-color var(--t-fast), color var(--t-fast);
  }
  .amt-btn.active { border-color:var(--accent-steel); color:var(--accent-steel); }
  .amt-btn:hover:not(.active) { border-color:var(--border-mid); color:var(--color-text); }
  .auto-up-btn {
    background:transparent; border:1px solid var(--accent-steel); color:var(--accent-steel);
    font-family:var(--font-display); font-size:0.66rem; font-weight:700; letter-spacing:0.1em;
    padding:4px 14px; cursor:pointer; transition:background var(--t-fast), color var(--t-fast);
  }
  .auto-up-btn:hover { background:rgba(90,138,170,0.1); color:var(--accent-white); }

  .sections { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:4px; padding: 8px; }

  .accordion { border:1px solid var(--border-subtle); background:var(--panel-bg); }
  .acc-head {
    width:100%; display:flex; justify-content:space-between; align-items:center;
    background:transparent; border:none; color:var(--accent-steel);
    font-family:var(--font-display); font-size:0.65rem; font-weight:700; letter-spacing:0.1em;
    padding:8px 12px; cursor:pointer; text-transform:uppercase;
    transition:background var(--t-fast), color var(--t-fast);
  }
  .acc-head:hover { background:rgba(90,138,170,0.06); }
  .accordion.open .acc-head { border-bottom: 1px solid var(--border-subtle); }
  .acc-arrow { font-size:0.55rem; }
  .acc-body { padding:10px; display:flex; flex-direction:column; gap:8px; }

  .tool-row { display:flex; justify-content:space-between; font-size:0.72rem; }
  .muted { color:var(--color-muted); font-family:var(--font-display); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.08em; }
  .highlight { color:var(--accent-steel); font-family:var(--font-display); font-weight:700; letter-spacing: 0.06em; }

  .bar-group { display:flex; flex-direction:column; gap:3px; }
  .bar-label-row { display:flex; justify-content:space-between; font-size:0.6rem; color:var(--color-muted); font-family:var(--font-display); letter-spacing: 0.06em; }
  .bar-track { height:6px; background:var(--panel-inset); border:1px solid var(--border-subtle); overflow:hidden; }
  .bar-fill { height:100%; transition:width var(--t-mid); }
  .bar-fill.accent-warning { background:var(--accent-warning); }
  .bar-fill.accent-steel { background:var(--accent-steel); }

  .three-col { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; }
  .act-btn {
    background:transparent; border:1px solid var(--border-mid); padding:8px 6px;
    display:flex; flex-direction:column; gap:2px; cursor:pointer; transition:border-color var(--t-fast);
    text-align:left;
  }
  .act-btn:hover:not(:disabled) { border-color:var(--accent-steel); }
  .act-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .act-name { font-size:0.65rem; font-weight:700; color:var(--color-text); font-family:var(--font-display); letter-spacing:0.06em; }
  .act-btn small { font-size:0.58rem; color:var(--color-muted); }

  .upg-list { display:flex; flex-direction:column; gap:4px; }
  .upg-row {
    display:flex; justify-content:space-between; align-items:center;
    background:var(--panel-inset); padding:8px 10px;
    border-left:2px solid var(--accent-steel);
    transition:border-color var(--t-fast);
  }
  .upg-row:hover:not(.at-cap) { border-left-color:var(--accent-white); }
  .upg-row.at-cap { border-left-color:var(--accent-warning); opacity:0.6; }

  .upg-info { display:flex; flex-direction:column; gap:1px; min-width:80px; }
  .upg-name { font-size:0.68rem; font-weight:700; color:var(--color-text); font-family:var(--font-display); letter-spacing:0.04em; }
  .upg-lv   { font-size:0.6rem; color:var(--accent-steel); }

  .upg-btns { display:flex; gap:5px; align-items:center; }
  .upg-buy-btn {
    background:transparent; border:1px solid var(--border-mid); color:var(--color-text);
    font-family:var(--font-display); font-size:0.62rem; font-weight:600; letter-spacing:0.06em;
    padding:5px 10px; cursor:pointer; transition:border-color var(--t-fast);
    white-space:nowrap; min-width:70px; text-align:center;
  }
  .upg-buy-btn:hover:not(:disabled) { border-color:var(--accent-white); }
  .upg-buy-btn:disabled { opacity:0.35; cursor:not-allowed; }
  .btn-cost { font-size:0.55rem; color:var(--color-muted); margin-left:3px; }

  .upg-max-btn {
    background:transparent; border:1px solid var(--border-mid); color:var(--color-muted);
    font-family:var(--font-display); font-size:0.62rem; font-weight:600; letter-spacing:0.06em;
    padding:5px 10px; cursor:pointer; transition:border-color var(--t-fast), color var(--t-fast);
    white-space:nowrap; min-width:70px; text-align:center;
  }
  .upg-max-btn:hover:not(:disabled) { border-color:var(--accent-steel); color:var(--accent-steel); }
  .upg-max-btn:disabled { opacity:0.35; cursor:not-allowed; }

  .cap-badge {
    font-size:0.6rem; color:var(--accent-warning); font-family:var(--font-display); font-weight:700; letter-spacing:0.08em;
    padding:4px 8px; border:1px solid var(--accent-warning);
    background:transparent;
  }

  .res-tabs { display:flex; gap:4px; margin-bottom:6px; }
  .res-tabs button {
    background:transparent; border:1px solid transparent;
    color:#555; font-size:0.62rem; padding:3px 10px; cursor:pointer;
    font-family:var(--font-display); font-weight:600; letter-spacing:0.08em; transition:border-color var(--t-fast), color var(--t-fast);
  }
  .res-tabs button.active { border-color:var(--accent-warning); color:var(--accent-warning); }
  .res-tabs button:hover:not(.active) { color:var(--color-text); }

  .res-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; }
  .res-card {
    background:var(--panel-inset); border:1px solid var(--border-subtle); padding:7px 6px;
    display:flex; flex-direction:column; align-items:center; gap:3px;
    transition:opacity var(--t-fast);
  }
  .res-card.locked { opacity:0.2; pointer-events:none; }
  .res-name { font-size:0.58rem; color:var(--color-muted); text-align:center; text-transform:uppercase; font-family:var(--font-display); font-weight:600; letter-spacing:0.06em; }
  .res-amt { font-size:0.82rem; color:var(--accent-white); font-weight:700; font-family:var(--font-mono); font-variant-numeric: tabular-nums; }
  .res-actions { display:flex; gap:5px; align-items:center; }

  .mini-toggle { display:inline-block; width:22px; height:12px; position:relative; cursor:pointer; }
  .mini-toggle input { display:none; }
  .mini-slider { position:absolute; inset:0; background:var(--border-mid); transition:background var(--t-mid); }
  .mini-slider::before {
    content:''; position:absolute; width:8px; height:8px;
    background:var(--color-dim); top:2px; left:2px; transition:transform var(--t-mid);
  }
  .mini-toggle input:checked + .mini-slider { background:var(--accent-steel); }
  .mini-toggle input:checked + .mini-slider::before { transform:translateX(10px); background:var(--accent-white); }

  .refine-btn {
    background:transparent; border:1px solid var(--border-mid); color:var(--color-muted);
    font-size:0.55rem; padding:2px 6px; cursor:pointer; transition:border-color var(--t-fast), color var(--t-fast);
    font-family:var(--font-display); font-weight:600; letter-spacing:0.06em;
  }
  .refine-btn:hover:not(:disabled) { border-color:var(--accent-white); color:var(--accent-white); }
  .refine-btn:disabled { opacity:0.3; cursor:not-allowed; }
</style>
