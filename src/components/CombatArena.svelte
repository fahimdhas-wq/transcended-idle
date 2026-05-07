<script lang="ts">
import { combatState, getEffectiveCombatStats } from '../modules/combat.svelte.js';
import { character } from '../modules/character.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { getPowerTier } from '../systems/powerTier.js';
import { Decimal } from '../systems/decimal.js';
import type { MobType } from '../data/mobs.js';

let showAdvanced = $state(false);

let stats = $derived(getEffectiveCombatStats());

let maxHp  = $derived(stats.hp);
let maxSh  = $derived(stats.def);
let attackVal   = $derived(stats.atk);
let regenHpVal  = $derived(stats.regenHp.mul(10));
let regenDefVal = $derived(stats.regenDef.mul(10));

let powerTier = $derived(getPowerTier(attackVal));

let playerHpPct = $derived.by(() => {
  const hp = Decimal.from(character.stats?.hp ?? 0);
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
  if (!combatState.enemy || !combatState.enemy.maxHp) return 0;
  const eHp  = Decimal.from(combatState.enemy.hp ?? 0);
  const eMax = Decimal.from(combatState.enemy.maxHp);
  if (eHp.gte(eMax)) return 100;
  const pct = eHp.div(eMax).mul(100).toNumber();
  return isNaN(pct) ? 0 : Math.min(100, pct);
});

function enemyTypeColor(type: MobType) {
  if (type === 'organic')  return '#4caf50';
  if (type === 'robotic')  return '#00beff';
  if (type === 'spectral') return '#ff00ff';
  return '#888';
}
function enemyTypeLabel(type: MobType) {
  return (type || 'UNKNOWN').toUpperCase();
}

let hpIsLow = $derived(playerHpPct < 25);
</script>

<div class="combat-arena">
  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">⚔️</div>
      <div class="header-title-box">
        <h2 class="transcended-text">COMBAT ARENA</h2>
        <div class="header-subtitle">TACTICAL ENGAGEMENT</div>
      </div>
    </div>
  </div>

  <div class="stats-primary">
    <div class="stat-main">
      <span class="label">LEVEL</span>
      <span class="value">{formatValue(character.level ?? 0)}</span>
    </div>
    <div class="stat-main">
      <span class="label">POWER CLASS</span>
      <span class="value tier-badge {powerTier.class}" style="margin-top: 4px; display: inline-block;">{powerTier.name}</span>
    </div>
    <button class="btn-more" onclick={() => showAdvanced = !showAdvanced}>
      {showAdvanced ? 'LESS' : 'MORE'}
    </button>
  </div>

  {#if showAdvanced}
    <div class="stats-secondary">
      <div class="s-cell">CRIT: {(character.stats.critChance * 100).toFixed(1)}%</div>
      <div class="s-cell">KILLS: {formatValue(character.kills ?? 0)}</div>
      <div class="s-cell">SKIP: {(character.stats.skipDamageChance * 100).toFixed(1)}%</div>
      <div class="s-cell">HP/s: {formatValue(regenHpVal)}</div>
      <div class="s-cell">SH/s: {formatValue(regenDefVal)}</div>
      <div class="s-cell">SEALS: {character.seals}</div>
    </div>
  {/if}

  <div class="bars-section">
    <div class="bar-row">
      <span class="bar-label">HP</span>
      <div class="bar-track bar-thick">
        <div class="bar-fill hp" class:hp-low={hpIsLow} style="width: {playerHpPct}%"></div>
      </div>
      <span class="bar-val neon-red-text">{formatValue(character.stats?.hp ?? 0)}</span>
    </div>
    <div class="bar-row">
      <span class="bar-label">SH</span>
      <div class="bar-track bar-thick">
        <div class="bar-fill sh" style="width: {playerShPct}%"></div>
      </div>
      <span class="bar-val neon-blue-text">{formatValue(character.stats?.defense ?? 0)}</span>
    </div>
    <div class="bar-row">
      <span class="bar-label">XP</span>
      <div class="bar-track">
        <div class="bar-fill xp" style="width: {xpPct}%"></div>
      </div>
      <span class="bar-val">{formatValue(character.xp ?? 0)}</span>
    </div>
  </div>

  <div class="arena-box">
    {#if combatState.enemy}
      <div class="enemy-card">
        <div class="enemy-header">
          <span class="enemy-name">{combatState.enemy.name}</span>
          <div class="enemy-meta">
            <span class="enemy-type-badge" style="border-color: {enemyTypeColor(combatState.enemy.type)}; color: {enemyTypeColor(combatState.enemy.type)}">
              {enemyTypeLabel(combatState.enemy.type)}
            </span>
            <span class="enemy-lvl">LVL {formatValue(combatState.enemy.level ?? 0)}</span>
          </div>
        </div>
        <div class="bar-track enemy-bar-track">
          <div class="bar-fill enemy-hp" style="width: {enemyHpPct}%"></div>
        </div>
        <div class="enemy-hp-text">{formatValue(combatState.enemy.hp ?? 0)} / {formatValue(combatState.enemy.maxHp ?? 0)}</div>
      </div>
    {:else}
      <div class="scanning">SCANNING SECTOR...</div>
    {/if}
  </div>
</div>

<style>
.combat-arena { display: flex; flex-direction: column; gap: 10px; height: 100%; overflow: hidden; }

.stats-primary { display: grid; grid-template-columns: 1fr 1fr 60px; gap: 8px; }
.stat-main { background: rgba(0,0,0,0.4); padding: 8px; border: 1px solid var(--border-subtle); text-align: center; }
.stat-main .label { display: block; font-size: 0.6rem; color: var(--neon-blue); letter-spacing: 1px; }
.stat-main .value { font-family: var(--font-cyber); font-size: 1rem; color: #fff; }

.btn-more { 
  background: transparent; 
  border: 1px solid var(--neon-blue); 
  color: var(--neon-blue); 
  cursor: pointer; 
  font-family: var(--font-cyber); 
  font-size: 0.75rem; 
  padding: 8px; 
  transition: all 0.2s ease;
  box-shadow: inset 0 0 5px rgba(0,190,255,0.2);
  text-transform: uppercase;
  font-weight: bold;
}
.btn-more:hover { 
  background: rgba(0,190,255,0.1);
  box-shadow: 0 0 10px rgba(0,190,255,0.5), inset 0 0 10px rgba(0,190,255,0.4); 
  text-shadow: 0 0 5px var(--neon-blue);
}

.stats-secondary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; font-size: 0.65rem; color: #aaa; background: rgba(0,0,0,0.2); padding: 8px; }
.s-cell { font-family: var(--font-data); }

.bars-section { display: flex; flex-direction: column; gap: 6px; }
.bar-row { display: flex; align-items: center; gap: 8px; }
.bar-label { font-family: var(--font-cyber); font-size: 0.6rem; color: var(--neon-blue); width: 16px; flex-shrink: 0; }
.bar-track { flex: 1; height: 8px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 2px; overflow: hidden; }
.bar-fill { height: 100%; transition: width 0.25s ease; border-radius: 1px; }

.hp { background: var(--neon-red); box-shadow: 0 0 6px rgba(255,0,0,0.5); }
.hp.hp-low { animation: hp-pulse 0.8s infinite; }
@keyframes hp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.sh { background: var(--neon-blue); box-shadow: 0 0 6px rgba(0,190,255,0.4); }
.xp { background: var(--neon-gold); }

.bar-val { font-family: var(--font-data); font-size: 0.65rem; color: #ccc; min-width: 55px; text-align: right; }

.arena-box {
  flex: 1;
  border: 1px solid var(--neon-blue);
  box-shadow: inset 0 0 20px rgba(0, 190, 255, 0.1);
  background: 
    linear-gradient(rgba(0,190,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,190,255,0.05) 1px, transparent 1px),
    rgba(0,0,0,0.5);
  background-size: 20px 20px;
  animation: grid-move 5s linear infinite;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
@keyframes grid-move {
  0% { background-position: 0 0, 0 0; }
  100% { background-position: 20px 20px, 20px 20px; }
}
.enemy-card { 
  width: 100%; 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  background: rgba(0,0,0,0.8);
  border: 1px solid var(--neon-red);
  padding: 15px;
  box-shadow: 0 0 15px rgba(255,0,0,0.1);
  animation: glitch-anim 4s infinite;
}
@keyframes glitch-anim {
  0%, 98%, 100% { transform: translate(0); }
  99% { transform: translate(-2px, 1px); }
}
.enemy-header { display: flex; justify-content: space-between; align-items: flex-start; }
.enemy-name { font-family: var(--font-cyber); font-size: 1.2rem; color: var(--neon-pink); text-shadow: 0 0 8px var(--neon-pink); text-transform: uppercase; }
.enemy-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.enemy-type-badge {
  font-family: var(--font-cyber);
  font-size: 0.6rem;
  padding: 2px 6px;
  border: 1px solid;
  border-radius: 2px;
  box-shadow: inset 0 0 5px currentColor;
}
.enemy-lvl { font-size: 0.8rem; color: var(--neon-gold); text-shadow: 0 0 5px var(--neon-gold); }
.enemy-bar-track { height: 14px; border-color: var(--neon-red); box-shadow: 0 0 5px rgba(255,0,0,0.5); }
.enemy-hp { background: var(--neon-red); height: 100%; box-shadow: 0 0 10px var(--neon-red); }
.enemy-hp-text { font-size: 0.8rem; color: #fff; text-align: center; font-family: var(--font-data); margin-top: -4px;}
.scanning { font-family: var(--font-cyber); font-size: 1rem; color: var(--neon-blue); animation: scan-pulse 1s infinite alternate; }
@keyframes scan-pulse {
  from { opacity: 0.3; text-shadow: none; }
  to { opacity: 1; text-shadow: 0 0 10px var(--neon-blue); }
}

.bar-thick { height: 14px; }
.neon-red-text { color: var(--neon-red); text-shadow: 0 0 5px var(--neon-red); font-weight: bold;}
.neon-blue-text { color: var(--neon-blue); text-shadow: 0 0 5px var(--neon-blue); font-weight: bold;}
</style>
