<script lang="ts">
  import {
    fractureState, generateDungeon, fightFloor,
    getShopLevel, getShopCostFor, canBuyShopItem, buyShopItem,
    isFractureUnlocked,
  } from '../modules/fracture.svelte.js';
  import { SHOP_ITEMS } from '../data/fractureData.js';
  import { formatValue } from '../systems/formatValue.js';

  let lastResult = $state<{ won: boolean; currencyEarned: number; floor: number } | null>(null);

  const unlocked = $derived(isFractureUnlocked());
  const dungeon = $derived(fractureState.dungeon);
  const inRun = $derived(!!dungeon && !dungeon.completed && !dungeon.failed);
  const currentFloor = $derived(inRun && dungeon ? dungeon.floors[dungeon.currentFloor] : null);

  function doGenerate() {
    generateDungeon();
    lastResult = null;
  }

  function doFight() {
    if (!inRun) return;
    lastResult = fightFloor();
  }

  function fmt(v: number): string { return formatValue(v); }

  function modLabel(mods: { name: string }[]): string {
    return mods.map(m => m.name).join(' + ');
  }
</script>

<div class="fracture-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#9876;</div>
      <div class="header-text">
        <h2 class="transcended-text">FRACTURE DUNGEON</h2>
        <span class="transcended-sub">REALM BREAKER</span>
      </div>
    </div>
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">SHARDS</span>
        <span class="stat-value gold">{fmt(fractureState.currency)}</span>
      </div>
    </div>
  </div>

  {#if !unlocked}
    <div class="lock-screen">
      <div class="lock-icon">&#9876;</div>
      <p class="lock-title">LOCKED</p>
      <p class="lock-sub">Reach Ascension Tier 1 to unlock</p>
    </div>
  {:else}

    {#if !inRun && !dungeon?.completed}
      <button class="gen-btn" onclick={doGenerate}>
        GENERATE DUNGEON
      </button>
    {:else if !inRun && dungeon?.completed}
      <div class="result-card">
        <div class="result-title">DUNGEON COMPLETE</div>
        <div class="result-stat">Cleared {dungeon.totalFloors} floors</div>
        <button class="gen-btn" onclick={doGenerate}>NEW DUNGEON</button>
      </div>
    {:else if !inRun && dungeon?.failed}
      <div class="result-card">
        <div class="result-title fail">FAILED</div>
        <div class="result-stat">Reached floor {dungeon.currentFloor}/{dungeon.totalFloors}</div>
        <button class="gen-btn" onclick={doGenerate}>RETRY</button>
      </div>
    {/if}

    {#if inRun && currentFloor}
      <div class="floor-card">
        <div class="floor-header">
          <span class="floor-num">FLOOR {currentFloor.floor}/{dungeon!.totalFloors}</span>
          <span class="floor-theme">{currentFloor.theme.name}</span>
        </div>
        <div class="floor-enemy">
          <span class="enemy-label">{currentFloor.enemyName}</span>
          <span class="mod-badge">{modLabel(currentFloor.modifiers)}</span>
        </div>
        <div class="floor-stats">
          <span>HP: {fmt(currentFloor.enemyHp)}</span>
          <span>ATK: {fmt(currentFloor.enemyAtk)}</span>
          <span>DEF: {fmt(currentFloor.enemyDef)}</span>
        </div>

        <button class="fight-btn" onclick={doFight}>ADVANCE FLOOR</button>
      </div>
    {/if}

    {#if lastResult}
      <div class="result-toast" class:win={lastResult.won} class:lose={!lastResult.won}>
        {#if lastResult.won}
          FLOOR {lastResult.floor} CLEARED &mdash; +{fmt(lastResult.currencyEarned)} shards
        {:else}
          DEFEATED ON FLOOR {lastResult.floor}
        {/if}
      </div>
    {/if}

    <div class="shop-section">
      <div class="shop-header">SHOP</div>
      {#each SHOP_ITEMS as item (item.id)}
        {@const lv = getShopLevel(item.id)}
        {@const cost = getShopCostFor(item)}
        {@const canBuy = canBuyShopItem(item)}
        {@const atMax = lv >= item.maxLevel}
        <div class="shop-row" class:maxed={atMax}>
          <div class="shop-info">
            <span class="shop-name">{item.name}</span>
            <span class="shop-desc">{item.desc}</span>
          </div>
          <div class="shop-level">
            <span class="lv-text">Lv.{lv}/{item.maxLevel}</span>
            <div class="shop-bar"><div class="shop-bar-fill" style="width:{(lv / item.maxLevel) * 100}%"></div></div>
          </div>
          <div class="shop-action">
            {#if atMax}
              <span class="max-badge">MAX</span>
            {:else}
              <button class="buy-btn" disabled={!canBuy} onclick={() => buyShopItem(item, 1)}>
                {fmt(cost)}
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .fracture-panel { display:flex; flex-direction:column; height:100%; gap:10px; }
  .header-icon { color: var(--gold); }
  .gold { color: var(--gold); }

  .gen-btn { display:block; width:100%; padding:14px; background:transparent; border:1px solid var(--cyan); color:var(--cyan); font-family:var(--font-hud); font-size:0.7rem; letter-spacing:0.1em; cursor:pointer; transition:all var(--fast); }
  .gen-btn:hover { background:hsl(185 100% 55% / 0.1); box-shadow:0 0 12px hsl(185 100% 55% / 0.2); }

  .result-card { text-align:center; padding:16px; border:1px solid var(--line); }
  .result-title { font-size:0.85rem; font-weight:900; color:var(--green); font-family:var(--font-hud); letter-spacing:0.12em; }
  .result-title.fail { color:var(--red); }
  .result-stat { font-size:0.6rem; color:var(--text-2); margin:6px 0 12px; font-family:var(--font-mono); }

  .floor-card { display:flex; flex-direction:column; gap:8px; padding:12px; border:1px solid var(--line); }
  .floor-header { display:flex; justify-content:space-between; align-items:center; }
  .floor-num { font-size:0.7rem; font-weight:700; color:var(--text-0); font-family:var(--font-hud); letter-spacing:0.08em; }
  .floor-theme { font-size:0.55rem; color:var(--cyan); font-family:var(--font-mono); }

  .floor-enemy { display:flex; align-items:center; gap:8px; }
  .enemy-label { font-size:0.65rem; font-weight:700; color:var(--pink); font-family:var(--font-mono); }
  .mod-badge { font-size:0.5rem; color:var(--text-2); background:var(--bg-2); padding:2px 6px; font-family:var(--font-hud); }

  .floor-stats { display:flex; gap:12px; font-size:0.55rem; color:var(--text-2); font-family:var(--font-mono); }

  .fight-btn { display:block; width:100%; padding:12px; background:transparent; border:1px solid var(--pink); color:var(--pink); font-family:var(--font-hud); font-size:0.65rem; letter-spacing:0.1em; cursor:pointer; transition:all var(--fast); }
  .fight-btn:hover { background:hsl(330 100% 55% / 0.1); box-shadow:0 0 12px hsl(330 100% 55% / 0.2); }

  .result-toast { text-align:center; padding:8px; font-size:0.6rem; font-family:var(--font-hud); letter-spacing:0.06em; border:1px solid; }
  .result-toast.win { color:var(--green); border-color:var(--green); background:hsl(120 60% 50% / 0.05); }
  .result-toast.lose { color:var(--red); border-color:var(--red); background:hsl(0 60% 50% / 0.05); }

  .shop-section { display:flex; flex-direction:column; gap:4px; margin-top:8px; }
  .shop-header { font-size:0.6rem; font-weight:700; color:var(--text-0); font-family:var(--font-hud); letter-spacing:0.1em; padding:6px 0; border-bottom:1px solid var(--line); }

  .shop-row { display:grid; grid-template-columns:1fr auto auto; gap:8px; align-items:center; padding:6px 8px; border:1px solid var(--line); }
  .shop-row.maxed { opacity:0.5; }
  .shop-info { display:flex; flex-direction:column; gap:1px; }
  .shop-name { font-size:0.6rem; font-weight:700; color:var(--text-0); font-family:var(--font-hud); }
  .shop-desc { font-size:0.5rem; color:var(--text-2); }
  .shop-level { text-align:center; min-width:70px; }
  .lv-text { font-size:0.55rem; color:var(--text-2); font-family:var(--font-mono); }
  .shop-bar { background:var(--bg-2); height:3px; margin-top:2px; overflow:hidden; }
  .shop-bar-fill { height:100%; background:var(--gold); transition:width 0.2s; }

  .buy-btn { background:transparent; border:1px solid var(--line); color:var(--gold); font-size:0.55rem; font-family:var(--font-mono); padding:4px 8px; cursor:pointer; transition:all var(--fast); min-width:50px; }
  .buy-btn:hover:not(:disabled) { border-color:var(--gold); background:hsl(50 100% 55% / 0.1); }
  .buy-btn:disabled { opacity:0.3; cursor:not-allowed; }

  .max-badge { font-size:0.5rem; color:var(--green); font-family:var(--font-hud); font-weight:700; padding:3px 6px; border:1px solid var(--green); }
</style>
