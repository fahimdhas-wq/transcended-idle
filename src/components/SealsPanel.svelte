
<script lang="ts">
  import { character } from '../modules/character.svelte.js';
  import { formatNumber } from '../systems/scalingSystem.js';
  import { showToast } from '../stores/uiStore.svelte.js';
  import { Decimal } from '../systems/decimal.js';
  import ConfirmationModal from './ConfirmationModal.svelte';
  import Value from './Value.svelte';

  const sealReqRaw = [
    '1e4', '5e4', '25e4', '1e6', '5e6', '25e6', '1e8',          // Seals 1-7
    '5e8', '2.5e9', '1e10', '5e10', '2e11', '1e12',             // Seals 8-13
    '5e12', '2e13', '1e14', '5e14', '2e15', '1e16',             // Seals 14-19
    '5e16', '2e17', '1e18', '5e18', '2e19', '1e20',             // Seals 20-25
    '5e20', '2e21', '1e22', '5e22', '2e23', '1e24',             // Seals 26-31
    '5e24', '2e25', '1e26', '5e26', '2e27', '1e28',             // Seals 32-37
    '5e28', '2e29', '1e30', '5e30', '2e31', '1e32',             // Seals 38-43
    '5e32', '2e33', '1e34', '5e34', '2e35', '1e36',             // Seals 44-49
    '5e36', '2e37', '1e38', '5e38', '2e39', '1e40',             // Seals 50-55
    '5e40', '2e41', '1e42', '5e42', '2e43', '1e44',             // Seals 56-61
    '5e44', '2e45', '1e46', '5e46', '2e47', '1e48',             // Seals 62-67
    '5e48', '2e49', '1e50', '5e50', '2e51', '1e52',             // Seals 68-73
    '5e52', '2e53', '1e54', '5e54', '2e55', '1e56',             // Seals 74-79
    '5e56', '2e57', '1e58', '5e58', '2e59', '1e60',             // Seals 80-85
    '5e60', '2e61', '1e62', '5e62', '2e63', '1e64',             // Seals 86-91
    '5e64', '2e65', '1e66', '5e66', '2e67', '1e68',             // Seals 92-97
    '5e68', '2e69', '1e70', '5e70', '2e71', '1e72',             // Seals 98-103
    '5e72', '2e73', '1e74', '5e74', '2e75', '1e76',             // Seals 104-109
    '5e76', '2e77', '1e78', '5e78', '2e79', '1e80',             // Seals 110-115
    '5e80', '2e81', '1e82', '5e82', '2e83', '1e84',             // Seals 116-121
    '5e84', '2e85', '1e86', '5e86', '2e87', '1e88',             // Seals 122-127
    '5e88', '2e89', '1e90', '5e90', '2e91', '1e92',             // Seals 128-133
    '5e92', '2e93', '1e94', '5e94', '2e95', '1e96',             // Seals 134-139
    '5e96', '2e97', '1e98', '5e98', '2e99', '1e100',            // Seals 140-145
    '5e100', '2e101', '1e102', '5e102', '2e103', '1e104',       // Seals 146-151
    '5e104', '2e105', '1e106', '5e106', '2e107', '1e108',       // Seals 152-157
    '5e108', '2e109', '1e110', '5e110', '2e111', '1e112',       // Seals 158-163
    '5e112', '2e113', '1e114', '5e114', '2e115', '1e116',       // Seals 164-169
    '5e116', '2e117', '1e118', '5e118', '2e119', '1e120',       // Seals 170-175
    '5e120', '2e121', '1e122', '5e122', '2e123', '1e124',       // Seals 176-181
    '5e124', '2e125', '1e126', '5e126', '2e127', '1e128',       // Seals 182-187
    '5e128', '2e129', '1e130', '5e130', '2e131', '1e132',       // Seals 188-193
    '5e132', '2e133', '1e134', '5e134', '2e135', '1e136',       // Seals 194-199
    '5e136', '2e137', '1e138', '5e138', '2e139', '1e140',       // Seals 200-205
    '5e140', '2e141', '1e142', '5e142', '2e143', '1e144',       // Seals 206-211
    '5e144', '2e145', '1e146', '5e146', '2e147', '1e148',       // Seals 212-217
    '5e148', '2e149', '1e150', '5e150', '2e151', '1e152',       // Seals 218-223
    '5e152', '2e153', '1e154', '5e154', '2e155', '1e156',       // Seals 224-229
    '5e156', '2e157', '1e158', '5e158', '2e159', '1e160',       // Seals 230-235
    '5e160', '2e161', '1e162', '5e162', '2e163', '1e164',       // Seals 236-241
    '5e164', '2e165', '1e166', '5e166', '2e167', '1e168',       // Seals 242-247
    '5e168', '2e169', '1e170', '5e170', '2e171', '1e172',       // Seals 248-253
    '5e172', '2e173', '1e174', '5e174', '2e175', '1e176',       // Seals 254-259
    '5e176', '2e177', '1e178', '5e178', '2e179', '1e180',       // Seals 260-265
    '5e180', '2e181', '1e182', '5e182', '2e183', '1e184',       // Seals 266-271
    '5e184', '2e185', '1e186', '5e186', '2e187', '1e188',       // Seals 272-277
  ];

  // Pre-compute Decimal versions once
  const sealRequirements: Decimal[] = sealReqRaw.map(r => Decimal.from(r));

  let pendingSealIdx = $state<number | null>(null);
  let showModal = $state(false);
  let scrollContainer = $state<HTMLElement | null>(null);

  const ROW_HEIGHT = 68;
  const BUFFER = 5;
  let scrollTop = $state(0);
  let containerHeight = $state(600);

  const visibleStart = $derived(Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER));
  const visibleEnd = $derived(Math.min(sealRequirements.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER));
  const visibleSeals = $derived(sealRequirements.slice(visibleStart, visibleEnd).map((req, i) => ({
    req,
    idx: visibleStart + i
  })));
  const totalHeight = $derived(sealRequirements.length * ROW_HEIGHT);

  function handleScroll(e: Event) {
    const el = e.target as HTMLElement;
    scrollTop = el.scrollTop;
  }

  function killPct(req: Decimal): number {
    if (character.kills.gte(req)) return 100;
    return Math.min(100, character.kills.div(req).mul(100).toNumber());
  }

  function requestBreak(idx: number): void {
    pendingSealIdx = idx;
    showModal = true;
  }

  function confirmBreak(): void {
    const idx = pendingSealIdx;
    if (idx === null) return;
    if (idx === -1) {
      confirmUnlockAll();
    } else if (character.seals === idx && character.kills.gte(sealRequirements[idx])) {
      character.seals++;
      showToast(`SEAL ${idx + 1} BROKEN — x${Math.pow(10, character.seals)} MULT`, 'success');
    }
    pendingSealIdx = null;
  }

  function canBreak(idx: number): boolean {
    return character.seals === idx && character.kills.gte(sealRequirements[idx]);
  }

  function unlockableCount(): number {
    let cnt = 0;
    while (character.seals + cnt < sealRequirements.length && character.kills.gte(sealRequirements[character.seals + cnt])) {
      cnt++;
    }
    return cnt;
  }

  function requestUnlockAll(): void {
    pendingSealIdx = -1;
    showModal = true;
  }

  function confirmUnlockAll(): void {
    let broken = 0;
    while (character.seals < sealRequirements.length && character.kills.gte(sealRequirements[character.seals])) {
      character.seals++;
      broken++;
    }
    if (broken > 0) {
      showToast(`UNLOCKED ${broken} SEAL${broken > 1 ? 'S' : ''} — x${Math.pow(10, character.seals)} MULT`, 'success');
    }
  }
</script>

<div class="seals-panel">

  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#10038;</div>
      <div class="header-text">
        <h2 class="transcended-text">AWAKENING SEALS</h2>
        <span class="transcended-sub">UNBIND YOUR POWER</span>
      </div>
    </div>
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">KILLS</span>
        <span class="stat-value">{formatNumber(character.kills)}</span>
      </div>
      {#if unlockableCount() > 0}
        <button class="unlock-all-btn" onclick={requestUnlockAll}>
          UNLOCK ALL ({unlockableCount()})
        </button>
      {/if}
    </div>
  </div>

  <!-- God multiplier strip -->
  <div class="god-strip">
    <span class="god-label">GOD MULTIPLIER</span>
    <span class="god-val">x{formatNumber(Math.pow(10, character.seals))}</span>
    <span class="god-seals"><Value n={character.seals} /> / <Value n={sealRequirements.length} /> SEALS</span>
  </div>

  <!-- Seals list -->
  <div class="seals-list" onscroll={handleScroll} bind:this={scrollContainer} style="height: 100%; overflow-y: auto;">
    <div style="height: {totalHeight}px; position: relative;">
      {#each visibleSeals as item (item.idx)}
        {@const req = item.req}
        {@const idx = item.idx}
        {@const broken = character.seals > idx}
        {@const available = canBreak(idx)}
        {@const pct = killPct(req)}

        <div class="seal-row"
          class:broken={broken}
          class:available={available}
          class:locked={!broken && !available && character.seals < idx}
          style="position: absolute; top: {idx * ROW_HEIGHT}px; left: 0; right: 0;"
        >
          <div class="seal-left">
            <span class="seal-num">SEAL {idx + 1}</span>
            <span class="seal-req">{formatNumber(req)} kills</span>
            <span class="seal-reward">Next: x{formatNumber(Math.pow(10, idx + 1))}</span>
          </div>

          <div class="seal-mid">
            {#if broken}
              <span class="broken-text">BROKEN</span>
            {:else}
              <div class="kill-bar-wrap">
                <div class="kill-bar-fill" style="width:{pct}%"></div>
              </div>
              <span class="pct-text">{pct.toFixed(1)}%</span>
            {/if}
          </div>

          <div class="seal-right">
            {#if broken}
              <span class="check">&#10003;</span>
            {:else if available}
              <button class="break-btn" onclick={() => requestBreak(idx)}>BREAK</button>
            {:else}
              <span class="lock-icon">—</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

</div>

<ConfirmationModal
  bind:show={showModal}
  message={pendingSealIdx === -1
    ? `Unlock all ${unlockableCount()} available seal${unlockableCount() > 1 ? 's' : ''}? Grants permanent x10 multiplier each. Cannot be undone.`
    : `Break Seal {(pendingSealIdx ?? 0) + 1}? Grants permanent x10 multiplier. Cannot be undone.`}
  onConfirm={confirmBreak}
/>

<style>
.seals-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header-icon { color: var(--red); }

/* ── GOD STRIP ──────────────────────────────── */
.god-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-2);
  flex-shrink: 0;
}

.god-label {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-2);
  flex: 1;
}

.god-val {
  font-family: var(--font-data);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}

.god-seals {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-2);
  text-transform: uppercase;
}

/* ── SEALS LIST ─────────────────────────────── */
.seals-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px 0;
}

.seal-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  background: var(--bg-1);
  transition: all var(--fast);
  box-sizing: border-box;
}
.seal-row.broken {
  border-color: hsl(0 100% 60% / 0.2);
  opacity: 0.5;
}
.seal-row.available {
  border-color: var(--red);
  background: hsl(0 100% 60% / 0.08);
}
.seal-row.locked {
  opacity: 0.3;
}

.seal-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.seal-num {
  font-family: var(--font-hud);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-0);
}
.seal-req {
  font-family: var(--font-data);
  font-size: 0.6rem;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}

.seal-reward {
  font-family: var(--font-data);
  font-size: 0.55rem;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}

.seal-reward {
  font-family: var(--font-data);
  font-size: 0.55rem;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}

/* ── KILL BAR ───────────────────────────────── */
.seal-mid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.kill-bar-wrap {
  width: 100%;
  height: 6px;
  background: hsl(0 0% 0% / 0.4);
  border: 1px solid var(--line);
  overflow: hidden;
}
.kill-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--red), hsl(0 100% 70%));
  transition: width 200ms ease;
}
.pct-text {
  font-family: var(--font-data);
  font-size: 0.55rem;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
.broken-text {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cyan);
}

/* ── SEAL RIGHT ─────────────────────────────── */
.seal-right {
  display: flex;
  justify-content: flex-end;
}
.check {
  font-size: 0.8rem;
  color: var(--cyan);
}
.lock-icon {
  font-size: 0.7rem;
  color: var(--text-2);
}
.break-btn {
  font-family: var(--font-hud);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 12px;
  background: var(--red);
  border: none;
  color: var(--text-0);
  cursor: pointer;
  transition: all var(--fast);
}
.break-btn:hover {
  background: hsl(0 100% 70%);
  box-shadow: 0 0 12px hsl(0 100% 60% / 0.4);
}

.unlock-all-btn {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 4px 10px;
  background: var(--gold);
  border: none;
  color: #000;
  cursor: pointer;
  transition: all var(--fast);
  white-space: nowrap;
}
.unlock-all-btn:hover {
  background: hsl(45 100% 60%);
  box-shadow: 0 0 12px hsl(45 100% 50% / 0.4);
}
</style>
