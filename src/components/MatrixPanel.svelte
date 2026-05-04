<script>
  import { matrixState } from "../modules/matrix.svelte.js";
  import { overclockState } from "../modules/overclock.svelte.js";

  // Requires at least 1 Overclock to access the Auto-Matrix
  let isUnlocked = $derived(overclockState.timesOverclocked > 0);

  let localTarget = $state(matrixState.targetOverclockLevel);

  function applyTarget() {
    matrixState.targetOverclockLevel = localTarget;
  }
</script>

<div class="premium-header">
  <div class="header-main">
    <div class="header-icon">⚡</div>
    <div class="header-title-box">
      <h2 class="transcended-text">AUTO-MATRIX</h2>
      <div class="header-subtitle">PROGRAMMABLE LOGIC CORES</div>
    </div>
  </div>
</div>

{#if !isUnlocked}
  <div class="locked-box">
    <p class="warning-text">ACCESS DENIED. SYSTEM OVERCLOCK REQUIRED.</p>
    <p class="color-muted text-sm">
      Perform at least 1 Overclock to unlock the Auto-Matrix.
    </p>
  </div>
{:else}
  <div class="matrix-content">
    <div class="node-box">
      <div class="node-header">
        <h3>Auto-Scavenger Node</h3>
        <label class="switch">
          <input type="checkbox" bind:checked={matrixState.autoAchieve} />
          <span class="slider"></span>
        </label>
      </div>
      <p class="text-sm color-muted">
        Automatically claims unlocked achievements every few seconds.
      </p>
    </div>

    <div class="node-box">
      <div class="node-header">
        <h3>Auto-Assembler Node</h3>
        <label class="switch">
          <input type="checkbox" bind:checked={matrixState.autoSkill} />
          <span class="slider"></span>
        </label>
      </div>
      <p class="text-sm color-muted">
        Automatically purchases skill upgrades when enough fragments are
        available.
      </p>
    </div>

    <div class="node-box">
      <div class="node-header">
        <h3>Mining Optimization Node</h3>
        <label class="switch">
          <input type="checkbox" bind:checked={matrixState.autoMining} />
          <span class="slider"></span>
        </label>
      </div>
      <p class="text-sm color-muted">
        Automatically buys Mining upgrades when Data is available.
      </p>
    </div>

    <div class="node-box">
      <div class="node-header">
        <h3>Bio-Synthesis Node</h3>
        <label class="switch">
          <input type="checkbox" bind:checked={matrixState.autoForestry} />
          <span class="slider"></span>
        </label>
      </div>
      <p class="text-sm color-muted">
        Automatically buys Forestry upgrades when DNA is available.
      </p>
    </div>

    <div class="node-box">
      <div class="node-header">
        <h3>Archive Retrieval Node</h3>
        <label class="switch">
          <input type="checkbox" bind:checked={matrixState.autoBestiary} />
          <span class="slider"></span>
        </label>
      </div>
      <p class="text-sm color-muted">
        Automatically buys Bestiary upgrades when Data Fragments are available.
      </p>
    </div>

    <div class="node-box">
      <div class="node-header">
        <h3>Auto-Ascension Node</h3>
        <label class="switch">
          <input type="checkbox" bind:checked={matrixState.autoOverclock} />
          <span class="slider"></span>
        </label>
      </div>
      <p class="text-sm color-muted">
        Automatically initiates an Overclock when reaching the target level.
      </p>

      {#if matrixState.autoOverclock}
        <div class="target-input">
          <label for="target-level-input">Target Level:</label>
          <input
            id="target-level-input"
            type="number"
            bind:value={localTarget}
            min="1000"
            step="100"
          />
          <button class="apply-btn" onclick={applyTarget}>APPLY</button>
        </div>
        <p class="text-xs color-muted" style="margin-top: 5px;">
          Currently set to: {matrixState.targetOverclockLevel}
        </p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .matrix-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 10px;
  }
  .locked-box {
    border: 1px solid var(--neon-red);
    padding: 20px;
    text-align: center;
    background: rgba(255, 0, 0, 0.05);
    border-radius: 4px;
    margin: 10px;
  }
  .warning-text {
    color: var(--neon-red);
    font-weight: bold;
    font-size: 1.2rem;
  }

  .node-box {
    border: 1px solid var(--border-subtle);
    padding: 15px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
    transition: border-color 0.3s;
  }
  .node-box:hover {
    border-color: var(--neon-pink);
  }

  .node-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .node-header h3 {
    margin: 0;
    color: var(--neon-pink);
    text-transform: uppercase;
  }

  .target-input {
    margin-top: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.05);
    padding: 10px;
    border-radius: 4px;
  }
  .target-input input {
    background: transparent;
    border: 1px solid var(--border-subtle);
    color: var(--neon-blue);
    padding: 5px;
    font-family: var(--font-data);
    width: 100px;
  }

  .apply-btn {
    background: var(--neon-pink);
    color: #fff;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-family: var(--font-cyber);
    font-weight: bold;
    transition: box-shadow 0.2s;
  }
  .apply-btn:hover {
    box-shadow: 0 0 10px var(--neon-pink);
  }

  /* Toggle Switch CSS */
  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
  }
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #333;
    transition: 0.4s;
    border-radius: 20px;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
  input:checked + .slider {
    background-color: var(--neon-pink);
    box-shadow: 0 0 10px var(--neon-pink);
  }
  input:checked + .slider:before {
    transform: translateX(20px);
  }
</style>
