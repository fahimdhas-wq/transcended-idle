
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
  import LogPanel          from './components/LogPanel.svelte';
  import ToastNotification from './components/ToastNotification.svelte';
  import OfflineModal      from './components/OfflineModal.svelte';
  import { startGameLoop } from './core/gameLoop.svelte.js';
  import { character }     from './modules/character.svelte.js';
  import { overclockState } from './modules/overclockState.svelte.js';

  const tabs = ['COMBAT', 'CHARACTER', 'MINING', 'FORESTRY', 'BESTIARY', 'INVENTORY', 'SKILLS', 'SEALS', 'ACHIEVE', 'OVERCLOCK', 'MATRIX', 'SYSTEM'] as const;
  type Tab = typeof tabs[number];

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
    'SYSTEM':     SystemPanel,
    'OVERCLOCK':  OverclockPanel,
    'MATRIX':     MatrixPanel
  };

  let activeTab = $state<Tab>('CHARACTER');

  function isTabUnlocked(tab: Tab): boolean {
    const oc = overclockState.timesOverclocked > 0;
    if (tab === 'MINING')    return character.level.gte(100) || oc;
    if (tab === 'FORESTRY')  return character.level.gte(200) || oc;
    if (tab === 'OVERCLOCK') return character.level.gte(100) || oc;
    if (tab === 'MATRIX')    return character.level.gte(500) || character.statsUnlocked || oc;
    return true;
  }

  let prevUnlocked = $state(new Set<Tab>(['COMBAT', 'CHARACTER', 'BESTIARY', 'INVENTORY', 'SKILLS', 'SEALS', 'ACHIEVE', 'SYSTEM']));
  let newlyUnlocked = $state(new Set<Tab>());

  $effect(() => {
    tabs.forEach(t => {
      if (isTabUnlocked(t) && !prevUnlocked.has(t)) {
        newlyUnlocked.add(t);
        prevUnlocked.add(t);
        setTimeout(() => newlyUnlocked.delete(t), 5000);
      }
    });
  });

  onMount(() => { startGameLoop(); });
</script>

<div class="shell">
  <!-- TOP BAR -->
  <header class="top-bar">
    <div class="top-bar-left">
      <span class="logo">
        <span class="logo-bracket">[</span>
        TRANSCENDED
        <span class="logo-bracket">]</span>
      </span>
      <span class="version">v2.0</span>
    </div>

    <nav class="tab-nav" role="tablist" aria-label="Main navigation">
      {#each tabs as t (t)}
        {#if isTabUnlocked(t)}
          <button
            role="tab"
            aria-selected={t === activeTab}
            class="tab-btn"
            class:active={t === activeTab}
            class:desktop-hide={t === 'COMBAT'}
            onclick={() => { activeTab = t; }}
          >
            <span class="tab-text">{t}</span>
            <span class="tab-line"></span>
          </button>
        {/if}
      {/each}
    </nav>

    <div class="top-bar-right">
      <span class="status-indicator"></span>
      <span class="status-text">SYS.ONLINE</span>
    </div>
  </header>

  <!-- BODY -->
  <div class="body-split">
    <aside class="left-pane" class:mobile-hidden={activeTab !== 'COMBAT'}>
      <div class="combat-block panel">
        <CombatArena />
      </div>
      <div class="log-block panel">
        <LogPanel />
      </div>
    </aside>

    <main class="right-pane" class:mobile-hidden={activeTab === 'COMBAT'}>
      <div class="panel-area">
        {#each tabs as t}
          {#if isTabUnlocked(t) && t !== 'COMBAT'}
            <div class="panel-slot panel" class:active={t === activeTab}>
              {#if componentMap[t]}
                {@const C = componentMap[t]}
                <C />
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </main>
  </div>
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

/* ═══════════════════════════════════════════════════════════════════
   TOP BAR — Command Bar
══════════════════════════════════════════════════════════════════ */

.top-bar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  background: linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%);
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
  position: relative;
}

/* Glowing bottom line */
.top-bar::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--cyan) 20%,
    var(--cyan) 80%,
    transparent 100%
  );
  box-shadow: 0 0 10px var(--cyan);
}

/* LEFT */
.top-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  padding-right: 16px;
  border-right: 1px solid var(--line);
}

.logo {
  font-family: var(--font-hud);
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-0);
  display: flex;
  align-items: center;
  gap: 2px;
}

.logo-bracket {
  color: var(--cyan);
  text-shadow: 0 0 8px var(--cyan);
}

.version {
  font-family: var(--font-data);
  font-size: 0.5rem;
  color: var(--text-2);
  padding: 2px 6px;
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: 2px;
}

/* TAB NAV */
.tab-nav {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  height: 100%;
  padding: 0 16px;
}

.tab-nav::-webkit-scrollbar { display: none; }

.tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: none;
  border-radius: 0;
  color: var(--text-2);
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 8px 14px;
  cursor: pointer;
  height: 100%;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all var(--fast);
  position: relative;
}

.tab-text {
  position: relative;
  z-index: 1;
}

.tab-line {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: var(--cyan);
  box-shadow: 0 0 8px var(--cyan);
  transition: width var(--fast);
}

.tab-btn:hover {
  color: var(--text-0);
}

.tab-btn.active {
  color: var(--cyan);
  background: linear-gradient(180deg, transparent, hsl(185 100% 55% / 0.08));
}

.tab-btn.active .tab-line {
  width: 80%;
}

/* RIGHT */
.top-bar-right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 16px;
  border-left: 1px solid var(--line);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 8px var(--green);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--green); }
  50% { opacity: 0.7; box-shadow: 0 0 4px var(--green); }
}

.status-text {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--text-2);
  text-transform: uppercase;
}

/* ═══════════════════════════════════════════════════════════════════
   BODY
══════════════════════════════════════════════════════════════════ */

.body-split {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* LEFT PANE */
.left-pane {
  flex: 0 0 380px;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 12px;
  min-height: 0;
}

.combat-block {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.log-block {
  flex: 0 0 150px;
}

/* RIGHT PANE */
.right-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 12px 12px 0;
}

.panel-area {
  flex: 1;
  position: relative;
  overflow: hidden;
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
   MOBILE
══════════════════════════════════════════════════════════════════ */

@media (max-width: 900px) {
  .body-split { flex-direction: column; }
  .left-pane { flex: 1; border-right: none; border-bottom: 1px solid var(--line); }
  .right-pane { flex: 1; }
  .desktop-hide { display: block !important; }
  .mobile-hidden { display: none !important; }
}

@media (min-width: 901px) {
  .desktop-hide { display: none !important; }
}
</style>
