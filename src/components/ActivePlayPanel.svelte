<script lang="ts">
  import {
    activePlayState,
    canUsePower, canUseBoost, canUseCollect,
    activatePower, activateBoost, activateCollect,
  } from '../modules/activePlay.svelte.js';

  let statusMsg = $state('');

  function doPower() {
    const ok = activatePower();
    statusMsg = ok ? 'Power Surge active 10s!' : canUsePower() || 'Cannot activate';
    setTimeout(() => statusMsg = '', 2500);
  }

  function doBoost() {
    const ok = activateBoost();
    statusMsg = ok ? 'Boost active 30s!' : canUseBoost() || 'Cannot activate';
    setTimeout(() => statusMsg = '', 2500);
  }

  function doCollect() {
    const ok = activateCollect();
    statusMsg = ok ? 'Resources collected!' : canUseCollect() || 'Cannot use';
    setTimeout(() => statusMsg = '', 2500);
  }

  function fmtCd(end: number): string {
    const rem = Math.max(0, end - Date.now());
    return `${Math.ceil(rem / 1000)}s`;
  }
</script>

<div class="active-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#9889;</div>
      <div class="header-text">
        <h2 class="transcended-text">ACTIVE PLAY</h2>
        <span class="transcended-sub">QUICK ACTIONS</span>
      </div>
    </div>
  </div>

  <div class="hint">Quick actions to boost your progress. Unlocked at level 10.</div>

  <div class="btn-row">
    <button class="action-btn power" disabled={!!canUsePower()} onclick={doPower}>
      <span class="btn-label">POWER SURGE</span>
      <span class="btn-desc">+100% ATK for 10s</span>
      <span class="btn-cost">{activePlayState.powerActive ? 'ACTIVE' : '200 Mining Energy'}</span>
    </button>

    <button class="action-btn boost" disabled={!!canUseBoost()} onclick={doBoost}>
      <span class="btn-label">BOOST</span>
      <span class="btn-desc">+200% XP for 30s</span>
      <span class="btn-cost">{activePlayState.boostActive ? 'ACTIVE' : '150 Forestry Energy'}</span>
    </button>

    <button class="action-btn collect" disabled={!!canUseCollect()} onclick={doCollect}>
      <span class="btn-label">COLLECT</span>
      <span class="btn-desc">Instantly gather all progress</span>
      <span class="btn-cost">{Date.now() < activePlayState.collectCooldownEnd ? fmtCd(activePlayState.collectCooldownEnd) : '30s cooldown'}</span>
    </button>
  </div>

  {#if statusMsg}
    <div class="status-msg">{statusMsg}</div>
  {/if}
</div>

<style>
  .active-panel { display:flex; flex-direction:column; height:100%; gap:12px; }
  .header-icon { color: var(--cyan); }
  .hint { font-size:0.55rem; color:var(--text-2); font-family:var(--font-mono); }

  .btn-row { display:flex; flex-direction:column; gap:8px; }

  .action-btn { display:flex; flex-direction:column; align-items:center; gap:4px; padding:14px; background:transparent; border:1px solid var(--line); cursor:pointer; transition:all var(--fast); color:var(--text-0); font-family:var(--font-hud); }
  .action-btn:hover:not(:disabled) { border-color:var(--cyan); background:hsl(185 100% 55% / 0.05); }
  .action-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .action-btn.power { border-color:var(--pink); }
  .action-btn.power:hover:not(:disabled) { border-color:var(--pink); background:hsl(330 100% 55% / 0.05); }
  .action-btn.boost { border-color:var(--green); }
  .action-btn.boost:hover:not(:disabled) { border-color:var(--green); background:hsl(120 60% 50% / 0.05); }
  .action-btn.collect { border-color:var(--gold); }
  .action-btn.collect:hover:not(:disabled) { border-color:var(--gold); background:hsl(50 100% 50% / 0.05); }

  .btn-label { font-size:0.65rem; font-weight:700; letter-spacing:0.1em; }
  .btn-desc { font-size:0.55rem; color:var(--text-2); }
  .btn-cost { font-size:0.5rem; color:var(--text-2); font-family:var(--font-mono); }

  .status-msg { text-align:center; padding:8px; font-size:0.6rem; color:var(--cyan); font-family:var(--font-hud); border:1px solid var(--cyan); background:hsl(185 100% 55% / 0.05); }
</style>
