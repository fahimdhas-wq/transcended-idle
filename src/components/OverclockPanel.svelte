<script lang="ts">
  import { character } from '../modules/character.svelte.js';
  import { overclockState } from '../modules/overclockState.svelte.js';
  import { doOverclock, getPendingThreads, LEVEL_REQ, LEVEL_WALL } from '../modules/overclock.svelte.js';
  import { formatValue } from '../systems/formatValue.js';

  let state = $derived(
    character.level.gte(LEVEL_WALL) ? 'required' :
    character.level.gte(LEVEL_REQ)  ? 'optional' : 'locked'
  );

  let pendingThreads = $derived(getPendingThreads(character.level));

  let optionalProgress = $derived(
    Math.min(100, character.level.div(LEVEL_REQ).mul(100).toNumber())
  );
</script>

<div class="oc-panel">

  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">◈</div>
      <div class="header-title-box">
        <h2 class="transcended-text">SYSTEM OVERCLOCK</h2>
        <div class="header-subtitle">TRANSCEND PHYSICAL LIMITS</div>
      </div>
    </div>
    <div class="header-stats">
      <div class="header-stat-box">
        <span class="stat-label">THREADS</span>
        <span class="stat-value" style="color:var(--accent-warning)">{formatValue(overclockState.coreThreads)}</span>
      </div>
      <div class="header-stat-box">
        <span class="stat-label">MULTIPLIER</span>
        <span class="stat-value">×{formatValue(overclockState.coreThreads.add(1))}</span>
      </div>
    </div>
  </div>

  <!-- Stats grid -->
  <div class="stats-strip">
    <div class="strip-cell">
      <span class="sc-label">TOTAL THREADS</span>
      <span class="sc-val warning">{formatValue(overclockState.coreThreads)}</span>
    </div>
    <div class="strip-cell">
      <span class="sc-label">GLOBAL MULT</span>
      <span class="sc-val">×{formatValue(overclockState.coreThreads.add(1))}</span>
    </div>
    <div class="strip-cell">
      <span class="sc-label">RESETS</span>
      <span class="sc-val">{overclockState.timesOverclocked}</span>
    </div>
    <div class="strip-cell">
      <span class="sc-label">PENDING</span>
      <span class="sc-val green">+{formatValue(pendingThreads)}</span>
    </div>
  </div>

  <!-- State block -->
  <div class="state-block">

    {#if state === 'locked'}
      <div class="state-card locked">
        <div class="state-tag">LOCKED</div>
        <p class="state-desc">Reach Level <strong>{formatValue(LEVEL_REQ)}</strong> to unlock optional prestige. Progress is unrestricted until then.</p>
        <div class="prog-wrap">
          <div class="prog-fill" style="width:{optionalProgress}%"></div>
        </div>
        <span class="prog-label">LVL {formatValue(character.level)} / {formatValue(LEVEL_REQ)}</span>
      </div>

    {:else if state === 'optional'}
      <div class="state-card optional">
        <div class="state-tag steel">OPTIONAL PRESTIGE</div>
        <p class="state-desc">Reset level for <strong class="warn-text">+{formatValue(pendingThreads)} Core Threads</strong>. Not required — game continues freely until Level {formatValue(LEVEL_WALL)}.</p>
        <p class="tip-text">Higher level before Overclock = more threads (threads = log₁₀ of level).</p>
        <button class="oc-btn optional" onclick={doOverclock}>
          OVERCLOCK — +{formatValue(pendingThreads)} THREADS
        </button>
      </div>

    {:else}
      <div class="state-card required">
        <div class="state-tag danger">LEVEL CAP REACHED</div>
        <p class="state-desc">Locked at <strong class="danger-text">{formatValue(LEVEL_WALL)}</strong>. XP no longer accumulates. Overclock required to continue.</p>
        <p class="reward-text">Grants <strong class="warn-text">+{formatValue(pendingThreads)} Core Threads</strong> — each thread multiplies all progression permanently.</p>
        <button class="oc-btn required" onclick={doOverclock}>
          OVERCLOCK — BREAK THE WALL
        </button>
      </div>
    {/if}

  </div>

  <div class="info-strip">
    Overclock resets Level / XP / Skills / Stats. In return: permanent Core Threads that multiply everything. The higher your level before reset, the more threads earned.
  </div>

</div>

<style>
.oc-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
}

.stats-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.strip-cell {
  background: var(--panel-inset);
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
}

.sc-label {
  font-family: var(--font-display);
  font-size: 0.54rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.sc-val {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.sc-val.warning { color: var(--accent-warning); }
.sc-val.green   { color: var(--accent-green); }

/* ── STATE BLOCK ────────────────────────────── */
.state-block {
  flex: 1;
  padding: 14px;
  overflow-y: auto;
}

.state-card {
  border: 1px solid var(--border-mid);
  border-left: 3px solid var(--border-mid);
  background: var(--panel-inset);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.state-card.optional { border-left-color: var(--accent-steel); }
.state-card.required { border-left-color: var(--accent-danger); }
.state-card.locked   { border-left-color: var(--border-mid); }

.state-tag {
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-muted);
}
.state-tag.steel  { color: var(--accent-steel); }
.state-tag.danger { color: var(--accent-danger); }

.state-desc {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-text);
  line-height: 1.7;
  margin: 0;
}

.tip-text {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
  padding: 8px;
  border-left: 2px solid var(--border-mid);
}

.reward-text {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text);
  line-height: 1.6;
  margin: 0;
}

.warn-text   { color: var(--accent-warning); }
.danger-text { color: var(--accent-danger); }

/* ── PROGRESS BAR ───────────────────────────── */
.prog-wrap {
  height: 4px;
  background: var(--panel-bg);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}
.prog-fill {
  height: 100%;
  background: var(--accent-warning);
  transition: width 0.3s linear;
}
.prog-label {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
}

/* ── OC BUTTONS ─────────────────────────────── */
.oc-btn {
  width: 100%;
  padding: 12px;
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1px solid var(--border-mid);
  cursor: pointer;
  transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast);
}

.oc-btn.optional {
  background: rgba(90,138,170,0.08);
  border-color: var(--accent-steel);
  color: var(--accent-steel);
}
.oc-btn.optional:hover {
  background: rgba(90,138,170,0.2);
  color: var(--accent-white);
  border-color: var(--accent-white);
}

.oc-btn.required {
  background: var(--accent-danger);
  border-color: var(--accent-danger);
  color: var(--accent-white);
}
.oc-btn.required:hover {
  background: #cc2222;
  border-color: #cc2222;
}

/* ── INFO STRIP ─────────────────────────────── */
.info-strip {
  padding: 10px 14px;
  border-top: 1px solid var(--border-subtle);
  font-family: var(--font-mono);
  font-size: 0.64rem;
  color: var(--color-muted);
  line-height: 1.6;
  flex-shrink: 0;
}
</style>
