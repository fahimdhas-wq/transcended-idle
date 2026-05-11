<script lang="ts">
import { miningState, tools, buyMiningUpgrade } from '../modules/mining.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { uiStore } from '../stores/uiStore.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { Decimal } from '../systems/decimal.js';
import { invalidateBulkCostCache, calculateBulkCost, type CostFormula } from '../utils/bulkCost.js';
import { maxAffordable } from '../utils/maxAffordable.js';
import type { MiningUpgradeType } from '../modules/mining.svelte.js';

const buyAmount = $derived(uiStore.buyAmount);
const dataFragments = $derived(bestiaryState.dataFragments);

// Derived upgrade levels
const sharpness = $derived(miningState.sharpness);
const extraction = $derived(miningState.extraction);
const discovery = $derived(miningState.discovery);
const sensors = $derived(miningState.sensors);
const overclockPower = $derived(miningState.overclockPower);
const efficiency = $derived(miningState.efficiency);

// Upgrade costs with derived calculations
const costs = $derived.by(() => {
  const a = buyAmount;
  const data = dataFragments;

  return {
    sharpness:      getCost({ type: 'linear', base: 0, gain: 1000 }, sharpness, a, data),
    extraction:     getCost({ type: 'linear', base: 0, gain: 200 }, extraction, a, data),
    discovery:     getCost({ type: 'geometric', base: 500, multiplier: 10 }, discovery,
                          a === 'max' ? Math.min(10 - discovery, 10) : Math.min(a as number, 10 - discovery), data),
    sensors:        getCost({ type: 'linear', base: 2000, gain: 2000 }, sensors, a, data),
    overclockPower: getCost({ type: 'linear', base: 2500, gain: 2500 }, overclockPower, a, data),
    efficiency:    getCost({ type: 'linear', base: 1500, gain: 1500 }, efficiency, a, data),
  };
});

function getCost(formula: CostFormula, level: number, amount: number | 'max', budget: Decimal): { cost: Decimal, count: number } {
  const count = amount === 'max' ? maxAffordable(budget, level, formula).toNumber() : amount;
  const cost = calculateBulkCost(formula, level, count);
  return { cost, count };
}

function fmt(v: any): string { return formatValue(v); }
function canAfford(cost: Decimal | number): boolean { return dataFragments.gte(cost); }

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
  { key: 'overclockPower',label: 'OC Power'        },
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