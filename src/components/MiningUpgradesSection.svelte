<script lang="ts">
import { miningState, tools, buyMiningUpgrade } from '../modules/mining.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { uiStore } from '../stores/uiStore.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { Decimal } from '../systems/decimal.js';
import { invalidateBulkCostCache, calculateBulkCost, type CostFormula } from '../utils/bulkCost.js';
import { maxAffordable } from '../utils/maxAffordable.js';
import type { MiningUpgradeType } from '../modules/mining.svelte.js';
import { onMount, untrack } from 'svelte';

const buyAmount = $derived(uiStore.buyAmount);

// Upgrade costs — throttled to avoid recalculating on every tick
function computeCosts() {
  const a = buyAmount;
  const data = bestiaryState.dataFragments;
  const s = miningState.sharpness;
  const e = miningState.extraction;
  const d = miningState.discovery;
  const se = miningState.sensors;
  const ef = miningState.efficiency;

  return {
    sharpness:      getCost({ type: 'linear', base: 0, gain: 1000 }, s, a, data),
    extraction:     getCost({ type: 'linear', base: 0, gain: 200 }, e, a, data),
    discovery:     getCost({ type: 'geometric', base: 500, multiplier: 10 }, d,
                          a === 'max' ? Math.min(10 - d, 10) : Math.min(a as number, 10 - d), data),
    sensors:        getCost({ type: 'linear', base: 2000, gain: 2000 }, se, a, data),
    efficiency:    getCost({ type: 'linear', base: 1500, gain: 1500 }, ef, a, data),
  };
}

let costs = $state(computeCosts());
let _lastCostUpdate = 0;

function refreshCosts() {
  const now = performance.now();
  if (now - _lastCostUpdate > 200) {
    _lastCostUpdate = now;
    costs = computeCosts();
  }
}

$effect(() => {
  buyAmount;
  untrack(() => {
    costs = computeCosts();
    _lastCostUpdate = performance.now();
  });
});

onMount(() => {
  const id = setInterval(() => refreshCosts(), 250);
  return () => clearInterval(id);
});

function getCost(formula: CostFormula, level: number, amount: number | 'max', budget: Decimal): { cost: Decimal, count: number } {
  const count = amount === 'max' ? maxAffordable(budget, level, formula).toNumber() : amount;
  const cost = calculateBulkCost(formula, level, count);
  return { cost, count };
}

function fmt(v: any): string { return formatValue(v); }
function canAfford(cost: Decimal | number): boolean { return bestiaryState.dataFragments.gte(cost); }

function doBuy(type: MiningUpgradeType) {
  buyMiningUpgrade(type, buyAmount);
  invalidateBulkCostCache();
}

function buyMax(type: MiningUpgradeType) {
  buyMiningUpgrade(type, 'max');
  invalidateBulkCostCache();
}

const UPGRADE_DEFS: Array<{ key: MiningUpgradeType; label: string; cap?: number }> = [
  { key: 'discovery',      label: 'Discovery',  cap: 10 },
  { key: 'sharpness',     label: 'Sharpness'       },
  { key: 'extraction',    label: 'Extraction'      },
  { key: 'sensors',       label: 'Sensors'         },
  { key: 'efficiency',    label: 'Efficiency'      },
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