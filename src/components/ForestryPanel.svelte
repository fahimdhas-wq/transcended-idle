
<script lang="ts">
import { forestryState } from '../modules/forestry.svelte.js';
import { autoUpgradeForestry } from '../utils/globalMaxUpgrade.js';
import { uiStore, showToast } from '../stores/uiStore.svelte.js';
import { invalidateBulkCostCache } from '../utils/bulkCost.js';

import ForestryStatusSection from './ForestryStatusSection.svelte';
import ForestryUpgradesSection from './ForestryUpgradesSection.svelte';
import ForestryResourcesSection from './ForestryResourcesSection.svelte';
import { formatValue } from '../systems/formatValue.js';

const unlocked = $derived(forestryState.unlocked);
const harvestRate = $derived(forestryState.harvestRate);
const dnaFragments = $derived(forestryState.dnaFragments);

function fmt(v: any) { return formatValue(v); }

let openSections = $state({ status: true, upgrades: true, resources: false });
function toggle(key: 'status' | 'upgrades' | 'resources') { openSections[key] = !openSections[key]; }

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
        <span class="stat-value green">{fmt(harvestRate)}/s</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">DNA</span>
        <span class="stat-value green">{fmt(dnaFragments)}</span>
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

      <div class="accordion" class:open={openSections.status}>
        <button class="acc-head" onclick={() => toggle('status')}>
          <span>HARVESTER STATUS</span>
          <span class="acc-arrow">{openSections.status ? '−' : '+'}</span>
        </button>
        {#if openSections.status}
          <div class="acc-body">
            <ForestryStatusSection />
          </div>
        {/if}
      </div>

      <div class="accordion" class:open={openSections.upgrades}>
        <button class="acc-head" onclick={() => toggle('upgrades')}>
          <span>CALIBRATION</span>
          <span class="acc-arrow">{openSections.upgrades ? '−' : '+'}</span>
        </button>
        {#if openSections.upgrades}
          <div class="acc-body">
            <ForestryUpgradesSection />
          </div>
        {/if}
      </div>

      <div class="accordion" class:open={openSections.resources}>
        <button class="acc-head" onclick={() => toggle('resources')}>
          <span>RESOURCES</span>
          <span class="acc-arrow">{openSections.resources ? '−' : '+'}</span>
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
.forestry-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.header-icon { color: var(--green); }
.green { color: var(--green); }
.acc-head { color: var(--green); }
.acc-head:hover { background: hsl(145 85% 55% / 0.05); }

.amt-btn.active {
  border-color: var(--green);
  color: var(--green);
  background: hsl(145 85% 55% / 0.1);
}
.auto-up-btn {
  border-color: var(--green);
  color: var(--green);
}
.auto-up-btn:hover {
  background: hsl(145 85% 55% / 0.1);
  color: var(--text-0);
}
</style>
