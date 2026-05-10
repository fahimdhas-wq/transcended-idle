<script lang="ts">
import { forestryState, addGrowthChamber, upgradeMutationChance } from '../modules/forestry.svelte.js';
import { invalidateBulkCostCache } from '../utils/bulkCost.js';
import { maxAffordable } from '../utils/maxAffordable.js';
import { calculateBulkCost } from '../utils/bulkCost.js';
import { uiStore } from '../stores/uiStore.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { Decimal } from '../systems/decimal.js';

const buyAmount = $derived(uiStore.buyAmount);
const growthChambers = $derived(forestryState.growthChambers);
const mutationChance = $derived(forestryState.mutationChance);
const biofiber = $derived(forestryState.resources.get('biofiber'));
const resinGel = $derived(forestryState.resources.get('resinGel'));

// Growth Chamber cost - derived once with all calculations
const growthChamberCost = $derived.by(() => {
  const currentLv = growthChambers - 1;
  const getCost = (lv: number) => new Decimal(Math.floor(Math.pow(Math.max(0, lv), 1.5) * 50));
  const baseCost = getCost(currentLv);
  const maxAff = maxAffordable(biofiber, currentLv, getCost).toNumber();
  const count = Math.min(maxAff, buyAmount as number);
  const totalCost = calculateBulkCost(getCost, currentLv, count);
  return { currentLv, baseCost, count, totalCost };
});

// Mutation Chance cost (linear: 500 per level)
const mutationCost = $derived.by(() => {
  const currentLv = Math.round((mutationChance / 0.01) - 1);
  const maxAff = maxAffordable(resinGel, currentLv, { type: 'linear', base: 0, gain: 500 }).toNumber();
  const count = Math.min(maxAff, buyAmount as number);
  const totalCost = calculateBulkCost({ type: 'linear', base: 0, gain: 500 }, currentLv, count);
  return { currentLv, count, totalCost };
});

function fmt(v: any): string { return formatValue(v); }

function doGrowthChamber() {
  addGrowthChamber(buyAmount);
  invalidateBulkCostCache();
}
function doGrowthChamberMax() {
  addGrowthChamber('max');
  invalidateBulkCostCache();
}
function doMutationChance() {
  upgradeMutationChance(buyAmount);
  invalidateBulkCostCache();
}
function doMutationChanceMax() {
  upgradeMutationChance('max');
  invalidateBulkCostCache();
}
</script>

<div class="upg-list">
  <div class="upg-row">
    <div class="upg-info">
      <span class="upg-name">Growth Chambers</span>
      <span class="upg-lv">Lv.{fmt(growthChambers)}</span>
    </div>
    <div class="upg-btns">
      <button class="upg-buy-btn" onclick={doGrowthChamber}
        disabled={!biofiber.gte(growthChamberCost.baseCost)}>
        +{buyAmount}
        <span class="btn-cost">{fmt(growthChamberCost.baseCost)} Biofiber</span>
      </button>
      <button class="upg-max-btn" onclick={doGrowthChamberMax}>
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
      <button class="upg-buy-btn" onclick={doMutationChance}
        disabled={!resinGel.gte(mutationCost.totalCost)}>
        +{buyAmount}
        <span class="btn-cost">{fmt(mutationCost.totalCost)} Resin Gel</span>
      </button>
      <button class="upg-max-btn" onclick={doMutationChanceMax}>
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
    border-left:2px solid var(--accent-green);
  }
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
</style>