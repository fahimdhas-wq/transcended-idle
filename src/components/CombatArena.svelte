
<script lang="ts">
import { combatState, getEffectiveCombatStats } from '../modules/combat.svelte.js';
import { character } from '../modules/character.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { getPowerTier } from '../systems/powerTier.js';
import { Decimal } from '../systems/decimal.js';
import type { MobType } from '../data/mobs.js';

let showAdvanced = $state(false);
let stats = $derived(getEffectiveCombatStats());
let maxHp       = $derived(stats.hp);
let maxSh       = $derived(stats.def);
let attackVal   = $derived(stats.atk);
let regenHpVal  = $derived(stats.regenHp.mul(10));
let regenDefVal = $derived(stats.regenDef.mul(10));
let powerTier   = $derived(getPowerTier(attackVal));

let playerHpPct = $derived.by(() => {
  const hp  = Decimal.from(character.stats?.hp ?? 0);
  const mHp = Decimal.from(maxHp);
  if (hp.gte(mHp) && mHp.gt(0)) return 100;
  const pct = hp.div(mHp).mul(100).toNumber();
  return isNaN(pct) ? 100 : Math.max(0, Math.min(100, pct));
});

let playerShPct = $derived.by(() => {
  const sh  = Decimal.from(character.stats?.defense ?? 0);
  const mSh = Decimal.from(maxSh);
  if (sh.gte(mSh) && mSh.gt(0)) return 100;
  const pct = sh.div(mSh).mul(100).toNumber();
  return isNaN(pct) ? 100 : Math.max(0, Math.min(100, pct));
});

let xpPct = $derived.by(() => {
  const xp  = Decimal.from(character.xp ?? 0);
  const xpN = Decimal.from(character.xpNeeded ?? 1);
  if (xp.gte(xpN) && xpN.gt(0)) return 100;
  const pct = xp.div(xpN).mul(100).toNumber();
  return isNaN(pct) ? 0 : Math.min(100, pct);
});

let enemyHpPct = $derived.by(() => {
  if (!combatState.enemy?.maxHp) return 0;
  const eHp  = Decimal.from(combatState.enemy.hp ?? 0);
  const eMax = Decimal.from(combatState.enemy.maxHp);
  if (eHp.gte(eMax)) return 100;
  const pct = eHp.div(eMax).mul(100).toNumber();
  return isNaN(pct) ? 0 : Math.min(100, pct);
});

function typeLabel(type: MobType): string {
  return (type || 'UNKNOWN').toUpperCase();
}

let hpIsLow = $derived(playerHpPct < 25);
</script>

<div class="arena">

  <!-- PLAYER BLOCK -->
  <div class="player-block">

    <!-- Row 1: Level + Power tier -->
    <div class="p-row header-row">
      <div class="p-cell">
        <span class="cell-label">LEVEL</span>
        <span class="cell-val">{formatValue(character.level ?? 0)}</span>
      </div>
      <div class="p-cell center">
        <span class="cell-label">CLASS</span>
        <span class="tier-badge {powerTier.class}">{powerTier.name}</span>
      </div>
      <button class="more-btn" onclick={() => showAdvanced = !showAdvanced}>
        {showAdvanced ? 'LESS' : 'MORE'}
      </button>
    </div>

    <!-- Advanced stats (collapsed by default) -->
    {#if showAdvanced}
      <div class="adv-grid">
        <div class="adv-item"><span class="adv-label">CRIT</span><span class="adv-val">{(character.stats.critChance * 100).toFixed(1)}%</span></div>
        <div class="adv-item"><span class="adv-label">KILLS</span><span class="adv-val">{formatValue(character.kills ?? 0)}</span></div>
        <div class="adv-item"><span class="adv-label">SKIP</span><span class="adv-val">{(character.stats.skipDamageChance * 100).toFixed(1)}%</span></div>
        <div class="adv-item"><span class="adv-label">HP/s</span><span class="adv-val">{formatValue(regenHpVal)}</span></div>
        <div class="adv-item"><span class="adv-label">SH/s</span><span class="adv-val">{formatValue(regenDefVal)}</span></div>
        <div class="adv-item"><span class="adv-label">SEALS</span><span class="adv-val">{character.seals}</span></div>
      </div>
    {/if}

    <!-- Bars -->
    <div class="bars">

      <div class="bar-row">
        <span class="bar-tag danger">HP</span>
        <div class="bar-track" class:bar-thick={true}>
          <div class="bar-fill hp" class:hp-low={hpIsLow} style="width:{playerHpPct}%"></div>
        </div>
        <span class="bar-num danger-text">{formatValue(character.stats?.hp ?? 0)}</span>
      </div>

      <div class="bar-row">
        <span class="bar-tag steel">SH</span>
        <div class="bar-track" class:bar-thick={true}>
          <div class="bar-fill sh" style="width:{playerShPct}%"></div>
        </div>
        <span class="bar-num steel-text">{formatValue(character.stats?.defense ?? 0)}</span>
      </div>

      <div class="bar-row">
        <span class="bar-tag warn">XP</span>
        <div class="bar-track">
          <div class="bar-fill xp" style="width:{xpPct}%"></div>
        </div>
        <span class="bar-num muted-text">{formatValue(character.xp ?? 0)}</span>
      </div>

    </div>
  </div>

  <!-- ENEMY BLOCK -->
  <div class="enemy-block">
    {#if combatState.enemy}
      <div class="enemy-card">
        <div class="enemy-head">
          <div class="enemy-left">
            <span class="enemy-name">{combatState.enemy.name}</span>
            <span class="enemy-type">{typeLabel(combatState.enemy.type)}</span>
          </div>
          <span class="enemy-lvl-badge">LVL {formatValue(combatState.enemy.level ?? 0)}</span>
        </div>
        <div class="enemy-bar-track">
          <div class="enemy-bar-fill" style="width:{enemyHpPct}%"></div>
        </div>
        <div class="enemy-hp-row">
          <span class="enemy-hp-num">{formatValue(combatState.enemy.hp ?? 0)}</span>
          <span class="enemy-hp-sep">/</span>
          <span class="enemy-hp-num muted">{formatValue(combatState.enemy.maxHp ?? 0)}</span>
        </div>
      </div>
    {:else}
      <div class="scanning">
        <span class="scan-dot"></span>
        <span>SCANNING...</span>
      </div>
    {/if}
  </div>

</div>

<style>
.arena {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ── PLAYER BLOCK ──────────────────────────── */
.player-block {
  flex-shrink: 0;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.p-row {
  display: grid;
  grid-template-columns: 1fr 1fr 60px;
  gap: 8px;
  align-items: center;
}

.p-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.p-cell.center { align-items: flex-start; }

.cell-label {
  font-family: var(--font-display);
  font-size: 0.56rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--color-muted);
  text-transform: uppercase;
}
.cell-val {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.more-btn {
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 5px 8px;
  background: transparent;
  border: 1px solid var(--border-mid);
  color: var(--color-muted);
  cursor: pointer;
  transition: color var(--t-fast), border-color var(--t-fast);
  align-self: center;
}
.more-btn:hover {
  border-color: var(--accent-white);
  color: var(--accent-white);
  background: transparent;
}

/* ── ADVANCED STATS ─────────────────────────── */
.adv-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  background: var(--panel-inset);
  padding: 8px;
  border: 1px solid var(--border-subtle);
}
.adv-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}
.adv-label {
  font-family: var(--font-display);
  font-size: 0.56rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--color-muted);
  text-transform: uppercase;
}
.adv-val {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

/* ── BARS ───────────────────────────────────── */
.bars {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bar-tag {
  font-family: var(--font-display);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  width: 18px;
  text-align: right;
  flex-shrink: 0;
}
.bar-tag.danger { color: var(--accent-danger); }
.bar-tag.steel  { color: var(--accent-steel); }
.bar-tag.warn   { color: var(--accent-warning); }

.bar-track {
  flex: 1;
  height: 8px;
  background: var(--panel-inset);
  border: 1px solid var(--border-mid);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
}
.bar-track.bar-thick { height: 14px; }

.bar-fill { height: 100%; transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1); }
.bar-fill.hp    { background: var(--accent-danger); box-shadow: 0 0 10px var(--accent-danger); }
.bar-fill.hp.hp-low { background: #880000; animation: pulse-glow 1s infinite; }
.bar-fill.sh    { background: var(--color-muted); box-shadow: 0 0 10px var(--color-muted); }
.bar-fill.xp    { background: var(--accent-warning); box-shadow: 0 0 10px var(--accent-warning); }

.bar-num {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-variant-numeric: tabular-nums;
  min-width: 52px;
  text-align: right;
  flex-shrink: 0;
}
.bar-num.danger-text { color: var(--accent-danger); }
.bar-num.steel-text  { color: var(--accent-steel); }
.bar-num.muted-text  { color: var(--color-muted); }

/* ── ENEMY BLOCK ────────────────────────────── */
.enemy-block {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  background: var(--panel-inset);
  border-top: 1px solid var(--border-subtle);
  position: relative;
  overflow: hidden;
}

/* Subtle diagonal line texture */
.enemy-block::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 8px,
    rgba(255,255,255,0.01) 8px,
    rgba(255,255,255,0.01) 9px
  );
  pointer-events: none;
}

.enemy-card {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: transparent;
  border: 1px solid var(--border-mid);
  padding: 16px;
  position: relative;
}

/* Bracket corners */
.enemy-card::before, .enemy-card::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid var(--accent-danger);
}
.enemy-card::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.enemy-card::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.enemy-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.enemy-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.enemy-name {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text);
}

.enemy-type {
  font-family: var(--font-display);
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  color: var(--color-muted);
  text-transform: uppercase;
}

.enemy-lvl-badge {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--accent-warning);
  background: rgba(255,190,0,0.06);
  border: 1px solid rgba(255,190,0,0.3);
  padding: 3px 7px;
  font-variant-numeric: tabular-nums;
}

.enemy-bar-track {
  height: 6px;
  background: var(--panel-inset);
  border: 1px solid var(--border-mid);
  overflow: hidden;
}
.enemy-bar-fill {
  height: 100%;
  background: var(--accent-danger);
  box-shadow: 0 0 10px var(--accent-danger);
  transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.enemy-hp-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.enemy-hp-num {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.enemy-hp-num.muted { color: var(--color-muted); }
.enemy-hp-sep { color: var(--color-dim); font-size: 0.72rem; }

/* ── SCANNING STATE ─────────────────────────── */
.scanning {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
}
.scan-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-muted);
  animation: scan-blink 1.2s step-end infinite;
}
@keyframes scan-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>

