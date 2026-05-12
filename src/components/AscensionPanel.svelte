<script lang="ts">
  import {
    ascensionState,
    buyUpgrade,
    getUpgradeLevel,
    getUpgradeProgress,
    getNextUpgradeCost,
    getAffordableLevelCount,
    canBuyUpgrade,
    performAscension,
    isAscensionAvailable,
    canAscend,
    getAscensionShardCost
  } from '../modules/ascension.svelte.js';
  import {
    ascensionUpgrades,
    getUpgradesByCategory,
    ASCENSION_TIER_NAMES,
    TIER_REQUIREMENTS,
    type UpgradeCategory
  } from '../data/ascensionUpgrades.js';
  import { showToast } from '../stores/uiStore.svelte.js';
  import { addLog } from '../ui/LogPanelState.svelte.js';

  type Category = UpgradeCategory;
  const categories: Category[] = ['power', 'economy', 'multiplier'];

  const categoryLabels: Record<Category, string> = {
    power: '⚔️ POWER',
    economy: '💰 ECONOMY',
    multiplier: '📈 MULTIPLIER'
  };

  const categoryColors: Record<Category, string> = {
    power: 'var(--red)',
    economy: 'var(--gold)',
    multiplier: 'var(--cyan)'
  };

  let selectedCategory = $state<Category>('power');

  function getUpgradesForCategory(cat: Category) {
    return getUpgradesByCategory(cat).filter(u => u.tierRequired <= ascensionState.currentTier);
  }

  function getUpgradeCost(id: string): number {
    return getNextUpgradeCost(id);
  }

  function isUpgradeMaxed(id: string): boolean {
    return getUpgradeProgress(id).isMaxed;
  }

  function handleBuyUpgrade(id: string) {
    if (buyUpgrade(id, 1)) {
      const def = ascensionUpgrades.find(u => u.id === id);
      if (def) {
        showToast(`Upgraded ${def.name}!`, 'success');
      }
    }
  }

  function handleBuyMax(id: string) {
    const count = getAffordableLevelCount(id);
    if (count > 0 && buyUpgrade(id, count)) {
      const def = ascensionUpgrades.find(u => u.id === id);
      if (def) {
        showToast(`Maxed ${def.name} x${count}!`, 'success');
      }
    }
  }

  function handleAscend() {
    if (!canAscend()) {
      showToast('Ascension available after first run', 'info');
      return;
    }
    const cost = getAscensionShardCost();
    if (ascensionState.shards < cost) {
      showToast(`Need ${cost} shards to ascend`, 'info');
      return;
    }
    ascensionState.shards -= cost;
    const result = performAscension();
    addLog(`[ASCENSION] +${result.shardsGained} Shards! Total: ${ascensionState.ascensionCount} ascensions`, 'awakening');
    showToast(`Ascended! +${result.shardsGained} Shards`, 'success');
  }

  function formatShards(n: number): string {
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  }
</script>

<div class="ascension-panel">
  <!-- Header -->
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">☆</div>
      <div class="header-text">
        <h2 class="transcended-text">ASCENSION</h2>
        <span class="transcended-sub">{ASCENSION_TIER_NAMES[ascensionState.currentTier]}</span>
      </div>
    </div>
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">SHARDS</span>
        <span class="stat-value gold">{formatShards(ascensionState.shards)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">ASCENSIONS</span>
        <span class="stat-value">{ascensionState.ascensionCount}</span>
      </div>
    </div>
  </div>

  <!-- Ascend Button -->
  <div class="ascend-section">
    <div class="ascend-info">
      <span class="ascend-label">PERFORM ASCENSION</span>
      <span class="ascend-cost">Cost: {formatShards(getAscensionShardCost())} shards</span>
    </div>
    <button class="ascend-btn" onclick={handleAscend}>
      <span class="btn-icon">⟳</span>
      <span>ASCEND</span>
    </button>
    <p class="ascend-desc">
      Reset your progress to gain more Ascension Shards.
      Keep all Ascension Upgrades permanently.
    </p>
  </div>

  <!-- Category Tabs -->
  <div class="category-tabs">
    {#each categories as cat}
      <button
        class="cat-tab"
        class:active={selectedCategory === cat}
        style="--cat-color: {categoryColors[cat]}"
        onclick={() => selectedCategory = cat}
      >
        {categoryLabels[cat]}
      </button>
    {/each}
  </div>

  <!-- Upgrade List -->
  <div class="upgrade-list">
    {#each getUpgradesForCategory(selectedCategory) as def}
      {@const progress = getUpgradeProgress(def.id)}
      {@const cost = getUpgradeCost(def.id)}
      {@const canBuy = canBuyUpgrade(def.id)}
      {@const isMaxed = progress.isMaxed}
      <div class="upgrade-row" class:maxed={isMaxed}>
        <div class="upg-icon">{def.icon}</div>
        <div class="upg-info">
          <div class="upg-name">{def.name}</div>
          <div class="upg-desc">{def.description}</div>
          <div class="upg-effect">
            {#if progress.current > 0}
              <span class="current-effect">{def.effectDesc(progress.current)}</span>
              {#if !isMaxed}
                <span class="next-effect"> → {def.effectDesc(progress.current + 1)}</span>
              {/if}
            {:else}
              <span class="next-effect">{def.effectDesc(1)}</span>
            {/if}
          </div>
        </div>
        <div class="upg-level">
          <span class="level-num">{progress.current}</span>
          <span class="level-max">/{progress.max}</span>
        </div>
        <div class="upg-bar">
          <div class="bar-fill" style="width: {progress.percentage}%"></div>
        </div>
        {#if !isMaxed}
          <div class="upg-actions">
            <span class="cost-label">{formatShards(cost)}</span>
            <button class="buy-btn" onclick={() => handleBuyUpgrade(def.id)} disabled={!canBuy}>
              +1
            </button>
            <button class="buy-max-btn" onclick={() => handleBuyMax(def.id)} disabled={!canBuy}>
              MAX
            </button>
          </div>
        {:else}
          <div class="maxed-badge">MAXED</div>
        {/if}
      </div>
    {/each}
    {#if getUpgradesForCategory(selectedCategory).length === 0}
      <div class="empty-state">
        No upgrades available for this tier.
        Ascend to unlock more upgrades!
      </div>
    {/if}
  </div>

  <!-- Tier Progress -->
  <div class="tier-progress">
    <div class="tier-header">
      <span class="tier-label">ASCENSION TIER PROGRESS</span>
      <span class="tier-value">{ascensionState.ascensionCount} / 50 for max tier</span>
    </div>
    <div class="tier-bar">
      <div class="tier-fill" style="width: {Math.min(100, (ascensionState.ascensionCount / 50) * 100)}%"></div>
    </div>
    <div class="tier-unlocks">
      {#each Object.entries(TIER_REQUIREMENTS) as [tier, req]}
        <div class="tier-milestone" class:unlocked={ascensionState.ascensionCount >= req}>
          <span class="tier-num">{tier}</span>
          <span class="tier-req">{req} asc</span>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .ascension-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    gap: 12px;
    padding: 12px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .header-icon {
    font-size: 1.2rem;
    color: var(--gold);
  }
  .header-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .transcended-text {
    font-family: var(--font-hud);
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gold);
    margin: 0;
  }
  .transcended-sub {
    font-family: var(--font-hud);
    font-size: 0.5rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-2);
  }
  .header-stats {
    display: flex;
    gap: 16px;
  }
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
  }
  .stat-label {
    font-family: var(--font-hud);
    font-size: 0.5rem;
    letter-spacing: 0.15em;
    color: var(--text-2);
  }
  .stat-value {
    font-family: var(--font-data);
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-0);
  }
  .stat-value.gold { color: var(--gold); }

  /* Ascend Section */
  .ascend-section {
    background: var(--bg-2);
    border: 1px solid var(--gold);
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .ascend-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ascend-label {
    font-family: var(--font-hud);
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--gold);
  }
  .ascend-cost {
    font-family: var(--font-data);
    font-size: 0.7rem;
    color: var(--text-2);
  }
  .ascend-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: linear-gradient(180deg, var(--gold), hsl(45 100% 40%));
    border: none;
    color: var(--bg-void);
    font-family: var(--font-hud);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ascend-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px hsl(45 100% 50% / 0.5);
  }
  .ascend-desc {
    flex-shrink: 0;
    font-size: 0.6rem;
    color: var(--text-2);
    max-width: 200px;
    margin: 0;
  }

  /* Category Tabs */
  .category-tabs {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .cat-tab {
    flex: 1;
    padding: 8px;
    background: var(--bg-2);
    border: 1px solid var(--line);
    color: var(--text-2);
    font-family: var(--font-hud);
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .cat-tab:hover {
    border-color: var(--cat-color);
    color: var(--cat-color);
  }
  .cat-tab.active {
    border-color: var(--cat-color);
    color: var(--cat-color);
    background: hsl(from var(--cat-color) h s l / 0.1);
  }

  /* Upgrade List */
  .upgrade-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .upgrade-row {
    display: grid;
    grid-template-columns: 36px 1fr auto auto;
    grid-template-rows: auto auto;
    gap: 4px 8px;
    align-items: center;
    padding: 8px;
    background: var(--bg-1);
    border: 1px solid var(--line);
    transition: border-color 0.2s;
  }
  .upgrade-row:hover {
    border-color: var(--cyan);
  }
  .upgrade-row.maxed {
    opacity: 0.6;
    border-color: var(--gold);
  }
  .upg-icon {
    font-size: 1.2rem;
    text-align: center;
    grid-row: 1 / 3;
  }
  .upg-info {
    grid-column: 2;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .upg-name {
    font-family: var(--font-hud);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--text-0);
  }
  .upg-desc {
    font-size: 0.6rem;
    color: var(--text-2);
  }
  .upg-effect {
    font-family: var(--font-data);
    font-size: 0.65rem;
  }
  .current-effect { color: var(--green); }
  .next-effect { color: var(--text-2); }
  .upg-level {
    display: flex;
    align-items: baseline;
    gap: 2px;
    font-family: var(--font-data);
  }
  .level-num {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-0);
  }
  .level-max {
    font-size: 0.65rem;
    color: var(--text-2);
  }
  .upg-bar {
    grid-column: 2;
    height: 3px;
    background: var(--bg-0);
    border: 1px solid var(--line);
  }
  .bar-fill {
    height: 100%;
    background: var(--cyan);
    transition: width 0.3s;
  }
  .upg-actions {
    grid-column: 4;
    grid-row: 1 / 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .cost-label {
    font-family: var(--font-data);
    font-size: 0.65rem;
    color: var(--gold);
  }
  .buy-btn, .buy-max-btn {
    padding: 4px 8px;
    border: 1px solid var(--line);
    background: var(--bg-2);
    color: var(--text-0);
    font-family: var(--font-hud);
    font-size: 0.55rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .buy-btn:hover:not(:disabled) {
    border-color: var(--cyan);
    color: var(--cyan);
  }
  .buy-max-btn:hover:not(:disabled) {
    border-color: var(--gold);
    color: var(--gold);
  }
  .buy-btn:disabled, .buy-max-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .maxed-badge {
    grid-column: 4;
    grid-row: 1 / 3;
    padding: 4px 8px;
    background: hsl(45 100% 50% / 0.1);
    border: 1px solid var(--gold);
    font-family: var(--font-hud);
    font-size: 0.55rem;
    font-weight: 700;
    color: var(--gold);
    letter-spacing: 0.1em;
  }
  .empty-state {
    padding: 24px;
    text-align: center;
    color: var(--text-2);
    font-family: var(--font-hud);
    font-size: 0.7rem;
  }

  /* Tier Progress */
  .tier-progress {
    flex-shrink: 0;
    padding: 8px;
    background: var(--bg-1);
    border: 1px solid var(--line);
  }
  .tier-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .tier-label {
    font-family: var(--font-hud);
    font-size: 0.55rem;
    letter-spacing: 0.15em;
    color: var(--text-2);
  }
  .tier-value {
    font-family: var(--font-data);
    font-size: 0.65rem;
    color: var(--text-0);
  }
  .tier-bar {
    height: 6px;
    background: var(--bg-0);
    border: 1px solid var(--line);
    margin-bottom: 8px;
  }
  .tier-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--cyan), var(--gold));
    transition: width 0.5s;
  }
  .tier-unlocks {
    display: flex;
    gap: 4px;
  }
  .tier-milestone {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px;
    background: var(--bg-0);
    border: 1px solid var(--line);
    opacity: 0.4;
  }
  .tier-milestone.unlocked {
    opacity: 1;
    border-color: var(--gold);
    color: var(--gold);
  }
  .tier-num {
    font-family: var(--font-hud);
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--text-0);
  }
  .tier-milestone.unlocked .tier-num { color: var(--gold); }
  .tier-req {
    font-family: var(--font-data);
    font-size: 0.5rem;
    color: var(--text-2);
  }
</style>
