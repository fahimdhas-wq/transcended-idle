<script>
  import { uiStore, dismissOfflineSummary } from '../stores/uiStore.svelte.js';
  import { formatValue } from '../systems/formatValue.js';

  function fmt(s) {
    if (!s) return '';
    const summary = uiStore.offlineSummary;
    const mins = Math.floor(summary.seconds / 60);
    const hrs  = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    
    if (days > 0) return `${days}d ${hrs % 24}h ${mins % 60}m`;
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  }
</script>

{#if uiStore.offlineSummary}
  <div class="overlay">
    <div class="modal">
      <div class="modal-title transcended-text">OFFLINE SYNC</div>
      <div class="modal-sub">You were away for <span class="highlight">{fmt()}</span></div>

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

      <button class="dismiss-btn" onclick={dismissOfflineSummary}>⚡ CONTINUE</button>
    </div>
  </div>
{/if}

<style>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}
.modal {
  background: hsl(0,0%,6%);
  border: 1px solid var(--neon-blue);
  padding: 24px;
  width: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: 0 0 30px rgba(0,190,255,0.2);
}
.modal-title { font-size: 1.1rem; }
.modal-sub { font-size: 0.75rem; color: var(--color-muted); font-family: var(--font-cyber); }
.highlight { color: var(--neon-blue); }

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  width: 100%;
}
.stat-cell {
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--border-subtle);
  padding: 8px 4px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sc-label { font-size: 0.55rem; color: var(--neon-blue); font-family: var(--font-cyber); }
.sc-val   { font-size: 0.9rem; color: #fff; font-family: var(--font-cyber); }

.dismiss-btn {
  width: 100%;
  background: rgba(0,190,255,0.1);
  border: 1px solid var(--neon-blue);
  color: var(--neon-blue);
  font-family: var(--font-cyber);
  font-size: 0.8rem;
  padding: 10px;
  cursor: pointer;
  transition: 0.15s;
}
.dismiss-btn:hover {
  background: rgba(0,190,255,0.2);
  color: #fff;
}
</style>
