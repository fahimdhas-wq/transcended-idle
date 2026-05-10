
<script lang="ts">
  import { uiStore } from '../stores/uiStore.svelte.js';
</script>

{#if uiStore.toast}
  {#key uiStore.toast.id}
    <div class="toast toast-{uiStore.toast.type}">
      <span class="toast-bar"></span>
      {uiStore.toast.message}
    </div>
  {/key}
{/if}

<style>
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 9px 16px 9px 12px;
  background: var(--panel-bg);
  border: 1px solid var(--border-mid);
  border-left: 3px solid var(--accent-white);
  color: var(--color-text);
  z-index: 9999;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: toast-slide 0.15s ease;
  pointer-events: none;
}

.toast-bar {
  display: none;
}

.toast-success { border-left-color: var(--accent-green);   color: var(--accent-green);   }
.toast-warn    { border-left-color: var(--accent-warning);  color: var(--accent-warning);  }
.toast-danger  { border-left-color: var(--accent-danger);   color: var(--accent-danger);   }
.toast-loot    { border-left-color: var(--accent-violet);   color: var(--accent-violet);   }

@keyframes toast-slide {
  from { opacity: 0; transform: translateX(-50%) translateY(6px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0);   }
}
</style>

