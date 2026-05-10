
<script lang="ts">
  import { achievementDefs, achievementState } from '../systems/achievementSystem.svelte.js';

  let unlockedCount = $derived(Object.keys(achievementState.unlocked).length);
  const total = achievementDefs.length;
  let pct = $derived((unlockedCount / total * 100).toFixed(1));
</script>

<div class="ach-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#9734;</div>
      <div class="header-text">
        <h2 class="transcended-text">ACHIEVEMENTS</h2>
        <span class="transcended-sub">RECORDED MILESTONES</span>
      </div>
    </div>
    <div class="header-right">
      <span class="stat-label">UNLOCKED</span>
      <span class="stat-value">{unlockedCount} / {total}</span>
    </div>
  </div>

  <div class="ach-progress-track">
    <div class="ach-progress-fill" style:width="{pct}%"></div>
  </div>

  <div class="ach-list">
    {#each achievementDefs as ach (ach.id)}
      {@const unlocked = achievementState.unlocked[ach.id]}
      <div class="ach-card" class:unlocked>
        <div class="ach-top">
          <div class="ach-icon">{unlocked ? '✓' : '○'}</div>
          <div class="ach-info">
            <span class="ach-name">{ach.name}</span>
            <span class="ach-desc">{ach.desc}</span>
          </div>
          <div class="ach-bonus" class:bonus-active={unlocked}>{ach.bonusDesc}</div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .ach-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
    background: var(--panel-bg);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-icon {
    font-size: 1.1rem;
    color: var(--accent-warning);
    line-height: 1;
  }

  .header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .transcended-text {
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--color-text);
    margin: 0;
  }

  .transcended-sub {
    font-family: var(--font-display);
    font-size: 0.58rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: var(--color-muted);
  }

  .header-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
  }

  .stat-label {
    font-family: var(--font-display);
    font-size: 0.56rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .stat-value {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--accent-warning);
    font-variant-numeric: tabular-nums;
  }

  .ach-progress-track {
    height: 4px;
    background: var(--panel-inset);
    flex-shrink: 0;
  }

  .ach-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-warning), #ffcc00);
    transition: width 200ms ease;
  }

  .ach-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--panel-inset);
  }

  .ach-card {
    display: flex;
    flex-direction: column;
    background: var(--panel-bg);
    border: 1px solid var(--border-subtle);
    border-left: 3px solid var(--color-dim);
    padding: 12px 14px;
    transition: border-color 80ms ease, background 80ms ease;
  }

  .ach-card.unlocked {
    border-left-color: var(--accent-warning);
    background: rgba(255, 190, 0, 0.04);
  }

  .ach-card:hover {
    border-color: var(--border-mid);
  }

  .ach-card.unlocked:hover {
    border-left-color: var(--accent-warning);
  }

  .ach-top {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ach-icon {
    font-size: 1rem;
    color: var(--color-dim);
    flex-shrink: 0;
    width: 20px;
    text-align: center;
    font-weight: 700;
  }

  .ach-card.unlocked .ach-icon {
    color: var(--accent-warning);
  }

  .ach-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    gap: 3px;
  }

  .ach-name {
    font-family: var(--font-display);
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ach-desc {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--color-muted);
    line-height: 1.4;
  }

  .ach-bonus {
    font-family: var(--font-display);
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--color-dim);
    flex-shrink: 0;
    text-align: right;
    text-transform: uppercase;
  }

  .ach-bonus.bonus-active {
    color: var(--accent-warning);
  }

  /* Scrollbar styling */
  .ach-list::-webkit-scrollbar {
    width: 6px;
  }

  .ach-list::-webkit-scrollbar-track {
    background: var(--panel-inset);
  }

  .ach-list::-webkit-scrollbar-thumb {
    background: var(--border-mid);
    border-radius: 3px;
  }

  .ach-list::-webkit-scrollbar-thumb:hover {
    background: var(--color-muted);
  }
</style>

