
<script lang="ts">
  import { character } from '../modules/character.svelte.js';
  import { formatNumber } from '../systems/scalingSystem.js';
  import { showToast } from '../stores/uiStore.svelte.js';
  import { Decimal } from '../systems/decimal.js';
  import ConfirmationModal from './ConfirmationModal.svelte';

  const sealRequirements = [
    '1e4', '5e4', '25e4', '1e6', '5e6', '25e6', '1e8',
    '1e10', '1e12', '1e15', '1e18', '1e22', '1e26', '1e30',
    '1e35', '1e40', '1e50', '1e75', '1e100', '1e150', '1e200', '1e300',
    '1e500', '1e1000', '1e5000'
  ];

  let pendingSealIdx = $state<number | null>(null);
  let showModal = $state(false);

  function killPct(reqRaw: string): number {
    const req = Decimal.from(reqRaw);
    if (character.kills.gte(req)) return 100;
    return Math.min(100, character.kills.div(req).mul(100).toNumber());
  }

  function requestBreak(idx: number): void {
    pendingSealIdx = idx;
    showModal = true;
  }

  function confirmBreak(): void {
    const idx = pendingSealIdx;
    if (idx === null) return;
    if (character.seals === idx && character.kills.gte(Decimal.from(sealRequirements[idx]))) {
      character.seals++;
      showToast(`SEAL ${idx + 1} BROKEN — ×${Math.pow(10, character.seals)} MULT`, 'success');
    }
    pendingSealIdx = null;
  }

  function canBreak(idx: number): boolean {
    return character.seals === idx && character.kills.gte(Decimal.from(sealRequirements[idx]));
  }
</script>

<div class="seals-panel">

  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">◉</div>
      <div class="header-title-box">
        <h2 class="transcended-text">AWAKENING SEALS</h2>
        <div class="header-subtitle">UNBIND YOUR POWER</div>
      </div>
    </div>
    <div class="header-stats">
      <div class="header-stat-box">
        <span class="stat-label">KILLS</span>
        <span class="stat-value">{formatNumber(character.kills)}</span>
      </div>
    </div>
  </div>

  <!-- God multiplier strip -->
  <div class="god-strip">
    <span class="god-label">GOD MULTIPLIER</span>
    <span class="god-val">×{formatNumber(Math.pow(10, character.seals))}</span>
    <span class="god-seals">{character.seals} / {sealRequirements.length} SEALS</span>
  </div>

  <!-- Seals list -->
  <div class="seals-list">
    {#each sealRequirements as req, idx}
      {@const broken = character.seals > idx}
      {@const available = canBreak(idx)}
      {@const pct = killPct(req)}

      <div class="seal-row"
        class:broken={broken}
        class:available={available}
        class:locked={!broken && !available && character.seals < idx}
      >
        <div class="seal-left">
          <span class="seal-num">SEAL {idx + 1}</span>
          <span class="seal-req">{formatNumber(req)} kills</span>
        </div>

        <div class="seal-mid">
          {#if broken}
            <span class="broken-text">BROKEN</span>
          {:else}
            <div class="kill-bar-wrap">
              <div class="kill-bar-fill" style="width:{pct}%"></div>
            </div>
            <span class="pct-text">{pct.toFixed(1)}%</span>
          {/if}
        </div>

        <div class="seal-right">
          {#if broken}
            <span class="check">✓</span>
          {:else if available}
            <button class="break-btn" onclick={() => requestBreak(idx)}>BREAK</button>
          {:else}
            <span class="lock-icon">—</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>

</div>

<ConfirmationModal
  bind:show={showModal}
  message="Break Seal {(pendingSealIdx ?? 0) + 1}? Grants permanent ×10 multiplier. Cannot be undone."
  onConfirm={confirmBreak}
/>

<style>
.seals-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ── GOD STRIP ──────────────────────────────── */
.god-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--panel-inset);
  flex-shrink: 0;
}

.god-label {
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
  flex: 1;
}

.god-val {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent-amber);
  font-variant-numeric: tabular-nums;
}

.god-seals {
  font-family: var(--font-display);
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--color-muted);
  text-transform: uppercase;
}

/* ── SEALS LIST ─────────────────────────────── */
.seals-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px 0;
}

.seal-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border: 1px solid var(--border-subtle);
  background: transparent;
  transition: all var(--t-fast);
  position: relative;
}
.seal-row::before, .seal-row::after {
  content: ''; position: absolute;
  width: 4px; height: 4px; border: 1px solid var(--accent-danger);
}
.seal-row::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.seal-row::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.seal-row.broken {
  border-color: var(--accent-danger);
  background: hsla(0, 100%, 50%, 0.05);
  opacity: 0.6;
}

.seal-row.available {
  border-color: var(--accent-danger);
  background: hsla(0, 100%, 50%, 0.15);
  box-shadow: 0 0 10px hsla(0, 100%, 50%, 0.2);
}

.seal-row.locked {
  opacity: 0.3;
}

.seal-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.seal-num {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
}

.seal-req {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
}

/* ── KILL BAR ───────────────────────────────── */
.seal-mid {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: flex-start;
}

.kill-bar-wrap {
  width: 100%;
  height: 6px;
  background: var(--panel-inset);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.kill-bar-fill {
  height: 100%;
  background: var(--accent-danger);
  transition: width 0.4s linear;
  box-shadow: 0 0 10px var(--accent-danger);
}

.pct-text {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
}

.broken-text {
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent-steel);
}

/* ── SEAL RIGHT ─────────────────────────────── */
.seal-right { display: flex; justify-content: flex-end; }

.check {
  font-size: 0.8rem;
  color: var(--accent-steel);
}

.lock-icon {
  font-size: 0.7rem;
  color: var(--color-dim);
}

.break-btn {
  font-family: var(--font-display);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 5px 12px;
  background: transparent;
  border: 1px solid var(--accent-danger);
  color: var(--accent-white);
  cursor: pointer;
  transition: all var(--t-fast);
  position: relative;
}
.break-btn::before, .break-btn::after {
  content: ''; position: absolute;
  width: 3px; height: 3px; border: 1px solid var(--accent-white);
}
.break-btn::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.break-btn::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.break-btn:hover {
  background: var(--accent-danger);
  color: var(--accent-white);
  box-shadow: 0 0 10px var(--accent-danger);
}
</style>

