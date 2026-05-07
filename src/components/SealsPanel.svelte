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
    const kills = character.kills;
    if (kills.gte(req)) return 100;
    return Math.min(100, kills.div(req).mul(100).toNumber());
  }

  function requestBreak(idx: number): void {
    pendingSealIdx = idx;
    showModal = true;
  }

  function confirmBreak(): void {
    const idx = pendingSealIdx;
    if (idx === null) return;
    // FIX: Decimal.gte() instead of >=
    if (character.seals === idx && character.kills.gte(Decimal.from(sealRequirements[idx]))) {
      character.seals++;
      showToast(`⚡ SEAL ${idx + 1} BROKEN — x${Math.pow(10, character.seals)} GOD MULT`, 'success');
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
      <div class="header-icon">⎈</div>
      <div class="header-title-box">
        <h2 class="transcended-text">AWAKENING SEALS</h2>
        <div class="header-subtitle">UNBIND YOUR POWER</div>
      </div>
    </div>
    <div class="header-stats">
      <div class="header-stat-box">
        <span class="stat-label">TOTAL KILLS</span>
        <span class="stat-value">{formatNumber(character.kills)}</span>
      </div>
    </div>
  </div>

  <div class="god-info">
    <span class="text-sm">GOD MULTIPLIER</span>
    <span class="god-val">x{formatNumber(Math.pow(10, character.seals))}</span>
  </div>

  <div class="seals-list">
    {#each sealRequirements as req, idx}
      <div
        class="seal-card"
        class:is-unlocked={character.seals > idx}
        class:is-available={canBreak(idx)}
      >
        <div class="seal-row">
          <div class="seal-left">
            <span class="text-sm" style="font-weight: bold;">SEAL {idx + 1}</span>
            <span class="text-xs" style="color: var(--color-muted);">{formatNumber(req)} kills required</span>
          </div>
          <div class="seal-right">
            {#if character.seals > idx}
              <span class="broken-label">✓ BROKEN</span>
            {:else}
              <div class="kill-bar">
                <div class="kill-fill" style="width: {killPct(req)}%"></div>
              </div>
              <span class="text-xs pct-label">{killPct(req).toFixed(1)}%</span>
            {/if}
          </div>
        </div>

        {#if canBreak(idx)}
          <button class="break-btn" onclick={() => requestBreak(idx)}>
            ⚡ BREAK SEAL {idx + 1}
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>

<ConfirmationModal
  bind:show={showModal}
  message="Break Seal {(pendingSealIdx ?? 0) + 1}? This grants a permanent 10x multiplier and cannot be undone."
  onConfirm={confirmBreak}
/>

<style>
.seals-panel { display: flex; flex-direction: column; min-height: 100%; gap: 0; }

.god-info {
  margin: 0 0 10px 0;
  background: var(--panel-bg);
  border: 1px solid var(--border-subtle);
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.god-val { color: var(--neon-pink); font-weight: bold; font-family: var(--font-cyber); font-size: 1rem; }

.seals-list { display: flex; flex-direction: column; gap: 8px; padding: 0 0 10px; }

.seal-card {
  background: var(--panel-bg);
  border: 1px solid var(--border-subtle);
  padding: 10px;
  transition: border-color 0.2s;
}
.seal-card.is-unlocked {
  border-color: var(--neon-blue);
  background: rgba(0, 190, 255, 0.05);
}
.seal-card.is-available {
  border-color: var(--neon-gold);
  animation: seal-ready 2s ease-in-out infinite;
}
@keyframes seal-ready {
  0%, 100% { box-shadow: 0 0 4px rgba(255, 200, 0, 0.3); }
  50% { box-shadow: 0 0 12px rgba(255, 200, 0, 0.6); }
}

.seal-row { display: flex; justify-content: space-between; align-items: center; }
.seal-left { display: flex; flex-direction: column; gap: 2px; }
.seal-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }

.kill-bar {
  width: 80px; height: 6px;
  background: #000;
  border: 1px solid var(--border-subtle);
}
.kill-fill { height: 100%; background: var(--neon-blue); transition: width 0.5s; }
.pct-label { color: var(--color-muted); font-size: 0.6rem; }
.broken-label { font-size: 0.7rem; color: var(--neon-blue); font-family: var(--font-cyber); }

.break-btn {
  background: rgba(255, 200, 0, 0.1);
  border: 1px solid var(--neon-gold);
  color: var(--neon-gold);
  font-family: var(--font-cyber);
  font-size: 0.75rem;
  padding: 8px;
  cursor: pointer;
  width: 100%;
  margin-top: 8px;
  transition: 0.15s;
}
.break-btn:hover { background: rgba(255, 200, 0, 0.2); color: #fff; }
</style>
