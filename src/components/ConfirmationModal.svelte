
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
    background: var(--bg-1);
    border: 1px solid var(--line);
    padding: 24px;
    width: 300px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: relative;
  }
  .modal::before, .modal::after {
    content: ''; position: absolute;
    width: 10px; height: 10px; border: 2px solid var(--red);
  }
  .modal::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .modal::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }
  .modal-head { display: flex; align-items: center; gap: 10px; }
  .modal-icon { font-size: 1.1rem; color: var(--red); }
  .modal-title {
    font-family: var(--font-hud);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-0);
  }
  .modal-msg {
    font-size: 0.75rem;
    color: var(--text-2);
    line-height: 1.5;
    margin: 0;
    border-left: 2px solid var(--line);
    padding-left: 10px;
  }
  .modal-btns { display: flex; gap: 8px; }
  .btn-cancel, .btn-confirm {
    flex: 1;
    padding: 8px 12px;
    font-family: var(--font-hud);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: border-color var(--fast), color var(--fast), background var(--fast);
    text-align: center;
  }
  .btn-cancel {
    background: transparent;
    border: 1px solid var(--line);
    color: var(--text-2);
  }
  .btn-cancel:hover { border-color: var(--red); color: var(--text-0); }
  .btn-confirm {
    background: transparent;
    border: 1px solid var(--red);
    color: var(--red);
    position: relative;
  }
  .btn-confirm::before, .btn-confirm::after {
    content: ''; position: absolute;
    width: 4px; height: 4px; border: 1px solid var(--red);
  }
  .btn-confirm::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .btn-confirm::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

  .btn-confirm:hover { background: hsl(0 100% 60% / 0.1); color: var(--text-0); box-shadow: 0 0 10px hsl(0 100% 60% / 0.4); }
</style>

