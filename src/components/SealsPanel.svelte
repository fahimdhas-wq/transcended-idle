
<script lang="ts">
  import { character } from '../modules/character.svelte.js';
  import { formatNumber } from '../systems/scalingSystem.js';
  import { showToast } from '../stores/uiStore.svelte.js';
  import { Decimal } from '../systems/decimal.js';
  import ConfirmationModal from './ConfirmationModal.svelte';

  // Rebalanced for maxed skills in ~2 years (max ~60B kills/year)
  const sealRequirements = [
    '1e4', '5e4', '25e4', '1e6', '5e6', '25e6', '1e8',          // Seals 1-7: Hours to weeks
    '5e8', '2.5e9', '1e10', '5e10', '2e11', '1e12',             // Seals 8-13: Weeks to months
    '5e12', '2e13', '1e14', '5e14', '2e15', '1e16',             // Seals 14-19: Months to ~1 year
    '5e16', '2e17', '1e18', '5e18', '2e19', '1e20',             // Seals 20-25: ~1-2 years
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
      showToast(`SEAL ${idx + 1} BROKEN — x${Math.pow(10, character.seals)} MULT`, 'success');
    }
    pendingSealIdx = null;
  }

  function canBreak(idx: number): boolean {
    return character.seals === idx && character.kills.gte(Decimal.from(sealRequirements[idx]));
  }
</script>

<div class="seals-panel">

  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#10038;</div>
      <div class="header-text">
        <h2 class="transcended-text">AWAKENING SEALS</h2>
        <span class="transcended-sub">UNBIND YOUR POWER</span>
      </div>
    </div>
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">KILLS</span>
        <span class="stat-value">{formatNumber(character.kills)}</span>
      </div>
    </div>
  </div>

  <!-- God multiplier strip -->
  <div class="god-strip">
    <span class="god-label">GOD MULTIPLIER</span>
    <span class="god-val">x{formatNumber(Math.pow(10, character.seals))}</span>
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
          <span class="seal-reward">Next: x{formatNumber(Math.pow(10, idx + 1))}</span>
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
            <span class="check">&#10003;</span>
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
  message="Break Seal {(pendingSealIdx ?? 0) + 1}? Grants permanent x10 multiplier. Cannot be undone."
  onConfirm={confirmBreak}
/>

<style>
.seals-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-icon { font-size: 1rem; color: var(--red); }
.header-text { display: flex; flex-direction: column; gap: 1px; }
.header-stats { display: flex; gap: 16px; }
.stat-item { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.stat-label { font-family: var(--font-hud); font-size: 0.5rem; font-weight: 600; letter-spacing: 0.12em; color: var(--text-2); text-transform: uppercase; }
.stat-value { font-family: var(--font-data); font-size: 0.8rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text-0); }

/* ── GOD STRIP ──────────────────────────────── */
.god-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-2);
  flex-shrink: 0;
}

.god-label {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-2);
  flex: 1;
}

.god-val {
  font-family: var(--font-data);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}

.god-seals {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-2);
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
  padding: 10px 14px;
  border: 1px solid var(--line);
  background: transparent;
  transition: all var(--fast);
}
.seal-row.broken {
  border-color: hsl(0 100% 60% / 0.2);
  opacity: 0.5;
}
.seal-row.available {
  border-color: var(--red);
  background: hsl(0 100% 60% / 0.08);
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
  font-family: var(--font-hud);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-0);
}
.seal-req {
  font-family: var(--font-data);
  font-size: 0.6rem;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}

.seal-reward {
  font-family: var(--font-data);
  font-size: 0.55rem;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}

.seal-reward {
  font-family: var(--font-data);
  font-size: 0.55rem;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}

/* ── KILL BAR ───────────────────────────────── */
.seal-mid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.kill-bar-wrap {
  width: 100%;
  height: 6px;
  background: hsl(0 0% 0% / 0.4);
  border: 1px solid var(--line);
  overflow: hidden;
}
.kill-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--red), hsl(0 100% 70%));
  transition: width 200ms ease;
}
.pct-text {
  font-family: var(--font-data);
  font-size: 0.55rem;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
.broken-text {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cyan);
}

/* ── SEAL RIGHT ─────────────────────────────── */
.seal-right {
  display: flex;
  justify-content: flex-end;
}
.check {
  font-size: 0.8rem;
  color: var(--cyan);
}
.lock-icon {
  font-size: 0.7rem;
  color: var(--text-2);
}
.break-btn {
  font-family: var(--font-hud);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 12px;
  background: var(--red);
  border: none;
  color: var(--text-0);
  cursor: pointer;
  transition: all var(--fast);
}
.break-btn:hover {
  background: hsl(0 100% 70%);
  box-shadow: 0 0 12px hsl(0 100% 60% / 0.4);
}
</style>
