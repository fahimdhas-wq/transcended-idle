<script lang="ts">
import { miningState, upgradeAutomation } from '../modules/mining.svelte.js';
import { uiStore } from '../stores/uiStore.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { Decimal } from '../systems/decimal.js';
import { invalidateBulkCostCache, calculateBulkCost, type CostFormula } from '../utils/bulkCost.js';
import { maxAffordable } from '../utils/maxAffordable.js';
import type { MiningAutomationType } from '../modules/mining.svelte.js';

const buyAmount = $derived(uiStore.buyAmount);
const drones = $derived(miningState.drones);
const autoExtractors = $derived(miningState.autoExtractors);
const alloyX = $derived(miningState.resources.get('alloyX'));

// Derived costs
const droneCost = $derived.by(() => {
  const count = buyAmount === 'max'
    ? maxAffordable(alloyX, drones, { type: 'linear', base: 0, gain: 50 }).toNumber()
    : buyAmount as number;
  return {
    cost: calculateBulkCost({ type: 'linear', base: 0, gain: 50 }, drones, count),
    count
  };
});

const extractorCost = $derived.by(() => {
  const count = buyAmount === 'max'
    ? maxAffordable(alloyX, autoExtractors, { type: 'linear', base: 0, gain: 100 }).toNumber()
    : buyAmount as number;
  return {
    cost: calculateBulkCost({ type: 'linear', base: 0, gain: 100 }, autoExtractors, count),
    count
  };
});

function fmt(v: any): string { return formatValue(v); }
function canAffordRes(cost: Decimal): boolean { return alloyX.gte(cost); }

function doAuto(t: MiningAutomationType) {
  upgradeAutomation(t, buyAmount);
  invalidateBulkCostCache();
}
function doMax(t: MiningAutomationType) {
  upgradeAutomation(t, 'max');
  invalidateBulkCostCache();
}
</script>

<div class="upg-list">
  <div class="upg-row">
    <div class="upg-info">
      <span class="upg-name">Drones</span>
      <span class="upg-lv">Lv.{fmt(drones)}</span>
    </div>
    <div class="upg-btns">
      <button class="upg-buy-btn" onclick={() => doAuto('drone')}
        disabled={!canAffordRes(droneCost.cost)}>
        +{buyAmount === 'max' ? droneCost.count : buyAmount}
        <span class="btn-cost">{fmt(droneCost.cost)} Alloy-X</span>
      </button>
      <button class="upg-max-btn" onclick={() => doMax('drone')}>
        MAX
      </button>
    </div>
  </div>
  <div class="upg-row">
    <div class="upg-info">
      <span class="upg-name">Extractors</span>
      <span class="upg-lv">Lv.{fmt(autoExtractors)}</span>
    </div>
    <div class="upg-btns">
      <button class="upg-buy-btn" onclick={() => doAuto('extractor')}
        disabled={!canAffordRes(extractorCost.cost)}>
        +{buyAmount === 'max' ? extractorCost.count : buyAmount}
        <span class="btn-cost">{fmt(extractorCost.cost)} Alloy-X</span>
      </button>
      <button class="upg-max-btn" onclick={() => doMax('extractor')}>
        MAX
      </button>
    </div>
  </div>
</div>

<style>
  .upg-list { display:flex; flex-direction:column; gap:4px; }
  .upg-row {
    display:flex; justify-content:space-between; align-items:center;
    background:var(--panel-inset); padding:8px 10px;
    border-left:2px solid var(--accent-steel);
  }
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
</style>