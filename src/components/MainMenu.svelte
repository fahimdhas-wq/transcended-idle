<script lang="ts">
  import { saveSystem, type SlotInfo } from '../core/saveSystem.js';
  import { settingsState, loadSettings, applyTheme, setTheme, setSound, setAnimations, setOfflineEfficiency } from '../modules/settings.svelte.js';
  import { onMount } from 'svelte';

  let { onEnterGame }: { onEnterGame: (slot: number, newGame?: boolean) => void } = $props();

  const { getCurrentSlot, getAllSlots, hasSlotData } = saveSystem;

  let menuView = $state<'main' | 'load' | 'settings' | 'newGame'>('main');
  let slots = $state<SlotInfo[]>([]);
  let slotToDelete = $state<number | null>(null);
  let deleteConfirmText = $state('');
  let showDeleteConfirm = $state(false);

  onMount(() => {
    slots = saveSystem.getAllSlots();
    loadSettings();
    applyTheme(settingsState.theme);
  });

  function continueGame() {
    const slot = getCurrentSlot();
    if (hasSlotData(slot)) {
      onEnterGame(slot);
    } else {
      for (let i = 0; i < saveSystem.SLOT_COUNT; i++) {
        if (hasSlotData(i)) {
          onEnterGame(i);
          return;
        }
      }
      onEnterGame(0);
    }
  }

  function loadSlot(slot: number) {
    if (hasSlotData(slot)) {
      onEnterGame(slot);
    }
  }

  function newGame() {
    menuView = 'newGame';
  }

  function confirmNewGame(slot: number) {
    onEnterGame(slot, true);
  }

  function backToMain() {
    menuView = 'main';
    slotToDelete = null;
    showDeleteConfirm = false;
  }

  function openLoad() {
    slots = saveSystem.getAllSlots();
    menuView = 'load';
  }

  function openSettings() {
    menuView = 'settings';
  }

  function requestDeleteSlot(slot: number) {
    slotToDelete = slot;
    showDeleteConfirm = true;
    deleteConfirmText = '';
  }

  function confirmDelete() {
    if (slotToDelete !== null && deleteConfirmText === 'DELETE') {
      saveSystem.wipeSave(slotToDelete);
      slots = saveSystem.getAllSlots();
      showDeleteConfirm = false;
      slotToDelete = null;
      deleteConfirmText = '';
    }
  }

  function cancelDelete() {
    showDeleteConfirm = false;
    slotToDelete = null;
    deleteConfirmText = '';
  }

  function formatTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  }

  function formatDate(ts: number): string {
    if (!ts) return '--';
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="menu-shell">
  <div class="scanlines"></div>

  <div class="menu-content">
    <!-- Title -->
    <div class="title-block">
      <div class="title-overline">// SYSTEM BOOT //</div>
      <h1 class="title-main">
        <span class="t-bracket">[</span>
        IDLE RPG
        <span class="t-bracket">]</span>
      </h1>
      <div class="title-sub">CYBERPUNK IDLE EVOLUTION</div>
      <div class="title-divider"></div>
    </div>

    <!-- Main Menu Buttons -->
    {#if menuView === 'main'}
      <div class="menu-buttons">
        <button class="menu-btn primary" onclick={continueGame}>
          <span class="btn-key">▶</span>
          <span class="btn-label">CONTINUE</span>
        </button>

        <button class="menu-btn" onclick={newGame}>
          <span class="btn-key">+</span>
          <span class="btn-label">NEW GAME</span>
        </button>

        <button class="menu-btn" onclick={openLoad}>
          <span class="btn-key">≡</span>
          <span class="btn-label">LOAD</span>
        </button>

        <button class="menu-btn" onclick={openSettings}>
          <span class="btn-key">⚙</span>
          <span class="btn-label">SETTINGS</span>
        </button>
      </div>

      <div class="version-text">v3.0 // ALL SYSTEMS NOMINAL</div>

    <!-- Load Screen -->
    {:else if menuView === 'load'}
      <div class="sub-header">
        <button class="back-btn" onclick={backToMain}>← BACK</button>
        <span class="sub-title">LOAD / MANAGE SAVES</span>
      </div>
      <div class="slot-grid">
        {#each slots as slot, i}
          <div class="slot-card" class:occupied={slot.saved}>
            <div class="slot-header">
              <span class="slot-number">SLOT {i + 1}</span>
              {#if slot.saved}
                <span class="slot-status online">ONLINE</span>
              {:else}
                <span class="slot-status empty">EMPTY</span>
              {/if}
            </div>
            {#if slot.saved}
              <div class="slot-stats">
                <div class="ss-row"><span class="ss-label">LEVEL</span><span class="ss-val">{Math.floor(slot.level)}</span></div>
                <div class="ss-row"><span class="ss-label">KILLS</span><span class="ss-val">{Math.floor(slot.kills)}</span></div>
                <div class="ss-row"><span class="ss-label">PLAY TIME</span><span class="ss-val">{formatTime(slot.totalPlayTime)}</span></div>
                <div class="ss-row"><span class="ss-label">TIER</span><span class="ss-val">{slot.ascensionTier}</span></div>
                <div class="ss-row"><span class="ss-label">SAVED</span><span class="ss-val">{formatDate(slot.lastSaved)}</span></div>
              </div>
              <div class="slot-actions">
                <button class="slot-btn load" onclick={() => loadSlot(i)}>LOAD</button>
                <button class="slot-btn delete" onclick={() => requestDeleteSlot(i)}>DELETE</button>
              </div>
            {:else}
              <div class="slot-empty-msg">NO DATA</div>
              <button class="slot-btn load" onclick={() => confirmNewGame(i)}>NEW GAME</button>
            {/if}
          </div>
        {/each}
      </div>

    <!-- Settings Screen -->
    {:else if menuView === 'settings'}
      <div class="sub-header">
        <button class="back-btn" onclick={backToMain}>← BACK</button>
        <span class="sub-title">SETTINGS</span>
      </div>
      <div class="settings-panel">
        <label class="setting-row">
          <span class="setting-label">THEME</span>
          <select bind:value={settingsState.theme} onchange={() => setTheme(settingsState.theme)}>
            <option value="dark">Dark (Default)</option>
            <option value="light">Light</option>
            <option value="cyber">Cyber</option>
          </select>
        </label>

        <label class="setting-row">
          <span class="setting-label">SOUND</span>
          <button class="toggle-btn" class:active={settingsState.sound} onclick={() => setSound(!settingsState.sound)}>
            {settingsState.sound ? 'ON' : 'OFF'}
          </button>
        </label>

        <label class="setting-row">
          <span class="setting-label">ANIMATIONS</span>
          <button class="toggle-btn" class:active={settingsState.animations} onclick={() => setAnimations(!settingsState.animations)}>
            {settingsState.animations ? 'ON' : 'OFF'}
          </button>
        </label>

        <label class="setting-row">
          <span class="setting-label">OFFLINE EFFICIENCY</span>
          <div class="slider-group">
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settingsState.offlineEfficiency}
              oninput={(e) => setOfflineEfficiency(parseFloat((e.target as HTMLInputElement).value))}
            />
            <span class="slider-val">{(settingsState.offlineEfficiency * 100).toFixed(0)}%</span>
          </div>
        </label>
      </div>

    <!-- New Game Confirm -->
    {:else if menuView === 'newGame'}
      <div class="sub-header">
        <button class="back-btn" onclick={backToMain}>← BACK</button>
        <span class="sub-title">SELECT SLOT</span>
      </div>
      <div class="slot-grid">
        {#each slots as slot, i}
          <div class="slot-card" class:occupied={slot.saved}>
            <div class="slot-header">
              <span class="slot-number">SLOT {i + 1}</span>
              {#if slot.saved}
                <span class="slot-status warning">WILL OVERWRITE</span>
              {:else}
                <span class="slot-status empty">EMPTY</span>
              {/if}
            </div>
            {#if slot.saved}
              <div class="slot-stats">
                <div class="ss-row"><span class="ss-label">LEVEL</span><span class="ss-val">{Math.floor(slot.level)}</span></div>
                <div class="ss-row"><span class="ss-label">KILLS</span><span class="ss-val">{Math.floor(slot.kills)}</span></div>
                <div class="ss-row"><span class="ss-label">PLAY TIME</span><span class="ss-val">{formatTime(slot.totalPlayTime)}</span></div>
                <div class="ss-row"><span class="ss-label">SAVED</span><span class="ss-val">{formatDate(slot.lastSaved)}</span></div>
              </div>
            {:else}
              <div class="slot-empty-msg">EMPTY</div>
            {/if}
            <button class="slot-btn new" onclick={() => confirmNewGame(i)}>
              {slot.saved ? 'OVERWRITE' : 'START'}
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Delete Confirmation Modal -->
  {#if showDeleteConfirm}
    <div class="modal-overlay">
      <div class="modal-box">
        <div class="modal-title">DELETE SAVE</div>
        <p class="modal-text">Type DELETE to confirm deletion of Slot {slotToDelete !== null ? slotToDelete + 1 : ''}</p>
        <input class="delete-input" type="text" bind:value={deleteConfirmText} placeholder="type DELETE" />
        <div class="modal-actions">
          <button class="modal-btn cancel" onclick={cancelDelete}>CANCEL</button>
          <button class="modal-btn confirm" disabled={deleteConfirmText !== 'DELETE'} onclick={confirmDelete}>DELETE</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
.menu-shell {
  position: fixed;
  inset: 0;
  background: var(--bg-void, #0a0a0f);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow-y: auto;
}

.scanlines {
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.015) 2px,
    rgba(255, 255, 255, 0.015) 4px
  );
  pointer-events: none;
  z-index: 10000;
}

.menu-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 32px 16px;
  min-width: 320px;
  max-width: 480px;
  width: 100%;
  position: relative;
  z-index: 1;
}

.title-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.title-overline {
  font-family: var(--font-hud, monospace);
  font-size: 0.55rem;
  letter-spacing: 0.25em;
  color: var(--cyan, #0ff);
  opacity: 0.6;
}

.title-main {
  font-family: var(--font-data, monospace);
  font-size: 2.4rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: var(--text-0, #fff);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  text-shadow: 0 0 20px var(--cyan, #0ff), 0 0 60px var(--cyan, 0ff / 0.3);
}

.t-bracket {
  color: var(--cyan, #0ff);
  text-shadow: 0 0 10px var(--cyan, #0ff);
  font-size: 1.6rem;
}

.title-sub {
  font-family: var(--font-hud, monospace);
  font-size: 0.5rem;
  letter-spacing: 0.3em;
  color: var(--text-2, #888);
}

.title-divider {
  width: 120px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--cyan, #0ff), transparent);
  margin-top: 4px;
  box-shadow: 0 0 6px var(--cyan, #0ff);
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 300px;
}

.menu-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: var(--bg-1, #111);
  border: 1px solid var(--line, #333);
  color: var(--text-0, #fff);
  font-family: var(--font-hud, monospace);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
  overflow: hidden;
}

.menu-btn::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--cyan, #0ff);
  box-shadow: 0 0 6px var(--cyan, #0ff);
  opacity: 0;
  transition: opacity 0.15s;
}

.menu-btn:hover {
  border-color: var(--cyan, #0ff);
  background: hsl(185 100% 55% / 0.05);
  box-shadow: 0 0 12px hsl(185 100% 55% / 0.15);
}

.menu-btn:hover::before {
  opacity: 1;
}

.menu-btn.primary {
  border-color: var(--cyan, #0ff);
}

.btn-key {
  width: 20px;
  text-align: center;
  color: var(--cyan, #0ff);
  font-size: 0.85rem;
}

.btn-label {
  flex: 1;
}

.version-text {
  font-family: var(--font-hud, monospace);
  font-size: 0.45rem;
  color: var(--text-2, #555);
  letter-spacing: 0.15em;
}

/* Sub header */
.sub-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: transparent;
  border: 1px solid var(--line, #333);
  color: var(--cyan, #0ff);
  font-family: var(--font-hud, monospace);
  font-size: 0.55rem;
  font-weight: 700;
  padding: 6px 12px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.15s;
}

.back-btn:hover {
  border-color: var(--cyan, #0ff);
  box-shadow: 0 0 6px hsl(185 100% 55% / 0.2);
}

.sub-title {
  font-family: var(--font-hud, monospace);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--text-2, #888);
}

/* Slot grid */
.slot-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.slot-card {
  background: var(--bg-1, #111);
  border: 1px solid var(--line, #333);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

.slot-card.occupied {
  border-color: hsl(185 100% 55% / 0.25);
}

.slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slot-number {
  font-family: var(--font-hud, monospace);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-1, #ccc);
}

.slot-status {
  font-family: var(--font-hud, monospace);
  font-size: 0.45rem;
  letter-spacing: 0.12em;
  padding: 2px 8px;
}

.slot-status.online { color: var(--green, #0f0); border: 1px solid var(--green, #0f0); }
.slot-status.empty { color: var(--text-2, #666); border: 1px solid var(--text-2, #666); }
.slot-status.warning { color: var(--red, #f00); border: 1px solid var(--red, #f00); }

.slot-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.ss-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 6px;
  background: var(--bg-2, #0d0d14);
}

.ss-label {
  font-family: var(--font-hud, monospace);
  font-size: 0.45rem;
  color: var(--text-2, #888);
  letter-spacing: 0.1em;
}

.ss-val {
  font-family: var(--font-data, monospace);
  font-size: 0.5rem;
  color: var(--text-0, #fff);
  font-weight: 600;
}

.slot-empty-msg {
  font-family: var(--font-hud, monospace);
  font-size: 0.5rem;
  color: var(--text-2, #666);
  letter-spacing: 0.12em;
  text-align: center;
  padding: 8px;
}

.slot-actions {
  display: flex;
  gap: 8px;
}

.slot-btn {
  flex: 1;
  padding: 8px;
  font-family: var(--font-hud, monospace);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid var(--line, #333);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.slot-btn.load {
  color: var(--cyan, #0ff);
  border-color: var(--cyan, #0ff);
}

.slot-btn.load:hover {
  background: hsl(185 100% 55% / 0.1);
  box-shadow: 0 0 8px hsl(185 100% 55% / 0.2);
}

.slot-btn.delete {
  color: var(--red, #f00);
  border-color: var(--red, #f00);
}

.slot-btn.delete:hover {
  background: hsl(0 100% 60% / 0.1);
  box-shadow: 0 0 8px hsl(0 100% 60% / 0.2);
}

.slot-btn.new {
  color: var(--green, #0f0);
  border-color: var(--green, #0f0);
}

.slot-btn.new:hover {
  background: hsl(120 100% 50% / 0.1);
  box-shadow: 0 0 8px hsl(120 100% 50% / 0.2);
}

/* Settings */
.settings-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-1, #111);
  border: 1px solid var(--line, #333);
  cursor: pointer;
}

.setting-label {
  font-family: var(--font-hud, monospace);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-1, #ccc);
}

.setting-row select {
  background: var(--bg-2, #0d0d14);
  border: 1px solid var(--line, #333);
  color: var(--text-0, #fff);
  font-family: var(--font-hud, monospace);
  font-size: 0.5rem;
  padding: 4px 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.toggle-btn {
  background: transparent;
  border: 1px solid var(--line, #333);
  color: var(--text-2, #888);
  font-family: var(--font-hud, monospace);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 4px 14px;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 50px;
}

.toggle-btn.active {
  color: var(--green, #0f0);
  border-color: var(--green, #0f0);
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-group input[type="range"] {
  width: 100px;
  accent-color: var(--cyan, #0ff);
  cursor: pointer;
}

.slider-val {
  font-family: var(--font-data, monospace);
  font-size: 0.55rem;
  color: var(--cyan, #0ff);
  min-width: 36px;
  text-align: right;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.modal-box {
  background: var(--bg-1, #111);
  border: 1px solid var(--red, #f00);
  padding: 24px;
  width: 300px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-title {
  font-family: var(--font-hud, monospace);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--red, #f00);
  text-align: center;
}

.modal-text {
  font-family: var(--font-hud, monospace);
  font-size: 0.5rem;
  color: var(--text-2, #888);
  text-align: center;
  margin: 0;
}

.delete-input {
  background: var(--bg-2, #0d0d14);
  border: 1px solid var(--line, #333);
  color: var(--text-0, #fff);
  font-family: var(--font-hud, monospace);
  font-size: 0.6rem;
  text-align: center;
  padding: 8px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.modal-btn {
  flex: 1;
  padding: 10px;
  font-family: var(--font-hud, monospace);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid var(--line, #333);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.modal-btn.cancel {
  color: var(--text-2, #888);
}

.modal-btn.cancel:hover {
  border-color: var(--cyan, #0ff);
  color: var(--cyan, #0ff);
}

.modal-btn.confirm {
  color: var(--red, #f00);
  border-color: var(--red, #f00);
}

.modal-btn.confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-btn.confirm:not(:disabled):hover {
  background: hsl(0 100% 60% / 0.1);
  box-shadow: 0 0 8px hsl(0 100% 60% / 0.2);
}
</style>
