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
          <span class="ach-icon">{unlocked ? '&#10003;' : '&#9675;'}</span>
          <div class="ach-info">
            <span class="ach-name">{ach.name}</span>
            <span class="ach-desc">{ach.desc}</span>
          </div>
          <span class="ach-bonus" class:bonus-active={unlocked}>{ach.bonusDesc}</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .ach-panel { display: flex; flex-direction: column; height: 100%; min-height: 0; }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-icon { font-size: 1rem; color: var(--accent-warning); }
  .header-text { display: flex; flex-direction: column; gap: 1px; }
  .header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .stat-label { font-family: var(--font-display); font-size: 0.56rem; font-weight: 600; letter-spacing: 0.14em; color: var(--color-muted); }
  .stat-value { font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--accent-warning); }

  .ach-progress-track {
    height: 3px;
    background: var(--panel-inset);
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }
  .ach-progress-fill {
    height: 100%;
    background: var(--accent-warning);
    transition: width var(--t-mid);
  }

  .ach-list { flex: 1; min-height: 0; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 6px; }

  .ach-card {
    background: var(--panel-bg);
    border: 1px solid var(--border-subtle);
    border-left: 3px solid var(--color-dim);
    padding: 10px 12px;
    transition: border-color var(--t-fast), background var(--t-fast);
  }
  .ach-card.unlocked {
    border-left-color: var(--accent-warning);
    background: rgba(255, 190, 0, 0.03);
  }
  .ach-card:hover { border-color: var(--border-mid); }

  .ach-top { display: flex; align-items: center; gap: 10px; }
  .ach-icon { font-size: 0.85rem; color: var(--color-dim); flex-shrink: 0; width: 16px; text-align: center; }
  .ach-card.unlocked .ach-icon { color: var(--accent-warning); }

  .ach-info { display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 2px; }
  .ach-name { font-size: 0.75rem; font-weight: 700; color: var(--color-text); }
  .ach-desc { font-size: 0.62rem; color: var(--color-muted); }

  .ach-bonus {
    font-size: 0.6rem;
    font-family: var(--font-display);
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--color-dim);
    flex-shrink: 0;
    text-align: right;
  }
  .ach-bonus.bonus-active { color: var(--accent-warning); }
</style>
