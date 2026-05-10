
<script lang="ts">
// ============================================================
// ENGINE PANEL — Combat + Stats powered by WASM
// Zero-copy reads from WASM memory
// ============================================================

import {
  initUiBridge,
  getGoldFormatted,
  getXPFormatted,
  getEnemyHPPercent,
  getEnemyHPFormatted,
  getEnemyMaxHPFormatted,
  getMomentumPercent,
  getOverchargePercent,
  getEngineState,
} from '../stores/engineBridge.svelte';

let initStarted = false;

function ensureInit() {
  if (initStarted) return;
  initStarted = true;
  initUiBridge();
}

// Reactive state read from engine
let goldDisplay = $derived(getEngineState().gold);
let xpDisplay = $derived(getEngineState().xp);
let levelDisplay = $derived(getEngineState().level);
let killsDisplay = $derived(getEngineState().kills);
let momentumPct = $derived(getMomentumPercent());
let overchargePct = $derived(getOverchargePercent());
let enemyHP = $derived(getEngineState().enemyHP);
let enemyMaxHP = $derived(getEngineState().enemyMaxHP);
let enemyHPpct = $derived(getEnemyHPPercent());
let isReady = $derived(getEngineState().isReady);
</script>

<div class="engine-panel">
  {#if !isReady}
    <div class="loading">
      <button class="init-btn" onclick={ensureInit}>
        INITIALIZE ENGINE
      </button>
      <span class="hint">Click to load WASM core</span>
    </div>
  {:else}
    <div class="panel-header">
      <div class="header-left">
        <div class="header-icon">⚡</div>
        <div class="header-text">
          <h2 class="transcended-text">WASM ENGINE</h2>
          <span class="transcended-sub">DIRECT MEMORY ACCESS</span>
        </div>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-label">GOLD</span>
          <span class="stat-value accent-warning">{getGoldFormatted()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">LV</span>
          <span class="stat-value accent-green">{levelDisplay}</span>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-name">KILLS</span>
        <span class="stat-num">{killsDisplay.toLocaleString()}</span>
      </div>
      <div class="stat-card">
        <span class="stat-name">XP</span>
        <span class="stat-num">{getXPFormatted()}</span>
      </div>
      <div class="stat-card">
        <span class="stat-name">MOMENTUM</span>
        <span class="stat-num">{momentumPct}%</span>
      </div>
      <div class="stat-card">
        <span class="stat-name">OVERCHARGE</span>
        <span class="stat-num">{overchargePct}%</span>
      </div>
    </div>

    <div class="combat-section">
      <div class="section-label">ENEMY</div>
      <div class="enemy-card">
        <div class="hp-bar-container">
          <div class="bar-label-row">
            <span>HP</span>
            <span>{getEnemyHPFormatted()} / {getEnemyMaxHPFormatted()}</span>
          </div>
          <div class="bar-track bar-thick">
            <div class="bar-fill accent-red" style="width:{enemyHPpct}%"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="perf-section">
      <div class="section-label">ENGINE STATS</div>
      <div class="perf-grid">
        <div class="perf-item">
          <span>Tick Count</span>
          <span class="perf-val">{getEngineState().tickCount.toLocaleString()}</span>
        </div>
        <div class="perf-item">
          <span>Status</span>
          <span class="perf-val status-ok">RUNNING</span>
        </div>
        <div class="perf-item">
          <span>Memory Access</span>
          <span class="perf-val">DIRECT</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .engine-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--panel-bg);
    border: 1px solid var(--border-mid);
  }

  .loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .init-btn {
    background: transparent;
    border: 2px solid var(--accent-warning);
    color: var(--accent-warning);
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    padding: 12px 24px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .init-btn:hover {
    background: rgba(255, 200, 50, 0.1);
    color: var(--accent-white);
  }

  .hint {
    font-size: 0.65rem;
    color: var(--color-muted);
    font-family: var(--font-display);
    letter-spacing: 0.08em;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 8px;
  }

  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-icon { font-size: 1rem; color: var(--accent-warning); }
  .header-text { display: flex; flex-direction: column; gap: 1px; }
  .header-stats { display: flex; gap: 16px; }
  .stat-item { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .stat-label { font-family: var(--font-display); font-size: 0.56rem; font-weight: 600; letter-spacing: 0.14em; color: var(--color-muted); }
  .stat-value { font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; font-variant-numeric: tabular-nums; }

  .accent-warning { color: var(--accent-warning); }
  .accent-green { color: var(--accent-green); }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 8px;
  }

  .stat-card {
    background: var(--panel-inset);
    border: 1px solid var(--border-subtle);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-name {
    font-family: var(--font-display);
    font-size: 0.55rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: var(--color-muted);
  }

  .stat-num {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--accent-white);
    font-variant-numeric: tabular-nums;
  }

  .section-label {
    font-family: var(--font-display);
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
    padding: 8px 14px 4px;
  }

  .combat-section { padding-bottom: 8px; }

  .enemy-card {
    padding: 0 14px;
  }

  .hp-bar-container { display: flex; flex-direction: column; gap: 3px; }
  /* .bar-label-row, .bar-track, .bar-fill inherited from components.css */

  .perf-section { padding-bottom: 12px; }
  .perf-grid { display: flex; flex-direction: column; padding: 0 14px; gap: 4px; }
  .perf-item { display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--color-muted); font-family: var(--font-display); }
  .perf-val { color: var(--accent-white); font-family: var(--font-mono); }
  .perf-val.status-ok { color: var(--accent-green); }
</style>

