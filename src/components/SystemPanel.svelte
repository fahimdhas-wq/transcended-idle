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
      const raw = localStorage.getItem('cyber_idle_save_v3');
      if (raw) {
        // Robust UTF-8 to Base64
        exportedStr = btoa(encodeURIComponent(raw).replace(/%([0-9A-F]{2})/g, (_match: string, p1: string) => {
          return String.fromCharCode(parseInt(p1, 16));
        }));
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(exportedStr).then(() => {
            addLog('Save exported to clipboard!', 'system');
          }).catch((err) => {
            console.error("Clipboard write failed: ", err);
            addLog('Failed to copy to clipboard. Please copy manually from the box below.', 'system');
          });
        } else {
            addLog('Clipboard API not available. Please copy manually from the box below.', 'system');
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
      // Robust Base64 to UTF-8
      const decoded = decodeURIComponent(atob(importString.trim()).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      JSON.parse(decoded); // Validate JSON
      localStorage.setItem('cyber_idle_save_v3', decoded);
      addLog('[SYSTEM] Save imported! Reloading...', 'system');
      setTimeout(() => location.reload(), 1000);
    } catch (e) {
      console.error(e);
      addLog('Invalid save string! Make sure you copied the entire code.', 'system');
    }
  }

  function requestWipe(): void {
    showWipeModal = true;
  }

  function confirmWipe(): void {
    saveSystem.wipeSave();
  }

  function selectAll(e: MouseEvent): void {
    (e.currentTarget as HTMLTextAreaElement).select();
  }
</script>

<div class="system-panel">
  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">⚙️</div>
      <div class="header-title-box">
        <h2 class="transcended-text">SYSTEM DATA</h2>
        <div class="header-subtitle">SAVE AND SETTINGS</div>
      </div>
    </div>
  </div>

  <div class="save-info">
    Autosave every 15s · Last save: { lastSaveTime }
  </div>

  <div class="btn-grid">
    <button onclick={saveGame} class="sys-btn">💾 SAVE</button>
    <button onclick={exportGame} class="sys-btn">📤 EXPORT</button>
    <button onclick={requestWipe} class="sys-btn danger">🗑 WIPE</button>
  </div>

  <div class="import-section">
    <label class="import-label" for="import-ta">IMPORT BASE64 SAVE:</label>
    <textarea id="import-ta" bind:value={importString} placeholder="Paste your save code here..."></textarea>
    <button onclick={importGame} class="sys-btn" disabled={!importString.trim()}>📥 LOAD SAVE</button>
  </div>

  {#if exportedStr}
    <div class="export-box">
      <label class="import-label" for="export-ta">EXPORTED STRING (copy this):</label>
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
    gap: 10px;
  }

  .save-info {
    font-size: 0.68rem;
    color: hsl(0, 0%, 40%);
  }

  .btn-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 5px;
  }

  .sys-btn {
    background: hsl(0, 0%, 10%);
    border: 1px solid hsl(0, 0%, 25%);
    color: var(--hsl-text);
    font-family: var(--font-cyber);
    font-size: 0.75rem;
    padding: 8px 5px;
    cursor: pointer;
    text-align: center;
    transition: 0.2s;
    width: 100%;
  }
  .sys-btn:hover:not(:disabled) { background: hsl(190, 50%, 15%); color: #fff; }
  .sys-btn.danger { border-color: var(--hsl-red); color: var(--hsl-red); }
  .sys-btn.danger:hover { background: hsl(0, 50%, 15%); color: #fff; }
  .sys-btn:disabled { opacity: 0.35; cursor: default; }

  .import-section, .export-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .import-label {
    font-size: 0.65rem;
    color: hsl(0, 0%, 40%);
    letter-spacing: 1px;
  }

  textarea {
    flex: 1;
    min-height: 60px;
    background: hsl(0, 0%, 5%);
    border: 1px solid hsl(0, 0%, 22%);
    color: var(--hsl-blue);
    font-family: monospace;
    font-size: 0.75rem;
    padding: 6px;
    resize: none;
    outline: none;
  }
  textarea:focus { border-color: var(--hsl-blue); }
</style>
