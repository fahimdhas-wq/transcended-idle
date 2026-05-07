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

<div class="character-panel">
  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">👤</div>
      <div class="header-title-box">
        <h2 class="transcended-text">SYS.IDENTITY</h2>
        <div class="header-subtitle">CORE CHARACTER DATA</div>
      </div>
    </div>
    {#if bestiaryState.cachedBoost > 0}
      <div class="header-stats">
        <div class="header-stat-box">
          <span class="stat-label">COMBAT SYNC</span>
          <span class="stat-value" style="color: var(--neon-green);">+{(bestiaryState.cachedBoost * 100).toFixed(0)}%</span>
        </div>
      </div>
    {/if}
  </div>

  <div class="stat-group">
    <div class="stat-row-title">
      <span>LVL {formatNumber(character.level)}</span>
      <span>STAGE [{formatNumber(character.awakeningStage)}]</span>
    </div>
    <div class="xp-bar-container">
      <div class="xp-bar" style="width: {xpPercent}%"></div>
      <div class="xp-text">
        {formatNumber(Decimal.from(character.xp).lt(0) ? 0 : character.xp)} /
        {formatNumber(character.xpNeeded)} XP
      </div>
    </div>
  </div>

  <div class="stat-list">
    <div class="stat-item">
      <span class="label">HP</span>
      <span class="val">{formatNumber(character.stats.hp)} / {formatNumber(character.stats.maxHp)}</span>
    </div>
    <div class="stat-item">
      <span class="label">SHIELD</span>
      <span class="val val-blue">{formatNumber(character.stats.defense)} / {formatNumber(character.stats.maxDefense)}</span>
    </div>
    <div class="stat-item">
      <span class="label">POWER CLASS (ATK)</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="val">{formatNumber(character.stats.attack)}</span>
        <span class="val tier-badge {powerTier.class}">{powerTier.name}</span>
      </div>
    </div>
    <div class="stat-item">
      <span class="label">REGEN HP/s</span>
      <span class="val">{formatNumber(character.stats.regenHp.mul(new Decimal(10).pow(character.seals)).mul(10))}</span>
    </div>
    <div class="stat-item">
      <span class="label">REGEN SH/s</span>
      <span class="val val-blue">{formatNumber(character.stats.regenDef.mul(new Decimal(10).pow(character.seals)).mul(10))}</span>
    </div>
    <div class="stat-item">
      <span class="label">CRIT CHANCE</span>
      <span class="val">{(character.stats.critChance * 100).toFixed(1)}%</span>
    </div>
    <div class="stat-item">
      <span class="label">TOTAL KILLS</span>
      <span class="val">{formatNumber(character.kills)}</span>
    </div>
    <div class="stat-item">
      <span class="label">SEALS</span>
      <span class="val val-pink">{character.seals}</span>
    </div>
  </div>

  <div class="awakening-info">
    <h3 class="transcended-sub">AWAKENING NODE</h3>
    <p>Power Multiplier: <span class="val-pink">x{formatNumber(Decimal.from(1.5).pow(character.awakeningStage))}</span></p>
    {#if isCritical}
      <div class="critical-warning">⚠ CRITICAL — AWAKENING IMMINENT</div>
    {/if}
  </div>
</div>

<style>
.character-panel { display: flex; flex-direction: column; gap: 12px; height: 100%; }

.bestiary-bonus { font-size: 0.7rem; color: var(--neon-green); font-family: var(--font-cyber); }

.stat-group { margin-bottom: 4px; }

.stat-row-title {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-cyber);
  font-size: 1.1rem;
  color: var(--neon-pink);
  text-shadow: 0 0 5px rgba(255, 0, 255, 0.4);
  margin-bottom: 6px;
}

.xp-bar-container {
  height: 14px;
  background: #111;
  border: 1px solid var(--border-subtle);
  position: relative;
  border-radius: 1px;
}
.xp-bar {
  height: 100%;
  background: var(--neon-blue);
  box-shadow: 0 0 8px rgba(0, 190, 255, 0.4);
  transition: width 0.4s ease;
}
.xp-text {
  position: absolute;
  top: -1px;
  width: 100%;
  text-align: center;
  font-size: 0.7rem;
  color: #fff;
  text-shadow: 1px 1px 2px #000;
  pointer-events: none;
}

.stat-list { display: flex; flex-direction: column; gap: 5px; overflow-y: auto; }

.stat-item {
  display: flex;
  justify-content: space-between;
  background: rgba(0, 255, 255, 0.04);
  padding: 5px 10px;
  border-left: 2px solid var(--neon-blue);
}
.stat-item .label { color: var(--color-muted); font-size: 0.7rem; }
.stat-item .val   { font-family: var(--font-cyber); color: #fff; font-size: 0.75rem; }
.val-blue  { color: var(--neon-blue); text-shadow: 0 0 4px rgba(0, 190, 255, 0.4); }
.val-pink  { color: var(--neon-pink); text-shadow: 0 0 4px rgba(255, 0, 255, 0.4); }

.awakening-info {
  margin-top: auto;
  border-top: 1px dashed var(--neon-pink);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.awakening-info p { font-size: 0.75rem; color: var(--color-muted); margin: 0; }

.critical-warning {
  color: var(--neon-red);
  font-family: var(--font-cyber);
  font-size: 0.75rem;
  animation: glitch 1s infinite;
}

@keyframes glitch {
  0%   { transform: translate(0); }
  20%  { transform: translate(-2px, 1px); }
  40%  { transform: translate(-1px, -1px); }
  60%  { transform: translate(2px, 1px); }
  80%  { transform: translate(1px, -1px); }
  100% { transform: translate(0); }
}
</style>
