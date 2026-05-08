<script lang="ts">
import {
  forestryState, bioTools, upgradeBioTool, buyForestryUpgrade,
  refineBioSingle, addGrowthChamber, upgradeMutationChance,
  triggerForestryOverclock, upgradeForestryEnergy
} from '../modules/forestry.svelte.js';
import { autoUpgradeForestry } from '../utils/globalMaxUpgrade.js';
import type { ForestryUpgradeType } from '../modules/forestry.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { uiStore, showToast } from '../stores/uiStore.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { calculateBulkCost, invalidateBulkCostCache, type CostFormula } from '../utils/bulkCost.js';
import { maxAffordable } from '../utils/maxAffordable.js';
import { basicTrees, refinedTrees, advancedTrees } from '../data/resources.js';

let buyAmount = $derived(uiStore.buyAmount);

let openSections = $state<Record<string, boolean>>({
  status: true,
  upgrades: true,
  logistics: false,
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

function buyMax(type: ForestryUpgradeType) {
  buyForestryUpgrade(type, 'max');
  invalidateBulkCostCache();
}

let costs = $derived.by(() => {
  const a = buyAmount;
  const dna = forestryState.dnaFragments;
  const reinf = forestryState.resources.reinforcedFiber ?? new Decimal(0);
  const biofiber = forestryState.resources.biofiber ?? new Decimal(0);
  const resin = forestryState.resources.resinGel ?? new Decimal(0);

  return {
    chainsawFuel:    resolveCost({ type: 'linear', base: 0, gain: 500 }, forestryState.chainsawFuel, a, dna),
    reforestation:   resolveCost({ type: 'linear', base: 0, gain: 200 }, forestryState.reforestation, a, dna),
    ancientSaplings: resolveCost({ type: 'geometric', base: 100, multiplier: 10 }, forestryState.ancientSaplings, a === 'max' ? Math.min(100, 10 - forestryState.ancientSaplings) : Math.min(typeof a === 'number' ? a : 10 - forestryState.ancientSaplings, 10 - forestryState.ancientSaplings), dna),
    mutationPower:   resolveCost({ type: 'linear', base: 1500, gain: 1500 }, forestryState.mutationPower ?? 0, a, dna),
    overclockPower:  resolveCost({ type: 'linear', base: 2000, gain: 2000 }, forestryState.overclockPower ?? 0, a, dna),
    efficiency:      resolveCost({ type: 'linear', base: 1000, gain: 1000 }, forestryState.efficiency ?? 0, a, dna),
    energy:          resolveCost({ type: 'linear', base: ((forestryState.maxEnergy - 100) / 100 + 1) * 25, gain: 25 }, 0, a, reinf),
    chamber:         resolveCost((i: number) => new Decimal(Math.floor(Math.pow((forestryState.growthChambers - 1) + i, 1.5) * 50)), 0, a, biofiber),
    mutChance:       resolveCost({ type: 'linear', base: 0, gain: 500 }, (forestryState.mutationChance / 0.01) - 1, a, resin),
    nextTool:        bioTools[forestryState.toolTier]?.dataCost ?? Infinity,
  };
});

function canDna(cost: Decimal | number): boolean { return forestryState.dnaFragments.gte(cost); }
function canRes(key: string, cost: Decimal | number): boolean {
  return (forestryState.resources[key] ?? new Decimal(0)).gte(cost);
}

function doBuy(t: ForestryUpgradeType) { buyForestryUpgrade(t, buyAmount); invalidateBulkCostCache(); }
function doTool() { upgradeBioTool(); invalidateBulkCostCache(); showToast('Bio tool upgraded!', 'success'); }
function doOC() { triggerForestryOverclock(); showToast('Growth Surge active!', 'warn'); }
function doEnergy() { upgradeForestryEnergy(buyAmount); invalidateBulkCostCache(); }
function doMax() { autoUpgradeForestry(); invalidateBulkCostCache(); showToast('Bio-Harvester optimized!', 'success'); }

const UPGRADE_DEFS: Array<{ key: ForestryUpgradeType; label: string; formula: CostFormula; cap?: number }> = [
  { key: 'chainsawFuel',    label: 'Chainsaw Fuel',    formula: { type: 'linear', base: 0, gain: 500 } },
  { key: 'reforestation',   label: 'Reforestation',    formula: { type: 'linear', base: 0, gain: 200 } },
  { key: 'ancientSaplings', label: 'Ancient Saplings', formula: { type: 'geometric', base: 100, multiplier: 10 }, cap: 10 },
  { key: 'mutationPower',   label: 'Mutation Power',   formula: { type: 'linear', base: 1500, gain: 1500 } },
  { key: 'overclockPower',  label: 'OC Power',         formula: { type: 'linear', base: 2000, gain: 2000 } },
  { key: 'efficiency',      label: 'Efficiency',       formula: { type: 'linear', base: 1000, gain: 1000 } },
];

let energyPct = $derived(Math.max(0, Math.min(100,
  (Number(forestryState.energy) / Math.max(1, Number(forestryState.maxEnergy))) * 100
)));
</script>

<div class="panel">
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
        <span class="stat-label">RATE</span>
        <span class="stat-value" style="color:var(--neon-green)">{fmt(forestryState.harvestRate)}/s</span>
      </div>
      <div class="header-stat-box">
        <span class="stat-label">DNA</span>
        <span class="stat-value" style="color:var(--neon-green)">{fmt(forestryState.dnaFragments)}</span>
      </div>
    </div>
  </div>

  {#if !forestryState.unlocked}
    <div class="lock-screen">
      <div class="lock-icon-big">🌿</div>
      <p>Unlocks at Level 200</p>
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
          <span>HARVESTER STATUS</span>
          <span class="acc-arrow">{openSections.status ? '▲' : '▼'}</span>
        </button>
        {#if openSections.status}
          <div class="acc-body">
            <div class="tool-row">
              <span class="muted">TOOL</span>
              <span class="highlight green">{forestryState.toolName}</span>
            </div>

            <div class="bar-group">
              <div class="bar-label-row">
                <span>HARVEST PROGRESS</span>
                {#if forestryState.harvestRate >= 100}
                  <span style="color:var(--neon-green)">{fmt(forestryState.harvestRate)}/s</span>
                {:else}
                  <span>{Math.floor(forestryState.growthProgress)}%</span>
                {/if}
              </div>
              <div class="bar-track">
                <div class="bar-fill green" style="width:{forestryState.harvestRate >= 100 ? 100 : forestryState.growthProgress}%"></div>
              </div>
            </div>

            <div class="bar-group">
              <div class="bar-label-row"><span>NUTRIENT ENERGY</span><span>{energyPct.toFixed(0)}%</span></div>
              <div class="bar-track">
                <div class="bar-fill blue" style="width:{energyPct}%"></div>
              </div>
            </div>

            <div class="three-col">
              <button class="act-btn" onclick={doTool}
                disabled={forestryState.toolTier >= 10 || !canDna(costs.nextTool)}>
                <span class="act-name">UPGRADE TOOL</span>
                <small>{forestryState.toolTier >= 10 ? 'MAX' : fmt(costs.nextTool) + ' DNA'}</small>
              </button>
              <button class="act-btn" onclick={doOC} disabled={forestryState.isOverclocked}>
                <span class="act-name">{forestryState.isOverclocked ? 'SURGE ACTIVE' : 'GROWTH SURGE'}</span>
                <small>25 Reinf.Fiber</small>
              </button>
              <button class="act-btn" onclick={doEnergy}
                disabled={!canRes('reinforcedFiber', costs.energy.cost)}>
                <span class="act-name">+NUTRIENT CAP</span>
                <small>{fmt(costs.energy.cost)} Reinf.Fiber</small>
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
                {@const lv = Number(forestryState[def.key as keyof typeof forestryState] || 0)}
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
                          disabled={!canDna(costData.cost)}>
                          +{buyAmount === 'max' ? costData.count : buyAmount}
                          <span class="btn-cost">{fmt(costData.cost)}</span>
                        </button>
                        <button class="upg-max-btn"
                          onclick={() => buyMax(def.key)}
                          disabled={!canDna(calculateBulkCost(def.formula, lv, 1))}>
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

      <!-- LOGISTICS -->
      <div class="accordion" class:open={openSections.logistics}>
        <button class="acc-head" onclick={() => toggle('logistics')}>
          <span>BIOME LOGISTICS</span>
          <span class="acc-arrow">{openSections.logistics ? '▲' : '▼'}</span>
        </button>
        {#if openSections.logistics}
          <div class="acc-body">
            <div class="upg-list">
              <div class="upg-row">
                <div class="upg-info">
                  <span class="upg-name">Growth Chambers</span>
                  <span class="upg-lv">x{forestryState.growthChambers}</span>
                </div>
                <div class="upg-btns">
                  <button class="upg-buy-btn"
                    onclick={() => { addGrowthChamber(buyAmount); invalidateBulkCostCache(); }}
                    disabled={!canRes('biofiber', costs.chamber.cost)}>
                    +{buyAmount === 'max' ? costs.chamber.count : buyAmount}
                    <span class="btn-cost">{fmt(costs.chamber.cost)} Biofiber</span>
                  </button>
                  <button class="upg-max-btn"
                    onclick={() => { addGrowthChamber('max'); invalidateBulkCostCache(); }}
                    disabled={!canRes('biofiber', new Decimal(Math.floor(Math.pow(forestryState.growthChambers - 1, 1.5) * 50)))}>
                    MAX
                  </button>
                </div>
              </div>
              <div class="upg-row">
                <div class="upg-info">
                  <span class="upg-name">Mutation Chance</span>
                  <span class="upg-lv">{Math.floor(forestryState.mutationChance * 100)}%</span>
                </div>
                <div class="upg-btns">
                  <button class="upg-buy-btn"
                    onclick={() => { upgradeMutationChance(buyAmount); invalidateBulkCostCache(); }}
                    disabled={!canRes('resinGel', costs.mutChance.cost)}>
                    +{buyAmount === 'max' ? costs.mutChance.count : buyAmount}
                    <span class="btn-cost">{fmt(costs.mutChance.cost)} Resin Gel</span>
                  </button>
                  <button class="upg-max-btn"
                    onclick={() => { upgradeMutationChance('max'); invalidateBulkCostCache(); }}
                    disabled={!canRes('resinGel', new Decimal(1))}>
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
                {#each basicTrees as tree (tree.id)}
                  <div class="res-card" class:locked={(tree.tier ?? 0) > forestryState.ancientSaplings}>
                    <span class="res-name">{tree.name}</span>
                    <span class="res-amt">{fmt(forestryState.resources[tree.id] ?? 0)}</span>
                    <div class="res-actions">
                      <label class="mini-toggle">
                        <input type="checkbox"
                          checked={forestryState.autoRefine[tree.id]}
                          onchange={(e) => forestryState.autoRefine[tree.id] = (e.currentTarget as HTMLInputElement).checked}>
                        <span class="mini-slider"></span>
                      </label>
                      <button class="refine-btn"
                        onclick={() => refineBioSingle(tree.id)}
                        disabled={!(forestryState.resources[tree.id]) || forestryState.resources[tree.id].lt(25)}>
                        EVOLVE
                      </button>
                    </div>
                  </div>
                {/each}
              {:else if resourceTab === 'refined'}
                {#each refinedTrees as res (res.id)}
                  <div class="res-card">
                    <span class="res-name">{res.name}</span>
                    <span class="res-amt">{fmt(forestryState.resources[res.id] ?? 0)}</span>
                    <div class="res-actions">
                      <label class="mini-toggle">
                        <input type="checkbox"
                          checked={forestryState.autoRefine[res.id]}
                          onchange={(e) => forestryState.autoRefine[res.id] = (e.currentTarget as HTMLInputElement).checked}>
                        <span class="mini-slider"></span>
                      </label>
                      <button class="refine-btn"
                        onclick={() => refineBioSingle(res.id)}
                        disabled={!(forestryState.resources[res.id]) || forestryState.resources[res.id].lt(25)}>
                        EVOLVE
                      </button>
                    </div>
                  </div>
                {/each}
              {:else}
                {#each advancedTrees as res (res.id)}
                  <div class="res-card">
                    <span class="res-name">{res.name}</span>
                    <span class="res-amt">{fmt(forestryState.resources[res.id] ?? 0)}</span>
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
.amt-btn.active { border-color:var(--neon-green); color:var(--neon-green); }
.auto-up-btn {
  background:rgba(46,204,113,0.08); border:1px solid var(--neon-green);
  color:var(--neon-green); font-family:var(--font-cyber); font-size:0.7rem;
  padding:4px 14px; cursor:pointer; font-weight:bold; letter-spacing:1px; transition:0.15s;
}
.auto-up-btn:hover { background:rgba(46,204,113,0.2); color:#fff; }

.sections { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:6px; padding-right:2px; }

.accordion { border:1px solid var(--border-subtle); background:rgba(0,0,0,0.35); }
.acc-head {
  width:100%; display:flex; justify-content:space-between; align-items:center;
  background:rgba(46,204,113,0.06); border:none; color:var(--neon-green);
  font-family:var(--font-cyber); font-size:0.68rem; letter-spacing:1px;
  padding:8px 12px; cursor:pointer; text-transform:uppercase;
}
.acc-head:hover { background:rgba(46,204,113,0.12); }
.acc-arrow { font-size:0.55rem; }
.acc-body { padding:10px; display:flex; flex-direction:column; gap:8px; }

.tool-row { display:flex; justify-content:space-between; font-size:0.72rem; }
.muted { color:var(--color-muted); }
.highlight { color:var(--neon-blue); font-family:var(--font-cyber); font-weight:bold; }
.highlight.green { color:var(--neon-green); }

.bar-group { display:flex; flex-direction:column; gap:3px; }
.bar-label-row { display:flex; justify-content:space-between; font-size:0.6rem; color:var(--color-muted); font-family:var(--font-cyber); }
.bar-track { height:8px; background:#000; border:1px solid #222; border-radius:2px; overflow:hidden; }
.bar-fill { height:100%; transition:width 0.15s linear; border-radius:1px; }
.bar-fill.green { background:var(--neon-green); box-shadow:0 0 6px var(--neon-green); }
.bar-fill.blue { background:var(--neon-blue); box-shadow:0 0 6px var(--neon-blue); }

.three-col { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; }

.act-btn {
  background:#0d0d0d; border:1px solid #333; padding:8px 6px;
  display:flex; flex-direction:column; gap:2px; cursor:pointer; transition:0.1s; text-align:left;
}
.act-btn:hover:not(:disabled) { border-color:var(--neon-green); background:#141414; }
.act-btn:disabled { opacity:0.4; cursor:not-allowed; }
.act-name { font-size:0.68rem; font-weight:bold; color:#e0e0e0; font-family:var(--font-cyber); }
.act-btn small { font-size:0.58rem; color:#777; }

.upg-list { display:flex; flex-direction:column; gap:5px; }
.upg-row {
  display:flex; justify-content:space-between; align-items:center;
  background:#0a0a0a; border:1px solid #222; padding:8px 10px; transition:border-color 0.1s;
}
.upg-row:not(.at-cap):hover { border-color:#333; }
.upg-row.at-cap { opacity:0.45; }

.upg-info { display:flex; flex-direction:column; gap:2px; min-width:80px; }
.upg-name { font-size:0.72rem; font-weight:bold; color:#ddd; font-family:var(--font-cyber); }
.upg-lv   { font-size:0.6rem; color:var(--neon-green); }

.upg-btns { display:flex; gap:4px; align-items:center; }
.upg-buy-btn {
  background:#111; border:1px solid #333; color:#ccc;
  font-family:var(--font-cyber); font-size:0.65rem; padding:5px 10px;
  cursor:pointer; transition:0.1s; display:flex; flex-direction:column; align-items:center; gap:1px;
  white-space:nowrap;
}
.upg-buy-btn:hover:not(:disabled) { border-color:var(--neon-green); color:#fff; }
.upg-buy-btn:disabled { opacity:0.35; cursor:not-allowed; }
.btn-cost { font-size:0.55rem; color:#888; }

.upg-max-btn {
  background:rgba(46,204,113,0.07); border:1px solid var(--neon-green);
  color:var(--neon-green); font-family:var(--font-cyber); font-size:0.6rem;
  padding:5px 8px; cursor:pointer; transition:0.1s; font-weight:bold; letter-spacing:1px;
}
.upg-max-btn:hover:not(:disabled) { background:rgba(46,204,113,0.18); color:#fff; }
.upg-max-btn:disabled { opacity:0.3; cursor:not-allowed; }

.cap-badge { font-size:0.6rem; color:var(--neon-gold); font-family:var(--font-cyber); padding:4px 8px; border:1px solid var(--neon-gold); opacity:0.7; }

.res-tabs { display:flex; gap:4px; margin-bottom:6px; }
.res-tabs button {
  background:transparent; border:1px solid transparent;
  color:#555; font-size:0.65rem; padding:3px 10px; cursor:pointer;
  font-family:var(--font-cyber); transition:0.1s;
}
.res-tabs button.active { border-color:var(--neon-green); color:var(--neon-green); background:rgba(46,204,113,0.05); }

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
.mini-toggle input:checked + .mini-slider { background:var(--neon-green); }
.mini-toggle input:checked + .mini-slider::before { transform:translateX(10px); }

.refine-btn {
  background:#000; border:1px solid #333; color:#aaa;
  font-size:0.55rem; padding:2px 6px; cursor:pointer; transition:0.1s; font-family:var(--font-cyber);
}
.refine-btn:hover:not(:disabled) { border-color:#fff; color:#fff; }
.refine-btn:disabled { opacity:0.3; cursor:not-allowed; }
</style>