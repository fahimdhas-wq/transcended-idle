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

// Per-upgrade individual MAX
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
  { key: 'efficiency',      label: 'Efficiency'      },
];

let energyPct = $derived(Math.max(0, Math.min(100,
  (Number(miningState.energy) / Math.max(1, Number(miningState.maxEnergy))) * 100
)));
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
        <span class="stat-label">RATE</span>
        <span class="stat-value" style="color:var(--neon-blue)">{fmt(miningState.minesPerSecond)}/s</span>
      </div>
      <div class="header-stat-box">
        <span class="stat-label">DATA</span>
        <span class="stat-value" style="color:var(--neon-gold)">{fmt(bestiaryState.dataFragments)}</span>
      </div>
    </div>
  </div>

  {#if !miningState.unlocked}
    <div class="lock-screen">
      <div class="lock-icon-big">⛏️</div>
      <p>Unlocks at Level 100</p>
    </div>
  {:else}
    <div class="control-bar">
      <div class="buy-selector">
        {#each [1, 10, 100, 1000] as amt}
          <button class="amt-btn" class:active={uiStore.buyAmount === amt}
            onclick={() => { uiStore.buyAmount = amt; invalidateBulkCostCache(); }}>
            x{amt}
          </button>
        {/each}
        <button class="amt-btn" class:active={uiStore.buyAmount === 'max'}
            onclick={() => { uiStore.buyAmount = 'max'; invalidateBulkCostCache(); }}>
            MAX
        </button>
      </div>
      <button class="auto-up-btn" onclick={doMax}>AUTO UP</button>
    </div>

    <div class="sections">

      <!-- STATUS -->
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
                  <span style="color:var(--neon-gold)">{fmt(miningState.minesPerSecond)}/s</span>
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
          <span class="acc-arrow">{openSections.upgrades ? '▲' : '▼'}</span>
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
                      <span class="upg-lv">Lv.{lv}{atCap ? ' MAX' : ''}</span>
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
                            def.key === 'discovery' ? { type: 'geometric', base: 500, multiplier: 10 } :
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
          <span class="acc-arrow">{openSections.automation ? '▲' : '▼'}</span>
        </button>
        {#if openSections.automation}
          <div class="acc-body">
            <div class="upg-list">
              <div class="upg-row">
                <div class="upg-info">
                  <span class="upg-name">Drones</span>
                  <span class="upg-lv">x{miningState.drones}</span>
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
                  <span class="upg-lv">x{miningState.autoExtractors}</span>
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
.panel { display:flex; flex-direction:column; height:100%; }

.lock-screen {
  flex:1; display:flex; flex-direction:column; align-items:center;
  justify-content:center; color:var(--color-muted); gap:8px;
}
.lock-icon-big { font-size:3rem; }

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
.auto-up-btn {
  background:rgba(0,190,255,0.08); border:1px solid var(--neon-blue);
  color:var(--neon-blue); font-family:var(--font-cyber); font-size:0.7rem;
  padding:4px 14px; cursor:pointer; font-weight:bold; letter-spacing:1px; transition:0.15s;
}
.auto-up-btn:hover { background:rgba(0,190,255,0.2); color:#fff; }

.sections { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:6px; padding-right:2px; }

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

.act-btn {
  background:#0d0d0d; border:1px solid #333; padding:8px 6px;
  display:flex; flex-direction:column; gap:2px; cursor:pointer; transition:0.1s; text-align:left;
}
.act-btn:hover:not(:disabled) { border-color:var(--neon-blue); background:#141414; }
.act-btn:disabled { opacity:0.4; cursor:not-allowed; }
.act-name { font-size:0.68rem; font-weight:bold; color:#e0e0e0; font-family:var(--font-cyber); }
.act-btn small { font-size:0.58rem; color:#777; }

/* ── Upgrade list (new style) ── */
.upg-list { display:flex; flex-direction:column; gap:5px; }

.upg-row {
  display:flex; justify-content:space-between; align-items:center;
  background:#0a0a0a; border:1px solid #222; padding:8px 10px;
  transition: border-color 0.1s;
}
.upg-row:not(.at-cap):hover { border-color:#333; }
.upg-row.at-cap { opacity:0.45; }

.upg-info { display:flex; flex-direction:column; gap:2px; min-width:80px; }
.upg-name { font-size:0.72rem; font-weight:bold; color:#ddd; font-family:var(--font-cyber); }
.upg-lv   { font-size:0.6rem; color:var(--neon-blue); }

.upg-btns { display:flex; gap:4px; align-items:center; }

.upg-buy-btn {
  background:#111; border:1px solid #333; color:#ccc;
  font-family:var(--font-cyber); font-size:0.65rem; padding:5px 10px;
  cursor:pointer; transition:0.1s; display:flex; flex-direction:column; align-items:center; gap:1px;
  white-space:nowrap;
}
.upg-buy-btn:hover:not(:disabled) { border-color:var(--neon-gold); color:#fff; }
.upg-buy-btn:disabled { opacity:0.35; cursor:not-allowed; }
.btn-cost { font-size:0.55rem; color:#888; }

.upg-max-btn {
  background:rgba(0,190,255,0.07); border:1px solid var(--neon-blue);
  color:var(--neon-blue); font-family:var(--font-cyber); font-size:0.6rem;
  padding:5px 8px; cursor:pointer; transition:0.1s; font-weight:bold; letter-spacing:1px;
}
.upg-max-btn:hover:not(:disabled) { background:rgba(0,190,255,0.18); color:#fff; }
.upg-max-btn:disabled { opacity:0.3; cursor:not-allowed; }

.cap-badge { font-size:0.6rem; color:var(--neon-gold); font-family:var(--font-cyber); padding:4px 8px; border:1px solid var(--neon-gold); opacity:0.7; }

/* Resources */
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
.mini-slider { position:absolute; inset:0; background:#2a2a2a; border-radius:6px; transition:0.2s; }
.mini-slider::before {
  content:''; position:absolute; width:8px; height:8px;
  background:#fff; border-radius:50%; top:2px; left:2px; transition:0.2s;
}
.mini-toggle input:checked + .mini-slider { background:var(--neon-blue); }
.mini-toggle input:checked + .mini-slider::before { transform:translateX(10px); }

.refine-btn {
  background:#000; border:1px solid #333; color:#aaa;
  font-size:0.55rem; padding:2px 6px; cursor:pointer; transition:0.1s; font-family:var(--font-cyber);
}
.refine-btn:hover:not(:disabled) { border-color:#fff; color:#fff; }
.refine-btn:disabled { opacity:0.3; cursor:not-allowed; }
</style>