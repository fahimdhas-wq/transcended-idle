
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

  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#9889;</div>
      <div class="header-text">
        <h2 class="transcended-text">SYSTEM OVERCLOCK</h2>
        <span class="transcended-sub">TRANSCEND PHYSICAL LIMITS</span>
      </div>
    </div>
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">THREADS</span>
        <span class="stat-value gold">{formatValue(overclockState.coreThreads)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">MULT</span>
        <span class="stat-value">x{formatValue(overclockState.coreThreads.add(1))}</span>
      </div>
    </div>
  </div>

  <!-- Stats grid -->
  <div class="stats-strip">
    <div class="strip-cell">
      <span class="sc-label">TOTAL THREADS</span>
      <span class="sc-val gold">{formatValue(overclockState.coreThreads)}</span>
    </div>
    <div class="strip-cell">
      <span class="sc-label">GLOBAL MULT</span>
      <span class="sc-val">x{formatValue(overclockState.coreThreads.add(1))}</span>
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
        <p class="tip-text">Higher level before Overclock = more threads (threads = log10 of level).</p>
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
.header-icon { font-size: 1rem; color: var(--cyan); }
.header-text { display: flex; flex-direction: column; gap: 1px; }
.header-stats { display: flex; gap: 16px; }
.stat-item { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.stat-label { font-family: var(--font-hud); font-size: 0.5rem; font-weight: 600; letter-spacing: 0.12em; color: var(--text-2); text-transform: uppercase; }
.stat-value { font-family: var(--font-data); font-size: 0.8rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text-0); }
.gold { color: var(--gold); }



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
.header-icon { font-size: 1rem; color: var(--cyan); }
.header-text { display: flex; flex-direction: column; gap: 1px; }
.header-stats { display: flex; gap: 16px; }
.stat-item { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.stat-label { font-family: var(--font-hud); font-size: 0.5rem; font-weight: 600; letter-spacing: 0.12em; color: var(--text-2); text-transform: uppercase; }
.stat-value { font-family: var(--font-data); font-size: 0.8rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text-0); }
.gold { color: var(--gold); }



.stats-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--line);
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.strip-cell {
  background: var(--bg-2);
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
}

.sc-label {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-2);
}

.sc-val {
  font-family: var(--font-data);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-0);
  font-variant-numeric: tabular-nums;
}
.sc-val.gold { color: var(--gold); }
.sc-val.green { color: var(--green); }

/* ── STATE BLOCK ────────────────────────────── */
.state-block {
  flex: 1;
  padding: 14px;
  overflow-y: auto;
}

.state-card {
  border: 1px solid var(--line);
  background: var(--bg-1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}
.state-card.optional { border-color: var(--red); }
.state-card.required { border-color: var(--red); box-shadow: 0 0 15px hsl(0 100% 60% / 0.15); }
.state-card.locked { border-color: var(--line); }

.state-tag {
  font-family: var(--font-hud);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-2);
}
.state-tag.steel { color: var(--cyan); }
.state-tag.danger { color: var(--red); }

.state-desc {
  font-family: var(--font-data);
  font-size: 0.7rem;
  color: var(--text-0);
  line-height: 1.6;
  margin: 0;
}

.tip-text {
  font-family: var(--font-data);
  font-size: 0.65rem;
  color: var(--text-2);
  line-height: 1.5;
  margin: 0;
  padding: 8px;
  border-left: 2px solid var(--line);
}

.reward-text {
  font-family: var(--font-data);
  font-size: 0.7rem;
  color: var(--text-0);
  line-height: 1.5;
  margin: 0;
}

.warn-text { color: var(--gold); }
.danger-text { color: var(--red); }

/* ── PROGRESS BAR ───────────────────────────── */
.prog-wrap {
  height: 4px;
  background: hsl(0 0% 0% / 0.4);
  border: 1px solid var(--line);
  overflow: hidden;
}
.prog-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--red), hsl(0 100% 70%));
  transition: width 200ms ease;
}
.prog-label {
  font-family: var(--font-data);
  font-size: 0.6rem;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}

.oc-btn {
  width: 100%;
  padding: 12px;
  font-family: var(--font-hud);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid var(--red);
  cursor: pointer;
  background: transparent;
  color: var(--red);
  transition: all var(--fast);
}
.oc-btn.optional {
  background: hsl(0 100% 60% / 0.08);
}
.oc-btn.optional:hover {
  background: hsl(0 100% 60% / 0.18);
  color: var(--text-0);
}

.oc-btn.required {
  background: var(--red);
  color: var(--text-0);
  box-shadow: 0 0 15px hsl(0 100% 60% / 0.3);
}
.oc-btn.required:hover {
  background: hsl(0 100% 70%);
}

/* ── INFO STRIP ─────────────────────────────── */
.info-strip {
  padding: 10px 14px;
  border-top: 1px solid var(--line);
  font-family: var(--font-data);
  font-size: 0.65rem;
  color: var(--text-2);
  line-height: 1.5;
  flex-shrink: 0;
}
</style>
