
<script lang="ts">
import {
  miningState, tools, upgradeTool,
  upgradeEnergy, buyMiningUpgrade, refineSingle
} from '../modules/mining.svelte.js';
import { autoUpgradeMining } from '../utils/globalMaxUpgrade.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { uiStore, showToast } from '../stores/uiStore.svelte.js';
import { invalidateBulkCostCache } from '../utils/bulkCost.js';

import MiningStatusSection from './MiningStatusSection.svelte';
import MiningUpgradesSection from './MiningUpgradesSection.svelte';
import MiningResourcesSection from './MiningResourcesSection.svelte';

let buyAmount = $derived(uiStore.buyAmount);

let openSections = $state<Record<string, boolean>>({
  status: true,
  upgrades: true,
  resources: false,
});
function toggle(key: string) { openSections[key] = !openSections[key]; }

function fmt(v: any) { return formatValue(v); }

function doMax() {
  autoUpgradeMining();
  invalidateBulkCostCache();
  showToast('Mining Rig optimized!', 'success');
}

const minesPerSecond = $derived(miningState.minesPerSecond);
const dataFragments = $derived(bestiaryState.dataFragments);
const unlocked = $derived(miningState.unlocked);
</script>

<div class="mining-panel">
  <div class="panel-header">
    <div class="header-left">
      <div class="header-icon">&#9935;</div>
      <div class="header-text">
        <h2 class="transcended-text">MINING RIG</h2>
        <span class="transcended-sub">RESOURCE EXTRACTION</span>
      </div>
    </div>
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">RATE</span>
        <span class="stat-value">{fmt(minesPerSecond)}/s</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">DATA</span>
        <span class="stat-value gold">{fmt(dataFragments)}</span>
      </div>
    </div>
  </div>

  {#if !unlocked}
    <div class="lock-screen">
      <div class="lock-icon">&#9935;</div>
      <p class="lock-title">LOCKED</p>
      <p class="lock-sub">Unlocks at Level 100</p>
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
      <button class="auto-up-btn" onclick={doMax}>AUTO UP</button>
    </div>

    <div class="sections">

      <div class="accordion" class:open={openSections.status}>
        <button class="acc-head" onclick={() => toggle('status')}>
          <span>DRILL STATUS</span>
          <span class="acc-arrow">{openSections.status ? '−' : '+'}</span>
        </button>
        {#if openSections.status}
          <div class="acc-body">
            <MiningStatusSection />
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
            <MiningUpgradesSection />
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
            <MiningResourcesSection />
          </div>
        {/if}
      </div>

    </div>
  {/if}
</div>

<style>
.mining-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.header-icon { color: var(--cyan); }
.gold { color: var(--gold); }
.acc-head { color: var(--cyan); }
.acc-head:hover { background: hsl(185 100% 55% / 0.05); }
</style>
