
<script lang="ts">
  import { inventory } from '../modules/inventory.svelte.js';
  import { formatNumber } from '../systems/scalingSystem.js';
  import type { ItemRarity } from '../data/items.js';
  import { onMount, untrack } from 'svelte';

  type SortKey = 'name' | 'rarity' | 'count';

  const rarityOrder: Record<ItemRarity, number> = { Common: 0, Rare: 1, Epic: 2, Legendary: 3, Mythic: 4 };
  const rarityColors: Record<ItemRarity, string> = {
    Common: 'var(--text-2)',
    Rare: 'var(--cyan)',
    Epic: 'var(--purple)',
    Legendary: 'var(--gold)',
    Mythic: 'var(--red)',
  };
  const rarityBorders: Record<ItemRarity, string> = {
    Common: 'var(--line)',
    Rare: 'var(--cyan)',
    Epic: 'var(--purple)',
    Legendary: 'var(--gold)',
    Mythic: 'var(--red)',
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
    sortedItems = doSort();
  }

  function doSort() {
    const arr = [...inventory.items];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name')   cmp = a.name.localeCompare(b.name);
      if (sortKey === 'rarity') cmp = (rarityOrder[a.rarity] ?? 0) - (rarityOrder[b.rarity] ?? 0);
      if (sortKey === 'count')  cmp = a.count - b.count;
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }

  let totalItems = $derived(inventory.items.reduce((s, i) => s + i.count, 0));

  let sortedItems = $state(doSort());

  // Throttled re-sort when inventory changes (not on every item update)
  let _lastSortTime = 0;
  function refreshSort() {
    const now = performance.now();
    if (now - _lastSortTime > 250) {
      _lastSortTime = now;
      sortedItems = doSort();
    }
  }

  onMount(() => {
    const id = setInterval(() => refreshSort(), 300);
    return () => clearInterval(id);
  });
</script>

<div class="inventory-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#128717;</div>
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
    <span class="sort-hint">SORT:</span>
    {#each sortOptions as opt (opt.key)}
      <button
        class="sort-btn"
        class:active={sortKey === opt.key}
        onclick={() => setSort(opt.key)}
      >
        {opt.label}
        {#if sortKey === opt.key}
          <span class="sort-arrow">{sortAsc ? '▲' : '▼'}</span>
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
.inventory-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-icon { font-size: 1rem; color: var(--gold); }
.header-text { display: flex; flex-direction: column; gap: 1px; }
.header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.stat-label { font-family: var(--font-hud); font-size: 0.5rem; font-weight: 600; letter-spacing: 0.12em; color: var(--text-2); text-transform: uppercase; }
.stat-value { font-family: var(--font-data); font-size: 0.8rem; font-weight: 700; font-variant-numeric: tabular-nums; }

.sort-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--line);
}
.sort-hint {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-2);
  text-transform: uppercase;
  margin-right: 4px;
}
.sort-btn {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text-2);
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  padding: 4px 8px;
  cursor: pointer;
  transition: all var(--fast);
  display: flex;
  align-items: center;
  gap: 3px;
}
.sort-btn.active {
  border-color: var(--cyan);
  color: var(--cyan);
  background: hsl(185 100% 55% / 0.08);
}
.sort-btn:hover:not(.active) {
  border-color: var(--line);
  color: var(--text-1);
}
.sort-arrow { font-size: 0.5rem; }

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-2);
  font-family: var(--font-hud);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.inv-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 10px;
  overflow-y: auto;
}
.inv-cell {
  background: var(--bg-1);
  border: 1px solid var(--line);
  padding: 10px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: all var(--fast);
}
.inv-cell:hover {
  background: hsl(185 100% 55% / 0.04);
}

.cell-count {
  position: absolute;
  top: 3px;
  right: 5px;
  font-family: var(--font-data);
  font-size: 0.55rem;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
.cell-name {
  font-family: var(--font-hud);
  font-size: 0.65rem;
  font-weight: 700;
  text-align: center;
  margin-top: 8px;
  margin-bottom: 2px;
  line-height: 1.2;
}
.cell-rarity {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-2);
}
</style>
