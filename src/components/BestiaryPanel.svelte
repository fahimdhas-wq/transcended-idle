<script lang="ts">
  import { bestiaryState, buyBestiaryUpgrade } from '../modules/bestiary.svelte.js';
  import type { BestiaryUpgradeType } from '../modules/bestiary.svelte.js';
  import { formatNumber } from '../systems/scalingSystem.js';
  import { uiStore } from '../stores/uiStore.svelte.js';
  import { calculateBulkCost, type CostFormula } from '../utils/bulkCost.js';
  import { maxAffordable } from '../utils/maxAffordable.js';
  import { Decimal } from '../systems/decimal.js';

  let buyAmount = $derived(uiStore.buyAmount);

  function calculateBestiaryCost(type: BestiaryUpgradeType, amount: number | 'max'): Decimal {
    const currentLv = Number(bestiaryState[type]);
    
    // Define the cost formula for each type
    let formula: CostFormula;
    let resource: Decimal;
    
    if (type === 'anatomy') {
      formula = { type: 'linear', base: 0, gain: 500 };
      resource = bestiaryState.dataFragments;
    } else if (type === 'huntersGreed') {
      formula = { type: 'linear', base: 1000, gain: 1000 };
      resource = bestiaryState.dataFragments;
    } else if (type === 'soulExtraction') {
      formula = { type: 'linear', base: 0, gain: 2500 };
      resource = bestiaryState.dataFragments;
    } else {
      return new Decimal(Infinity);
    }

    const count = amount === 'max' ? maxAffordable(resource, currentLv, formula) : amount;
    return calculateBulkCost(formula, currentLv, count);
  }
</script>

<div class="bestiary-panel">
  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">🧬</div>
      <div class="header-title-box">
        <h2 class="transcended-text">DATA.BESTIARY</h2>
        <div class="header-subtitle">COMBAT ARCHIVES</div>
      </div>
    </div>
    <div class="header-stats">
      <div class="header-stat-box">
        <span class="stat-label">DATA</span>
        <span class="stat-value" style="color: var(--neon-blue);">{formatNumber(bestiaryState.dataFragments)}</span>
      </div>
      <div class="header-stat-box">
        <span class="stat-label">SOULS</span>
        <span class="stat-value" style="color: var(--neon-pink);">{formatNumber(bestiaryState.souls)}</span>
      </div>
    </div>
  </div>

  <div class="upgrades-section">
    <div class="section-header">
      <h4 class="transcended-sub">UPGRADES</h4>
      <div class="buy-selector">
         {#each [1, 10, 100, 1000, 10000] as amt}
           <button class="amt-btn" class:active={uiStore.buyAmount === amt} onclick={() => uiStore.buyAmount = amt}>x{amt}</button>
         {/each}
         <button class="amt-btn" class:active={uiStore.buyAmount === 'max'} onclick={() => uiStore.buyAmount = 'max'}>MAX</button>
      </div>
    </div>

    <div class="upgrade-row">
      <button class="btn-u" onclick={() => buyBestiaryUpgrade('anatomy', buyAmount)} disabled={bestiaryState.dataFragments.lt(calculateBestiaryCost('anatomy', buyAmount))}>
        <span class="u-name">Anatomy [v.{bestiaryState.anatomy}]</span>
        <small>Cost: {formatNumber(calculateBestiaryCost('anatomy', buyAmount))}</small>
      </button>

      <button class="btn-u" onclick={() => buyBestiaryUpgrade('huntersGreed', buyAmount)} disabled={bestiaryState.dataFragments.lt(calculateBestiaryCost('huntersGreed', buyAmount))}>
        <span class="u-name">Hunter's Greed [v.{bestiaryState.huntersGreed}]</span>
        <small>Cost: {formatNumber(calculateBestiaryCost('huntersGreed', buyAmount))}</small>
      </button>

      <button class="btn-u" onclick={() => buyBestiaryUpgrade('soulExtraction', buyAmount)} disabled={bestiaryState.dataFragments.lt(calculateBestiaryCost('soulExtraction', buyAmount))}>
        <span class="u-name">Soul Extraction [v.{bestiaryState.soulExtraction}]</span>
        <small>Cost: {formatNumber(calculateBestiaryCost('soulExtraction', buyAmount))}</small>
      </button>
    </div>
  </div>

  <div style="margin-top: 15px; text-align: center;">
    <h4 class="transcended-sub">SPECIES ARCHIVE</h4>
  </div>
  
  <div class="mob-list">
    {#each Object.values(bestiaryState.entries) as entry}
      <div class="mob-entry {entry.stage.toLowerCase()}">
        <div class="mob-header">
          <span class="mob-name">{entry.name}</span>
          <span class="mob-stage">[{entry.stage}]</span>
        </div>
        <div class="mob-stats">
          <span>KILLS: {formatNumber(entry.kills)}</span>
          <span>TYPE: {entry.type}</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .bestiary-panel { display: flex; flex-direction: column; height: 100%; overflow-y: auto; padding: 10px; }
  .stats-bar { display: flex; justify-content: space-between; gap: 15px; font-size: 0.7rem; color: var(--color-muted); padding: 5px 0; }
  .cyan { color: #00ffff; }
  .purple { color: #bf00ff; }

  .upgrades-section { margin-top: 10px; padding-top: 10px; }
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .buy-selector { display: flex; gap: 2px; border: 1px solid var(--border-subtle); }
  .amt-btn { padding: 2px 6px; font-size: 0.6rem; background: #000; }
  .amt-btn.active { background: var(--color-primary); color: #000; }
  
  .upgrade-row { display: grid; grid-template-columns: 1fr; gap: 5px; }
  .btn-u { background: var(--panel-bg); border: 1px solid var(--border-subtle); padding: 8px; cursor: pointer; text-align: left; }
  .u-name { font-weight: bold; color: var(--color-text); font-size: 0.8rem; }
  .btn-u small { font-size: 0.6rem; color: var(--color-muted); }

  .mob-list { display: flex; flex-direction: column; gap: 4px; padding-top: 5px; }
  .mob-entry { background: var(--panel-bg); border: 1px solid var(--border-subtle); border-left: 3px solid #444; padding: 6px 10px; }
  .mob-header { display: flex; justify-content: space-between; align-items: center; }
  .mob-name { font-size: 0.8rem; font-weight: bold; color: #ddd; }
  .mob-stage { font-size: 0.65rem; color: var(--color-primary); }
  .mob-stats { display: flex; gap: 12px; color: var(--color-muted); font-size: 0.65rem; }
  
  .mob-entry.omniscient { border-left-color: #ffaa00; }
  .mob-entry.transcendent { border-left-color: #ff00ff; }
  .mob-entry.exalted { border-left-color: #00ffaa; }
  .mob-entry.mastered { border-left-color: #00ccff; }
</style>
