
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
      <span class="wordmark">TRANSCENDED</span>
      <span class="version">V2.0</span>
    </div>

    <div class="tab-nav" role="tablist">
      {#each tabs as t (t)}
        {#if isTabUnlocked(t)}
          <button
            role="tab"
            aria-selected={t === activeTab}
            class="tab-btn"
            class:active={t === activeTab}
            class:new-tab={newlyUnlocked.has(t)}
            class:desktop-hide={t === 'COMBAT'}
            onclick={() => { activeTab = t; newlyUnlocked.delete(t); }}
          >
            {t}
            {#if newlyUnlocked.has(t)}<span class="new-dot" aria-hidden="true"></span>{/if}
          </button>
        {/if}
      {/each}
    </div>

    <div class="top-bar-right">
      <span class="status-dot"></span>
      <span class="status-label">ONLINE</span>
    </div>
  </header>

  <!-- BODY -->
  <div class="body-split">

    <!-- LEFT: combat + log (always visible on desktop) -->
    <aside class="left-pane" class:mobile-hidden={activeTab !== 'COMBAT'}>
      <div class="combat-block">
        <CombatArena />
      </div>
      <div class="log-block">
        <LogPanel />
      </div>
    </aside>

    <!-- RIGHT: panel area -->
    <main class="right-pane" class:mobile-hidden={activeTab === 'COMBAT'}>
      <div class="panel-area">
        {#each tabs as t}
          {#if isTabUnlocked(t) && t !== 'COMBAT'}
            <div class="panel-slot" class:active={t === activeTab}>
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
/* ── SHELL ──────────────────────────────────── */
:global(body) {
  margin: 0; padding: 0;
  background: var(--bg-dark);
  overflow: hidden;
}

.shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--bg-dark);
}

/* ── TOP BAR ────────────────────────────────── */
.top-bar {
  display: flex;
  align-items: center;
  height: 44px;
  flex-shrink: 0;
  padding: 0 16px;
  background: var(--panel-bg);
  border-bottom: 1px solid var(--border-subtle);
  gap: 0;
  position: relative;
  z-index: 10;
}

.top-bar-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex: 0 0 auto;
  padding-right: 20px;
  border-right: 1px solid var(--border-subtle);
  margin-right: 0;
}

.wordmark {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text);
}

.version {
  font-family: var(--font-mono);
  font-size: 0.56rem;
  color: var(--color-muted);
  letter-spacing: 0.06em;
}

/* ── TAB NAV ────────────────────────────────── */
.tab-nav {
  flex: 1;
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  scrollbar-width: none;
  height: 100%;
  padding: 0 8px;
}
.tab-nav::-webkit-scrollbar { display: none; }

.tab-btn {
  position: relative;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  color: var(--color-muted);
  font-family: var(--font-display);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0 14px;
  cursor: pointer;
  height: 100%;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color var(--t-fast), border-color var(--t-fast);
}

.tab-btn:hover {
  background: transparent;
  color: var(--color-text);
  border-bottom-color: var(--border-mid);
  box-shadow: none;
}

.tab-btn.active {
  color: var(--accent-white);
  border-bottom-color: var(--accent-white);
  background: transparent;
}

.tab-btn.new-tab {
  color: var(--accent-warning);
  border-bottom-color: var(--accent-warning);
}

.new-dot {
  position: absolute;
  top: 8px;
  right: 6px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent-warning);
}

.top-bar-right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 16px;
  border-left: 1px solid var(--border-subtle);
  margin-left: 0;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
}

.status-label {
  font-family: var(--font-display);
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--color-muted);
}

/* ── BODY SPLIT ─────────────────────────────── */
.body-split {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* ── LEFT PANE ──────────────────────────────── */
.left-pane {
  flex: 0 0 420px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-subtle);
  min-height: 0;
}

.combat-block {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.log-block {
  flex: 0 0 140px;
  border-top: 1px solid var(--border-subtle);
  padding: 8px 12px;
  overflow: hidden;
}

/* ── RIGHT PANE ─────────────────────────────── */
.right-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
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
  padding: 14px;
}

.panel-slot.active {
  display: flex;
}

/* ── MOBILE ─────────────────────────────────── */
@media (max-width: 900px) {
  .body-split { flex-direction: column; }
  .left-pane  { flex: 1; border-right: none; border-bottom: 1px solid var(--border-subtle); }
  .right-pane { flex: 1; }
  .desktop-hide { display: block !important; }
  .mobile-hidden { display: none !important; }
}

@media (min-width: 901px) {
  .desktop-hide { display: none !important; }
}
</style>

