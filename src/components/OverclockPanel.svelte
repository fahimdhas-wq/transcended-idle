<script>
  import { character } from '../modules/character.svelte.js';
  import { overclockState, doOverclock, getPendingThreads, LEVEL_REQ, LEVEL_WALL } from '../modules/overclock.svelte.js';
  import { formatValue } from '../systems/formatValue.js';

  // Three states: locked | optional | required
  let state = $derived(
    character.level.gte(LEVEL_WALL) ? 'required' :
    character.level.gte(LEVEL_REQ) ? 'optional' : 'locked'
  );

  let pendingThreads = $derived(getPendingThreads(character.level));

  // Progress toward the optional threshold (0–100%)
  let optionalProgress = $derived(
    Math.min(100, character.level.div(LEVEL_REQ).mul(100).toNumber())
  );
</script>

<div class="premium-header">
  <div class="header-main">
    <div class="header-icon">🔥</div>
    <div class="header-title-box">
      <h2 class="transcended-text">SYSTEM OVERCLOCK</h2>
      <div class="header-subtitle">TRANSCEND PHYSICAL LIMITS</div>
    </div>
  </div>
  <div class="header-stats">
    <div class="header-stat-box">
      <span class="stat-label">THREADS</span>
      <span class="stat-value" style="color: var(--neon-gold);">{formatValue(overclockState.coreThreads)}</span>
    </div>
    <div class="header-stat-box">
      <span class="stat-label">MULTIPLIER</span>
      <span class="stat-value" style="color: var(--neon-blue);">x{formatValue(overclockState.coreThreads.add(1))}</span>
    </div>
  </div>
</div>

<div class="overclock-content">

  <!-- Thread Stats -->
  <div class="stats-grid">
    <div class="stat-card">
      <span class="sc-label">TOTAL THREADS</span>
      <span class="sc-val neon-gold">{formatValue(overclockState.coreThreads)}</span>
    </div>
    <div class="stat-card">
      <span class="sc-label">GLOBAL MULT</span>
      <span class="sc-val neon-blue">x{formatValue(overclockState.coreThreads.add(1))}</span>
    </div>
    <div class="stat-card">
      <span class="sc-label">RESETS</span>
      <span class="sc-val">{overclockState.timesOverclocked}</span>
    </div>
    <div class="stat-card">
      <span class="sc-label">THREADS IF OC NOW</span>
      <span class="sc-val neon-green">+{formatValue(pendingThreads)}</span>
    </div>
  </div>

  <!-- State: LOCKED -->
  {#if state === 'locked'}
    <div class="action-box locked-box">
      <div class="lock-icon">🔒</div>
      <h3 class="lock-title">OVERCLOCK LOCKED</h3>
      <p class="lock-desc">Reach Level <span class="neon-gold">{formatValue(LEVEL_REQ)}</span> to unlock optional prestige.<br>
        Until then, your progress is completely unrestricted.</p>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: {optionalProgress}%"></div>
      </div>
      <p class="progress-label">Level {formatValue(character.level)} / {formatValue(LEVEL_REQ)}</p>
    </div>

  <!-- State: OPTIONAL PRESTIGE -->
  {:else if state === 'optional'}
    <div class="action-box optional-box">
      <div class="state-badge optional-badge">⚡ OPTIONAL PRESTIGE</div>
      <h3>Overclock Available</h3>
      <p class="desc-text">
        You can reset your level now for <span class="neon-gold">+{formatValue(pendingThreads)} Core Threads</span>.<br>
        <strong>You do NOT need to.</strong> The game keeps progressing freely until you reach the level cap: <span class="neon-wall">{formatValue(LEVEL_WALL)}</span>.
      </p>
      <p class="tip-text">💡 Tip: The higher your level before Overclocking, the more threads you earn.<br>
        (Threads = log₁₀ of current level)</p>
      <div class="btn-row">
        <button class="overclock-btn optional-btn" onclick={doOverclock}>
          ⚡ OVERCLOCK NOW (+{formatValue(pendingThreads)} Threads)
        </button>
      </div>
    </div>

  <!-- State: REQUIRED (hit 1ZZZ wall) -->
  {:else}
    <div class="action-box required-box">
      <div class="state-badge required-badge">⚠️ LEVEL CAP REACHED</div>
      <h3 class="wall-title">You've hit the 1ZZZ Wall!</h3>
      <p class="desc-text">
        Your level is locked at <span class="neon-wall">{formatValue(LEVEL_WALL)}</span>.<br>
        XP is no longer accumulating. You <strong>must Overclock</strong> to continue progressing.
      </p>
      <p class="reward-text">
        Overclocking now grants <span class="neon-gold">+{formatValue(pendingThreads)} Core Threads</span>.<br>
        Each thread permanently multiplies ALL progression by +100%.
      </p>
      <button class="overclock-btn required-btn" onclick={doOverclock}>
        🔥 OVERCLOCK — BREAK THE WALL
      </button>
    </div>
  {/if}

  <!-- Info -->
  <div class="info-box">
    <p><strong>How Overclock Works:</strong> Resets your Level, XP, Skills, and Combat Stats to 1.
      In return, you gain permanent <strong>Core Threads</strong> that multiply XP, damage, and all stats in every future run.
      The further you level before Overclocking, the more Threads you earn.</p>
  </div>
</div>

<style>
  .overclock-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 10px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 8px;
  }
  .stat-card {
    background: rgba(0,0,0,0.5);
    border: 1px solid var(--border-subtle);
    padding: 10px 8px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sc-label { font-size: 0.55rem; color: var(--neon-blue); font-family: var(--font-cyber); letter-spacing: 1px; }
  .sc-val   { font-size: 0.9rem; color: #fff; font-family: var(--font-cyber); font-weight: bold; }
  .neon-gold  { color: var(--neon-gold) !important; }
  .neon-blue  { color: var(--neon-blue) !important; }
  .neon-green { color: var(--neon-green) !important; }
  .neon-wall  { color: #ff4757; font-weight: bold; }

  .action-box {
    border: 1px solid var(--border-subtle);
    padding: 20px;
    background: rgba(0,0,0,0.5);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .action-box h3 { margin: 0; font-family: var(--font-cyber); font-size: 1rem; }

  /* LOCKED */
  .locked-box { border-color: #333; text-align: center; }
  .lock-icon  { font-size: 2.5rem; }
  .lock-title { color: var(--color-muted); font-family: var(--font-cyber); margin: 0; }
  .lock-desc  { color: var(--color-muted); font-size: 0.8rem; margin: 0; }
  .progress-label { font-size: 0.7rem; color: var(--color-muted); text-align: center; margin: 0; }

  /* OPTIONAL */
  .optional-box  { border-color: var(--neon-blue); background: rgba(0,190,255,0.04); }
  .optional-badge { font-size: 0.75rem; font-weight: bold; color: var(--neon-blue); font-family: var(--font-cyber); }

  /* REQUIRED */
  .required-box   { border-color: #ff4757; background: rgba(255,71,87,0.06); animation: wall-pulse 2s ease-in-out infinite; }
  .required-badge { font-size: 0.75rem; font-weight: bold; color: #ff4757; font-family: var(--font-cyber); }
  .wall-title     { color: #ff4757 !important; }
  .reward-text    { font-size: 0.82rem; margin: 0; }

  @keyframes wall-pulse {
    0%, 100% { box-shadow: 0 0 8px rgba(255,71,87,0.3); }
    50%       { box-shadow: 0 0 20px rgba(255,71,87,0.6); }
  }

  .state-badge { font-size: 0.75rem; letter-spacing: 1px; }
  .desc-text   { font-size: 0.82rem; color: var(--color-text); margin: 0; }
  .tip-text    { font-size: 0.72rem; color: var(--color-muted); margin: 0; background: rgba(255,255,255,0.03); padding: 8px; border-left: 2px solid var(--neon-gold); }

  .btn-row { display: flex; gap: 10px; }

  .progress-bar-bg {
    width: 100%;
    height: 10px;
    background: #111;
    border: 1px solid var(--border-subtle);
    border-radius: 2px;
  }
  .progress-bar-fill {
    height: 100%;
    background: var(--neon-gold);
    box-shadow: 0 0 5px var(--neon-gold);
    transition: width 0.3s;
    border-radius: 2px;
  }

  .overclock-btn {
    width: 100%;
    padding: 14px;
    font-size: 1rem;
    font-weight: bold;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-family: var(--font-cyber);
  }
  .optional-btn {
    background: rgba(0,190,255,0.15);
    border: 1px solid var(--neon-blue) !important;
    color: var(--neon-blue);
  }
  .optional-btn:hover {
    background: rgba(0,190,255,0.3);
    box-shadow: 0 0 20px rgba(0,190,255,0.4);
    color: #fff;
  }
  .required-btn {
    background: linear-gradient(90deg, #ff4757, #ff6b81);
    color: #fff;
    animation: btn-pulse 1.5s ease-in-out infinite;
  }
  .required-btn:hover {
    transform: scale(1.02);
    box-shadow: 0 0 25px rgba(255,71,87,0.7);
  }
  @keyframes btn-pulse {
    0%, 100% { box-shadow: 0 0 10px rgba(255,71,87,0.5); }
    50%       { box-shadow: 0 0 25px rgba(255,71,87,0.9); }
  }

  .info-box {
    border: 1px solid #333;
    padding: 12px;
    background: rgba(0,0,0,0.3);
    border-radius: 4px;
    font-size: 0.75rem;
    color: var(--color-muted);
    line-height: 1.6;
  }
  .info-box strong { color: var(--color-text); }
</style>
