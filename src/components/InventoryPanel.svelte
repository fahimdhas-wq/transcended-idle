<script>
  import { inventory } from '../modules/inventory.svelte.js';
  import { formatNumber } from '../systems/scalingSystem.js';

  const rarityOrder = { Common: 0, Rare: 1, Epic: 2, Legendary: 3, Mythic: 4 };

  let sortKey = $state('rarity');
  let sortAsc = $state(false);

  const sortOptions = [
    { key: 'name',   label: 'NAME'   },
    { key: 'rarity', label: 'RARITY' },
    { key: 'count',  label: 'COUNT'  },
  ];

  function setSort(key) {
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
  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">📦</div>
      <div class="header-title-box">
        <h2 class="transcended-text">LOOT CACHE</h2>
        <div class="header-subtitle">SECURED ASSETS</div>
      </div>
    </div>
    <div class="header-stats">
      <div class="header-stat-box">
        <span class="stat-label">TOTAL ITEMS</span>
        <span class="stat-value">{formatNumber(totalItems)}</span>
      </div>
    </div>
  </div>

  <div class="sort-row">
    <span class="text-xs" style="color: var(--color-muted);">SORT:</span>
    {#each sortOptions as opt (opt.key)}
      <button
        class:active={sortKey === opt.key}
        onclick={() => setSort(opt.key)}
      >
        {opt.label}
        {#if sortKey === opt.key}
          {sortAsc ? '▲' : '▼'}
        {/if}
      </button>
    {/each}
  </div>

  {#if inventory.items.length === 0}
    <div class="empty-state text-base">
      NO ITEMS COLLECTED YET
    </div>
  {/if}

  <div class="inv-grid">
    {#each sortedItems as item (item.id)}
      <div
        class="inv-cell r-{item.rarity.toLowerCase()}"
        title="{item.name} — {item.rarity} (x{item.count})"
      >
        <span class="cell-count text-xs">x{formatNumber(item.count)}</span>
        <span class="cell-name text-sm">{item.name}</span>
        <span class="cell-rarity text-xs">{item.rarity}</span>
      </div>
    {/each}
  </div>
</div>

<style>
.inventory-panel { display: flex; flex-direction: column; min-height: 100%; }
.sort-row { display: flex; align-items: center; gap: 4px; padding: 0 10px; margin-bottom: 10px; }
.empty-state { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--color-muted); padding: 20px; }
.inv-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 0 10px 10px 10px; }
.inv-cell { background: var(--panel-bg); border: 1px solid var(--border-subtle); padding: 8px 4px; display: flex; flex-direction: column; align-items: center; position: relative; }
.inv-cell:hover { border-color: var(--color-primary); }
.cell-count { position: absolute; top: 2px; right: 4px; color: var(--color-muted); }
.cell-name { text-align: center; color: var(--color-text); margin-top: 8px; }
.cell-rarity { color: var(--color-muted); }

/* Rarity */
.r-common    { border-color: hsl(0, 0%, 28%); }
.r-rare      { border-color: hsl(190, 80%, 45%); box-shadow: inset 0 0 8px rgba(0,204,255,0.35); }
.r-rare .cell-name  { color: hsl(190, 80%, 65%); }
.r-epic      { border-color: hsl(280, 80%, 55%); box-shadow: inset 0 0 8px rgba(180,0,255,0.35); }
.r-epic .cell-name  { color: hsl(280, 80%, 75%); }
.r-legendary { border-color: hsl(40, 100%, 50%); background: hsl(40, 20%, 5%); box-shadow: inset 0 0 12px rgba(255,170,0,0.4); }
.r-legendary .cell-name { color: hsl(40, 100%, 65%); }
.r-mythic    { border-color: hsl(0, 100%, 55%); background: hsl(0, 20%, 5%); animation: mythic-glow 1.5s infinite alternate; }
.r-mythic .cell-name { color: hsl(0, 100%, 70%); }

@keyframes mythic-glow {
  from { box-shadow: inset 0 0 10px hsl(0, 100%, 30%); }
  to { box-shadow: inset 0 0 25px hsl(0, 100%, 50%); }
}
</style>