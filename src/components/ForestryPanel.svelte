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
import { calculateBulkCost, type CostFormula } from '../utils/bulkCost.js';
import { maxAffordable } from '../utils/maxAffordable.js';
import { basicTrees, refinedTrees, advancedTrees } from '../data/resources.js';

let buyAmount = $derived(uiStore.buyAmount);
let resources = $derived(forestryState.resources);

// Core state refs - single source of truth
let dnaFragments = $derived(forestryState.dnaFragments);
let harvestRate = $derived(forestryState.harvestRate);
let growthProgress = $derived(forestryState.growthProgress);
let energy = $derived(forestryState.energy);
let maxEnergy = $derived(forestryState.maxEnergy);
let unlocked = $derived(forestryState.unlocked);
let toolName = $derived(forestryState.toolName);
let toolTier = $derived(forestryState.toolTier);
let isOverclocked = $derived(forestryState.isOverclocked);
let ancientSaplings = $derived(forestryState.ancientSaplings);
let growthChambers = $derived(forestryState.growthChambers);
let mutationChance = $derived(forestryState.mutationChance);
let autoRefine = $derived(forestryState.autoRefine);

// Upgrade levels
let chainsawFuel = $derived(forestryState.chainsawFuel);
let reforestation = $derived(forestryState.reforestation);
let mutationPower = $derived(forestryState.mutationPower);
let overclockPower = $derived(forestryState.overclockPower);
let efficiency = $derived(forestryState.efficiency);

// Section state
let openSections = $state({ status: true, upgrades: true, logistics: false, resources: false });
function toggle(key: string) { openSections[key] = !openSections[key]; }

let resourceTab = $state<'basic' | 'refined' | 'advanced'>('basic');

// Actions
function doBuy(t: ForestryUpgradeType) { buyForestryUpgrade(t, buyAmount); }
function doTool() { upgradeBioTool(); showToast('Bio tool upgraded!', 'success'); }
function doOC() { triggerForestryOverclock(); showToast('Growth Surge active!', 'warn'); }
function doEnergy() { upgradeForestryEnergy(buyAmount); }
function doMax() { autoUpgradeForestry(); showToast('Bio-Harvester optimized!', 'success'); }

// Cost calculations - computed on demand, cached inline
function costLinear(level: number, base: number, gain: number, budget: Decimal): Decimal {
  const count = buyAmount === 'max' ? maxAffordable(budget, level, { type: 'linear', base, gain }).toNumber() : buyAmount;
  return calculateBulkCost({ type: 'linear', base, gain }, level, count);
}
function costGeo(level: number, cap: number, budget: Decimal): Decimal {
  const amt = buyAmount === 'max' ? Math.min(cap, cap - level) : buyAmount;
  return calculateBulkCost({ type: 'geometric', base: 100, multiplier: 10 }, level, amt);
}

// Helper
function fmt(v: any): string { return formatValue(v); }
function getRes(id: string): Decimal { return resources[id] || new Decimal(0); }
</script>

<div class="forestry-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#127807;</div>
      <div class="header-text">
        <h2 class="transcended-text">BIO HARVESTER</h2>
        <span class="transcended-sub">ORGANIC SYNTHESIS</span>
      </div>
    </div>
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">RATE</span>
        <span class="stat-value accent-green">{fmt(harvestRate)}/s</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">DNA</span>
        <span class="stat-value accent-green">{fmt(dnaFragments)}</span>
      </div>
    </div>
  </div>

  {#if !unlocked}
    <div class="lock-screen">
      <div class="lock-icon">&#127807;</div>
      <p class="lock-title">LOCKED</p>
      <p class="lock-sub">Unlocks at Level 200</p>
    </div>
  {:else}
    <div class="control-strip">
      <div class="buy-selector">
        {#each [1, 10, 100, 1000, 10000] as amt}
          <button class="amt-btn" class:active={buyAmount === amt}
            onclick={() => uiStore.buyAmount = amt}>
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
          <span>HARVESTER STATUS</span>
        </button>
        {#if openSections.status}
          <div class="acc-body">
            <div class="tool-row">
              <span class="muted">TOOL</span>
              <span class="highlight">{toolName}</span>
            </div>

            <div class="bar-group">
              <div class="bar-label-row">
                <span>HARVEST PROGRESS</span>
                <span>{Math.floor(growthProgress)}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill accent-green" style="width:{Math.min(100, growthProgress)}%"></div>
              </div>
            </div>

            <div class="bar-group">
              <div class="bar-label-row">
                <span>NUTRIENT ENERGY</span>
                <span>{Math.floor((energy / Math.max(1, maxEnergy)) * 100)}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill accent-steel" style="width:{(energy / Math.max(1, maxEnergy)) * 100}%"></div>
              </div>
            </div>

            <div class="three-col">
              <button class="act-btn" onclick={doTool}
                disabled={toolTier >= 10 || !dnaFragments.gte(bioTools[toolTier]?.dataCost ?? Infinity)}>
                <span class="act-name">UPGRADE TOOL</span>
                <small>{toolTier >= 10 ? 'MAX' : fmt(bioTools[toolTier]?.dataCost ?? 0) + ' DNA'}</small>
              </button>
              <button class="act-btn" onclick={doOC} disabled={isOverclocked}>
                <span class="act-name">{isOverclocked ? 'SURGE ACTIVE' : 'GROWTH SURGE'}</span>
                <small>25 Reinf.Fiber</small>
              </button>
              <button class="act-btn" onclick={doEnergy}
                disabled={!(resources.reinforcedFiber) || resources.reinforcedFiber.lt(costLinear(0, ((maxEnergy - 100) / 100 + 1) * 25, 25, resources.reinforcedFiber))}>
                <span class="act-name">+NUTRIENT CAP</span>
                <small>{fmt(costLinear(0, ((maxEnergy - 100) / 100 + 1) * 25, 25, resources.reinforcedFiber || new Decimal(0)))} Reinf.Fiber</small>
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- UPGRADES -->
      <div class="accordion" class:open={openSections.upgrades}>
        <button class="acc-head" onclick={() => toggle('upgrades')}>
          <span>CALIBRATION</span>
        </button>
        {#if openSections.upgrades}
          <div class="acc-body">
            <div class="upg-list">
              <div class="upg-row">
                <div class="upg-info">
                  <span class="upg-name">Chainsaw Fuel</span>
                  <span class="upg-lv">Lv.{chainsawFuel}</span>
                </div>
                <div class="upg-btns">
                  <button class="upg-buy-btn" onclick={doBuy} data-type="chainsawFuel"
                    disabled={!dnaFragments.gte(costLinear(chainsawFuel, 0, 500, dnaFragments))}>
                    +{buyAmount}
                    <span class="btn-cost">{fmt(costLinear(chainsawFuel, 0, 500, dnaFragments))}</span>
                  </button>
                  <button class="upg-max-btn" onclick={() => buyForestryUpgrade('chainsawFuel', 'max')}>
                    MAX
                  </button>
                </div>
              </div>

              <div class="upg-row">
                <div class="upg-info">
                  <span class="upg-name">Reforestation</span>
                  <span class="upg-lv">Lv.{reforestation}</span>
                </div>
                <div class="upg-btns">
                  <button class="upg-buy-btn" onclick={() => doBuy('reforestation')}
                    disabled={!dnaFragments.gte(costLinear(reforestation, 0, 200, dnaFragments))}>
                    +{buyAmount}
                    <span class="btn-cost">{fmt(costLinear(reforestation, 0, 200, dnaFragments))}</span>
                  </button>
                  <button class="upg-max-btn" onclick={() => buyForestryUpgrade('reforestation', 'max')}>
                    MAX
                  </button>
                </div>
              </div>

              <div class="upg-row" class:at-cap={ancientSaplings >= 10}>
                <div class="upg-info">
                  <span class="upg-name">Ancient Saplings</span>
                  <span class="upg-lv">Lv.{ancientSaplings}{ancientSaplings >= 10 ? ' MAX' : ''}</span>
                </div>
                <div class="upg-btns">
                  {#if ancientSaplings < 10}
                    <button class="upg-buy-btn" onclick={() => doBuy('ancientSaplings')}
                      disabled={!dnaFragments.gte(costGeo(ancientSaplings, 10, dnaFragments))}>
                      +{buyAmount}
                      <span class="btn-cost">{fmt(costGeo(ancientSaplings, 10, dnaFragments))}</span>
                    </button>
                    <button class="upg-max-btn" onclick={() => buyForestryUpgrade('ancientSaplings', 'max')}>
                      MAX
                    </button>
                  {:else}
                    <span class="cap-badge">MAXED</span>
                  {/if}
                </div>
              </div>

              <div class="upg-row">
                <div class="upg-info">
                  <span class="upg-name">Mutation Power</span>
                  <span class="upg-lv">Lv.{mutationPower}</span>
                </div>
                <div class="upg-btns">
                  <button class="upg-buy-btn" onclick={() => doBuy('mutationPower')}
                    disabled={!dnaFragments.gte(costLinear(mutationPower, 1500, 1500, dnaFragments))}>
                    +{buyAmount}
                    <span class="btn-cost">{fmt(costLinear(mutationPower, 1500, 1500, dnaFragments))}</span>
                  </button>
                  <button class="upg-max-btn" onclick={() => buyForestryUpgrade('mutationPower', 'max')}>
                    MAX
                  </button>
                </div>
              </div>

              <div class="upg-row">
                <div class="upg-info">
                  <span class="upg-name">OC Power</span>
                  <span class="upg-lv">Lv.{overclockPower}</span>
                </div>
                <div class="upg-btns">
                  <button class="upg-buy-btn" onclick={() => doBuy('overclockPower')}
                    disabled={!dnaFragments.gte(costLinear(overclockPower, 2000, 2000, dnaFragments))}>
                    +{buyAmount}
                    <span class="btn-cost">{fmt(costLinear(overclockPower, 2000, 2000, dnaFragments))}</span>
                  </button>
                  <button class="upg-max-btn" onclick={() => buyForestryUpgrade('overclockPower', 'max')}>
                    MAX
                  </button>
                </div>
              </div>

              <div class="upg-row">
                <div class="upg-info">
                  <span class="upg-name">Efficiency</span>
                  <span class="upg-lv">Lv.{efficiency}</span>
                </div>
                <div class="upg-btns">
                  <button class="upg-buy-btn" onclick={() => doBuy('efficiency')}
                    disabled={!dnaFragments.gte(costLinear(efficiency, 1000, 1000, dnaFragments))}>
                    +{buyAmount}
                    <span class="btn-cost">{fmt(costLinear(efficiency, 1000, 1000, dnaFragments))}</span>
                  </button>
                  <button class="upg-max-btn" onclick={() => buyForestryUpgrade('efficiency', 'max')}>
                    MAX
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- LOGISTICS -->
      <div class="accordion" class:open={openSections.logistics}>
        <button class="acc-head" onclick={() => toggle('logistics')}>
          <span>BIOME LOGISTICS</span>
        </button>
        {#if openSections.logistics}
          <div class="acc-body">
            <div class="upg-list">
              <div class="upg-row">
                <div class="upg-info">
                  <span class="upg-name">Growth Chambers</span>
                  <span class="upg-lv">Lv.{growthChambers}</span>
                </div>
                <div class="upg-btns">
                  <button class="upg-buy-btn" onclick={() => addGrowthChamber(buyAmount)}
                    disabled={!(resources.biofiber) || resources.biofiber.lt(costLinear(0, 0, 1, resources.biofiber))}>
                    +{buyAmount}
                    <span class="btn-cost">{fmt(costLinear(0, 0, 1, resources.biofiber || new Decimal(0)))} Biofiber</span>
                  </button>
                  <button class="upg-max-btn" onclick={() => addGrowthChamber('max')}>
                    MAX
                  </button>
                </div>
              </div>

              <div class="upg-row">
                <div class="upg-info">
                  <span class="upg-name">Mutation Chance</span>
                  <span class="upg-lv">{Math.floor(mutationChance * 100)}%</span>
                </div>
                <div class="upg-btns">
                  <button class="upg-buy-btn" onclick={() => upgradeMutationChance(buyAmount)}
                    disabled={!(resources.resinGel) || resources.resinGel.lt(costLinear(0, 0, 500, resources.resinGel))}>
                    +{buyAmount}
                    <span class="btn-cost">{fmt(costLinear(0, 0, 500, resources.resinGel || new Decimal(0)))} Resin Gel</span>
                  </button>
                  <button class="upg-max-btn" onclick={() => upgradeMutationChance('max')}>
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
                  <div class="res-card" class:locked={(tree.tier ?? 0) > ancientSaplings}>
                    <span class="res-name">{tree.name}</span>
                    <span class="res-amt">{fmt(getRes(tree.id))}</span>
                    <div class="res-actions">
                      <label class="mini-toggle">
                        <input type="checkbox"
                          checked={autoRefine[tree.id]}
                          onchange={(e) => autoRefine[tree.id] = (e.currentTarget as HTMLInputElement).checked}>
                        <span class="mini-slider"></span>
                      </label>
                      <button class="refine-btn"
                        onclick={() => refineBioSingle(tree.id)}
                        disabled={!getRes(tree.id).gte(25)}>
                        EVOLVE
                      </button>
                    </div>
                  </div>
                {/each}
              {:else if resourceTab === 'refined'}
                {#each refinedTrees as res (res.id)}
                  <div class="res-card">
                    <span class="res-name">{res.name}</span>
                    <span class="res-amt">{fmt(getRes(res.id))}</span>
                    <div class="res-actions">
                      <label class="mini-toggle">
                        <input type="checkbox"
                          checked={autoRefine[res.id]}
                          onchange={(e) => autoRefine[res.id] = (e.currentTarget as HTMLInputElement).checked}>
                        <span class="mini-slider"></span>
                      </label>
                      <button class="refine-btn"
                        onclick={() => refineBioSingle(res.id)}
                        disabled={!getRes(res.id).gte(25)}>
                        EVOLVE
                      </button>
                    </div>
                  </div>
                {/each}
              {:else}
                {#each advancedTrees as res (res.id)}
                  <div class="res-card">
                    <span class="res-name">{res.name}</span>
                    <span class="res-amt">{fmt(getRes(res.id))}</span>
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
  .forestry-panel { display:flex; flex-direction:column; height:100%; }

  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0; flex-wrap: wrap; gap: 8px;
  }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-icon { font-size: 1rem; color: var(--accent-green); }
  .header-text { display: flex; flex-direction: column; gap: 1px; }
  .header-stats { display: flex; gap: 16px; }
  .stat-item { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .stat-label { font-family: var(--font-display); font-size: 0.56rem; font-weight: 600; letter-spacing: 0.14em; color: var(--color-muted); }
  .stat-value { font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; font-variant-numeric: tabular-nums; }
  .accent-green { color: var(--accent-green); }
  .accent-steel { color: var(--accent-steel); }

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
  .amt-btn.active { border-color:var(--accent-green); color:var(--accent-green); }
  .amt-btn:hover:not(.active) { border-color:var(--border-mid); color:var(--color-text); }
  .auto-up-btn {
    background:transparent; border:1px solid var(--accent-green); color:var(--accent-green);
    font-family:var(--font-display); font-size:0.66rem; font-weight:700; letter-spacing:0.1em;
    padding:4px 14px; cursor:pointer; transition:background var(--t-fast), color var(--t-fast);
  }
  .auto-up-btn:hover { background:rgba(0,204,102,0.1); color:var(--accent-white); }

  .sections { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:4px; padding: 8px; }

  .accordion { border:1px solid var(--border-subtle); background:var(--panel-bg); }
  .acc-head {
    width:100%; display:flex; justify-content:space-between; align-items:center;
    background:transparent; border:none; color:var(--accent-green);
    font-family:var(--font-display); font-size:0.65rem; font-weight:700; letter-spacing:0.1em;
    padding:8px 12px; cursor:pointer; text-transform:uppercase;
    transition:background var(--t-fast), color var(--t-fast);
  }
  .acc-head:hover { background:rgba(0,204,102,0.06); }
  .accordion.open .acc-head { border-bottom: 1px solid var(--border-subtle); }
  .acc-body { padding:10px; display:flex; flex-direction:column; gap:8px; }

  .tool-row { display:flex; justify-content:space-between; font-size:0.72rem; }
  .muted { color:var(--color-muted); font-family:var(--font-display); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.08em; }
  .highlight { color:var(--accent-green); font-family:var(--font-display); font-weight:700; letter-spacing: 0.06em; }

  .bar-group { display:flex; flex-direction:column; gap:3px; }
  .bar-label-row { display:flex; justify-content:space-between; font-size:0.6rem; color:var(--color-muted); font-family:var(--font-display); letter-spacing: 0.06em; }
  .bar-track { height:6px; background:var(--panel-inset); border:1px solid var(--border-subtle); overflow:hidden; }
  .bar-fill { height:100%; transition:width var(--t-mid); }
  .bar-fill.accent-green { background:var(--accent-green); }
  .bar-fill.accent-steel { background:var(--accent-steel); }

  .three-col { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; }
  .act-btn {
    background:transparent; border:1px solid var(--border-mid); padding:8px 6px;
    display:flex; flex-direction:column; gap:2px; cursor:pointer; transition:border-color var(--t-fast);
    text-align:left;
  }
  .act-btn:hover:not(:disabled) { border-color:var(--accent-green); }
  .act-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .act-name { font-size:0.65rem; font-weight:700; color:var(--color-text); font-family:var(--font-display); letter-spacing:0.06em; }
  .act-btn small { font-size:0.58rem; color:var(--color-muted); }

  .upg-list { display:flex; flex-direction:column; gap:4px; }
  .upg-row {
    display:flex; justify-content:space-between; align-items:center;
    background:var(--panel-inset); padding:8px 10px;
    border-left:2px solid var(--accent-green);
  }
  .upg-row.at-cap { border-left-color:var(--accent-warning); opacity:0.6; }
  .upg-info { display:flex; flex-direction:column; gap:1px; min-width:80px; }
  .upg-name { font-size:0.68rem; font-weight:700; color:var(--color-text); font-family:var(--font-display); letter-spacing:0.04em; }
  .upg-lv   { font-size:0.6rem; color:var(--accent-green); }

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
  .upg-max-btn:hover:not(:disabled) { border-color:var(--accent-green); color:var(--accent-green); }
  .upg-max-btn:disabled { opacity:0.35; cursor:not-allowed; }

  .cap-badge {
    font-size:0.6rem; color:var(--accent-warning); font-family:var(--font-display); font-weight:700; letter-spacing:0.08em;
    padding:4px 8px; border:1px solid var(--accent-warning); background:transparent;
  }

  .res-tabs { display:flex; gap:4px; margin-bottom:6px; }
  .res-tabs button {
    background:transparent; border:1px solid transparent;
    color:#555; font-size:0.62rem; padding:3px 10px; cursor:pointer;
    font-family:var(--font-display); font-weight:600; letter-spacing:0.08em; transition:border-color var(--t-fast), color var(--t-fast);
  }
  .res-tabs button.active { border-color:var(--accent-green); color:var(--accent-green); }
  .res-tabs button:hover:not(.active) { color:var(--color-text); }

  .res-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; }
  .res-card {
    background:var(--panel-inset); border:1px solid var(--border-subtle); padding:7px 6px;
    display:flex; flex-direction:column; align-items:center; gap:3px;
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
  .mini-toggle input:checked + .mini-slider { background:var(--accent-green); }
  .mini-toggle input:checked + .mini-slider::before { transform:translateX(10px); background:var(--accent-white); }

  .refine-btn {
    background:transparent; border:1px solid var(--border-mid); color:var(--color-muted);
    font-size:0.55rem; padding:2px 6px; cursor:pointer; transition:border-color var(--t-fast), color var(--t-fast);
    font-family:var(--font-display); font-weight:600; letter-spacing:0.06em;
  }
  .refine-btn:hover:not(:disabled) { border-color:var(--accent-white); color:var(--accent-white); }
  .refine-btn:disabled { opacity:0.3; cursor:not-allowed; }
</style>
