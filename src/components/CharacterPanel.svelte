
<script lang="ts">
  import { character } from '../modules/character.svelte.js';
  import { formatNumber } from '../systems/scalingSystem.js';
  import { Decimal } from '../systems/decimal.js';
  import { bestiaryState } from '../modules/bestiary.svelte.js';
  import { getPowerTier } from '../systems/powerTier.js';
  import Value from './Value.svelte';

  let displayData = $derived.by(() => {
    const xp  = character.xp;
    const xpN = character.xpNeeded;
    const xpPercent = (() => {
      if (xp.lt(0)) return 0;
      if (xp.gte(xpN) && xpN.gt(0)) return 100;
      const pct = xp.div(xpN).mul(100).toNumber();
      return isNaN(pct) ? 0 : Math.min(100, Math.max(0, pct));
    })();

    const powerTier = getPowerTier(character.stats?.attack ?? 0);

    const isCritical = (character.stats?.hp ?? Decimal.ZERO).lte(
      (character.stats?.maxHp ?? Decimal.ONE).mul(0.2)
    );

    const sealMult = Decimal.TEN.pow(character.seals);
    const hpRegen = character.stats.regenHp.mul(sealMult).mul(10);
    const shRegen = character.stats.regenDef.mul(sealMult).mul(10);

    return { xpPercent, powerTier, isCritical, hpRegen, shRegen };
  });
</script>

<div class="char-panel">

  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#11043;</div>
      <div class="header-text">
        <h2 class="transcended-text">SYS.IDENTITY</h2>
        <span class="transcended-sub">CORE CHARACTER DATA</span>
      </div>
    </div>
    {#if bestiaryState.cachedBoost > 0}
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-label">COMBAT SYNC</span>
          <span class="stat-value green">+{(bestiaryState.cachedBoost * 100).toFixed(0)}%</span>
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
      <div class="tier-info">
        <span class="tier-badge {displayData.powerTier.class}">{displayData.powerTier.name}</span>
        <span class="tier-label">CLASS</span>
      </div>
    </div>

    <div class="xp-block">
      <div class="xp-bar-wrap">
        <div class="xp-bar-fill" style="width:{displayData.xpPercent}%"></div>
      </div>
      <div class="xp-text-row">
        <span class="xp-val">{formatNumber(character.xp.lt(0) ? 0 : character.xp)}</span>
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
      <span class="s-val">{formatNumber(displayData.hpRegen)}</span>
    </div>

    <div class="stat-row">
      <span class="s-label">SH REGEN/s</span>
      <span class="s-val steel">{formatNumber(displayData.shRegen)}</span>
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
      <span class="s-val violet"><Value n={character.seals} /></span>
    </div>

  </div>

  <!-- Stats footer -->
  <div class="awakening-block">
    {#if displayData.isCritical}
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
.green { color: var(--green); }

/* ── LEVEL BLOCK ────────────────────────────── */
.level-block {
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
  position: relative;
}

.level-row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.level-info, .tier-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.level-num {
  font-family: var(--font-data);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-0);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.level-label {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--text-2);
  text-transform: uppercase;
}

.tier-info { justify-content: center; }
.tier-label {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--text-2);
  text-transform: uppercase;
  margin-top: 3px;
  text-align: center;
}

/* ── XP BAR ─────────────────────────────────── */
.xp-block { display: flex; flex-direction: column; gap: 3px; }
.xp-bar-wrap {
  height: 6px;
  background: hsl(0 0% 0% / 0.4);
  border: 1px solid var(--line);
  overflow: hidden;
}
.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold), hsl(45 100% 70%));
  transition: width 200ms ease;
}
.xp-text-row {
  display: flex;
  align-items: center;
  gap: 3px;
}
.xp-val {
  font-family: var(--font-data);
  font-size: 0.65rem;
  color: var(--text-0);
  font-variant-numeric: tabular-nums;
}
.xp-val.muted { color: var(--text-2); }
.xp-sep { color: var(--text-2); font-size: 0.65rem; }

/* ── STAT LIST ─────────────────────────────── */
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
  padding: 8px 14px;
  border: 1px solid transparent;
  transition: all var(--fast);
  background: transparent;
}
.stat-row:hover {
  border-color: var(--line);
  background: hsl(185 100% 55% / 0.04);
}

.s-label {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-1);
}

.s-val {
  font-family: var(--font-data);
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-0);
  font-variant-numeric: tabular-nums;
}
.s-val.danger { color: var(--red); }
.s-val.steel  { color: var(--cyan); }
.s-val.violet { color: var(--purple); }
.s-sep { color: var(--text-2); margin: 0 2px; }
.s-max { color: var(--text-2); }

/* ── FOOTER ───────────────────────── */
.awakening-block {
  padding: 8px 14px;
  border-top: 1px solid var(--line);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.crit-warning {
  font-family: var(--font-hud);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--red);
}
</style>
