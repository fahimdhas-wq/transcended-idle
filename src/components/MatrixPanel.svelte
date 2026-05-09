<script lang="ts">
  import { matrixState } from '../modules/matrix.svelte.js';
  import { overclockState } from '../modules/overclockState.svelte.js';

  let isUnlocked = $derived(overclockState.timesOverclocked > 0);
  let localTarget = $state<number>(matrixState.targetOverclockLevel);
  let validationError = $state('');

  function applyTarget(): void {
    const parsed = Number(localTarget);
    if (isNaN(parsed)) { validationError = 'Must be a valid number'; return; }
    if (parsed < 1000) { validationError = 'Minimum level is 1000'; return; }
    if (parsed > 1e308) { validationError = 'Level too high'; return; }
    validationError = '';
    matrixState.targetOverclockLevel = parsed;
  }

  const NODES = [
    { key: 'autoAchieve',      label: 'Auto-Scavenger',       desc: 'Automatically claims unlocked achievements every few seconds.' },
    { key: 'autoSkill',        label: 'Auto-Assembler',        desc: 'Automatically purchases skill upgrades when enough fragments are available.' },
    { key: 'autoMining',       label: 'Mining Optimization',   desc: 'Automatically buys Mining upgrades when Data is available.' },
    { key: 'autoForestry',     label: 'Bio-Synthesis',         desc: 'Automatically buys Forestry upgrades when DNA is available.' },
    { key: 'autoBestiary',     label: 'Archive Retrieval',     desc: 'Automatically buys Bestiary upgrades when Data Fragments are available.' },
    { key: 'autoOverclock',    label: 'Auto-Ascension',        desc: 'Automatically initiates an Overclock when reaching the target level.', hasTarget: true },
  ] as const;
</script>

<div class="matrix-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#9889;</div>
      <div class="header-text">
        <h2 class="transcended-text">AUTO-MATRIX</h2>
        <span class="transcended-sub">PROGRAMMABLE LOGIC CORES</span>
      </div>
    </div>
  </div>

  {#if !isUnlocked}
    <div class="locked-screen">
      <div class="lock-icon">&#9888;</div>
      <p class="lock-title">ACCESS DENIED</p>
      <p class="lock-sub">SYSTEM OVERCLOCK REQUIRED</p>
      <p class="lock-hint">Perform at least 1 Overclock to unlock the Auto-Matrix.</p>
    </div>
  {:else}
    <div class="nodes-list">
      {#each NODES as node}
        {@const enabled = matrixState[node.key as keyof typeof matrixState]}
        <div class="node-card" class:node-active={enabled}>
          <div class="node-header">
            <span class="node-label">{node.label}</span>
            <label class="toggle">
              <input type="checkbox" bind:checked={matrixState[node.key as keyof typeof matrixState]} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          <p class="node-desc">{node.desc}</p>
          {#if node.hasTarget && matrixState.autoOverclock}
            <div class="target-row">
              <label class="target-label" for="target-{node.key}">Target Level:</label>
              <input
                id="target-{node.key}"
                class="target-input"
                type="number"
                bind:value={localTarget}
                min="1000"
                step="100"
              />
              <button class="apply-btn" onclick={applyTarget}>APPLY</button>
            </div>
            {#if validationError}
              <p class="val-error">{validationError}</p>
            {/if}
            <p class="target-current">Currently set to: {matrixState.targetOverclockLevel}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .matrix-panel { display: flex; flex-direction: column; height: 100%; }

  .panel-header {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-icon { font-size: 1rem; color: var(--accent-steel); }
  .header-text { display: flex; flex-direction: column; gap: 1px; }

  .locked-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 20px;
  }
  .lock-icon { font-size: 2.5rem; color: var(--accent-danger); }
  .lock-title {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--accent-danger);
    margin: 0;
  }
  .lock-sub {
    font-family: var(--font-display);
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: var(--color-muted);
    margin: 0;
  }
  .lock-hint {
    font-size: 0.68rem;
    color: var(--color-dim);
    margin: 0;
    margin-top: 8px;
    text-align: center;
  }

  .nodes-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 6px; }

  .node-card {
    background: var(--panel-bg);
    border: 1px solid var(--border-subtle);
    border-left: 3px solid var(--border-mid);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: border-color var(--t-fast), background var(--t-fast);
  }
  .node-card.node-active { border-left-color: var(--accent-steel); background: rgba(90, 138, 170, 0.04); }
  .node-card:hover { border-color: var(--border-mid); }

  .node-header { display: flex; justify-content: space-between; align-items: center; }
  .node-label {
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--accent-steel);
    text-transform: uppercase;
  }
  .node-desc { font-size: 0.65rem; color: var(--color-muted); margin: 0; line-height: 1.4; }

  /* Toggle */
  .toggle { display: inline-block; position: relative; width: 40px; height: 20px; cursor: pointer; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-track {
    position: absolute; inset: 0;
    background: var(--border-mid);
    transition: background var(--t-mid);
  }
  .toggle-thumb {
    position: absolute;
    width: 14px; height: 14px;
    background: var(--color-dim);
    top: 3px; left: 3px;
    transition: transform var(--t-mid), background var(--t-mid);
  }
  .toggle input:checked + .toggle-track { background: var(--accent-steel); }
  .toggle input:checked + .toggle-track .toggle-thumb { transform: translateX(20px); background: var(--accent-white); }

  .target-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; background: var(--panel-inset); padding: 8px; }
  .target-label { font-family: var(--font-display); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.1em; color: var(--color-muted); white-space: nowrap; }
  .target-input {
    flex: 1;
    background: transparent;
    border: 1px solid var(--border-mid);
    color: var(--accent-steel);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    padding: 4px 8px;
    outline: none;
    min-width: 0;
  }
  .target-input:focus { border-color: var(--accent-steel); }

  .apply-btn {
    background: transparent;
    border: 1px solid var(--accent-steel);
    color: var(--accent-steel);
    font-family: var(--font-display);
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    padding: 5px 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--t-fast), color var(--t-fast);
  }
  .apply-btn:hover { background: rgba(90, 138, 170, 0.1); color: var(--accent-white); }

  .val-error { font-size: 0.6rem; color: var(--accent-danger); margin: 0; }
  .target-current { font-size: 0.6rem; color: var(--color-dim); margin: 0; font-family: var(--font-mono); }
</style>
