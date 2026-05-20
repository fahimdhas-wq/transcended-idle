<script lang="ts">
  import { miningState, buyMiningUpgrade } from '../modules/mining.svelte.js';
  import { bestiaryState } from '../modules/bestiary.svelte.js';
  import { uiStore } from '../stores/uiStore.svelte.js';
  import { formatValue } from '../systems/formatValue.js';
  import { Decimal } from '../systems/decimal.js';
  import { invalidateBulkCostCache, calculateBulkCost, type CostFormula } from '../utils/bulkCost.js';
  import { maxAffordable } from '../utils/maxAffordable.js';
  import type { MiningUpgradeType } from '../modules/mining.svelte.js';

  const buyAmount = $derived(uiStore.buyAmount);

  function getCost(formula: CostFormula, level: number, amount: number | 'max', budget: Decimal): { cost: Decimal, count: number } {
    const count = amount === 'max' ? maxAffordable(budget, level, formula).toNumber() : amount;
    const cost = calculateBulkCost(formula, level, count);
    return { cost, count };
  }

  const costs = $derived({
    sharpness:    getCost({ type: 'linear', base: 0, gain: 1000 }, miningState.sharpness, buyAmount, bestiaryState.dataFragments),
    extraction:   getCost({ type: 'linear', base: 0, gain: 200 }, miningState.extraction, buyAmount, bestiaryState.dataFragments),
    discovery:    getCost({ type: 'geometric', base: 500, multiplier: 10 }, miningState.discovery,
                        buyAmount === 'max' ? Math.min(10 - miningState.discovery, 10) : Math.min(buyAmount as number, 10 - miningState.discovery), bestiaryState.dataFragments),
    sensors:      getCost({ type: 'linear', base: 2000, gain: 2000 }, miningState.sensors, buyAmount, bestiaryState.dataFragments),
    efficiency:   getCost({ type: 'linear', base: 1500, gain: 1500 }, miningState.efficiency, buyAmount, bestiaryState.dataFragments),
  });

  function doBuy(type: MiningUpgradeType) {
    buyMiningUpgrade(type, buyAmount);
    invalidateBulkCostCache();
  }

  function buyMax(type: MiningUpgradeType) {
    buyMiningUpgrade(type, 'max');
    invalidateBulkCostCache();
  }

  function fmt(v: any): string { return formatValue(v); }
  function canAfford(cost: Decimal | number): boolean { return bestiaryState.dataFragments.gte(cost); }

  const UPGRADE_DEFS: Array<{ key: MiningUpgradeType; label: string; cap?: number }> = [
    { key: 'discovery', label: 'Discovery', cap: 10 },
    { key: 'sharpness', label: 'Sharpness' },
    { key: 'extraction', label: 'Extraction' },
    { key: 'sensors', label: 'Sensors' },
    { key: 'efficiency', label: 'Efficiency' },
  ];
</script>

<div class="upg-list">
  {#each UPGRADE_DEFS as def (def.key)}
    {@const costData = costs[def.key]}
    {@const lv = miningState[def.key]}
    {@const atCap = def.cap !== undefined && lv >= def.cap}
    {#if costData}
      <div class="upg-row" class:at-cap={atCap}>
        <div class="upg-info">
          <span class="upg-name">{def.label}</span>
          <span class="upg-lv">Lv.{fmt(lv)}{atCap ? ' MAX' : ''}</span>
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
              onclick={() => buyMax(def.key)}>
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

<style>
  .upg-list { display:flex; flex-direction:column; gap:4px; }


  .cap-badge {
    font-size:0.6rem; color:var(--red); font-family:var(--font-hud); font-weight:700; letter-spacing:0.08em;
    padding:4px 8px; border:1px solid var(--red);
    background:transparent;
  }
</style>