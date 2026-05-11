
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
  background: transparent;
  border: 1px solid var(--border-mid);
  color: var(--color-text);
  z-index: 9999;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: toast-slide 0.15s ease;
  pointer-events: none;
  backdrop-filter: blur(4px);
}
.toast::before, .toast::after {
  content: ''; position: absolute;
  width: 6px; height: 6px; border: 2px solid var(--border-mid);
}
.toast::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.toast::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.toast-bar {
  display: none;
}

.toast-success { border-color: var(--accent-green);   color: var(--accent-green);   box-shadow: 0 0 10px hsla(150, 100%, 40%, 0.2); }
.toast-success::before, .toast-success::after { border-color: var(--accent-green); }

.toast-warn    { border-color: var(--accent-warning); color: var(--accent-warning); box-shadow: 0 0 10px hsla(45, 100%, 50%, 0.2); }
.toast-warn::before, .toast-warn::after { border-color: var(--accent-warning); }

.toast-danger  { border-color: var(--accent-danger);  color: var(--accent-danger);  box-shadow: 0 0 10px hsla(0, 100%, 50%, 0.2); }
.toast-danger::before, .toast-danger::after { border-color: var(--accent-danger); }

.toast-loot    { border-color: var(--accent-violet);  color: var(--accent-violet);  box-shadow: 0 0 10px hsla(260, 100%, 60%, 0.2); }
.toast-loot::before, .toast-loot::after { border-color: var(--accent-violet); }

@keyframes toast-slide {
  from { opacity: 0; transform: translateX(-50%) translateY(6px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0);   }
}
</style>

