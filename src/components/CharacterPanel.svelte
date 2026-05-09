<script lang="ts">
  import { character } from '../modules/character.svelte.js';
  import { formatNumber } from '../systems/scalingSystem.js';
  import { Decimal } from '../systems/decimal.js';
  import { bestiaryState } from '../modules/bestiary.svelte.js';
  import { getPowerTier } from '../systems/powerTier.js';

  let xpPercent = $derived.by(() => {
    const xp  = Decimal.from(character.xp);
    const xpN = Decimal.from(character.xpNeeded);
    if (xp.lt(0)) return 0;
    if (xp.gte(xpN) && xpN.gt(0)) return 100;
    const pct = xp.div(xpN).mul(100).toNumber();
    return isNaN(pct) ? 0 : Math.min(100, Math.max(0, pct));
  });

  let powerTier = $derived(getPowerTier(character.stats?.attack ?? 0));

  let isCritical = $derived(
    Decimal.from(character.stats?.hp ?? 0).lte(
      Decimal.from(character.stats?.maxHp ?? 1).mul(0.2)
    )
  );
</script>

<div class="char-panel">

  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">⬡</div>
      <div class="header-title-box">
        <h2 class="transcended-text">SYS.IDENTITY</h2>
        <div class="header-subtitle">CORE CHARACTER DATA</div>
      </div>
    </div>
    {#if bestiaryState.cachedBoost > 0}
      <div class="header-stats">
        <div class="header-stat-box">
          <span class="stat-label">COMBAT SYNC</span>
          <span class="stat-value" style="color: var(--accent-green);">+{(bestiaryState.cachedBoost * 100).toFixed(0)}%</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Level + XP -->
  <div class="level-block">
    <div class="level-row">
      <div class="level-info">
        <span class="level-num">{formatNumber(character.level)}</span>
        <span class="level-label">LEVEL</span>
      </div>
      <div class="stage-info">
        <span class="stage-num">{formatNumber(character.awakeningStage)}</span>
        <span class="stage-label">AWAKENING</span>
      </div>
      <div class="tier-info">
        <span class="tier-badge {powerTier.class}">{powerTier.name}</span>
        <span class="tier-label">CLASS</span>
      </div>
    </div>

    <div class="xp-block">
      <div class="xp-bar-wrap">
        <div class="xp-bar-fill" style="width:{xpPercent}%"></div>
      </div>
      <div class="xp-text-row">
        <span class="xp-val">{formatNumber(Decimal.from(character.xp).lt(0) ? 0 : character.xp)}</span>
        <span class="xp-sep">/</span>
        <span class="xp-val muted">{formatNumber(character.xpNeeded)} XP</span>
      </div>
    </div>
  </div>

  <!-- Stats list -->
  <div class="stat-list">

    <div class="stat-row">
      <span class="s-label">HP</span>
      <span class="s-val danger">{formatNumber(character.stats.hp)}<span class="s-sep">/</span><span class="s-max">{formatNumber(character.stats.maxHp)}</span></span>
    </div>

    <div class="stat-row">
      <span class="s-label">SHIELD</span>
      <span class="s-val steel">{formatNumber(character.stats.defense)}<span class="s-sep">/</span><span class="s-max">{formatNumber(character.stats.maxDefense)}</span></span>
    </div>

    <div class="stat-row">
      <span class="s-label">ATTACK</span>
      <span class="s-val">{formatNumber(character.stats.attack)}</span>
    </div>

    <div class="stat-row">
      <span class="s-label">HP REGEN/s</span>
      <span class="s-val">{formatNumber(character.stats.regenHp.mul(new Decimal(10).pow(character.seals)).mul(10))}</span>
    </div>

    <div class="stat-row">
      <span class="s-label">SH REGEN/s</span>
      <span class="s-val steel">{formatNumber(character.stats.regenDef.mul(new Decimal(10).pow(character.seals)).mul(10))}</span>
    </div>

    <div class="stat-row">
      <span class="s-label">CRIT CHANCE</span>
      <span class="s-val">{(character.stats.critChance * 100).toFixed(1)}%</span>
    </div>

    <div class="stat-row">
      <span class="s-label">KILLS</span>
      <span class="s-val">{formatNumber(character.kills)}</span>
    </div>

    <div class="stat-row">
      <span class="s-label">SEALS BROKEN</span>
      <span class="s-val violet">{character.seals}</span>
    </div>

  </div>

  <!-- Awakening footer -->
  <div class="awakening-block">
    <div class="awk-row">
      <span class="awk-label">AWAKENING MULT</span>
      <span class="awk-val">×{formatNumber(Decimal.from(1.5).pow(character.awakeningStage))}</span>
    </div>
    {#if isCritical}
      <div class="crit-warning">CRITICAL — LOW HP</div>
    {/if}
  </div>

</div>

<style>
.char-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
}

/* ── LEVEL BLOCK ────────────────────────────── */
.level-block {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.level-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.level-info, .stage-info, .tier-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.level-num {
  font-family: var(--font-mono);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.level-label {
  font-family: var(--font-display);
  font-size: 0.54rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--color-muted);
  text-transform: uppercase;
}

.stage-num {
  font-family: var(--font-mono);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--accent-amber);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.stage-label {
  font-family: var(--font-display);
  font-size: 0.54rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--color-muted);
  text-transform: uppercase;
}

.tier-info { justify-content: center; }
.tier-label {
  font-family: var(--font-display);
  font-size: 0.54rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--color-muted);
  text-transform: uppercase;
  margin-top: 3px;
  text-align: center;
}

/* ── XP BAR ─────────────────────────────────── */
.xp-block { display: flex; flex-direction: column; gap: 3px; }
.xp-bar-wrap {
  height: 4px;
  background: var(--panel-inset);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}
.xp-bar-fill {
  height: 100%;
  background: var(--accent-warning);
  transition: width 300ms linear;
}
.xp-text-row {
  display: flex;
  align-items: center;
  gap: 3px;
}
.xp-val {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.xp-val.muted { color: var(--color-muted); }
.xp-sep { color: var(--color-dim); font-size: 0.62rem; }

/* ── STAT LIST ──────────────────────────────── */
.stat-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px 0;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 14px;
  border-left: 2px solid transparent;
  transition: border-color var(--t-fast), background var(--t-fast);
}
.stat-row:hover {
  border-left-color: var(--border-mid);
  background: var(--panel-inset);
}

.s-label {
  font-family: var(--font-display);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.s-val {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.s-val.danger { color: var(--accent-danger); }
.s-val.steel  { color: var(--accent-steel); }
.s-val.violet { color: var(--accent-violet); }
.s-sep { color: var(--color-dim); margin: 0 2px; }
.s-max { color: var(--color-muted); }

/* ── AWAKENING FOOTER ───────────────────────── */
.awakening-block {
  padding: 10px 14px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.awk-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.awk-label {
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.awk-val {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent-amber);
  font-variant-numeric: tabular-nums;
}

.crit-warning {
  font-family: var(--font-display);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent-danger);
}
</style>
