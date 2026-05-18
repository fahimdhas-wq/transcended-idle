<script lang="ts">
  import { ascensionUpgrades, ASCENSION_TIERS, type AscensionUpgradeDef, type AscensionCategory } from '../data/ascensionUpgrades.js';
  import { ascensionState, getTier, getTierName, getTierBonus, getUpgradeLevel, getUpgradeCost, canBuyUpgrade, buyUpgrade } from '../modules/ascension.svelte.js';
  import { formatValue } from '../systems/formatValue.js';

  const tier = $derived(getTier());
  const tierName = $derived(getTierName());
  const tierBonus = $derived(getTierBonus());
  const nextTierShards = $derived(tier < ASCENSION_TIERS.length - 1 ? ASCENSION_TIERS[tier + 1].shardReq : Infinity);
  const tierProgress = $derived(tier < ASCENSION_TIERS.length - 1 ? Math.min(100, (ascensionState.lifetimeShards / nextTierShards) * 100) : 100);

  const categories: AscensionCategory[] = ['power', 'economy', 'multiplier'];
  const catLabel: Record<AscensionCategory, string> = { power: 'POWER', economy: 'ECONOMY', multiplier: 'MULTIPLIER' };

  function getCatUpgrades(cat: AscensionCategory): AscensionUpgradeDef[] {
    return ascensionUpgrades.filter(u => u.category === cat);
  }

  function fmt(v: number): string { return formatValue(v); }
</script>

<div class="asc-panel">
  <div class="tier-section">
    <div class="tier-name">{tierName}</div>
    <div class="tier-bonus">+{fmt(tierBonus * 100)}% All Stats</div>
    <div class="bar-track">
      <div class="bar-fill" style="width:{tierProgress}%"></div>
    </div>
    <div class="tier-progress">
      <span>{fmt(ascensionState.lifetimeShards)} / {isFinite(nextTierShards) ? fmt(nextTierShards) : 'MAX'} shards</span>
    </div>
  </div>

  <div class="shard-row">
    <span class="shard-label">ASCENSION SHARDS</span>
    <span class="shard-value">{fmt(ascensionState.shards)}</span>
  </div>

  {#each categories as cat}
    <div class="tree-section">
      <div class="tree-header">{catLabel[cat]}</div>
      {#each getCatUpgrades(cat) as def (def.id)}
        {@const lv = getUpgradeLevel(def.id)}
        {@const cost = getUpgradeCost(def)}
        {@const canBuy = canBuyUpgrade(def)}
        {@const atMax = lv >= def.maxLevel}
        <div class="upg-row" class:maxed={atMax}>
          <div class="upg-info">
            <span class="upg-name">{def.name}</span>
            <span class="upg-desc">{def.desc}</span>
          </div>
          <div class="upg-level">
            <span class="lv-text">Lv.{lv}/{def.maxLevel}</span>
            <div class="upg-bar">
              <div class="upg-bar-fill" style="width:{(lv / def.maxLevel) * 100}%"></div>
            </div>
          </div>
          <div class="upg-action">
            {#if atMax}
              <span class="max-badge">MAX</span>
            {:else}
              <button class="buy-btn" disabled={!canBuy} onclick={() => buyUpgrade(def, 1)}>
                {fmt(cost)}
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .asc-panel { display:flex; flex-direction:column; gap:12px; padding:12px; }

  .tier-section { text-align:center; padding:12px; border:1px solid var(--line); }
  .tier-name { font-size:1.1rem; font-weight:900; color:var(--cyan); font-family:var(--font-hud); letter-spacing:0.1em; }
  .tier-bonus { font-size:0.7rem; color:var(--green); margin-top:4px; font-family:var(--font-hud); }
  .bar-track { background:var(--bg-2); height:6px; margin:8px 0 4px; overflow:hidden; }
  .bar-fill { height:100%; background:var(--cyan); transition:width 0.3s; }
  .tier-progress { font-size:0.55rem; color:var(--text-2); font-family:var(--font-mono); }

  .shard-row { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border:1px solid var(--line); }
  .shard-label { font-size:0.6rem; color:var(--text-2); font-family:var(--font-hud); letter-spacing:0.08em; }
  .shard-value { font-size:0.85rem; font-weight:700; color:var(--pink); font-family:var(--font-mono); }

  .tree-section { display:flex; flex-direction:column; gap:4px; }
  .tree-header { font-size:0.65rem; font-weight:700; color:var(--text-0); font-family:var(--font-hud); letter-spacing:0.1em; padding:6px 0; border-bottom:1px solid var(--line); }

  .upg-row { display:grid; grid-template-columns:1fr auto auto; gap:8px; align-items:center; padding:6px 8px; border:1px solid var(--line); }
  .upg-row.maxed { opacity:0.5; }
  .upg-info { display:flex; flex-direction:column; gap:1px; }
  .upg-name { font-size:0.65rem; font-weight:700; color:var(--text-0); font-family:var(--font-hud); }
  .upg-desc { font-size:0.55rem; color:var(--text-2); }
  .upg-level { text-align:center; min-width:80px; }
  .lv-text { font-size:0.6rem; color:var(--text-2); font-family:var(--font-mono); }
  .upg-bar { background:var(--bg-2); height:4px; margin-top:2px; overflow:hidden; }
  .upg-bar-fill { height:100%; background:var(--cyan); transition:width 0.2s; }

  .buy-btn { background:transparent; border:1px solid var(--line); color:var(--cyan); font-size:0.6rem; font-family:var(--font-mono); padding:4px 10px; cursor:pointer; transition:all var(--fast); min-width:60px; }
  .buy-btn:hover:not(:disabled) { border-color:var(--cyan); background:hsl(185 100% 55% / 0.1); }
  .buy-btn:disabled { opacity:0.3; cursor:not-allowed; }

  .max-badge { font-size:0.55rem; color:var(--green); font-family:var(--font-hud); font-weight:700; padding:4px 8px; border:1px solid var(--green); }
</style>
