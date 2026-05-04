<script>
  import { skillsState, tiers } from '../modules/skills.svelte.js';
  import { character } from '../modules/character.svelte.js';
  import { formatNumber } from '../systems/scalingSystem.js';

  function currentTier(skill) { return tiers[skill.tierIndex] || 'F-'; }
  function tierClass(skill) { 
    let t = currentTier(skill);
    return 'tier-' + t.replace(/\+/g, 'plus').replace(/-/g, 'minus'); 
  }
  function nextTier(skill) { return tiers[skill.tierIndex + 1] || 'MAX'; }
  function fragPct(skill) { return Math.min(100, (skill.fragments / skill.fragmentsNeeded) * 100); }

  function feed(skill, amount) {
    const needed = skill.fragmentsNeeded - skill.fragments;
    const give   = Math.min(amount, character.skillFragments.toNumber(), needed);
    if (give <= 0) return;
    character.skillFragments = character.skillFragments.sub(give);
    skill.fragments          += give;
    checkEvolve(skill);
  }

  function feedAll(skill) {
    const needed = skill.fragmentsNeeded - skill.fragments;
    const give   = Math.min(needed, character.skillFragments.toNumber());
    if (give <= 0) return;
    character.skillFragments = character.skillFragments.sub(give);
    skill.fragments          += give;
    checkEvolve(skill);
  }

  function checkEvolve(skill) {
    while (skill.fragments >= skill.fragmentsNeeded && skill.tierIndex < tiers.length - 1) {
      skill.fragments      -= skill.fragmentsNeeded;
      skill.tierIndex++;
      skill.fragmentsNeeded = Math.floor(skill.fragmentsNeeded * 2.5);
    }
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
          <button onclick={() => feedAll(skill)}   disabled={character.skillFragments.lt(1)}>MAX</button>
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