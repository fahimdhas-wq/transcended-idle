
<script lang="ts">
  import { bestiaryState, buyBestiaryUpgrade } from '../modules/bestiary.svelte.js';
  import { autoUpgradeBestiary } from '../utils/globalMaxUpgrade.js';
  import type { BestiaryUpgradeType } from '../modules/bestiary.svelte.js';
  import { formatValue } from '../systems/formatValue.js';
  import { uiStore, showToast } from '../stores/uiStore.svelte.js';
  import { calculateBulkCost, invalidateBulkCostCache, type CostFormula } from '../utils/bulkCost.js';
  import { maxAffordable } from '../utils/maxAffordable.js';
  import { Decimal } from '../systems/decimal.js';

  let buyAmount = $derived(uiStore.buyAmount);

  function fmt(v: any) { return formatValue(v); }

  function resolveCost(formula: CostFormula, currentLevel: number, amount: number | 'max', budget: Decimal): { cost: Decimal, count: number } {
    const count = amount === 'max' ? maxAffordable(budget, currentLevel, formula).toNumber() : amount;
    const cost = calculateBulkCost(formula, currentLevel, count);
    return { cost, count };
  }

  const UPGRADE_DEFS: Array<{ key: BestiaryUpgradeType; label: string; formula: CostFormula }> = [
    { key: 'anatomy',         label: 'Anatomy',          formula: { type: 'linear', base: 0,    gain: 500  } },
    { key: 'huntersGreed',    label: "Hunter's Greed",   formula: { type: 'linear', base: 1000, gain: 1000 } },
    { key: 'soulExtraction',  label: 'Soul Extraction',  formula: { type: 'linear', base: 0,    gain: 2500 } },
  ];

  let upgradeCosts = $derived.by(() => {
    const a = buyAmount;
    const data = bestiaryState.dataFragments;
    return {
      anatomy:        resolveCost(UPGRADE_DEFS[0].formula, Number(bestiaryState.anatomy), a, data),
      huntersGreed:   resolveCost(UPGRADE_DEFS[1].formula, Number(bestiaryState.huntersGreed), a, data),
      soulExtraction: resolveCost(UPGRADE_DEFS[2].formula, Number(bestiaryState.soulExtraction), a, data),
    };
  });

  function doBuy(type: BestiaryUpgradeType) {
    buyBestiaryUpgrade(type, buyAmount);
    invalidateBulkCostCache();
  }
  function doMax(type: BestiaryUpgradeType) {
    buyBestiaryUpgrade(type, 'max');
    invalidateBulkCostCache();
  }
  function doAutoUp() {
    autoUpgradeBestiary();
    invalidateBulkCostCache();
    showToast('Bestiary optimized!', 'success');
  }

  const STAGE_COLORS: Record<string, string> = {
    omniscient: 'var(--gold)',
    transcendent: 'var(--purple)',
    exalted: 'var(--green)',
    mastered: 'var(--cyan)',
  };
</script>

<div class="bestiary-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#9763;</div>
      <div class="header-text">
        <h2 class="transcended-text">DATA.BESTIARY</h2>
        <span class="transcended-sub">COMBAT ARCHIVES</span>
      </div>
    </div>
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">DATA</span>
        <span class="stat-value">{fmt(bestiaryState.dataFragments)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">SOULS</span>
        <span class="stat-value violet">{fmt(bestiaryState.souls)}</span>
      </div>
    </div>
  </div>

  <div class="control-strip">
    <div class="buy-selector">
      {#each [1, 10, 100, 1000, 10000] as amt}
        <button class="amt-btn" class:active={uiStore.buyAmount === amt} onclick={() => uiStore.buyAmount = amt}>x{amt}</button>
      {/each}
    </div>
    <button class="auto-up-btn" onclick={doAutoUp}>AUTO UP</button>
  </div>

  <div class="section-label">UPGRADES</div>

  <div class="upg-list">
    {#each UPGRADE_DEFS as def (def.key)}
      {@const costData = upgradeCosts[def.key as keyof typeof upgradeCosts]}
      {@const lv = Number(bestiaryState[def.key])}
      <div class="upg-row">
        <div class="upg-info">
          <span class="upg-name">{def.label}</span>
          <span class="upg-lv">Lv.{fmt(lv)}</span>
        </div>
        {#if costData && typeof costData === 'object' && 'cost' in costData}
          <div class="upg-btns">
            <button class="upg-buy-btn"
              onclick={() => doBuy(def.key)}
              disabled={bestiaryState.dataFragments.lt(costData.cost)}>
              +{buyAmount === 'max' ? costData.count : buyAmount}
              <span class="btn-cost">{fmt(costData.cost)} DATA</span>
            </button>
            <button class="upg-max-btn"
              onclick={() => doMax(def.key)}
              disabled={bestiaryState.dataFragments.lt(calculateBulkCost(def.formula, lv, 1))}>
              MAX
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="section-label" style="border-top: 1px solid var(--line); margin-top: 8px; padding-top: 10px;">SPECIES ARCHIVE</div>

  <div class="mob-list">
    {#each Object.values(bestiaryState.entries) as entry}
      <div class="mob-entry" style="border-left-color: {STAGE_COLORS[entry.stage.toLowerCase()] || 'var(--line)'}">
        <div class="mob-header">
          <span class="mob-name">{entry.name}</span>
          <span class="mob-stage" style="color: {STAGE_COLORS[entry.stage.toLowerCase()] || 'var(--text-2)'}">[{entry.stage}]</span>
        </div>
        <div class="mob-stats">
          <span>KILLS: {fmt(entry.kills)}</span>
          <span>TYPE: {entry.type}</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
.bestiary-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-icon { font-size: 1rem; color: var(--cyan); }
.header-text { display: flex; flex-direction: column; gap: 1px; }
.header-stats { display: flex; gap: 16px; }
.stat-item { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.stat-label { font-family: var(--font-hud); font-size: 0.5rem; font-weight: 600; letter-spacing: 0.12em; color: var(--text-2); text-transform: uppercase; }
.stat-value { font-family: var(--font-data); font-size: 0.8rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text-0); }
.violet { color: var(--purple); }

.control-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.buy-selector { display: flex; gap: 2px; }

.section-label {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-2);
  padding: 8px 14px 4px;
}

.upg-list { display: flex; flex-direction: column; padding: 0 14px 8px; gap: 4px; }
.upg-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-1);
  border: 1px solid var(--line);
  border-left: 2px solid var(--cyan);
  padding: 8px 10px;
  transition: all var(--fast);
}
.upg-row:hover { border-left-color: var(--text-0); }
.upg-info { display: flex; flex-direction: column; gap: 1px; min-width: 90px; }
.upg-name { font-size: 0.7rem; font-weight: 700; color: var(--text-0); font-family: var(--font-hud); letter-spacing: 0.04em; }
.upg-lv { font-size: 0.55rem; color: var(--cyan); }
.upg-btns { display: flex; gap: 5px; align-items: center; }

.mob-list { display: flex; flex-direction: column; padding: 0 14px 14px; gap: 4px; flex: 1; }
.mob-entry {
  background: var(--bg-1);
  border: 1px solid var(--line);
  border-left: 3px solid var(--line);
  padding: 8px 12px;
}
.mob-header { display: flex; justify-content: space-between; align-items: center; }
.mob-name { font-size: 0.7rem; font-weight: 700; color: var(--text-0); }
.mob-stage { font-size: 0.55rem; font-weight: 600; letter-spacing: 0.08em; }
.mob-stats { display: flex; gap: 12px; color: var(--text-2); font-size: 0.6rem; margin-top: 3px; font-family: var(--font-hud); letter-spacing: 0.05em; }
</style>
