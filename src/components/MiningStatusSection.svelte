<script lang="ts">
import { miningState, tools, upgradeTool, triggerOverclock, upgradeEnergy } from '../modules/mining.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { uiStore, showToast } from '../stores/uiStore.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { Decimal } from '../systems/decimal.js';
import { invalidateBulkCostCache } from '../utils/bulkCost.js';

const toolTier = $derived(miningState.toolTier);
const toolName = $derived(miningState.toolName);
const isOverclocked = $derived(miningState.isOverclocked);
const miningProgress = $derived(miningState.miningProgress);
const minesPerSecond = $derived(miningState.minesPerSecond);
const energy = $derived(miningState.energy);
const maxEnergy = $derived(miningState.maxEnergy);
const fuelX = $derived(miningState.resources.get('fuelX'));

const nextToolCost = $derived(tools[toolTier]?.dataCost ?? new Decimal(Infinity));
const energyPct = $derived(Math.max(0, Math.min(100, (energy / Math.max(1, maxEnergy)) * 100)));

// Energy upgrade cost
const energyCost = $derived.by(() => {
  const currentLv = (maxEnergy - 100) / 100;
  return new Decimal((currentLv + 1) * 25);
});

function fmt(v: any): string { return formatValue(v); }
function canAffordTool(): boolean { return bestiaryState.dataFragments.gte(nextToolCost); }
function canAffordEnergy(): boolean { return fuelX.gte(energyCost); }

function doUpgradeTool() {
  upgradeTool();
  invalidateBulkCostCache();
  showToast('Drill upgraded!', 'success');
}
function doOverclock() {
  triggerOverclock();
  showToast('Overclock active!', 'warn');
}
function doEnergy() {
  upgradeEnergy(uiStore.buyAmount);
  invalidateBulkCostCache();
}
</script>

<div class="status-section">
  <div class="tool-row">
    <span class="muted">TOOL</span>
    <span class="highlight">{toolName}</span>
  </div>

  <div class="bar-group">
    <div class="bar-label-row">
      <span>PROGRESS</span>
      {#if minesPerSecond >= 100}
        <span class="accent-warning">{fmt(minesPerSecond)}/s</span>
      {:else}
        <span>{Math.floor(miningProgress)}%</span>
      {/if}
    </div>
    <div class="bar-track">
      <div class="bar-fill accent-warning" style="width:{minesPerSecond >= 100 ? 100 : miningProgress}%"></div>
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
      disabled={toolTier >= 10 || !canAffordTool()}>
      <span class="act-name">UPGRADE DRILL</span>
      <small>{toolTier >= 10 ? 'MAX' : fmt(nextToolCost) + ' DATA'}</small>
    </button>
    <button class="act-btn" onclick={doOverclock} disabled={isOverclocked}>
      <span class="act-name">{isOverclocked ? 'OC ACTIVE' : 'OVERCLOCK'}</span>
      <small>25 Fuel-X</small>
    </button>
    <button class="act-btn" onclick={doEnergy}
      disabled={!canAffordEnergy()}>
      <span class="act-name">+ENERGY CAP</span>
      <small>{fmt(energyCost)} Fuel-X</small>
    </button>
  </div>
</div>

<style>
  .status-section { display: flex; flex-direction: column; gap: 8px; }

  .tool-row { display:flex; justify-content:space-between; font-size:0.72rem; }
  .muted { color:var(--text-2); font-family:var(--font-hud); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.08em; }
  .highlight { color:var(--cyan); font-family:var(--font-hud); font-weight:700; letter-spacing: 0.06em; }

  .bar-group { display:flex; flex-direction:column; gap:3px; }
  .bar-label-row { display:flex; justify-content:space-between; font-size:0.6rem; color:var(--text-2); font-family:var(--font-hud); letter-spacing: 0.06em; }
  .bar-track { background: var(--bg-2); height: 8px; overflow: hidden; border: 1px solid var(--line); }
  .bar-fill { height: 100%; transition: width 0.1s linear; }
  .bar-fill.accent-warning { background: var(--red); }
  .bar-fill.accent-steel { background: var(--cyan); }

  .three-col { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; }
  .act-btn {
    background:transparent; border:1px solid var(--line); padding:8px 6px;
    display:flex; flex-direction:column; gap:2px; cursor:pointer; transition:all var(--fast);
    text-align:left; position: relative;
  }
  .act-btn::before, .act-btn::after {
    content: ''; position: absolute;
    width: 4px; height: 4px; border: 1px solid var(--cyan);
  }
  .act-btn::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .act-btn::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

  .act-btn:hover:not(:disabled) { border-color:var(--cyan); background: hsl(185 100% 55% / 0.1); }
  .act-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .act-name { font-size:0.65rem; font-weight:700; color:var(--text-0); font-family:var(--font-hud); letter-spacing:0.06em; }
  .act-btn small { font-size:0.58rem; color:var(--text-2); }
</style>