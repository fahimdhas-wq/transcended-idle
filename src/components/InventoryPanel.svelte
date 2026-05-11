
<script lang="ts">
  import { inventory } from '../modules/inventory.svelte.js';
  import { formatNumber } from '../systems/scalingSystem.js';
  import type { ItemRarity } from '../data/items.js';

  type SortKey = 'name' | 'rarity' | 'count';

  const rarityOrder: Record<ItemRarity, number> = { Common: 0, Rare: 1, Epic: 2, Legendary: 3, Mythic: 4 };
  const rarityColors: Record<ItemRarity, string> = {
    Common: 'var(--color-dim)',
    Rare: 'var(--accent-steel)',
    Epic: 'var(--accent-violet)',
    Legendary: 'var(--accent-warning)',
    Mythic: 'var(--accent-danger)',
  };
  const rarityBorders: Record<ItemRarity, string> = {
    Common: 'var(--border-subtle)',
    Rare: 'var(--accent-steel)',
    Epic: 'var(--accent-violet)',
    Legendary: 'var(--accent-warning)',
    Mythic: 'var(--accent-danger)',
  };

  let sortKey = $state<SortKey>('rarity');
  let sortAsc = $state(false);

  const sortOptions: Array<{ key: SortKey; label: string }> = [
    { key: 'name',   label: 'NAME'   },
    { key: 'rarity', label: 'RARITY' },
    { key: 'count',  label: 'COUNT'  },
  ];

  function setSort(key: SortKey): void {
    if (sortKey === key) {
      sortAsc = !sortAsc;
    } else {
      sortKey = key;
      sortAsc = (key === 'name');
    }
  }

  let totalItems = $derived(inventory.items.reduce((s, i) => s + i.count, 0));

  let sortedItems = $derived.by(() => {
    const arr = [...inventory.items];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name')   cmp = a.name.localeCompare(b.name);
      if (sortKey === 'rarity') cmp = (rarityOrder[a.rarity] ?? 0) - (rarityOrder[b.rarity] ?? 0);
      if (sortKey === 'count')  cmp = a.count - b.count;
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  });
</script>

<div class="inventory-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#9632;</div>
      <div class="header-text">
        <h2 class="transcended-text">LOOT CACHE</h2>
        <span class="transcended-sub">SECURED ASSETS</span>
      </div>
    </div>
    <div class="header-right">
      <span class="stat-label">TOTAL ITEMS</span>
      <span class="stat-value">{formatNumber(totalItems)}</span>
    </div>
  </div>

  <div class="sort-row">
    <span class="text-xs color-muted">SORT:</span>
    {#each sortOptions as opt (opt.key)}
      <button
        class="sort-btn"
        class:active={sortKey === opt.key}
        onclick={() => setSort(opt.key)}
      >
        {opt.label}
        {#if sortKey === opt.key}
          <span class="sort-arrow">{sortAsc ? '&#9650;' : '&#9660;'}</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if inventory.items.length === 0}
    <div class="empty-state">NO ITEMS COLLECTED YET</div>
  {/if}

  <div class="inv-grid">
    {#each sortedItems as item (item.id)}
      <div
        class="inv-cell"
        style="border-color: {rarityBorders[item.rarity]}; color: {rarityColors[item.rarity]};"
      >
        <span class="cell-count">x{formatNumber(item.count)}</span>
        <span class="cell-name">{item.name}</span>
        <span class="cell-rarity">{item.rarity}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .inventory-panel { display: flex; flex-direction: column; height: 100%; }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-icon { font-size: 1rem; color: var(--accent-amber); }
  .header-text { display: flex; flex-direction: column; gap: 1px; }
  .header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .stat-label { font-family: var(--font-display); font-size: 0.56rem; font-weight: 600; letter-spacing: 0.14em; color: var(--color-muted); }
  .stat-value { font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; font-variant-numeric: tabular-nums; }

  .sort-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .sort-btn {
    background: transparent;
    border: 1px solid var(--border-mid);
    color: var(--color-muted);
    font-family: var(--font-display);
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    padding: 3px 8px;
    cursor: pointer;
    transition: all var(--t-fast);
    display: flex;
    align-items: center;
    gap: 3px;
    position: relative;
  }
  .sort-btn::before, .sort-btn::after {
    content: ''; position: absolute;
    width: 3px; height: 3px; border: 1px solid var(--accent-danger);
  }
  .sort-btn::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .sort-btn::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

  .sort-btn.active { border-color: var(--accent-danger); color: #fff; background: var(--accent-danger); box-shadow: 0 0 10px hsla(0, 100%, 50%, 0.4); }
  .sort-btn:hover:not(.active) { color: var(--accent-white); background: hsla(0, 100%, 50%, 0.1); border-color: var(--accent-danger); }
  .sort-arrow { font-size: 0.5rem; }

  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-dim);
    font-family: var(--font-display);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.12em;
  }

  .inv-grid { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 10px; overflow-y: auto; }
  .inv-cell {
    background: transparent;
    border: 1px solid var(--border-subtle);
    padding: 10px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    transition: all var(--t-fast);
  }
  .inv-cell:hover { background: hsla(0, 100%, 50%, 0.05); }

  .cell-count {
    position: absolute;
    top: 3px;
    right: 5px;
    font-family: var(--font-mono);
    font-size: 0.58rem;
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
  }
  .cell-name {
    font-size: 0.65rem;
    font-weight: 700;
    text-align: center;
    margin-top: 10px;
    margin-bottom: 2px;
    line-height: 1.2;
  }
  .cell-rarity {
    font-family: var(--font-display);
    font-size: 0.52rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--color-muted);
  }
</style>

