
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
          <span class="sc-val">{formatValue(uiStore.offlineSummary.kills)}</span>
        </div>
        <div class="stat-cell">
          <span class="sc-label">LEVELS</span>
          <span class="sc-val">{formatValue(uiStore.offlineSummary.levels)}</span>
        </div>
        <div class="stat-cell">
          <span class="sc-label">EFFICIENCY</span>
          <span class="sc-val">{(uiStore.offlineSummary.efficiency * 100).toFixed(0)}%</span>
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
  background: var(--panel-bg);
  border: 1px solid var(--border-mid);
  padding: 24px;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.modal::before, .modal::after {
  content: ''; position: absolute;
  width: 12px; height: 12px; border: 3px solid var(--accent-danger);
}
.modal::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.modal::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.modal-label {
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.elapsed {
  font-family: var(--font-mono);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1px;
  background: var(--border-subtle);
  border: 1px solid var(--border-subtle);
}

.stat-cell {
  background: var(--panel-inset);
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
}

.sc-label {
  font-family: var(--font-display);
  font-size: 0.54rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.sc-val {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.continue-btn {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: transparent;
  border: 1px solid var(--accent-danger);
  color: var(--accent-danger);
  padding: 10px;
  cursor: pointer;
  width: 100%;
  transition: all var(--t-fast);
  position: relative;
}
.continue-btn::before, .continue-btn::after {
  content: ''; position: absolute;
  width: 6px; height: 6px; border: 1px solid var(--accent-danger);
}
.continue-btn::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.continue-btn::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.continue-btn:hover {
  background: hsla(0, 100%, 50%, 0.15);
  color: var(--accent-white);
  box-shadow: 0 0 10px hsla(0, 100%, 50%, 0.4);
}
</style>

