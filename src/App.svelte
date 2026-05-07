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

  // Track previously unlocked tabs to detect new unlocks
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

  onMount(() => {
    startGameLoop();
  });
</script>

<div class="app-wrapper">
  <div class="cyber-app">
    <div class="header-container">
      <div class="game-title transcended-text">TRANSCENDED <span style="font-size: 0.5em; vertical-align: middle; color: var(--neon-blue);">v2.0</span></div>
    </div>

    <div class="tab-scroll-wrapper">
      <div class="tab-header">
        {#each tabs as t (t)}
          {#if isTabUnlocked(t)}
            <button
              onclick={() => { activeTab = t; newlyUnlocked.delete(t); }}
              class:active={t === activeTab}
              class:new-tab={newlyUnlocked.has(t)}
              class:desktop-hide={t === 'COMBAT'}
            >
              {t}
              {#if newlyUnlocked.has(t)}<span class="new-dot"></span>{/if}
            </button>
          {/if}
        {/each}
      </div>
      <div class="tab-fade-right"></div>
    </div>

    <div class="split-layout">
      <div class="left-pane" class:mobile-hidden={activeTab !== 'COMBAT'}>
        <div class="combat-container">
          <CombatArena />
        </div>
        <div class="bottom-row">
          <LogPanel />
        </div>
      </div>

      <div class="right-pane" class:mobile-hidden={activeTab === 'COMBAT'}>
        <div class="main-content">
          <div class="panel-container">
            {#each tabs as t}
              {#if isTabUnlocked(t) && t !== 'COMBAT'}
                <div class="panel-wrapper" class:active={t === activeTab}>
                  {#if componentMap[t]}
                    {@const Component = componentMap[t]}
                    <Component />
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<ToastNotification />
<OfflineModal />

<style>
  :global(body) {
    margin: 0; padding: 0;
    background: radial-gradient(circle at center, #050a10 0%, #000000 100%);
    color: var(--color-text);
    font-family: var(--font-data);
    overflow: hidden;
    font-size: 13px;
  }

  .app-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
  }

  .cyber-app {
    display: flex;
    flex-direction: column;
    height: 98vh;
    width: 98vw;
    max-width: 1400px;
    background: rgba(10, 10, 15, 0.85);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 190, 255, 0.2);
    border-radius: 8px;
    padding: 16px;
    box-sizing: border-box;
    gap: 12px;
    box-shadow: 0 0 40px rgba(0, 190, 255, 0.1), inset 0 0 20px rgba(0,0,0,0.8);
  }

  .header-container { text-align: center; margin-bottom: 5px; flex-shrink: 0; }
  .game-title {
    font-family: var(--font-cyber);
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: 4px;
    background: linear-gradient(90deg, var(--neon-blue), var(--neon-pink), var(--neon-gold));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-transform: uppercase;
    filter: drop-shadow(0 0 8px rgba(0, 190, 255, 0.4));
  }

  .split-layout {
    display: flex;
    flex: 1;
    gap: 16px;
    min-height: 0;
  }

  .left-pane {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 0 0 450px; /* Fixed width for combat */
  }

  .combat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-subtle);
    background: rgba(0,0,0,0.4);
    border-radius: 4px;
    overflow: hidden;
    box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
  }

  .bottom-row {
    flex: 0 0 150px;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    background: rgba(0,0,0,0.4);
    overflow: hidden;
  }

  .right-pane {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .tab-scroll-wrapper {
    position: relative;
  }

  .tab-header {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .tab-header::-webkit-scrollbar { display: none; }

  .tab-fade-right {
    position: absolute;
    right: 0; top: 0; bottom: 8px;
    width: 40px;
    background: linear-gradient(to right, transparent, rgba(10,10,15,0.9));
    pointer-events: none;
  }

  .tab-header button {
    position: relative;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    color: hsl(0, 0%, 60%);
    font-family: var(--font-cyber);
    font-size: 0.85rem;
    padding: 10px 18px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
  .tab-header button:hover {
    background: rgba(255,255,255,0.08);
    color: #fff;
  }
  .tab-header button.active {
    background: rgba(0, 190, 255, 0.15);
    color: var(--neon-blue);
    border-color: var(--neon-blue);
    box-shadow: 0 0 10px rgba(0, 190, 255, 0.2), inset 0 0 5px rgba(0, 190, 255, 0.1);
  }
  .tab-header button.new-tab {
    border-color: var(--neon-gold);
    color: var(--neon-gold);
    animation: tab-pulse 1.5s ease-in-out infinite;
  }
  @keyframes tab-pulse {
    0%, 100% { box-shadow: 0 0 4px var(--neon-gold); }
    50% { box-shadow: 0 0 12px var(--neon-gold); }
  }

  .new-dot {
    position: absolute;
    top: 4px; right: 4px;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--neon-gold);
    box-shadow: 0 0 5px var(--neon-gold);
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .panel-container {
    flex: 1;
    border: 1px solid var(--border-subtle);
    background: rgba(0,0,0,0.5);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    box-shadow: inset 0 0 30px rgba(0,0,0,0.6);
  }

  .panel-wrapper {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    display: none;
    padding: 16px;
    flex-direction: column;
    overflow-y: auto;
  }
  .panel-wrapper.active { display: flex; }

  @media (max-width: 900px) {
    .split-layout {
      flex-direction: column;
    }
    .left-pane {
      flex: 1;
      display: flex;
    }
    .right-pane {
      flex: 1;
      display: flex;
    }
    .desktop-hide { display: inline-block !important; }
    .mobile-hidden { display: none !important; }
    .cyber-app {
      height: 100vh;
      width: 100vw;
      border-radius: 0;
      border: none;
    }
  }
  @media (min-width: 901px) {
    .desktop-hide { display: none !important; }
  }
</style>
