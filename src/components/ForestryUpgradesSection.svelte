<script lang="ts">
  import { forestryState, buyForestryUpgrade } from '../modules/forestry.svelte.js';
  import { invalidateBulkCostCache } from '../utils/bulkCost.js';
  import { maxAffordable } from '../utils/maxAffordable.js';
  import { calculateBulkCost, type CostFormula } from '../utils/bulkCost.js';
  import { uiStore } from '../stores/uiStore.svelte.js';
  import { formatValue } from '../systems/formatValue.js';
  import { Decimal } from '../systems/decimal.js';
  import type { ForestryUpgradeType } from '../modules/forestry.svelte.js';

  const buyAmount = $derived(uiStore.buyAmount);

  function resolveCost(formula: CostFormula, currentLevel: number, amount: number | 'max', budget: Decimal): { cost: Decimal, count: number } {
    const count = amount === 'max' ? maxAffordable(budget, currentLevel, formula).toNumber() : amount;
    const cost = calculateBulkCost(formula, currentLevel, count);
    return { cost, count };
  }

  const costs = $derived({
    chainsawFuel: resolveCost({ type: 'linear', base: 0, gain: 500 }, forestryState.chainsawFuel, buyAmount, forestryState.dnaFragments),
    reforestation: resolveCost({ type: 'linear', base: 0, gain: 200 }, forestryState.reforestation, buyAmount, forestryState.dnaFragments),
    ancientSaplings: resolveCost({ type: 'geometric', base: 100, multiplier: 10 }, forestryState.ancientSaplings, buyAmount === 'max' ? Math.min(10 - forestryState.ancientSaplings, 10) : Math.min(buyAmount as number, 10 - forestryState.ancientSaplings), forestryState.dnaFragments),
    mutationPower: resolveCost({ type: 'linear', base: 1500, gain: 1500 }, forestryState.mutationPower, buyAmount, forestryState.dnaFragments),
    efficiency: resolveCost({ type: 'linear', base: 1000, gain: 1000 }, forestryState.efficiency, buyAmount, forestryState.dnaFragments),
  });

  function fmt(v: any): string { return formatValue(v); }
  function canAfford(cost: Decimal | number): boolean { return forestryState.dnaFragments.gte(cost); }

  function doBuy(t: ForestryUpgradeType) {
    buyForestryUpgrade(t, buyAmount);
    invalidateBulkCostCache();
  }
  function doMax(t: ForestryUpgradeType) {
    buyForestryUpgrade(t, 'max');
    invalidateBulkCostCache();
  }
</script>

<div class="upg-list">
  <!-- Ancient Saplings: TOP priority, capped at 10 -->
  <div class="upg-row" class:at-cap={forestryState.ancientSaplings >= 10}>
    <div class="upg-info">
      <span class="upg-name">Ancient Saplings</span>
      <span class="upg-lv">Lv.{fmt(forestryState.ancientSaplings)}{forestryState.ancientSaplings >= 10 ? ' MAX' : ''}</span>
    </div>
    <div class="upg-btns">
      {#if forestryState.ancientSaplings < 10}
        <button class="upg-buy-btn" onclick={() => doBuy('ancientSaplings')}
          disabled={!canAfford(costs.ancientSaplings.cost)}>
          +{buyAmount}
          <span class="btn-cost">{fmt(costs.ancientSaplings.cost)}</span>
        </button>
        <button class="upg-max-btn" onclick={() => doMax('ancientSaplings')}>
          MAX
        </button>
      {:else}
        <span class="cap-badge">MAXED</span>
      {/if}
    </div>
  </div>

  <div class="upg-row">
    <div class="upg-info">
      <span class="upg-name">Chainsaw Fuel</span>
      <span class="upg-lv">Lv.{fmt(forestryState.chainsawFuel)}</span>
    </div>
    <div class="upg-btns">
      <button class="upg-buy-btn" onclick={() => doBuy('chainsawFuel')}
        disabled={!canAfford(costs.chainsawFuel.cost)}>
        +{buyAmount}
        <span class="btn-cost">{fmt(costs.chainsawFuel.cost)}</span>
      </button>
      <button class="upg-max-btn" onclick={() => doMax('chainsawFuel')}>
        MAX
      </button>
    </div>
  </div>

  <div class="upg-row">
    <div class="upg-info">
      <span class="upg-name">Reforestation</span>
      <span class="upg-lv">Lv.{fmt(forestryState.reforestation)}</span>
    </div>
    <div class="upg-btns">
      <button class="upg-buy-btn" onclick={() => doBuy('reforestation')}
        disabled={!canAfford(costs.reforestation.cost)}>
        +{buyAmount}
        <span class="btn-cost">{fmt(costs.reforestation.cost)}</span>
      </button>
      <button class="upg-max-btn" onclick={() => doMax('reforestation')}>
        MAX
      </button>
    </div>
  </div>

  <div class="upg-row">
    <div class="upg-info">
      <span class="upg-name">Mutation Power</span>
      <span class="upg-lv">Lv.{fmt(forestryState.mutationPower)}</span>
    </div>
    <div class="upg-btns">
      <button class="upg-buy-btn" onclick={() => doBuy('mutationPower')}
        disabled={!canAfford(costs.mutationPower.cost)}>
        +{buyAmount}
        <span class="btn-cost">{fmt(costs.mutationPower.cost)}</span>
      </button>
      <button class="upg-max-btn" onclick={() => doMax('mutationPower')}>
        MAX
      </button>
    </div>
  </div>

  <div class="upg-row">
    <div class="upg-info">
      <span class="upg-name">Efficiency</span>
      <span class="upg-lv">Lv.{fmt(forestryState.efficiency)}</span>
    </div>
    <div class="upg-btns">
      <button class="upg-buy-btn" onclick={() => doBuy('efficiency')}
        disabled={!canAfford(costs.efficiency.cost)}>
        +{buyAmount}
        <span class="btn-cost">{fmt(costs.efficiency.cost)}</span>
      </button>
      <button class="upg-max-btn" onclick={() => doMax('efficiency')}>
        MAX
      </button>
    </div>
  </div>
</div>

<style>
  .upg-list { display:flex; flex-direction:column; gap:4px; }


  .cap-badge {
    font-size:0.6rem; color:var(--red); font-family:var(--font-hud); font-weight:700; letter-spacing:0.08em;
    padding:4px 8px; border:1px solid var(--red); background:transparent;
  }
</style>