<script lang="ts">
  import { proceduralState } from '../modules/procedural.svelte.js';
  import { formatValue } from '../systems/formatValue.js';

  const unlocked = $derived(true);
</script>

<div class="proc-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#8776;</div>
      <div class="header-text">
        <h2 class="transcended-text">PROCEDURAL GEN</h2>
        <span class="transcended-sub">INFINITE VARIATION</span>
      </div>
    </div>
  </div>

  <div class="panel-hint">
    When Ascension Tier 1+ is reached, 10% of enemies are procedurally generated with unique names and stat variations.
  </div>

  <div class="stat-card">
    <span class="stat-label">Procedural Enemies Slain</span>
    <span class="stat-value">{formatValue(proceduralState.totalProceduralKills)}</span>
  </div>

  <div class="stat-card">
    <span class="stat-label">Unique Resources Discovered</span>
    <span class="stat-value">{proceduralState.discoveredResources.length}</span>
  </div>

  {#if proceduralState.discoveredResources.length > 0}
    <div class="resource-list">
      <div class="list-header">DISCOVERED RESOURCES</div>
      {#each proceduralState.discoveredResources as res}
        <div class="res-item">{res}</div>
      {/each}
    </div>
  {/if}

  {#if proceduralState.totalProceduralKills === 0}
    <div class="empty-msg">No procedurally generated entities encountered yet. Keep playing to discover unique enemies and resources.</div>
  {/if}
</div>

<style>
  .proc-panel { display:flex; flex-direction:column; height:100%; gap:10px; }
  .header-icon { color: var(--cyan); }
  .panel-hint { font-size:0.55rem; color:var(--text-2); font-family:var(--font-mono); line-height:1.4; }

  .stat-card { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border:1px solid var(--line); }
  .stat-label { font-size:0.55rem; color:var(--text-2); font-family:var(--font-hud); letter-spacing:0.06em; }
  .stat-value { font-size:0.8rem; font-weight:700; color:var(--cyan); font-family:var(--font-mono); }

  .resource-list { display:flex; flex-direction:column; gap:3px; }
  .list-header { font-size:0.55rem; font-weight:700; color:var(--text-0); font-family:var(--font-hud); letter-spacing:0.1em; padding:4px 0; border-bottom:1px solid var(--line); }
  .res-item { font-size:0.55rem; color:var(--pink); font-family:var(--font-mono); padding:4px 8px; border:1px solid var(--line); }

  .empty-msg { text-align:center; padding:30px 12px; font-size:0.55rem; color:var(--text-2); font-family:var(--font-mono); }
</style>
