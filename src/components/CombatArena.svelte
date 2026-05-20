<script lang="ts">
import { combatState } from '../modules/combat.svelte.js';
import { character } from '../modules/character.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { Decimal } from '../systems/decimal.js';
import type { MobType } from '../data/mobs.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';

let { compact = false }: { compact?: boolean } = $props();

let combatDisplay = $derived.by(() => {
  const enemyHpPct = (() => {
    if (!combatState.enemy?.maxHp) return 0;
    const eHp = combatState.enemy.hp ?? Decimal.ZERO;
    const eMax = combatState.enemy.maxHp;
    if (eHp.gte(eMax)) return 100;
    const pct = eHp.div(eMax).mul(100).toNumber();
    return isNaN(pct) ? 0 : Math.min(100, pct);
  })();

  const playerHp = character.stats?.hp ?? Decimal.ZERO;
  const playerMaxHp = character.stats?.maxHp ?? Decimal.HUNDRED;
  const playerHpPct = playerHp.gte(playerMaxHp) ? 100 : Math.min(100, playerHp.div(playerMaxHp).mul(100).toNumber());

  const playerDef = character.stats?.defense ?? Decimal.ZERO;
  const playerMaxDef = character.stats?.maxDefense ?? Decimal.FIFTY;
  const playerShPct = playerDef.gte(playerMaxDef) ? 100 : Math.min(100, playerDef.div(playerMaxDef).mul(100).toNumber());

  const hpIsLow = playerHpPct < 20;

  return { enemyHpPct, playerHpPct, playerShPct, hpIsLow };
});

function typeLabel(type: MobType): string {
  return (type || 'UNKNOWN').toUpperCase();
}

function getZoneName(level: number): string {
  if (level < 50) return 'NEURAL WASTES';
  if (level < 200) return 'CRYSTAL VALLEYS';
  if (level < 500) return 'VOID DEPTHS';
  if (level < 1000) return 'SINGULARITY CORE';
  return 'TRANSCENDENCE';
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
          <span class="c-scan">SEARCHING...</span>
        {/if}
      </div>
    </div>
  </div>
{:else}
<div class="arena">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#11043;</div>
      <div class="header-text">
        <h2 class="transcended-text">SYS.COMBAT</h2>
        <span class="transcended-sub">ENGAGEMENT PROTOCOL</span>
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

  <!-- ENEMY ZONE -->
  <div class="enemy-zone">
    {#if combatState.enemy}
      <div class="target-card">
        <div class="zone-label">{getZoneName(combatState.enemy.level?.toNumber() ?? 0)}</div>
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
      <div class="target-card waiting">
        <div class="zone-label">{getZoneName(character.level.toNumber())}</div>
        <div class="target-header">
          <div class="target-info">
            <span class="target-name">SEARCHING...</span>
            <span class="target-type">NO TARGET ACQUIRED</span>
          </div>
          <div class="target-level">
            <span class="lvl-label">LVL</span>
            <span class="lvl-value">{formatValue(character.level ?? 0)}</span>
          </div>
        </div>
        <div class="target-health">
          <div class="bar-track empty">
            <div class="bar-fill hp" style="width:0%"></div>
          </div>
          <div class="health-numbers">
            <span class="current">—</span>
            <span class="separator">/</span>
            <span class="max">—</span>
          </div>
        </div>
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
   PANEL HEADER
═════════════════════════════════════════════════════════════════ */

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
.transcended-text {
  font-family: var(--font-hud);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-0);
  margin: 0;
  text-transform: uppercase;
}
.transcended-sub {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--text-2);
  text-transform: uppercase;
}

/* ═══════════════════════════════════════════════════════════════════
   ENEMY ZONE
═════════════════════════════════════════════════════════════════ */

.enemy-zone {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background:
    radial-gradient(ellipse 60% 40% at 50% 50%, hsl(0 100% 60% / 0.05) 0%, transparent 70%);
}

.bar-track {
  height: 14px;
  background: hsl(0 0% 0% / 0.5);
  border: 1px solid hsl(0 100% 60% / 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.bar-track.empty {
  border-color: var(--line);
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--red), hsl(0 100% 70%));
  border-radius: 3px;
  transition: width 150ms ease;
}

.bar-fill.hp {
  background: linear-gradient(90deg, var(--red), hsl(0 100% 70%));
}

.target-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-2);
  border: 1px solid hsl(0 100% 60% / 0.25);
  padding: 20px;
  box-shadow: 0 0 20px hsl(0 100% 60% / 0.1);
}

.target-card.waiting {
  border-color: var(--line);
  box-shadow: none;
}

.zone-label {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--cyan);
  text-transform: uppercase;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--line);
}

.target-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.target-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.target-name {
  font-family: var(--font-hud);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-0);
}

.target-type {
  font-family: var(--font-hud);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--text-2);
  text-transform: uppercase;
}

.target-level {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 6px 14px;
  background: hsl(45 100% 60% / 0.1);
  border: 1px solid hsl(45 100% 60% / 0.25);
}

.lvl-label {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--gold);
  opacity: 0.7;
}

.lvl-value {
  font-family: var(--font-data);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--gold);
}

.target-health {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.health-numbers {
  display: flex;
  align-items: center;
  gap: 6px;
}

.current {
  font-family: var(--font-data);
  font-size: 1rem;
  font-weight: 600;
  color: var(--red);
}

.separator {
  font-family: var(--font-data);
  font-size: 0.85rem;
  color: var(--text-2);
}

.max {
  font-family: var(--font-data);
  font-size: 0.85rem;
  color: var(--text-2);
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
  color: var(--text-2);
}
</style>
