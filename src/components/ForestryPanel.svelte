<script lang="ts">
import { forestryState } from '../modules/forestry.svelte.js';
import { autoUpgradeForestry } from '../utils/globalMaxUpgrade.js';
import { uiStore, showToast } from '../stores/uiStore.svelte.js';
import { invalidateBulkCostCache } from '../utils/bulkCost.js';

// Import isolated child components for better reactivity isolation
import ForestryStatusSection from './ForestryStatusSection.svelte';
import ForestryUpgradesSection from './ForestryUpgradesSection.svelte';
import ForestryLogisticsSection from './ForestryLogisticsSection.svelte';
import ForestryResourcesSection from './ForestryResourcesSection.svelte';
import { formatValue } from '../systems/formatValue.js';

const unlocked = $derived(forestryState.unlocked);
const harvestRate = $derived(forestryState.harvestRate);
const dnaFragments = $derived(forestryState.dnaFragments);

function fmt(v: any) { return formatValue(v); }

// Section state
let openSections = $state({ status: true, upgrades: true, logistics: false, resources: false });
function toggle(key: 'status' | 'upgrades' | 'logistics' | 'resources') { openSections[key] = !openSections[key]; }

function doAutoUp() {
  autoUpgradeForestry();
  invalidateBulkCostCache();
  showToast('Bio-Harvester optimized!', 'success');
}
</script>

<div class="forestry-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#127807;</div>
      <div class="header-text">
        <h2 class="transcended-text">BIO HARVESTER</h2>
        <span class="transcended-sub">ORGANIC SYNTHESIS</span>
      </div>
    </div>
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">RATE</span>
        <span class="stat-value accent-green">{fmt(harvestRate)}/s</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">DNA</span>
        <span class="stat-value accent-green">{fmt(dnaFragments)}</span>
      </div>
    </div>
  </div>

  {#if !unlocked}
    <div class="lock-screen">
      <div class="lock-icon">&#127807;</div>
      <p class="lock-title">LOCKED</p>
      <p class="lock-sub">Unlocks at Level 200</p>
    </div>
  {:else}
    <div class="control-strip">
      <div class="buy-selector">
        {#each [1, 10, 100, 1000, 10000] as amt}
          <button class="amt-btn" class:active={uiStore.buyAmount === amt}
            onclick={() => { uiStore.buyAmount = amt; invalidateBulkCostCache(); }}>
            x{amt}
          </button>
        {/each}
      </div>
      <button class="auto-up-btn" onclick={doAutoUp}>AUTO UP</button>
    </div>

    <div class="sections">

      <!-- STATUS -->
      <div class="accordion" class:open={openSections.status}>
        <button class="acc-head" onclick={() => toggle('status')}>
          <span>HARVESTER STATUS</span>
        </button>
        {#if openSections.status}
          <div class="acc-body">
            <ForestryStatusSection />
          </div>
        {/if}
      </div>

      <!-- UPGRADES -->
      <div class="accordion" class:open={openSections.upgrades}>
        <button class="acc-head" onclick={() => toggle('upgrades')}>
          <span>CALIBRATION</span>
        </button>
        {#if openSections.upgrades}
          <div class="acc-body">
            <ForestryUpgradesSection />
          </div>
        {/if}
      </div>

      <!-- LOGISTICS -->
      <div class="accordion" class:open={openSections.logistics}>
        <button class="acc-head" onclick={() => toggle('logistics')}>
          <span>BIOME LOGISTICS</span>
        </button>
        {#if openSections.logistics}
          <div class="acc-body">
            <ForestryLogisticsSection />
          </div>
        {/if}
      </div>

      <!-- RESOURCES -->
      <div class="accordion" class:open={openSections.resources}>
        <button class="acc-head" onclick={() => toggle('resources')}>
          <span>RESOURCES</span>
        </button>
        {#if openSections.resources}
          <div class="acc-body">
            <ForestryResourcesSection />
          </div>
        {/if}
      </div>

    </div>
  {/if}
</div>

<style>
  .forestry-panel { display:flex; flex-direction:column; height:100%; }

  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0; flex-wrap: wrap; gap: 8px;
  }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-icon { font-size: 1rem; color: var(--accent-green); }
  .header-text { display: flex; flex-direction: column; gap: 1px; }
  .header-stats { display: flex; gap: 16px; }
  .stat-item { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .stat-label { font-family: var(--font-display); font-size: 0.56rem; font-weight: 600; letter-spacing: 0.14em; color: var(--color-muted); }
  .stat-value { font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; font-variant-numeric: tabular-nums; }
  .accent-green { color: var(--accent-green); }

  .lock-screen { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--color-muted); gap:8px; }
  .lock-icon { font-size:3rem; color: var(--color-dim); }
  .lock-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; letter-spacing: 0.12em; color: var(--color-dim); margin: 0; }
  .lock-sub { font-size: 0.7rem; color: var(--color-dim); margin: 0; }

  .control-strip {
    display:flex; align-items:center; justify-content:space-between;
    padding:8px 14px; border-bottom:1px solid var(--border-subtle); flex-shrink:0;
  }
  .buy-selector { display:flex; gap:2px; }
  .amt-btn {
    background:transparent; border:1px solid var(--border-subtle); color:var(--color-muted);
    font-family:var(--font-display); font-size:0.6rem; font-weight:600; letter-spacing:0.08em;
    padding:3px 8px; cursor:pointer; transition:border-color var(--t-fast), color var(--t-fast);
  }
  .amt-btn.active { border-color:var(--accent-green); color:var(--accent-green); }
  .amt-btn:hover:not(.active) { border-color:var(--border-mid); color:var(--color-text); }
  .auto-up-btn {
    background:transparent; border:1px solid var(--accent-green); color:var(--accent-green);
    font-family:var(--font-display); font-size:0.66rem; font-weight:700; letter-spacing:0.1em;
    padding:4px 14px; cursor:pointer; transition:background var(--t-fast), color var(--t-fast);
  }
  .auto-up-btn:hover { background:rgba(0,204,102,0.1); color:var(--accent-white); }

  .sections { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:4px; padding: 8px; }

  .accordion { border:1px solid var(--border-subtle); background:var(--panel-bg); }
  .acc-head {
    width:100%; display:flex; justify-content:space-between; align-items:center;
    background:transparent; border:none; color:var(--accent-green);
    font-family:var(--font-display); font-size:0.65rem; font-weight:700; letter-spacing:0.1em;
    padding:8px 12px; cursor:pointer; text-transform:uppercase;
    transition:background var(--t-fast), color var(--t-fast);
  }
  .acc-head:hover { background:rgba(0,204,102,0.06); }
  .accordion.open .acc-head { border-bottom: 1px solid var(--border-subtle); }
  .acc-body { padding:10px; display:flex; flex-direction:column; gap:8px; }
</style>