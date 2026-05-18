
<script lang="ts">
  import { achievementDefs, achievementState } from '../systems/achievementSystem.svelte.js';
  import Value from './Value.svelte';

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
      <span class="stat-value"><Value n={unlockedCount} /> / <Value n={total} /></span>
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
          <div class="ach-icon"></div>
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
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
  background: var(--bg-1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 1rem;
  color: var(--gold);
  line-height: 1;
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
  color: var(--text-0);
  margin: 0;
}

.transcended-sub {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--text-2);
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.stat-label {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--text-2);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--font-data);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}

.ach-progress-track {
  height: 4px;
  background: hsl(0 0% 0% / 0.4);
  flex-shrink: 0;
  overflow: hidden;
}

.ach-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold), hsl(45 100% 70%));
  transition: width 200ms ease;
}

.ach-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg-2);
}

.ach-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-1);
  border: 1px solid var(--line);
  padding: 10px 12px;
  transition: all var(--fast);
}
.ach-card.unlocked {
  border-color: var(--gold);
  background: hsl(45 100% 60% / 0.05);
}
.ach-card:hover {
  border-color: var(--line);
}

.ach-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ach-icon {
  width: 8px;
  height: 8px;
  border: 1px solid var(--line);
  flex-shrink: 0;
  transition: all var(--fast);
}
.ach-card.unlocked .ach-icon {
  background: var(--gold);
  border-color: var(--gold);
  box-shadow: 0 0 6px var(--gold);
}

.ach-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ach-name {
  font-family: var(--font-hud);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-0);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ach-desc {
  font-family: var(--font-data);
  font-size: 0.65rem;
  color: var(--text-2);
  line-height: 1.4;
}

.ach-bonus {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text-2);
  flex-shrink: 0;
  text-align: right;
  text-transform: uppercase;
}
.ach-bonus.bonus-active {
  color: var(--gold);
}
</style>
