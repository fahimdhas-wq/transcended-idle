
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
  height: 60px;
  flex-shrink: 0;
  padding: 0 20px;
  background: var(--bg-dark);
  border-bottom: 2px solid var(--accent-danger);
  box-shadow: 0 4px 15px hsla(0, 100%, 50%, 0.1), inset 0 -2px 10px hsla(0, 100%, 50%, 0.05);
  gap: 0;
  position: relative;
  z-index: 10;
}
/* Top decorative hardware lines */
.top-bar::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 3px;
  background: repeating-linear-gradient(90deg, transparent, transparent 10px, var(--border-mid) 10px, var(--border-mid) 12px);
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
  font-size: 1.25rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--accent-white);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
  position: relative;
}
.wordmark::after {
  content: ' ///';
  color: var(--accent-danger);
  font-style: italic;
  font-weight: 900;
  text-shadow: 0 0 8px var(--accent-danger);
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
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  height: 100%;
  padding: 0 16px;
}
.tab-nav::-webkit-scrollbar { display: none; }

.tab-btn {
  position: relative;
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-muted);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 0 24px;
  cursor: pointer;
  height: 36px;
  line-height: 34px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.tab-btn::before, .tab-btn::after {
  content: ''; position: absolute;
  width: 6px; height: 6px; border: 1px solid var(--border-mid);
  transition: border-color var(--t-fast);
}
.tab-btn::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.tab-btn::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.tab-btn:hover {
  background: hsla(0, 100%, 50%, 0.15);
  color: var(--accent-white);
  border-color: transparent;
}
.tab-btn:hover::before, .tab-btn:hover::after { border-color: var(--accent-danger); }

.tab-btn.active {
  color: #fff;
  background: hsla(0, 100%, 50%, 0.15);
  border-color: var(--accent-danger);
  box-shadow: 0 0 15px hsla(0, 100%, 50%, 0.4);
}
.tab-btn.active::before, .tab-btn.active::after { border-color: var(--accent-danger); }

.tab-btn.new-tab {
  color: var(--accent-danger);
  border-bottom-color: var(--accent-danger);
  animation: pulse-glow 2s infinite;
}

.new-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 0; /* Square for hardware look */
  background: var(--accent-danger);
  box-shadow: 0 0 6px var(--accent-danger);
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
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-green);
  box-shadow: 0 0 8px var(--accent-green);
  animation: pulse-glow 3s infinite;
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

