
<script lang="ts">
  import { skillsState, tiers } from '../modules/skills.svelte.js';
  import type { Skill } from '../modules/skills.svelte.js';
  import { character } from '../modules/character.svelte.js';
  import { formatNumber } from '../systems/scalingSystem.js';
  import { Decimal } from '../systems/decimal.js';
  import { flushStatCache } from '../modules/combat.svelte.js';

  function currentTier(skill: Skill): string { return tiers[skill.tierIndex] || 'F-'; }
  function tierClass(skill: Skill): string {
    const t = currentTier(skill);
    return 'tier-' + t.replace(/\+/g, 'plus').replace(/-/g, 'minus').replace(/ EX$/, 'EX').replace(/ /g, '');
  }
  function nextTier(skill: Skill): string { return tiers[skill.tierIndex + 1] || 'MAX'; }
  function fragPct(skill: Skill): number {
    if (skill.fragmentsNeeded.lte(0)) return 100;
    return Math.min(100, skill.fragments.div(skill.fragmentsNeeded).mul(100).toNumber());
  }

  function feed(skill: Skill, amount: number): void {
    const needed = skill.fragmentsNeeded.sub(skill.fragments);
    const give = Decimal.min(Decimal.min(character.skillFragments, amount), needed);
    if (give.lte(0)) return;
    character.skillFragments = character.skillFragments.sub(give);
    skill.fragments = skill.fragments.add(give);
    checkEvolve(skill);
  }

  function feedAll(skill: Skill): void {
    const needed = skill.fragmentsNeeded.sub(skill.fragments);
    const give = Decimal.min(needed, character.skillFragments);
    if (give.lte(0)) return;
    character.skillFragments = character.skillFragments.sub(give);
    skill.fragments = skill.fragments.add(give);
    checkEvolve(skill);
  }

  function checkEvolve(skill: Skill): void {
    let evolved = false;
    while (skill.fragments.gte(skill.fragmentsNeeded) && skill.tierIndex < tiers.length - 1) {
      skill.fragments = skill.fragments.sub(skill.fragmentsNeeded);
      skill.tierIndex++;
      skill.fragmentsNeeded = skill.fragmentsNeeded.mul(2.5).floor();
      evolved = true;
    }
    if (evolved) flushStatCache();
  }

  let totalFrags = $derived(formatNumber(character.skillFragments));
</script>

<div class="skill-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#9670;</div>
      <div class="header-text">
        <h2 class="transcended-text">SKILLS</h2>
        <span class="transcended-sub">NEURAL UPGRADES</span>
      </div>
    </div>
    <div class="header-right">
      <span class="stat-label">FRAGMENTS</span>
      <span class="stat-value accent-violet">&#9889; {totalFrags}</span>
    </div>
  </div>

  <div class="skills-list">
    {#each skillsState.skills as skill (skill.id)}
      <div class="skill-card">
        <div class="skill-top">
          <span class="skill-name">{skill.name}</span>
          <span class="tier-badge {tierClass(skill)}">{currentTier(skill)}</span>
        </div>

        <p class="skill-desc">{skill.description}</p>

        <div class="progress-track">
          <div class="progress-fill" style:width="{fragPct(skill)}%"></div>
        </div>
        <div class="frag-row">
          <span class="text-xs color-muted">{formatNumber(skill.fragments)} / {formatNumber(skill.fragmentsNeeded)}</span>
          <span class="text-xs color-muted">&#8594; {nextTier(skill)} &#183; x{formatNumber(Math.pow(2, skill.tierIndex + 1))} boost</span>
        </div>

        <div class="skill-btns">
          <button class="btn-sm" onclick={() => feed(skill, 1)} disabled={character.skillFragments.lt(1)}>+1</button>
          <button class="btn-sm" onclick={() => feed(skill, 10)} disabled={character.skillFragments.lt(10)}>+10</button>
          <button class="btn-sm" onclick={() => feed(skill, 50)} disabled={character.skillFragments.lt(50)}>+50</button>
          <button class="btn-sm accent-btn" onclick={() => feedAll(skill)} disabled={character.skillFragments.lt(1)}>MAX</button>
          {#if skill.tierIndex > 0}
            <label class="auto-tog">
              <input type="checkbox" bind:checked={skill.autoCast} />
              <span>AUTO</span>
            </label>
          {:else}
            <span class="locked-label">LOCKED</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .skill-panel { display: flex; flex-direction: column; height: 100%; }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-icon { font-size: 1rem; color: var(--accent-violet); }
  .header-text { display: flex; flex-direction: column; gap: 1px; }
  .header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }

  .stat-label { font-family: var(--font-display); font-size: 0.56rem; font-weight: 600; letter-spacing: 0.14em; color: var(--color-muted); text-transform: uppercase; }
  .stat-value { font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; }
  .accent-violet { color: var(--accent-violet); }

  .skills-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }

  .skill-card {
    background: transparent;
    border: 1px solid var(--border-subtle);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: all var(--t-fast);
    position: relative;
  }
  .skill-card::before, .skill-card::after {
    content: ''; position: absolute;
    width: 6px; height: 6px; border: 1px solid var(--accent-danger);
  }
  .skill-card::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .skill-card::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

  .skill-card:hover { border-color: var(--accent-danger); background: hsla(0, 100%, 50%, 0.05); }

  .skill-top { display: flex; justify-content: space-between; align-items: center; }
  .skill-name { font-weight: 700; font-size: 0.8rem; color: var(--color-text); letter-spacing: 0.04em; }
  .skill-desc { margin: 0; font-size: 0.68rem; color: var(--color-muted); line-height: 1.4; }

  .progress-track { height: 6px; background: var(--panel-inset); border: 1px solid var(--border-mid); overflow: hidden; }
  .progress-fill { height: 100%; background: var(--accent-danger); transition: width var(--t-mid); box-shadow: 0 0 10px var(--accent-danger); }

  .frag-row { display: flex; justify-content: space-between; }

  .skill-btns { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }

  .btn-sm {
    background: transparent;
    border: 1px solid var(--border-mid);
    color: var(--color-muted);
    font-family: var(--font-display);
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 3px 10px;
    cursor: pointer;
    transition: all var(--t-fast);
    position: relative;
  }
  .btn-sm::before, .btn-sm::after {
    content: ''; position: absolute;
    width: 3px; height: 3px; border: 1px solid var(--accent-danger);
  }
  .btn-sm::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .btn-sm::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

  .btn-sm:hover:not(:disabled) { border-color: var(--accent-danger); color: var(--accent-white); background: hsla(0, 100%, 50%, 0.1); }
  .btn-sm:disabled { opacity: 0.3; cursor: not-allowed; }

  .btn-sm.accent-btn {
    border-color: var(--accent-danger);
    color: var(--accent-danger);
  }
  .btn-sm.accent-btn:hover:not(:disabled) { background: hsla(0, 100%, 50%, 0.15); border-color: var(--accent-danger); color: var(--accent-white); }

  .auto-tog { display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 0.62rem; font-family: var(--font-display); font-weight: 600; letter-spacing: 0.08em; color: var(--color-muted); }
  .auto-tog input { accent-color: var(--accent-violet); }

  .locked-label {
    font-family: var(--font-display);
    font-size: 0.56rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--color-dim);
    border: 1px solid var(--border-subtle);
    padding: 3px 8px;
  }
</style>

