<script>
  import { uiStore } from '../stores/uiStore.svelte.js';
</script>

{#if uiStore.toast}
  <div class="toast toast-{uiStore.toast.type}" key={uiStore.toast.id}>
    {uiStore.toast.message}
  </div>
{/if}

<style>
.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-cyber);
  font-size: 0.75rem;
  padding: 8px 16px;
  border-radius: 2px;
  border: 1px solid var(--neon-blue);
  background: rgba(0, 0, 0, 0.92);
  color: var(--neon-blue);
  z-index: 9999;
  white-space: nowrap;
  animation: toast-in 0.2s ease;
  pointer-events: none;
}
.toast-success { border-color: var(--neon-green); color: var(--neon-green); }
.toast-warn    { border-color: var(--neon-gold);  color: var(--neon-gold);  }
.toast-danger  { border-color: var(--neon-red);   color: var(--neon-red);   }
.toast-loot    { border-color: var(--neon-pink);  color: var(--neon-pink);  }

@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
