
<script lang="ts">
  import { uiStore } from '../stores/uiStore.svelte.js';
</script>

{#if uiStore.toast}
  {#key uiStore.toast.id}
    <div class="toast toast-{uiStore.toast.type}">
      <span class="toast-icon">▸</span>
      <span class="toast-msg">{uiStore.toast.message}</span>
    </div>
  {/key}
{/if}

<style>
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-hud);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 10px 16px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  color: var(--text-0);
  z-index: 9999;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: toast-slide 0.15s ease;
  pointer-events: none;
  backdrop-filter: blur(8px);
}

.toast-icon {
  font-family: var(--font-data);
  font-size: 0.7rem;
}

.toast-msg {
  font-size: 0.6rem;
}

.toast-success {
  border-color: var(--green);
  color: var(--green);
  box-shadow: 0 0 12px hsl(145 85% 55% / 0.2);
}

.toast-warn {
  border-color: var(--gold);
  color: var(--gold);
  box-shadow: 0 0 12px hsl(45 100% 60% / 0.2);
}

.toast-danger {
  border-color: var(--red);
  color: var(--red);
  box-shadow: 0 0 12px hsl(0 100% 60% / 0.2);
}

.toast-loot {
  border-color: var(--purple);
  color: var(--purple);
  box-shadow: 0 0 12px hsl(270 100% 65% / 0.2);
}

@keyframes toast-slide {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
