
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

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-icon { font-size: 1rem; color: var(--green); }
.header-text { display: flex; flex-direction: column; gap: 1px; }
.header-stats { display: flex; gap: 16px; }
.stat-item { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.stat-label { font-family: var(--font-hud); font-size: 0.5rem; font-weight: 600; letter-spacing: 0.12em; color: var(--text-2); text-transform: uppercase; }
.stat-value { font-family: var(--font-data); font-size: 0.8rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text-0); }
.green { color: var(--green); }

.lock-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-2);
  gap: 8px;
}
.lock-icon { font-size: 3rem; color: var(--text-2); }
.lock-title {
  font-family: var(--font-hud);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-2);
  margin: 0;
}
.lock-sub { font-size: 0.7rem; color: var(--text-2); margin: 0; }

.control-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.buy-selector { display: flex; gap: 2px; }
.amt-btn {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text-2);
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  cursor: pointer;
  transition: all var(--fast);
}
.amt-btn.active {
  border-color: var(--green);
  color: var(--green);
  background: hsl(145 85% 55% / 0.1);
}
.amt-btn:hover:not(.active) {
  border-color: var(--line);
  color: var(--text-1);
}
.auto-up-btn {
  background: transparent;
  border: 1px solid var(--green);
  color: var(--green);
  font-family: var(--font-hud);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 5px 14px;
  cursor: pointer;
  transition: all var(--fast);
}
.auto-up-btn:hover {
  background: hsl(145 85% 55% / 0.1);
  color: var(--text-0);
}

.sections {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
}

.accordion {
  border: 1px solid var(--line);
  background: var(--bg-1);
}
.acc-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  border: none;
  color: var(--green);
  font-family: var(--font-hud);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 10px 12px;
  cursor: pointer;
  text-transform: uppercase;
  transition: background var(--fast);
}
.acc-head:hover {
  background: hsl(145 85% 55% / 0.05);
}
.acc-arrow {
  font-family: var(--font-data);
  font-size: 0.8rem;
}
.accordion.open .acc-head {
  border-bottom: 1px solid var(--line);
}
.acc-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
