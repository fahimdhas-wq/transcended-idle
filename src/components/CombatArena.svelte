<script lang="ts">
import { combatState, getEffectiveCombatStats } from '../modules/combat.svelte.js';
import { character } from '../modules/character.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { getPowerTier } from '../systems/powerTier.js';
import { Decimal } from '../systems/decimal.js';
import { onMount } from 'svelte';
import type { MobType } from '../data/mobs.js';
import Value from './Value.svelte';

let { compact = false }: { compact?: boolean } = $props();

let showAdvanced = $state(false);

const combatDialogues = [
  'SLAYING DEMONS...',
  'PURGING EVIL...',
  'DEFENDING REALM...',
  'BREAKING DIMENSIONS...',
  'EXECUTING PROTOCOL...',
  'ANNIHILATING THREAT...',
  'SACRIFICING ALL...',
  'OVERCLOCKING SYSTEM...',
  'RIPPING THROUGH...',
  'CONSUMING DARKNESS...',
  'ASCENDING BEYOND...',
  'TEARING FATE...',
  'VOID CRAVES MORE...',
  'TRANSCENDING LIMITS...',
  'SLAYING LEGENDS...',
];
let dialogueIndex = $state(0);

onMount(() => {
  const interval = setInterval(() => {
    dialogueIndex = (dialogueIndex + 1) % combatDialogues.length;
  }, 2500);
  return () => clearInterval(interval);
});

// Single derived block for all combat display data — reduces reactive overhead
let combatDisplay = $derived.by(() => {
  const stats = getEffectiveCombatStats();
  const hp = character.stats?.hp ?? Decimal.ZERO;
  const mHp = stats.hp;
  const sh = character.stats?.defense ?? Decimal.ZERO;
  const mSh = stats.def;
  const xp = character.xp ?? Decimal.ZERO;
  const xpN = character.xpNeeded ?? Decimal.ONE;

  const playerHpPct = (() => {
    if (hp.gte(mHp) && mHp.gt(0)) return 100;
    const pct = hp.div(mHp).mul(100).toNumber();
    return isNaN(pct) ? 100 : Math.max(0, Math.min(100, pct));
  })();

  const playerShPct = (() => {
    if (sh.gte(mSh) && mSh.gt(0)) return 100;
    const pct = sh.div(mSh).mul(100).toNumber();
    return isNaN(pct) ? 100 : Math.max(0, Math.min(100, pct));
  })();

  const xpPct = (() => {
    if (xp.gte(xpN) && xpN.gt(0)) return 100;
    const pct = xp.div(xpN).mul(100).toNumber();
    return isNaN(pct) ? 0 : Math.min(100, pct);
  })();

  const enemyHpPct = (() => {
    if (!combatState.enemy?.maxHp) return 0;
    const eHp = combatState.enemy.hp ?? Decimal.ZERO;
    const eMax = combatState.enemy.maxHp;
    if (eHp.gte(eMax)) return 100;
    const pct = eHp.div(eMax).mul(100).toNumber();
    return isNaN(pct) ? 0 : Math.min(100, pct);
  })();

  return {
    stats,
    maxHp: stats.hp,
    maxSh: stats.def,
    attackVal: stats.atk,
    regenHpVal: stats.regenHp.mul(10),
    regenDefVal: stats.regenDef.mul(10),
    powerTier: getPowerTier(stats.atk),
    playerHpPct,
    playerShPct,
    xpPct,
    enemyHpPct,
    hpIsLow: playerHpPct < 25,
  };
});

function typeLabel(type: MobType): string {
  return (type || 'UNKNOWN').toUpperCase();
}
</script>

{#if compact}
  <div class="arena-compact">
    <div class="c-main">
      <div class="c-level">
        <span class="c-lbl">LV</span>
        <span class="c-lv">{formatValue(character.level ?? 0)}</span>
      </div>
      <div class="c-player-bars">
        <div class="c-gauge">
          <div class="c-g-label hp">HP</div>
          <div class="c-bar-track">
            <div class="c-bar-fill" class:hp-critical={combatDisplay.hpIsLow} style="width:{combatDisplay.playerHpPct}%"></div>
          </div>
          <div class="c-g-value">{formatValue(character.stats?.hp ?? 0)}</div>
        </div>
        <div class="c-gauge">
          <div class="c-g-label sh">SH</div>
          <div class="c-bar-track">
            <div class="c-bar-fill sh" style="width:{combatDisplay.playerShPct}%"></div>
          </div>
          <div class="c-g-value">{formatValue(character.stats?.defense ?? 0)}</div>
        </div>
      </div>
      <div class="c-enemy">
        {#if combatState.enemy}
          <div class="c-enemy-top">
            <span class="c-enemy-name">{combatState.enemy.name}</span>
            <span class="c-enemy-lv">Lv.{formatValue(combatState.enemy.level ?? 0)}</span>
          </div>
          <div class="c-bar-track enemy">
            <div class="c-bar-fill hp" style="width:{combatDisplay.enemyHpPct}%"></div>
          </div>
        {:else}
          <span class="c-scan">▸ {combatDialogues[dialogueIndex]}</span>
        {/if}
      </div>
    </div>
  </div>
{:else}
<div class="arena">
  <!-- PLAYER HUD -->
  <div class="player-hud">
    <!-- Level & Class -->
    <div class="player-identity">
      <div class="identity-main">
        <span class="label">LVL</span>
        <span class="value">{formatValue(character.level ?? 0)}</span>
      </div>
      <div class="identity-divider"></div>
      <div class="identity-class">
        <span class="tier-badge {combatDisplay.powerTier.class}">{combatDisplay.powerTier.name}</span>
      </div>
      <button class="expand-btn" onclick={() => showAdvanced = !showAdvanced}>
        {showAdvanced ? '[-]' : '[+]'}
      </button>
    </div>

    <!-- Advanced Stats -->
    {#if showAdvanced}
      <div class="adv-grid">
        <div class="adv-item"><span class="a-lbl">CRIT</span><span class="a-val">{character.stats.critChance * 100 > 0 ? (character.stats.critChance * 100).toFixed(1) + '%' : '—'}</span></div>
        <div class="adv-item"><span class="a-lbl">KILLS</span><span class="a-val">{formatValue(character.kills ?? 0)}</span></div>
        <div class="adv-item"><span class="a-lbl">SKIP</span><span class="a-val">{character.stats.skipDamageChance * 100 > 0 ? (character.stats.skipDamageChance * 100).toFixed(1) + '%' : '—'}</span></div>
        <div class="adv-item"><span class="a-lbl">HP/s</span><span class="a-val val-green">{formatValue(combatDisplay.regenHpVal)}</span></div>
        <div class="adv-item"><span class="a-lbl">SH/s</span><span class="a-val val-cyan">{formatValue(combatDisplay.regenDefVal)}</span></div>
        <div class="adv-item"><span class="a-lbl">SEALS</span><span class="a-val val-gold"><Value n={character.seals} /></span></div>
      </div>
    {/if}

    <!-- Health Bars -->
    <div class="gauge-container">
      <!-- HP -->
      <div class="gauge">
        <div class="gauge-header">
          <span class="gauge-label red">HP</span>
          <span class="gauge-value">{formatValue(character.stats?.hp ?? 0)}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill hp" class:hp-critical={combatDisplay.hpIsLow} style="width:{combatDisplay.playerHpPct}%"></div>
        </div>
      </div>

      <!-- Shield -->
      <div class="gauge">
        <div class="gauge-header">
          <span class="gauge-label cyan">SH</span>
          <span class="gauge-value">{formatValue(character.stats?.defense ?? 0)}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill sh" style="width:{combatDisplay.playerShPct}%"></div>
        </div>
      </div>

      <!-- XP -->
      <div class="gauge">
        <div class="gauge-header">
          <span class="gauge-label gold">XP</span>
          <span class="gauge-value">{formatValue(character.xp ?? 0)}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill xp" style="width:{combatDisplay.xpPct}%"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ENEMY ZONE -->
  <div class="enemy-zone">
    {#if combatState.enemy}
      <div class="target-card">
        <div class="target-header">
          <div class="target-info">
            <span class="target-name">{combatState.enemy.name}</span>
            <span class="target-type">{typeLabel(combatState.enemy.type)}</span>
          </div>
          <div class="target-level">
            <span class="lvl-label">LVL</span>
            <span class="lvl-value">{formatValue(combatState.enemy.level ?? 0)}</span>
          </div>
        </div>
        <div class="target-health">
          <div class="bar-track">
            <div class="bar-fill hp" style="width:{combatDisplay.enemyHpPct}%"></div>
          </div>
          <div class="health-numbers">
            <span class="current">{formatValue(combatState.enemy.hp ?? 0)}</span>
            <span class="separator">/</span>
            <span class="max">{formatValue(combatState.enemy.maxHp ?? 0)}</span>
          </div>
        </div>
      </div>
    {:else}
      <div class="scanning">
        <span class="scan-icon">▸</span>
        <span class="scan-text">{combatDialogues[dialogueIndex]}</span>
      </div>
    {/if}
  </div>
</div>
{/if}

<style>
.arena {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ═══════════════════════════════════════════════════════════════════
   PLAYER HUD
══════════════════════════════════════════════════════════════════ */

.player-hud {
  flex-shrink: 0;
  padding: 12px;
  border-bottom: 1px solid var(--line);
}

.player-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.identity-main {
  display: flex;
  flex-direction: column;
}

.identity-main .label {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--text-2);
  text-transform: uppercase;
}

.identity-main .value {
  font-family: var(--font-data);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-0);
  line-height: 1;
}

.identity-divider {
  width: 1px;
  height: 28px;
  background: var(--line);
}

.identity-class {
  flex: 1;
}

.expand-btn {
  font-family: var(--font-data);
  font-size: 0.6rem;
  padding: 4px 8px;
  background: var(--bg-0);
  border: 1px solid var(--line);
  color: var(--text-2);
}

.expand-btn:hover {
  border-color: var(--cyan);
  color: var(--cyan);
}

/* Advanced Grid */
.adv-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 8px;
  background: var(--bg-1);
  border: 1px solid var(--line);
  margin-bottom: 10px;
}

.adv-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 6px;
  background: var(--bg-0);
}

.a-lbl {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-2);
  text-transform: uppercase;
}

.a-val {
  font-family: var(--font-data);
  font-size: 0.65rem;
  color: var(--text-0);
}

/* ═══════════════════════════════════════════════════════════════════
   GAUGES
══════════════════════════════════════════════════════════════════ */

.gauge-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gauge {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gauge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gauge-label {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.gauge-label.red { color: var(--red); }
.gauge-label.cyan { color: var(--cyan); }
.gauge-label.gold { color: var(--gold); }

.gauge-value {
  font-family: var(--font-data);
  font-size: 0.7rem;
  color: var(--text-0);
}

/* ═══════════════════════════════════════════════════════════════════
   ENEMY ZONE
══════════════════════════════════════════════════════════════════ */

.enemy-zone {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background:
    radial-gradient(ellipse 60% 40% at 50% 50%, hsl(0 100% 60% / 0.05) 0%, transparent 70%);
}

.target-card {
  width: 100%;
  max-width: 340px;
  background: var(--bg-2);
  border: 1px solid hsl(0 100% 60% / 0.2);
  padding: 14px;
}

.target-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.target-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.target-name {
  font-family: var(--font-hud);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-0);
}

.target-type {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--text-2);
  text-transform: uppercase;
}

.target-level {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 4px 10px;
  background: hsl(45 100% 60% / 0.1);
  border: 1px solid hsl(45 100% 60% / 0.25);
}

.lvl-label {
  font-family: var(--font-hud);
  font-size: 0.45rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--gold);
  opacity: 0.7;
}

.lvl-value {
  font-family: var(--font-data);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--gold);
}

.target-health {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.health-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
}

.current {
  font-family: var(--font-data);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--red);
}

.separator {
  font-family: var(--font-data);
  font-size: 0.7rem;
  color: var(--text-2);
}

.max {
  font-family: var(--font-data);
  font-size: 0.7rem;
  color: var(--text-2);
}

/* Scanning */
.scanning {
  display: flex;
  align-items: center;
  gap: 10px;
}

.scan-icon {
  font-family: var(--font-data);
  font-size: 1rem;
  color: var(--cyan);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.scan-text {
  font-family: var(--font-hud);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--text-2);
  text-transform: uppercase;
}

/* ═══════════════════════════════════════════════════════════════════
   COMPACT MODE — Portrait combat strip
══════════════════════════════════════════════════════════════════ */

.arena-compact {
  display: flex;
  flex-direction: column;
}

.c-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.c-level {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  min-width: 44px;
}

.c-lbl {
  font-family: var(--font-hud);
  font-size: 0.45rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-2);
  text-transform: uppercase;
}

.c-lv {
  font-family: var(--font-data);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-0);
  line-height: 1.2;
}

.c-player-bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.c-gauge {
  display: flex;
  align-items: center;
  gap: 4px;
}

.c-g-label {
  font-family: var(--font-hud);
  font-size: 0.45rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  width: 16px;
  flex-shrink: 0;
}

.c-g-label.hp { color: var(--red); }
.c-g-label.sh { color: var(--cyan); }

.c-g-value {
  font-family: var(--font-data);
  font-size: 0.55rem;
  color: var(--text-0);
  font-variant-numeric: tabular-nums;
  width: 60px;
  text-align: right;
  flex-shrink: 0;
}

.c-bar-track {
  flex: 1;
  height: 5px;
  background: hsl(0 0% 0% / 0.5);
  border: 1px solid var(--line);
  border-radius: 3px;
  overflow: hidden;
  min-width: 0;
}

.c-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 150ms ease;
  background: linear-gradient(90deg, var(--red), hsl(0 100% 70%));
}

.c-bar-fill.sh {
  background: linear-gradient(90deg, var(--cyan), hsl(185 100% 70%));
}

.hp-critical {
  animation: hp-flash 0.5s ease-in-out infinite alternate;
}

@keyframes hp-flash {
  from { opacity: 1; }
  to { opacity: 0.5; }
}

.c-enemy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  max-width: 160px;
}

.c-enemy-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.c-enemy-name {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-0);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.c-enemy-lv {
  font-family: var(--font-data);
  font-size: 0.5rem;
  color: var(--gold);
  flex-shrink: 0;
}

.c-bar-track.enemy {
  height: 5px;
}

.c-bar-fill.hp {
  background: linear-gradient(90deg, var(--red), hsl(0 100% 70%));
}

.c-scan {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--cyan);
  animation: blink 1s step-end infinite;
}
</style>
