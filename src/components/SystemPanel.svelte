<script lang="ts">
  import { saveSystem } from '../core/saveSystem.js';
  import { addLog } from '../ui/LogPanelState.svelte.js';
  import ConfirmationModal from './ConfirmationModal.svelte';

  let importString = $state('');
  let exportedStr = $state('');
  let lastSaveTime = $state('&#8212;');
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
      const raw = localStorage.getItem('cyber_idle_save_v3');
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
      localStorage.setItem('cyber_idle_save_v3', decoded);
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
  .system-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; gap: 10px; }

  .panel-header {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-icon { font-size: 1rem; color: var(--accent-steel); }
  .header-text { display: flex; flex-direction: column; gap: 1px; }

  .save-info {
    font-size: 0.65rem;
    color: var(--color-dim);
    padding: 0 14px;
    font-family: var(--font-display);
    letter-spacing: 0.06em;
  }

  .btn-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; padding: 0 14px; }

  .sys-btn {
    background: transparent;
    border: 1px solid var(--border-mid);
    color: var(--color-text);
    font-family: var(--font-display);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 10px 5px;
    cursor: pointer;
    text-align: center;
    transition: border-color var(--t-fast), background var(--t-fast);
  }
  .sys-btn:hover:not(:disabled) { border-color: var(--accent-white); background: rgba(255,255,255,0.03); }
  .sys-btn.danger { border-color: var(--accent-danger); color: var(--accent-danger); }
  .sys-btn.danger:hover { background: rgba(255, 51, 51, 0.08); }
  .sys-btn:disabled { opacity: 0.35; cursor: default; }

  .import-section, .export-box { display: flex; flex-direction: column; gap: 6px; padding: 0 14px; flex: 1; min-height: 0; }

  .import-label {
    font-family: var(--font-display);
    font-size: 0.58rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  textarea {
    flex: 1;
    min-height: 70px;
    background: var(--panel-inset);
    border: 1px solid var(--border-subtle);
    color: var(--accent-steel);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    padding: 8px;
    resize: none;
    outline: none;
    transition: border-color var(--t-fast);
  }
  textarea:focus { border-color: var(--accent-steel); }
</style>
