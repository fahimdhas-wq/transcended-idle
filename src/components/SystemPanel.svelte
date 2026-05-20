
<script lang="ts">
  import { saveSystem } from '../core/saveSystem.js';
  import { addLog } from '../ui/LogPanelState.svelte.js';
  import ConfirmationModal from './ConfirmationModal.svelte';

  let importString = $state('');
  let exportedStr = $state('');
  let lastSaveTime = $state('—');
  let showWipeModal = $state(false);

  function saveGame(): void {
    try {
      saveSystem.save();
      lastSaveTime = new Date().toLocaleTimeString();
      addLog('[SYSTEM] Game Saved Successfully!', 'system');
    } catch (e) {
      console.error(e);
      addLog('[SYSTEM] Save Failed!', 'system');
    }
  }

  function exportGame(): void {
    try {
      saveSystem.save();
      const raw = localStorage.getItem(saveSystem.getSlotStorageKey());
      if (raw) {
        exportedStr = btoa(encodeURIComponent(raw).replace(/%([0-9A-F]{2})/g, (_match: string, p1: string) => {
          return String.fromCharCode(parseInt(p1, 16));
        }));
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(exportedStr).then(() => {
            addLog('Save exported to clipboard!', 'system');
          }).catch(() => {
            addLog('Failed to copy to clipboard. Please copy manually from the box below.', 'system');
          });
        }
      } else {
        addLog('Export Failed: No save data found.', 'system');
      }
    } catch (e) {
      console.error(e);
      addLog('Export Failed! Check console for details.', 'system');
    }
  }

  function importGame(): void {
    try {
      if (!importString.trim()) {
        addLog('Please paste a save code to import.', 'system');
        return;
      }
      const decoded = decodeURIComponent(atob(importString.trim()).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      JSON.parse(decoded);
      localStorage.setItem(saveSystem.getSlotStorageKey(), decoded);
      addLog('[SYSTEM] Save imported! Reloading...', 'system');
      setTimeout(() => location.reload(), 1000);
    } catch (e) {
      console.error(e);
      addLog('Invalid save string! Make sure you copied the entire code.', 'system');
    }
  }

  function requestWipe(): void { showWipeModal = true; }
  function confirmWipe(): void { saveSystem.wipeSave(); }
  function selectAll(e: MouseEvent): void { (e.currentTarget as HTMLTextAreaElement).select(); }
</script>

<div class="system-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#9881;</div>
      <div class="header-text">
        <h2 class="transcended-text">SYSTEM DATA</h2>
        <span class="transcended-sub">SAVE AND SETTINGS</span>
      </div>
    </div>
  </div>

  <div class="save-info">
    Autosave every 15s &#183; Last save: {@html lastSaveTime}
  </div>

  <div class="btn-grid">
    <button onclick={saveGame} class="sys-btn">&#128190; SAVE</button>
    <button onclick={exportGame} class="sys-btn">&#128228; EXPORT</button>
    <button onclick={requestWipe} class="sys-btn danger">&#128465; WIPE</button>
  </div>

  <div class="import-section">
    <label class="import-label" for="import-ta">IMPORT BASE64 SAVE</label>
    <textarea
      id="import-ta"
      bind:value={importString}
      placeholder="Paste your save code here..."
    ></textarea>
    <button onclick={importGame} class="sys-btn" disabled={!importString.trim()}>&#128229; LOAD SAVE</button>
  </div>

  {#if exportedStr}
    <div class="export-box">
      <label class="import-label" for="export-ta">EXPORTED STRING</label>
      <textarea id="export-ta" readonly value={exportedStr} onclick={selectAll}></textarea>
    </div>
  {/if}
</div>

<ConfirmationModal
  bind:show={showWipeModal}
  message="Permanently delete ALL progress? This cannot be undone and the game will reload."
  onConfirm={confirmWipe}
/>

<style>
.system-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  gap: 12px;
  padding: 12px;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-icon {
  font-size: 1rem;
  color: var(--cyan);
}
.header-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}



.save-info {
  font-size: 0.6rem;
  color: var(--text-2);
  font-family: var(--font-hud);
  letter-spacing: 0.05em;
}

.btn-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.sys-btn {
  background: var(--bg-2);
  border: 1px solid var(--line);
  color: var(--text-0);
  font-family: var(--font-hud);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 10px 5px;
  cursor: pointer;
  text-align: center;
  transition: all var(--fast);
}
.sys-btn:hover:not(:disabled) {
  border-color: var(--cyan-bright);
  color: var(--cyan);
  box-shadow: 0 0 10px hsl(185 100% 55% / 0.25);
}
.sys-btn.danger {
  border-color: hsl(0 100% 60% / 0.35);
  color: var(--red);
}
.sys-btn.danger:hover {
  background: hsl(0 100% 60% / 0.1);
  border-color: var(--red);
}
.sys-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.import-section, .export-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.import-label {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--text-2);
  text-transform: uppercase;
}

textarea {
  flex: 1;
  min-height: 70px;
  background: var(--bg-0);
  border: 1px solid var(--line);
  color: var(--cyan);
  font-family: var(--font-data);
  font-size: 0.65rem;
  padding: 8px;
  resize: none;
  outline: none;
  transition: border-color var(--fast);
}
textarea:focus {
  border-color: var(--cyan-bright);
}
</style>
