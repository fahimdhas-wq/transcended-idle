
<script lang="ts">
import { forestryState, bioTools, upgradeBioTool, triggerForestryOverclock, upgradeForestryEnergy } from '../modules/forestry.svelte.js';
import { uiStore } from '../stores/uiStore.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { Decimal } from '../systems/decimal.js';

const toolTier = $derived(forestryState.toolTier);
const toolName = $derived(forestryState.toolName);
const isOverclocked = $derived(forestryState.isOverclocked);
const growthProgress = $derived(forestryState.growthProgress);
const harvestRate = $derived(forestryState.harvestRate);
const energy = $derived(forestryState.energy);
const maxEnergy = $derived(forestryState.maxEnergy);
const dnaFragments = $derived(forestryState.dnaFragments);
const reinforced = $derived(forestryState.resources.get('reinforcedFiber'));

const nextToolCost = $derived(bioTools[toolTier]?.dataCost ?? new Decimal(Infinity));
const energyPercent = $derived(Math.max(0, Math.min(100, (energy / Math.max(1, maxEnergy)) * 100)));

function fmt(v: any): string { return formatValue(v); }
function canAffordTool(): boolean { return dnaFragments.gte(nextToolCost); }
function canAffordOC(): boolean { return reinforced.gte(25); }

function doTool() {
  upgradeBioTool();
}
function doOC() {
  triggerForestryOverclock();
}
function doEnergy() {
  upgradeForestryEnergy(uiStore.buyAmount);
}
</script>

<div class="status-section">
  <div class="tool-row">
    <span class="muted">TOOL</span>
    <span class="highlight">{toolName}</span>
  </div>

  <div class="bar-group">
    <div class="bar-label-row">
      <span>HARVEST PROGRESS</span>
      {#if harvestRate >= 100}
        <span class="accent-green">{fmt(harvestRate)}/s</span>
      {:else}
        <span>{Math.floor(growthProgress)}%</span>
      {/if}
    </div>
    <div class="bar-track">
      <div class="bar-fill accent-green" style="width:{harvestRate >= 100 ? 100 : growthProgress}%"></div>
    </div>
  </div>

  <div class="bar-group">
    <div class="bar-label-row">
      <span>NUTRIENT ENERGY</span>
      <span>{energyPercent.toFixed(0)}%</span>
    </div>
    <div class="bar-track">
      <div class="bar-fill accent-steel" style="width:{energyPercent}%"></div>
    </div>
  </div>

  <div class="three-col">
    <button class="act-btn" onclick={doTool}
      disabled={toolTier >= 10 || !canAffordTool()}>
      <span class="act-name">UPGRADE TOOL</span>
      <small>{toolTier >= 10 ? 'MAX' : fmt(nextToolCost) + ' DNA'}</small>
    </button>
    <button class="act-btn" onclick={doOC} disabled={isOverclocked || !canAffordOC()}>
      <span class="act-name">{isOverclocked ? 'SURGE ACTIVE' : 'GROWTH SURGE'}</span>
      <small>25 Reinf.Fiber</small>
    </button>
    <button class="act-btn" onclick={doEnergy} disabled={!reinforced.gte(1)}>
      <span class="act-name">+NUTRIENT CAP</span>
      <small>Reinf.Fiber</small>
    </button>
  </div>
</div>

<style>
  .status-section { display: flex; flex-direction: column; gap: 8px; }

  .tool-row { display:flex; justify-content:space-between; font-size:0.72rem; }
  .muted { color:var(--color-muted); font-family:var(--font-display); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.08em; }
  .highlight { color:var(--accent-green); font-family:var(--font-display); font-weight:700; letter-spacing: 0.06em; }

  .bar-group { display:flex; flex-direction:column; gap:3px; }
  .bar-label-row { display:flex; justify-content:space-between; font-size:0.6rem; color:var(--color-muted); font-family:var(--font-display); letter-spacing: 0.06em; }
  .bar-track { background: var(--panel-inset); height: 8px; border-radius: 2px; overflow: hidden; }
  .bar-fill { height: 100%; transition: width 0.1s linear; }
  .bar-fill.accent-green { background: var(--accent-green); }
  .bar-fill.accent-steel { background: var(--accent-steel); }

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
</style>
