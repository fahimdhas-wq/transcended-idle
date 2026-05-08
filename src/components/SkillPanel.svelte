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
    return 'tier-' + t.replace(/\+/g, 'plus').replace(/-/g, 'minus'); 
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
    while (skill.fragments.gte(skill.fragmentsNeeded) && skill.tierIndex < tiers.length - 1) {
      skill.fragments = skill.fragments.sub(skill.fragmentsNeeded);
      skill.tierIndex++;
      skill.fragmentsNeeded = skill.fragmentsNeeded.mul(2.5).floor();
    }
    flushStatCache();
  }
</script>

<div class="skill-panel">
  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">❖</div>
      <div class="header-title-box">
        <h2 class="transcended-text">SKILLS</h2>
        <div class="header-subtitle">NEURAL UPGRADES</div>
      </div>
    </div>
    <div class="header-stats">
      <div class="header-stat-box">
        <span class="stat-label">FRAGMENTS</span>
        <span class="stat-value" style="color: var(--color-primary);">⚡ {formatNumber(character.skillFragments)}</span>
      </div>
    </div>
  </div>

  <div class="skills-list" style="padding: 10px; display: flex; flex-direction: column; gap: 8px;">
    {#each skillsState.skills as skill (skill.id)}
      <div class="skill-card">
        <div class="skill-row-top">
          <span class="skill-name">{ skill.name }</span>
          <span class="tier-badge {tierClass(skill)}">{ currentTier(skill) }</span>
        </div>

        <p class="skill-desc">{ skill.description }</p>

        <div class="progress-track">
          <div class="progress-fill" style:width="{fragPct(skill)}%"></div>
        </div>
        <div class="frag-row">
          <span class="text-xs" style="color: var(--color-muted);">{ formatNumber(skill.fragments) } / { formatNumber(skill.fragmentsNeeded) }</span>
          <span class="text-xs" style="color: var(--color-muted);">→ { nextTier(skill) } · x{ formatNumber(Math.pow(2, skill.tierIndex + 1)) } boost</span>
        </div>

        <div class="skill-btns">
          <button onclick={() => feed(skill, 1)}   disabled={character.skillFragments.lt(1)}>+1</button>
          <button onclick={() => feed(skill, 10)}  disabled={character.skillFragments.lt(10)}>+10</button>
          <button onclick={() => feed(skill, 50)}  disabled={character.skillFragments.lt(50)}>+50</button>
          <button onclick={() => feedAll(skill)}   disabled={character.skillFragments.lt(1)} style="background: rgba(0, 190, 255, 0.1); border: 1px solid var(--neon-blue); color: var(--neon-blue);">MAX</button>
          {#if skill.tierIndex > 0}
            <label class="auto-tog">
              <input type="checkbox" bind:checked={skill.autoCast} />AUTO
            </label>
          {:else}
            <span class="locked-auto">LOCKED</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .skill-panel { display: flex; flex-direction: column; min-height: 100%; }
  .skill-card { background: var(--panel-bg); border: 1px solid var(--border-subtle); padding: 8px; display: flex; flex-direction: column; gap: 5px; }
  .skill-row-top { display: flex; justify-content: space-between; align-items: center; }
  .skill-name { font-weight: bold; color: var(--color-text); }
  .skill-desc { margin: 0; font-size: 0.7rem; color: var(--color-muted); line-height: 1.4; }
  .progress-track { height: 6px; background: #000; border: 1px solid var(--border-subtle); }
  .progress-fill { height: 100%; background: var(--color-primary); }
  .frag-row { display: flex; justify-content: space-between; }
  .skill-btns { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
</style>
