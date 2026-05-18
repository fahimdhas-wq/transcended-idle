<script lang="ts">
  import { PARADOX_DEFS } from '../data/paradoxData.js';
  import {
    paradoxState, isParadoxUnlocked,
    getActiveParadox, getParadoxCompletions,
    canStartParadox, startParadox, cancelParadox,
    getParadoxAllStatsBonus,
  } from '../modules/paradox.svelte.js';

  const unlocked = $derived(isParadoxUnlocked());
  const active = $derived(getActiveParadox());
  const allBonus = $derived(getParadoxAllStatsBonus());

  let statusMsg = $state('');

  function doStart(id: string) {
    const ok = startParadox(id);
    if (ok) {
      const def = PARADOX_DEFS.find(d => d.id === id);
      statusMsg = `${def?.name} activated!`;
    } else {
      statusMsg = canStartParadox(id) || 'Cannot start';
    }
    setTimeout(() => statusMsg = '', 3000);
  }

  function doCancel() {
    cancelParadox();
    statusMsg = 'Paradox cancelled';
    setTimeout(() => statusMsg = '', 2000);
  }

  function fmtCooldown(): string {
    const rem = Math.max(0, paradoxState.cooldownEnd - Date.now());
    const m = Math.ceil(rem / 60000);
    return `${m}min`;
  }

  function isOnCd(): boolean {
    return Date.now() < paradoxState.cooldownEnd;
  }
</script>

<div class="paradox-panel">
  {#if !unlocked}
    <div class="locked-msg">
      <span class="lock-icon">&#9888;</span>
      <span>Reach Ascension Tier 3 to unlock Paradox Challenges</span>
    </div>
  {:else}
    <div class="all-bonus-bar">
      <span>Permanent bonus from paradoxes: +{(allBonus * 100).toFixed(2)}% All Stats</span>
    </div>

    {#if active}
      <div class="active-card">
        <div class="active-name">{active.name}</div>
        <div class="active-desc">{active.desc}</div>
        <div class="active-effect">{active.effectDesc}</div>
        <div class="active-progress">
          <span>Kills: {paradoxState.progressKills} / {active.targetKills}</span>
          <div class="prog-bar">
            <div class="prog-bar-fill" style="width:{Math.min(100, (paradoxState.progressKills / active.targetKills) * 100)}%"></div>
          </div>
        </div>
        <button class="cancel-btn" onclick={doCancel}>CANCEL</button>
      </div>
    {:else}
      {#each PARADOX_DEFS as def (def.id)}
        {@const completions = getParadoxCompletions(def.id)}
        <div class="paradox-card">
          <div class="card-header">
            <span class="card-name">{def.name}</span>
            <span class="card-lv">Done: {completions}</span>
          </div>
          <div class="card-desc">{def.desc}</div>
          <div class="card-effect">{def.effectDesc}</div>
          <div class="card-rewards">
            <span>Target: {def.targetKills} kills</span>
            <span>Asc Shards: +{def.rewardAscShards}</span>
            <span>All Stats: +{(def.rewardAllStats * 100).toFixed(1)}%</span>
          </div>
          <div class="card-action">
            <button class="start-btn"
              disabled={!!canStartParadox(def.id) || isOnCd()}
              onclick={() => doStart(def.id)}>
              {isOnCd() ? `Cooldown ${fmtCooldown()}` : 'START'}
            </button>
          </div>
        </div>
      {/each}
    {/if}

    {#if statusMsg}
      <div class="status-msg">{statusMsg}</div>
    {/if}
  {/if}
</div>

<style>
  .paradox-panel { display:flex; flex-direction:column; gap:10px; padding:12px; }

  .locked-msg { display:flex; align-items:center; gap:8px; justify-content:center; padding:40px 12px; color:var(--text-2); font-family:var(--font-hud); font-size:0.65rem; }
  .lock-icon { font-size:1rem; }

  .all-bonus-bar { text-align:center; font-size:0.55rem; color:var(--cyan); font-family:var(--font-mono); padding:6px; border:1px solid var(--line); }

  .active-card { display:flex; flex-direction:column; gap:8px; padding:16px; border:2px solid var(--pink); background:hsl(330 100% 55% / 0.05); }
  .active-name { font-size:0.85rem; font-weight:900; color:var(--pink); font-family:var(--font-hud); letter-spacing:0.1em; }
  .active-desc { font-size:0.55rem; color:var(--text-2); }
  .active-effect { font-size:0.6rem; color:var(--green); font-family:var(--font-mono); }
  .active-progress { font-size:0.55rem; color:var(--text-2); font-family:var(--font-mono); }
  .prog-bar { background:var(--bg-2); height:6px; margin-top:4px; overflow:hidden; }
  .prog-bar-fill { height:100%; background:var(--pink); transition:width 0.5s; }

  .cancel-btn { display:block; width:100%; padding:10px; background:transparent; border:1px solid var(--red); color:var(--red); font-family:var(--font-hud); font-size:0.6rem; cursor:pointer; }
  .cancel-btn:hover { background:hsl(0 60% 50% / 0.1); }

  .paradox-card { display:flex; flex-direction:column; gap:6px; padding:12px; border:1px solid var(--line); }
  .card-header { display:flex; justify-content:space-between; align-items:center; }
  .card-name { font-size:0.7rem; font-weight:700; color:var(--text-0); font-family:var(--font-hud); letter-spacing:0.08em; }
  .card-lv { font-size:0.55rem; color:var(--text-2); font-family:var(--font-mono); }

  .card-desc { font-size:0.55rem; color:var(--text-2); }
  .card-effect { font-size:0.6rem; color:var(--green); font-family:var(--font-mono); }

  .card-rewards { display:flex; gap:8px; font-size:0.5rem; color:var(--gold); font-family:var(--font-mono); flex-wrap:wrap; }

  .start-btn { display:block; width:100%; padding:10px; background:transparent; border:1px solid var(--pink); color:var(--pink); font-family:var(--font-hud); font-size:0.6rem; letter-spacing:0.1em; cursor:pointer; transition:all var(--fast); }
  .start-btn:hover:not(:disabled) { background:hsl(330 100% 55% / 0.1); box-shadow:0 0 12px hsl(330 100% 55% / 0.2); }
  .start-btn:disabled { opacity:0.3; cursor:not-allowed; }

  .status-msg { text-align:center; padding:8px; font-size:0.6rem; color:var(--green); font-family:var(--font-hud); border:1px solid var(--green); background:hsl(120 60% 50% / 0.05); }
</style>
