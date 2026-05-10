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
    omniscient: 'var(--accent-warning)',
    transcendent: 'var(--accent-violet)',
    exalted: 'var(--accent-green)',
    mastered: 'var(--accent-steel)',
  };
</script>

<div class="bestiary-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#9875;</div>
      <div class="header-text">
        <h2 class="transcended-text">DATA.BESTIARY</h2>
        <span class="transcended-sub">COMBAT ARCHIVES</span>
      </div>
    </div>
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">DATA</span>
        <span class="stat-value accent-steel">{fmt(bestiaryState.dataFragments)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">SOULS</span>
        <span class="stat-value accent-violet">{fmt(bestiaryState.souls)}</span>
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

  <div class="section-label" style="border-top: 1px solid var(--border-subtle); margin-top: 8px; padding-top: 10px;">SPECIES ARCHIVE</div>

  <div class="mob-list">
    {#each Object.values(bestiaryState.entries) as entry}
      <div class="mob-entry" style="border-left-color: {STAGE_COLORS[entry.stage.toLowerCase()] || 'var(--border-mid)'}">
        <div class="mob-header">
          <span class="mob-name">{entry.name}</span>
          <span class="mob-stage" style="color: {STAGE_COLORS[entry.stage.toLowerCase()] || 'var(--color-muted)'}">[{entry.stage}]</span>
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
  .bestiary-panel { display: flex; flex-direction: column; height: 100%; overflow-y: auto; }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 8px;
  }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-icon { font-size: 1rem; color: var(--accent-steel); }
  .header-text { display: flex; flex-direction: column; gap: 1px; }
  .header-stats { display: flex; gap: 16px; }
  .stat-item { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .stat-label { font-family: var(--font-display); font-size: 0.56rem; font-weight: 600; letter-spacing: 0.14em; color: var(--color-muted); }
  .stat-value { font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; font-variant-numeric: tabular-nums; }
  .accent-steel { color: var(--accent-steel); }
  .accent-violet { color: var(--accent-violet); }

  .control-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }
  .buy-selector { display: flex; gap: 2px; }
  .amt-btn {
    background: transparent;
    border: 1px solid var(--border-subtle);
    color: var(--color-muted);
    font-family: var(--font-display);
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 3px 7px;
    cursor: pointer;
    transition: border-color var(--t-fast), color var(--t-fast);
  }
  .amt-btn.active { border-color: var(--accent-steel); color: var(--accent-steel); }
  .amt-btn:hover:not(.active) { border-color: var(--border-mid); color: var(--color-text); }

  .auto-up-btn {
    background: transparent;
    border: 1px solid var(--accent-steel);
    color: var(--accent-steel);
    font-family: var(--font-display);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    padding: 4px 14px;
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast);
  }
  .auto-up-btn:hover { background: rgba(90, 138, 170, 0.1); color: var(--accent-white); }

  .section-label {
    font-family: var(--font-display);
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
    padding: 8px 14px 4px;
  }

  .upg-list { display: flex; flex-direction: column; padding: 0 14px 8px; gap: 4px; }
  .upg-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--panel-bg);
    border: 1px solid var(--border-subtle);
    border-left: 2px solid var(--accent-steel);
    padding: 8px 10px;
    transition: border-color var(--t-fast);
  }
  .upg-row:hover { border-left-color: var(--accent-white); }

  .upg-info { display: flex; flex-direction: column; gap: 1px; min-width: 90px; }
  .upg-name { font-size: 0.7rem; font-weight: 700; color: var(--color-text); font-family: var(--font-display); letter-spacing: 0.04em; }
  .upg-lv { font-size: 0.6rem; color: var(--accent-steel); }

  .upg-btns { display: flex; gap: 5px; align-items: center; }
  .upg-buy-btn {
    background: transparent;
    border: 1px solid var(--border-mid);
    color: var(--color-text);
    font-family: var(--font-display);
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    padding: 5px 10px;
    cursor: pointer;
    transition: border-color var(--t-fast);
    white-space: nowrap;
    min-width: 70px;
    text-align: center;
  }
  .upg-buy-btn:hover:not(:disabled) { border-color: var(--accent-white); }
  .upg-buy-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .btn-cost { font-size: 0.55rem; color: var(--color-muted); margin-left: 3px; }

  .upg-max-btn {
    background: transparent;
    border: 1px solid var(--border-mid);
    color: var(--color-muted);
    font-family: var(--font-display);
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    padding: 5px 10px;
    cursor: pointer;
    transition: border-color var(--t-fast), color var(--t-fast);
    white-space: nowrap;
    min-width: 70px;
    text-align: center;
  }
  .upg-max-btn:hover:not(:disabled) { border-color: var(--accent-steel); color: var(--accent-steel); }
  .upg-max-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .mob-list { display: flex; flex-direction: column; padding: 0 14px 14px; gap: 4px; flex: 1; }
  .mob-entry {
    background: var(--panel-bg);
    border: 1px solid var(--border-subtle);
    border-left: 3px solid var(--border-mid);
    padding: 8px 12px;
  }
  .mob-header { display: flex; justify-content: space-between; align-items: center; }
  .mob-name { font-size: 0.75rem; font-weight: 700; color: var(--color-text); }
  .mob-stage { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.08em; }
  .mob-stats { display: flex; gap: 12px; color: var(--color-muted); font-size: 0.62rem; margin-top: 3px; font-family: var(--font-display); letter-spacing: 0.06em; }
</style>
