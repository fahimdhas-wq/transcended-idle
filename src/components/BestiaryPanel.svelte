<script lang="ts">
  import { bestiaryState, buyBestiaryUpgrade } from '../modules/bestiary.svelte.js';
  import { autoUpgradeBestiary } from '../utils/globalMaxUpgrade.js';
  import type { BestiaryUpgradeType } from '../modules/bestiary.svelte.js';
  import { formatValue } from '../systems/formatValue.js';
  import { uiStore, showToast } from '../stores/uiStore.svelte.js';
  import { calculateBulkCost, type CostFormula } from '../utils/bulkCost.js';
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

  function doBuy(type: BestiaryUpgradeType) { buyBestiaryUpgrade(type, buyAmount); }
  function doMax(type: BestiaryUpgradeType) { buyBestiaryUpgrade(type, 'max'); }
  function doAutoUp() { autoUpgradeBestiary(); showToast('Bestiary optimized!', 'success'); }
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
        <span class="stat-value" style="color: var(--neon-blue);">{fmt(bestiaryState.dataFragments)}</span>
      </div>
      <div class="header-stat-box">
        <span class="stat-label">SOULS</span>
        <span class="stat-value" style="color: var(--neon-purple);">{fmt(bestiaryState.souls)}</span>
      </div>
    </div>
  </div>

  <div class="upgrades-section">
    <div class="section-header">
      <h4 class="transcended-sub">UPGRADES</h4>
      <div class="right-controls">
        <div class="buy-selector">
          {#each [1, 10, 100, 1000, 10000] as amt}
            <button class="amt-btn" class:active={uiStore.buyAmount === amt} onclick={() => uiStore.buyAmount = amt}>x{amt}</button>
          {/each}
        </div>
        <button class="auto-up-btn" onclick={doAutoUp}>AUTO UP</button>
      </div>
    </div>

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
                +{buyAmount === 'max' ? costData.count : buyAmount} <span class="btn-cost">{fmt(costData.cost)} DATA</span>
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
  </div>

  <div class="archive-header">
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
    padding: 10px;
    gap: 10px;
  }

  .upgrades-section { display: flex; flex-direction: column; gap: 8px; }

  .section-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; }
  .right-controls { display: flex; align-items: center; gap: 6px; }

  .buy-selector { display: flex; gap: 2px; }
  .amt-btn { padding: 2px 6px; font-size: 0.6rem; background: #000; border: 1px solid #333; color: #666; cursor: pointer; font-family: var(--font-cyber); transition: 0.1s; }
  .amt-btn.active { border-color: var(--neon-purple); color: var(--neon-purple); }

  .auto-up-btn {
    background: rgba(0,190,255,0.08); border: 1px solid var(--neon-purple);
    color: var(--neon-purple); font-family: var(--font-cyber); font-size: 0.7rem;
    padding: 3px 12px; cursor: pointer; font-weight: bold; letter-spacing: 1px; transition: 0.15s;
  }
  .auto-up-btn:hover { background: rgba(0,190,255,0.2); color: #fff; }

  .upg-list { display: flex; flex-direction: column; gap: 4px; }
  .upg-row {
    display: flex; justify-content: space-between; align-items: center;
    background: rgba(138,43,226,0.03); padding: 8px 10px;
    border-left: 2px solid var(--neon-purple);
    transition: background 0.15s ease;
  }
  .upg-row:hover { background: rgba(138,43,226,0.06); }
  .upg-info { display: flex; flex-direction: column; gap: 1px; min-width: 100px; }
  .upg-name { font-size: 0.7rem; font-weight: bold; color: #e0e0e0; font-family: var(--font-cyber); }
  .upg-lv   { font-size: 0.6rem; color: var(--neon-purple); }

  .upg-btns { display: flex; gap: 5px; align-items: center; }
  .upg-buy-btn {
    background: #1a1a1a; border: 1px solid #444; color: #aaa;
    font-family: var(--font-cyber); font-size: 0.6rem; padding: 5px 10px;
    cursor: pointer; transition: all 0.15s ease;
    white-space: nowrap; min-width: 72px; text-align: center;
  }
  .upg-buy-btn:hover:not(:disabled) { border-color: #fff; color: #fff; box-shadow: 0 0 6px rgba(255,255,255,0.2); }
  .upg-buy-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .btn-cost { font-size: 0.55rem; color: #666; margin-left: 3px; }

  .upg-max-btn {
    background: #1a1a1a; border: 1px solid #444; color: #aaa;
    font-family: var(--font-cyber); font-size: 0.6rem; padding: 5px 10px;
    cursor: pointer; transition: all 0.15s ease;
    white-space: nowrap; min-width: 72px; text-align: center;
  }
  .upg-max-btn:hover:not(:disabled) { border-color: var(--neon-purple); color: #fff; box-shadow: var(--glow-pink); }
  .upg-max-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .archive-header { border-top: 1px solid var(--border-subtle); padding-top: 8px; }

  .mob-list { display: flex; flex-direction: column; gap: 4px; }
  .mob-entry { background: var(--panel-bg); border: 1px solid var(--border-subtle); border-left: 3px solid #444; padding: 8px 12px; }
  .mob-header { display: flex; justify-content: space-between; align-items: center; }
  .mob-name { font-size: 0.8rem; font-weight: bold; color: #ddd; }
  .mob-stage { font-size: 0.65rem; color: var(--color-primary); }
  .mob-stats { display: flex; gap: 12px; color: var(--color-muted); font-size: 0.65rem; margin-top: 4px; }

  .mob-entry.omniscient   { border-left-color: #ffaa00; }
  .mob-entry.transcendent { border-left-color: #ff00ff; }
  .mob-entry.exalted      { border-left-color: #00ffaa; }
  .mob-entry.mastered     { border-left-color: #00ccff; }
</style>
