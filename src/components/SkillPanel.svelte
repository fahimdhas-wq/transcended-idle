
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
    if (skill.tierIndex >= tiers.length - 1) return 100;
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
      <span class="stat-value violet">◈ {totalFrags}</span>
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
          <span class="frag-count">{formatNumber(skill.fragments)} / {formatNumber(skill.fragmentsNeeded)}</span>
          <span class="frag-next">&#8594; {nextTier(skill)} &#183; x{formatNumber(Math.pow(2, skill.tierIndex + 1))} boost</span>
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
.skill-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header-icon { color: var(--purple); }
.violet { color: var(--purple); }

.skills-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-card {
  background: var(--bg-1);
  border: 1px solid var(--line);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all var(--fast);
}
.skill-card:hover {
  border-color: var(--cyan-bright);
  background: hsl(185 100% 55% / 0.04);
}

.skill-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.skill-name {
  font-family: var(--font-hud);
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--text-0);
  letter-spacing: 0.04em;
}
.skill-desc {
  margin: 0;
  font-size: 0.65rem;
  color: var(--text-2);
  line-height: 1.4;
}

.progress-track {
  height: 6px;
  background: hsl(0 0% 0% / 0.4);
  border: 1px solid var(--line);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--purple), hsl(270 100% 75%));
  transition: width var(--fast);
}

.frag-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
}
.frag-count { color: var(--text-1); font-family: var(--font-data); }
.frag-next { color: var(--text-2); font-family: var(--font-data); }

.skill-btns {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.btn-sm {
  background: var(--bg-2);
  border: 1px solid var(--line);
  color: var(--text-1);
  font-family: var(--font-hud);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  cursor: pointer;
  transition: all var(--fast);
}
.btn-sm:hover:not(:disabled) {
  border-color: var(--cyan);
  color: var(--cyan);
}
.btn-sm:disabled { opacity: 0.3; cursor: not-allowed; }

.btn-sm.accent-btn {
  border-color: var(--purple);
  color: var(--purple);
}
.btn-sm.accent-btn:hover:not(:disabled) {
  background: hsl(270 100% 65% / 0.15);
  border-color: var(--purple);
  color: var(--text-0);
}

.auto-tog {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 0.6rem;
  font-family: var(--font-hud);
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text-2);
  margin-left: 8px;
}
.auto-tog input { accent-color: var(--purple); }

.locked-label {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-2);
  border: 1px solid var(--line);
  padding: 4px 8px;
  margin-left: 8px;
}
</style>
