
<script lang="ts">
  import { uiStore, dismissOfflineSummary } from '../stores/uiStore.svelte.js';
  import { formatValue } from '../systems/formatValue.js';

  function fmt(): string {
    const summary = uiStore.offlineSummary;
    if (!summary) return '';
    const mins = Math.floor(summary.seconds / 60);
    const hrs  = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}D ${hrs % 24}H ${mins % 60}M`;
    if (hrs > 0)  return `${hrs}H ${mins % 60}M`;
    return `${mins}M`;
  }
</script>

{#if uiStore.offlineSummary}
  <div class="overlay">
    <div class="modal">
      <div class="modal-label">OFFLINE SYNC</div>
      <div class="elapsed">{fmt()}</div>

      <div class="stats-grid">
        <div class="stat-cell">
          <span class="sc-label">KILLS</span>
          <span class="sc-val red">{formatValue(uiStore.offlineSummary.kills)}</span>
        </div>
        <div class="stat-cell">
          <span class="sc-label">LEVELS</span>
          <span class="sc-val gold">{formatValue(uiStore.offlineSummary.levels)}</span>
        </div>
        <div class="stat-cell">
          <span class="sc-label">EFFICIENCY</span>
          <span class="sc-val cyan">{(uiStore.offlineSummary.efficiency * 100).toFixed(0)}%</span>
        </div>
        <div class="stat-cell">
          <span class="sc-label">XP EARNED</span>
          <span class="sc-val">{formatValue(uiStore.offlineSummary.xpGained)}</span>
        </div>
        <div class="stat-cell">
          <span class="sc-label">◇ FRAGMENTS</span>
          <span class="sc-val purple">{formatValue(uiStore.offlineSummary.fragmentsGained)}</span>
        </div>
        <div class="stat-cell">
          <span class="sc-label">⬟ DATA</span>
          <span class="sc-val cyan">{formatValue(uiStore.offlineSummary.dataFragments)}</span>
        </div>
        <div class="stat-cell">
          <span class="sc-label">⟡ DNA</span>
          <span class="sc-val green">{formatValue(uiStore.offlineSummary.dnaFragments)}</span>
        </div>
        <div class="stat-cell">
          <span class="sc-label">⛏ MINING</span>
          <span class="sc-val">{formatValue(uiStore.offlineSummary.miningGained)}</span>
        </div>
        <div class="stat-cell">
          <span class="sc-label">🌲 FORESTRY</span>
          <span class="sc-val">{formatValue(uiStore.offlineSummary.forestryGained)}</span>
        </div>
      </div>

      <button class="continue-btn" onclick={dismissOfflineSummary}>CONTINUE</button>
    </div>
  </div>
{/if}

<style>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}

.modal {
  background: var(--bg-1);
  border: 1px solid var(--line);
  padding: 24px;
  width: 320px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.modal::before, .modal::after {
  content: ''; position: absolute;
  width: 12px; height: 12px; border: 3px solid var(--red);
}
.modal::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.modal::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.modal-label {
  font-family: var(--font-hud);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-2);
}

.elapsed {
  font-family: var(--font-data);
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-0);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
}

.stat-cell {
  background: var(--bg-2);
  padding: 10px 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
}

.sc-label {
  font-family: var(--font-hud);
  font-size: 0.48rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-2);
  white-space: nowrap;
}

.sc-val {
  font-family: var(--font-data);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-0);
  font-variant-numeric: tabular-nums;
}

.sc-val.red { color: var(--red); }
.sc-val.gold { color: var(--gold); }
.sc-val.cyan { color: var(--cyan); }
.sc-val.purple { color: var(--purple); }
.sc-val.green { color: var(--green); }

.continue-btn {
  font-family: var(--font-hud);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: transparent;
  border: 1px solid var(--red);
  color: var(--red);
  padding: 10px;
  cursor: pointer;
  width: 100%;
  transition: all var(--fast);
  position: relative;
}
.continue-btn::before, .continue-btn::after {
  content: ''; position: absolute;
  width: 6px; height: 6px; border: 1px solid var(--red);
}
.continue-btn::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.continue-btn::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.continue-btn:hover {
  background: hsl(0 100% 60% / 0.15);
  color: var(--text-0);
  box-shadow: 0 0 10px hsl(0 100% 60% / 0.4);
}
</style>
