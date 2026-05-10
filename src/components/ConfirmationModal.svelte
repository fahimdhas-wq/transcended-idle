
<script lang="ts">
  let { show = $bindable(false), message = '', onConfirm = () => {} } = $props();

  function handleConfirm() {
    onConfirm();
    show = false;
  }

  function handleCancel() {
    show = false;
  }
</script>

{#if show}
  <div
    class="overlay"
    onclick={handleCancel}
    onkeydown={(e) => { if (e.key === 'Escape') handleCancel(); }}
    role="button"
    tabindex="0"
    aria-label="Close modal"
  >
    <div
      class="modal"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      tabindex="0"
      aria-modal="true"
    >
      <div class="modal-head">
        <div class="modal-icon">&#9888;</div>
        <span class="modal-title">CONFIRM ACTION</span>
      </div>
      <p class="modal-msg">{message}</p>
      <div class="modal-btns">
        <button class="btn-cancel" onclick={handleCancel}>CANCEL</button>
        <button class="btn-confirm" onclick={handleConfirm}>CONFIRM</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 8500;
  }
  .modal {
    background: var(--panel-bg);
    border: 1px solid var(--accent-warning);
    border-left: 3px solid var(--accent-warning);
    padding: 24px;
    width: 300px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .modal-head { display: flex; align-items: center; gap: 10px; }
  .modal-icon { font-size: 1.1rem; color: var(--accent-warning); }
  .modal-title {
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text);
  }
  .modal-msg {
    font-size: 0.75rem;
    color: var(--color-muted);
    line-height: 1.5;
    margin: 0;
    border-left: 2px solid var(--border-mid);
    padding-left: 10px;
  }
  .modal-btns { display: flex; gap: 8px; }
  .btn-cancel, .btn-confirm {
    flex: 1;
    padding: 8px 12px;
    font-family: var(--font-display);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: border-color var(--t-fast), color var(--t-fast), background var(--t-fast);
    text-align: center;
  }
  .btn-cancel {
    background: transparent;
    border: 1px solid var(--border-mid);
    color: var(--color-muted);
  }
  .btn-cancel:hover { border-color: var(--accent-white); color: var(--accent-white); }
  .btn-confirm {
    background: transparent;
    border: 1px solid var(--accent-warning);
    color: var(--accent-warning);
  }
  .btn-confirm:hover { background: rgba(255, 190, 0, 0.1); color: var(--accent-white); border-color: var(--accent-white); }
</style>

