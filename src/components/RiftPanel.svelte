<script lang="ts">
  import { RIFT_DEFS } from '../data/riftData.js';
  import {
    riftState, isRiftUnlocked,
    getRiftCompletions, isRiftOnCooldown, getRiftTimeRemaining,
    canActivateRift, activateRift,
  } from '../modules/rift.svelte.js';

  const unlocked = $derived(isRiftUnlocked());

  let statusMsg = $state('');

  function doActivate(id: string) {
    const def = RIFT_DEFS.find(r => r.id === id);
    if (!def) return;
    const ok = activateRift(def);
    if (ok) {
      statusMsg = `${def.name} activated!`;
    } else {
      statusMsg = canActivateRift(def) || 'Already on cooldown';
    }
    setTimeout(() => statusMsg = '', 3000);
  }

  function fmtTime(ms: number): string {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }
</script>

<div class="rift-panel">
  {#if !unlocked}
    <div class="locked-msg">
      <span class="lock-icon">&#9888;</span>
      <span>Reach Ascension Tier 2 to unlock Rifts</span>
    </div>
  {:else}
    <div class="panel-hint">
      Activate rifts to gain permanent passive bonuses. Each rift has a 24h cooldown.
    </div>

    {#each RIFT_DEFS as def (def.id)}
      {@const lv = getRiftCompletions(def.id)}
      {@const onCd = isRiftOnCooldown(def.id)}
      {@const remaining = getRiftTimeRemaining(def.id)}
      {@const blockReason = canActivateRift(def)}
      <div class="rift-card">
        <div class="rift-header">
          <span class="rift-name">{def.name}</span>
          <span class="rift-lv">Lv.{lv}</span>
        </div>
        <div class="rift-desc">{def.desc}</div>
        <div class="rift-effect">{def.effect}</div>
        <div class="rift-costs">
          {#if def.resourceCost.miningEnergy}
            <span class="cost-tag">{def.resourceCost.miningEnergy} Mining Energy</span>
          {/if}
          {#if def.resourceCost.forestryEnergy}
            <span class="cost-tag">{def.resourceCost.forestryEnergy} Forestry Energy</span>
          {/if}
          {#if def.resourceCost.dataFragments}
            <span class="cost-tag">{def.resourceCost.dataFragments} Data Frags</span>
          {/if}
          {#if def.resourceCost.dnaFragments}
            <span class="cost-tag">{def.resourceCost.dnaFragments} DNA Frags</span>
          {/if}
          {#if def.resourceCost.miningResource}
            <span class="cost-tag">{def.resourceCost.miningResource.amount} {def.resourceCost.miningResource.id}</span>
          {/if}
          {#if def.resourceCost.forestryResource}
            <span class="cost-tag">{def.resourceCost.forestryResource.amount} {def.resourceCost.forestryResource.id}</span>
          {/if}
        </div>
        <div class="rift-action">
          {#if onCd}
            <span class="cd-text">Cooldown: {fmtTime(remaining)}</span>
          {:else}
            <button class="activate-btn" disabled={!!blockReason} onclick={() => doActivate(def.id)}>
              ACTIVATE
            </button>
          {/if}
        </div>
        {#if blockReason && !onCd}
          <div class="block-msg">{blockReason}</div>
        {/if}
      </div>
    {/each}

    {#if statusMsg}
      <div class="status-msg">{statusMsg}</div>
    {/if}
  {/if}
</div>

<style>
  .rift-panel { display:flex; flex-direction:column; gap:10px; padding:12px; }

  .locked-msg { display:flex; align-items:center; gap:8px; justify-content:center; padding:40px 12px; color:var(--text-2); font-family:var(--font-hud); font-size:0.65rem; }
  .lock-icon { font-size:1rem; }

  .panel-hint { font-size:0.55rem; color:var(--text-2); text-align:center; font-family:var(--font-mono); padding:6px; border:1px solid var(--line); }

  .rift-card { display:flex; flex-direction:column; gap:6px; padding:12px; border:1px solid var(--line); }
  .rift-header { display:flex; justify-content:space-between; align-items:center; }
  .rift-name { font-size:0.7rem; font-weight:700; color:var(--text-0); font-family:var(--font-hud); letter-spacing:0.08em; }
  .rift-lv { font-size:0.6rem; color:var(--cyan); font-family:var(--font-mono); }

  .rift-desc { font-size:0.55rem; color:var(--text-2); }
  .rift-effect { font-size:0.6rem; color:var(--green); font-family:var(--font-mono); }

  .rift-costs { display:flex; flex-wrap:wrap; gap:4px; }
  .cost-tag { font-size:0.5rem; color:var(--gold); background:var(--bg-2); padding:2px 6px; font-family:var(--font-mono); }

  .rift-action { margin-top:4px; }
  .activate-btn { display:block; width:100%; padding:10px; background:transparent; border:1px solid var(--cyan); color:var(--cyan); font-family:var(--font-hud); font-size:0.6rem; letter-spacing:0.1em; cursor:pointer; transition:all var(--fast); }
  .activate-btn:hover:not(:disabled) { background:hsl(185 100% 55% / 0.1); box-shadow:0 0 12px hsl(185 100% 55% / 0.2); }
  .activate-btn:disabled { opacity:0.3; cursor:not-allowed; }

  .cd-text { font-size:0.55rem; color:var(--text-2); font-family:var(--font-mono); }

  .block-msg { font-size:0.5rem; color:var(--red); text-align:center; font-family:var(--font-mono); }

  .status-msg { text-align:center; padding:8px; font-size:0.6rem; color:var(--green); font-family:var(--font-hud); border:1px solid var(--green); background:hsl(120 60% 50% / 0.05); }
</style>
