<script lang="ts">
  import { bestiaryState, buyBestiaryUpgrade } from '../modules/bestiary.svelte.js';
  import { autoUpgradeBestiary } from '../utils/globalMaxUpgrade.js';
  import type { BestiaryUpgradeType } from '../modules/bestiary.svelte.js';
  import { formatNumber } from '../systems/scalingSystem.js';
  import { uiStore, showToast } from '../stores/uiStore.svelte.js';
  import { calculateBulkCost, type CostFormula } from '../utils/bulkCost.js';
  import { maxAffordable } from '../utils/maxAffordable.js';
  import { Decimal } from '../systems/decimal.js';

  let buyAmount = $derived(uiStore.buyAmount);

  // Helper to resolve cost for both number and 'max'
  function resolveCost(formula: CostFormula, currentLevel: number, amount: number | 'max', budget: Decimal): { cost: Decimal, count: number } {
    const count = amount === 'max' ? maxAffordable(budget, currentLevel, formula) : amount;
    const cost = calculateBulkCost(formula, currentLevel, count);
    return { cost, count };
  }

  // Derived costs for upgrades
  let upgradeCosts = $derived.by(() => {
    const a = buyAmount;
    const data = bestiaryState.dataFragments;
    
    return {
      anatomy:        resolveCost({ type: 'linear', base: 0, gain: 500 }, Number(bestiaryState.anatomy), a, data),
      huntersGreed:   resolveCost({ type: 'linear', base: 1000, gain: 1000 }, Number(bestiaryState.huntersGreed), a, data),
      soulExtraction: resolveCost({ type: 'linear', base: 0, gain: 2500 }, Number(bestiaryState.soulExtraction), a, data)
    };
  });

  function doMax() { autoUpgradeBestiary(); showToast('Bestiary optimized!', 'success'); }
</script>

<div class="bestiary-panel">
  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">🧬</div>
      <div class="header-title-box">
        <h2 class="transcended-text">DATA.BESTIARY</h2>
        <h3 class="header-subtitle">COMBAT ARCHIVES</h3>
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
         {#each [1, 10, 100, 1000] as amt}
           <button class="amt-btn" class:active={uiStore.buyAmount === amt} onclick={() => uiStore.buyAmount = amt}>x{amt}</button>
         {/each}
         <button class="amt-btn" class:active={uiStore.buyAmount === 'max'} onclick={() => uiStore.buyAmount = 'max'}>MAX</button>
      </div>
      <button class="max-btn" onclick={doMax}>⚡ AUTO-UP</button>
    </div>


    <div class="upgrade-row">
      {#each ['anatomy', 'huntersGreed', 'soulExtraction'] as type}
        {@const costData = upgradeCosts[type as keyof typeof upgradeCosts]}
        {#if costData && typeof costData === 'object' && 'cost' in costData}
          <button class="btn-u" onclick={() => buyBestiaryUpgrade(type as BestiaryUpgradeType, buyAmount)} 
            disabled={bestiaryState.dataFragments.lt(costData.cost)}>
            <span class="u-name">
              {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')} [v.{bestiaryState[type as BestiaryUpgradeType]}]
            </span>
            <small>Cost: {formatNumber(costData.cost)} {buyAmount === 'max' ? `(x${costData.count})` : ''}</small>
          </button>
        {/if}
      {/each}
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
  .amt-btn { padding: 2px 6px; font-size: 0.6rem; background: #000; border: 1px solid #333; color: #666; cursor: pointer; }
  .amt-btn.active { border-color: var(--neon-blue); color: var(--neon-blue); }
  
  .upgrade-row { display: grid; grid-template-columns: 1fr; gap: 5px; }
  .btn-u { background: var(--panel-bg); border: 1px solid var(--border-subtle); padding: 12px; cursor: pointer; text-align: left; transition: 0.2s; }
  .btn-u:hover:not(:disabled) { border-color: var(--neon-blue); background: rgba(0, 190, 255, 0.05); }
  .u-name { font-weight: bold; color: var(--color-text); font-size: 0.85rem; }
  .btn-u small { display: block; font-size: 0.65rem; color: var(--color-muted); margin-top: 4px; }

  .mob-list { display: flex; flex-direction: column; gap: 4px; padding-top: 5px; }
  .mob-entry { background: var(--panel-bg); border: 1px solid var(--border-subtle); border-left: 3px solid #444; padding: 8px 12px; }
  .mob-header { display: flex; justify-content: space-between; align-items: center; }
  .mob-name { font-size: 0.8rem; font-weight: bold; color: #ddd; }
  .mob-stage { font-size: 0.65rem; color: var(--color-primary); }
  .mob-stats { display: flex; gap: 12px; color: var(--color-muted); font-size: 0.65rem; margin-top: 4px; }
  
  .mob-entry.omniscient { border-left-color: #ffaa00; }
  .mob-entry.transcendent { border-left-color: #ff00ff; }
  .mob-entry.exalted { border-left-color: #00ffaa; }
  .mob-entry.mastered { border-left-color: #00ccff; }
</style>
