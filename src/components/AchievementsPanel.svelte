<script>
  import { achievementDefs, achievementState } from '../systems/achievementSystem.svelte.js';

  let unlockedCount = $derived(Object.keys(achievementState.unlocked).length);
  const total = achievementDefs.length;
</script>

<div class="ach-panel">
  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">🏆</div>
      <div class="header-title-box">
        <h2 class="transcended-text">ACHIEVEMENTS</h2>
        <div class="header-subtitle">RECORDED MILESTONES</div>
      </div>
    </div>
    <div class="header-stats">
      <div class="header-stat-box">
        <span class="stat-label">UNLOCKED</span>
        <span class="stat-value">{unlockedCount} / {total}</span>
      </div>
    </div>
  </div>
  <div class="ach-progress-track">
    <div class="ach-progress-fill" style="width: {(unlockedCount/total*100).toFixed(1)}%"></div>
  </div>

  <div class="ach-list" style="padding: 10px; display: flex; flex-direction: column; gap: 8px;">
    {#each achievementDefs as ach (ach.id)}
      <div
        class="ach-card"
        class:unlocked={achievementState.unlocked[ach.id]}
      >
        <div class="ach-top">
          <span class="ach-icon">{achievementState.unlocked[ach.id] ? '✅' : '🔒'}</span>
          <div class="ach-info">
            <span class="text-base" style="font-weight: bold; color: var(--color-text);">{ach.name}</span>
            <span class="text-xs" style="color: var(--color-muted);">{ach.desc}</span>
          </div>
          <span class="text-xs" style="color: var(--color-muted); {achievementState.unlocked[ach.id] ? 'color: #ffcc00;' : ''}">
            {ach.bonusDesc}
          </span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
.ach-panel { display: flex; flex-direction: column; min-height: 100%; }
.ach-progress-track { height: 4px; background: #111; border: 1px solid var(--border-subtle); margin-top: 4px; }
.ach-progress-fill  { height: 100%; background: var(--neon-gold); transition: width 0.4s; }
.ach-card { background: var(--panel-bg); border: 1px solid var(--border-subtle); padding: 8px; }
.ach-card.unlocked { border-color: #aa8800; background: #221a00; }
.ach-top { display: flex; align-items: center; gap: 8px; }
.ach-icon { font-size: 1rem; }
.ach-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
</style>