
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Component } from 'svelte';
  import CombatArena       from './components/CombatArena.svelte';
  import MiningPanel       from './components/MiningPanel.svelte';
  import ForestryPanel     from './components/ForestryPanel.svelte';
  import BestiaryPanel     from './components/BestiaryPanel.svelte';
  import InventoryPanel    from './components/InventoryPanel.svelte';
  import SkillPanel        from './components/SkillPanel.svelte';
  import SealsPanel        from './components/SealsPanel.svelte';
  import AchievementsPanel from './components/AchievementsPanel.svelte';
  import SystemPanel       from './components/SystemPanel.svelte';
  import CharacterPanel    from './components/CharacterPanel.svelte';
  import OverclockPanel    from './components/OverclockPanel.svelte';
  import MatrixPanel       from './components/MatrixPanel.svelte';
  // import LogPanel          from './components/LogPanel.svelte';
  import ToastNotification from './components/ToastNotification.svelte';
  import OfflineModal      from './components/OfflineModal.svelte';
  import { startGameLoop } from './core/gameLoop.svelte.js';
  import { character }     from './modules/character.svelte.js';
  import { overclockState } from './modules/overclockState.svelte.js';
  import DailyChallenge    from './components/DailyChallenge.svelte';
  import AscensionPanel    from './components/AscensionPanel.svelte';
  import { formatValue } from './systems/formatValue.js';

  const allTabs = ['COMBAT', 'CHARACTER', 'MINING', 'FORESTRY', 'BESTIARY', 'INVENTORY', 'SKILLS', 'SEALS', 'ACHIEVE', 'DAILY', 'ASCENSION', 'OVERCLOCK', 'MATRIX', 'SYSTEM'] as const;
  type Tab = typeof allTabs[number];

  const componentMap: Record<Tab, Component> = {
    'COMBAT':     CombatArena,
    'CHARACTER':  CharacterPanel,
    'MINING':     MiningPanel,
    'FORESTRY':   ForestryPanel,
    'BESTIARY':   BestiaryPanel,
    'INVENTORY':  InventoryPanel,
    'SKILLS':     SkillPanel,
    'SEALS':      SealsPanel,
    'ACHIEVE':    AchievementsPanel,
    'DAILY':      DailyChallenge,
    'ASCENSION':  AscensionPanel,
    'SYSTEM':     SystemPanel,
    'OVERCLOCK':  OverclockPanel,
    'MATRIX':     MatrixPanel
  };

  const bottomTabs: Tab[] = ['CHARACTER', 'SKILLS', 'INVENTORY', 'SEALS', 'ALL'];

  let activeView = $state<string>('CHARACTER');

  function isTab(t: string): t is Tab {
    return allTabs.includes(t as Tab);
  }

  function isTabUnlocked(tab: Tab): boolean {
    const oc = overclockState.timesOverclocked > 0;
    if (tab === 'MINING')    return character.level.gte(100) || oc;
    if (tab === 'FORESTRY')  return character.level.gte(200) || oc;
    if (tab === 'OVERCLOCK') return character.level.gte(100) || oc;
    if (tab === 'MATRIX')    return character.level.gte(500) || character.statsUnlocked || oc;
    return true;
  }

  let prevUnlocked = $state(new Set<Tab>(['COMBAT', 'CHARACTER', 'BESTIARY', 'INVENTORY', 'SKILLS', 'SEALS', 'ACHIEVE', 'DAILY', 'SYSTEM']));
  let newlyUnlocked = $state(new Set<Tab>());

  $effect(() => {
    allTabs.forEach(t => {
      if (isTabUnlocked(t) && !prevUnlocked.has(t)) {
        newlyUnlocked.add(t);
        prevUnlocked.add(t);
        setTimeout(() => newlyUnlocked.delete(t), 5000);
      }
    });
  });

  onMount(() => { startGameLoop(); });

  function switchTab(t: Tab | 'ALL') {
    activeView = t;
  }
</script>

<div class="shell">
  <!-- TOP BAR -->
  <header class="top-bar">
    <div class="top-left"></div>
    <div class="top-center">
      <span class="logo">
        <span class="logo-bracket">[</span>
        TRANSCENDED
        <span class="logo-bracket">]</span>
      </span>
    </div>
    <div class="top-right">
      <span class="status-indicator"></span>
    </div>
  </header>

  <!-- COMBAT STRIP -->
  <div class="combat-strip">
    <div class="combat-inner">
      <CombatArena compact />
    </div>
  </div>

  <!-- PANEL CONTENT -->
  <main class="panel-content">
    {#if activeView === 'ALL'}
      <div class="all-grid">
        <div class="all-grid-inner">
          {#each allTabs as t}
            {#if isTabUnlocked(t) && t !== 'COMBAT' && !bottomTabs.includes(t)}
              <button class="all-btn" onclick={() => { activeView = t; }}>
                {t}
              </button>
            {/if}
          {/each}
        </div>
      </div>
    {:else}
      {#each allTabs as t}
        {#if isTabUnlocked(t) && t !== 'COMBAT' && t === activeView}
          <div class="panel-slot active">
            {#if componentMap[t]}
              {@const C = componentMap[t]}
              <C />
            {/if}
          </div>
        {/if}
      {/each}
    {/if}
  </main>

  <!-- BOTTOM TAB BAR -->
  <nav class="bottom-nav">
    {#each bottomTabs as t (t)}
      <button
        class="nav-btn"
        class:active={(t === 'ALL' && activeView === 'ALL') || (t !== 'ALL' && t === activeView)}
        onclick={() => switchTab(t)}
      >
        <span class="nav-label">{t}</span>
      </button>
    {/each}
  </nav>
</div>

<ToastNotification />
<OfflineModal />

<style>
.shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--bg-void);
}

@media (min-width: 901px) {
  .shell {
    width: min(100vw, 100vh * 9 / 16);
    aspect-ratio: 9 / 16;
    height: auto;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   TOP BAR — Compact
══════════════════════════════════════════════════════════════════ */

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 12px;
  background: linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%);
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
  position: relative;
}

.top-bar::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--cyan) 20%, var(--cyan) 80%, transparent 100%);
  box-shadow: 0 0 10px var(--cyan);
  pointer-events: none;
}

.top-left {
  flex: 1;
}

.top-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.logo {
  font-family: var(--font-hud);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-0);
  display: flex;
  align-items: center;
  gap: 1px;
}

.logo-bracket {
  color: var(--cyan);
  text-shadow: 0 0 6px var(--cyan);
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px var(--green);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--green); }
  50% { opacity: 0.6; box-shadow: 0 0 3px var(--green); }
}

/* ═══════════════════════════════════════════════════════════════════
   COMBAT STRIP — Always visible at top
══════════════════════════════════════════════════════════════════ */

.combat-strip {
  flex-shrink: 0;
  border-bottom: 1px solid var(--line);
  background:
    radial-gradient(ellipse 60% 60% at 50% 50%, hsl(185 100% 60% / 0.03) 0%, transparent 70%);
}

.combat-inner {
  padding: 8px 12px;
}

/* ═══════════════════════════════════════════════════════════════════
   PANEL CONTENT
══════════════════════════════════════════════════════════════════ */

.panel-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.panel-slot {
  position: absolute;
  inset: 0;
  display: none;
  flex-direction: column;
  overflow-y: auto;
}

.panel-slot.active {
  display: flex;
}

/* ═══════════════════════════════════════════════════════════════════
   BOTTOM NAV
══════════════════════════════════════════════════════════════════ */

.bottom-nav {
  display: flex;
  align-items: stretch;
  height: 52px;
  background: linear-gradient(0deg, var(--bg-2) 0%, var(--bg-1) 100%);
  border-top: 1px solid var(--line);
  flex-shrink: 0;
  position: relative;
}

.bottom-nav::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--cyan) 20%, var(--cyan) 80%, transparent 100%);
  box-shadow: 0 0 8px var(--cyan);
  pointer-events: none;
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  background: transparent;
  border: none;
  color: var(--text-2);
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 6px 4px;
  transition: all var(--fast);
  position: relative;
}

.nav-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: var(--cyan);
  box-shadow: 0 0 6px var(--cyan);
  transition: width var(--fast);
}

.nav-btn:hover {
  color: var(--text-1);
  background: hsl(185 100% 55% / 0.04);
}

.nav-btn.active {
  color: var(--cyan);
  background: linear-gradient(0deg, hsl(185 100% 55% / 0.1), transparent);
}

.nav-btn.active::before {
  width: 60%;
}

/* ═══════════════════════════════════════════════════════════════════
   ALL PANEL GRID
══════════════════════════════════════════════════════════════════ */

.all-grid {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.all-grid-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 16px;
}

.all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 12px;
  background: var(--bg-1);
  border: 1px solid var(--line);
  border-radius: var(--r);
  color: var(--text-0);
  font-family: var(--font-hud);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all var(--fast);
  position: relative;
  overflow: hidden;
}

.all-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--cyan), var(--pink));
  opacity: 0;
  transition: opacity var(--fast);
}

.all-btn:hover {
  border-color: var(--cyan-bright);
  color: var(--cyan);
  box-shadow: 0 0 12px hsl(185 100% 55% / 0.2);
}

.all-btn:hover::before {
  opacity: 1;
}

</style>
