<script>
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
  <div class="overlay" onclick={handleCancel}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-title transcended-text">CONFIRM ACTION</div>
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
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 8500;
}
.modal {
  background: var(--panel-bg);
  border: 1px solid var(--neon-blue);
  padding: 20px;
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 0 25px rgba(0,190,255,0.3);
}
.modal-title { font-size: 0.9rem; text-align: center; }
.modal-msg { font-size: 0.75rem; color: var(--color-text); line-height: 1.5; margin: 0; text-align: center; }
.modal-btns { display: flex; gap: 8px; }
.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 8px;
  font-family: var(--font-cyber);
  font-size: 0.7rem;
  cursor: pointer;
  transition: 0.15s;
}
.btn-cancel {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-subtle);
  color: var(--color-muted);
}
.btn-cancel:hover { border-color: var(--color-text); color: var(--color-text); }
.btn-confirm {
  background: rgba(0,190,255,0.1);
  border: 1px solid var(--neon-blue);
  color: var(--neon-blue);
}
.btn-confirm:hover { background: rgba(0,190,255,0.2); color: #fff; }
</style>
