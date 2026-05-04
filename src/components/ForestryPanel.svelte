<script>
import { 
  forestryState, 
  bioTools,
  upgradeBioTool, 
  buyForestryUpgrade,
  refineBioSingle,
  addGrowthChamber,
  upgradeMutationChance
} from '../modules/forestry.svelte.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { uiStore, showToast } from '../stores/uiStore.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { calculateBulkCost } from '../utils/bulkCost.js';

let buyAmount = $derived(uiStore.buyAmount);

function calculateForestryCost(type, amount) {
  const getCost = (lv) => {
    if (type === 'chainsawFuel')    return new Decimal(lv).mul(500);
    if (type === 'reforestation')   return new Decimal(lv).mul(150);
    if (type === 'ancientSaplings') {
      if (lv >= 10) return new Decimal(Infinity); // Cap at 10
      return new Decimal(10).pow(lv).mul(100);
    }
    if (type === 'mutationPower')   return new Decimal(lv + 1).mul(1500);
    if (type === 'overclockPower')  return new Decimal(lv + 1).mul(2000);
    if (type === 'efficiency')      return new Decimal(lv + 1).mul(1000);
    return new Decimal(0);
  };
  return calculateBulkCost(getCost, forestryState[type], amount);
}

function calculateChamberCost(amount) {
  let total = new Decimal(0);
  for (let i = 0; i < amount; i++) {
    const lv = forestryState.growthChambers + i;
    total = total.add(Math.floor(Math.pow(lv, 1.5) * 20));
  }
  return total;
}

function calculateMutationCost(amount) {
  let total = new Decimal(0);
  for (let i = 0; i < amount; i++) {
    const currentMut = forestryState.mutationChance + (i * 0.02);
    total = total.add(Math.floor(currentMut * 200));
  }
  return total;
}

const basicTrees = [
  { id: 'biomass', name: 'Biomass', tier: 1 },
  { id: 'oakron', name: 'Oakron', tier: 2 },
  { id: 'birchon', name: 'Birchon', tier: 3 },
  { id: 'pynex', name: 'Pynex', tier: 4 },
  { id: 'willix', name: 'Willix', tier: 5 },
  { id: 'mahorix', name: 'Mahorix', tier: 6 },
  { id: 'tecron', name: 'Tecron', tier: 7 },
  { id: 'ebonex', name: 'Ebonex', tier: 8 },
  { id: 'crystalis', name: 'Crystalis', tier: 9 },
  { id: 'spirion', name: 'Spirion', tier: 10 }
];

const refinedBio = [
  { id: 'biofiber', name: 'Biofiber' },
  { id: 'reinforcedFiber', name: 'Reinforced Fiber' },
  { id: 'lightPanel', name: 'Light Panel' },
  { id: 'resinGel', name: 'Resin Gel' },
  { id: 'flexFiber', name: 'Flex Fiber' },
  { id: 'denseCore', name: 'Dense Core' },
  { id: 'armorFiber', name: 'Armor Fiber' },
  { id: 'darkMatterFiber', name: 'Dark Matter Fiber' },
  { id: 'crystalGrowth', name: 'Crystal Growth' },
  { id: 'spiritFlux', name: 'Spirit Flux' }
];

const advancedBio = [
  { id: 'bioCore', name: 'Bio Core' },
  { id: 'terraCore', name: 'Terra Core' },
  { id: 'photonBark', name: 'Photon Bark' },
  { id: 'cryoCore', name: 'Cryo Core' },
  { id: 'psiCore', name: 'Psi Core' },
  { id: 'royalMatrix', name: 'Royal Matrix' },
  { id: 'guardianCore', name: 'Guardian Core' },
  { id: 'shadowCore', name: 'Shadow Core' },
  { id: 'lumenCore', name: 'Lumen Core' },
  { id: 'etherealCore', name: 'Ethereal Core' }
];

let currentDisplayTab = $state('basic');
let currentProgress = $derived(forestryState.growthProgress);
</script>

<div class="forestry-panel">
  <div class="premium-header">
    <div class="header-main">
      <div class="header-icon">🌿</div>
      <div class="header-title-box">
        <h2 class="transcended-text">BIO HARVESTER</h2>
        <div class="header-subtitle">ORGANIC SYNTHESIS</div>
      </div>
    </div>
    <div class="header-stats">
      <div class="header-stat-box">
        <span class="stat-label">DNA FRAGS</span>
        <span class="stat-value" style="color: var(--neon-green);">{formatNumber(forestryState.dnaFragments)}</span>
      </div>
    </div>
  </div>
  
  <div class="content-container" style="margin-top: 15px;">
    {#if !forestryState.unlocked}
    <div class="locked-msg">
      <div class="lock-icon">🌿</div>
      <div>Unlocks at Level 200</div>
    </div>
  {:else}
    <div class="status-bar">
      <span>Tool: <span class="highlight">{forestryState.toolName}</span></span>
      <span>DNA: <span class="highlight">{formatNumber(forestryState.dnaFragments)}</span></span>
    </div>

    <div class="growth-bar-container">
      <div class="growth-fill" style="width: {forestryState.toolTier >= 10 ? 100 : forestryState.growthProgress}%"></div>
    </div>

    <div class="action-grid">
      <button onclick={upgradeBioTool} class="btn-u" style="align-items: center;">
        <span class="u-name">TOOL UPGRADE</span>
        <small>{forestryState.toolTier >= 10 ? 'MAX' : 'Cost: ' + bioTools[forestryState.toolTier]?.dataCost + ' DNA'}</small>
      </button>
    </div>

    <div class="upgrades-section">
      <div class="section-header">
        <h4 class="transcended-sub">UPGRADES</h4>
        <div class="buy-selector">
          {#each [1, 10, 100, 1000, 10000] as amt}
            <button class="amt-btn" class:active={uiStore.buyAmount === amt} onclick={() => uiStore.buyAmount = amt}>x{amt}</button>
          {/each}
        </div>
      </div>
      
      <div class="upgrade-row">
        <button onclick={() => buyForestryUpgrade('chainsawFuel', buyAmount)} class="btn-u">
            <span class="u-name">Harvest Efficiency [Lv.{forestryState.chainsawFuel}]</span>
            <small>Cost: {formatNumber(calculateForestryCost('chainsawFuel', buyAmount))} DNA</small>
        </button>
        <button onclick={() => buyForestryUpgrade('ancientSaplings', buyAmount)} class="btn-u" disabled={forestryState.ancientSaplings >= 10}>
            <span class="u-name">Vein Discovery [Lv.{forestryState.ancientSaplings}]</span>
            <small>Cost: {forestryState.ancientSaplings >= 10 ? 'MAX' : formatNumber(calculateForestryCost('ancientSaplings', buyAmount)) + ' DNA'}</small>
        </button>
        <button onclick={() => buyForestryUpgrade('mutationPower', buyAmount)} class="btn-u">
            <span class="u-name">Mutation Power [Lv.{forestryState.mutationPower || 0}]</span>
            <small>Cost: {formatNumber(calculateForestryCost('mutationPower', buyAmount))} DNA</small>
        </button>
        <button onclick={() => buyForestryUpgrade('overclockPower', buyAmount)} class="btn-u">
            <span class="u-name">Overclock [Lv.{forestryState.overclockPower || 0}]</span>
            <small>Cost: {formatNumber(calculateForestryCost('overclockPower', buyAmount))} DNA</small>
        </button>
        <button onclick={() => buyForestryUpgrade('efficiency', buyAmount)} class="btn-u">
            <span class="u-name">Efficiency [Lv.{forestryState.efficiency || 0}]</span>
            <small>Cost: {formatNumber(calculateForestryCost('efficiency', buyAmount))} DNA</small>
        </button>
        <button onclick={() => buyForestryUpgrade('reforestation', buyAmount)} class="btn-u">
            <span class="u-name">Reforestation [Lv.{forestryState.reforestation || 1}]</span>
            <small>Cost: {formatNumber(calculateForestryCost('reforestation', buyAmount))} DNA</small>
        </button>
      </div>
    </div>

    <div class="automation-section">
      <div class="section-header">
        <h4 class="transcended-sub">AUTOMATION & BIOME</h4>
      </div>
      <div class="auto-row">
        <button onclick={() => addGrowthChamber(buyAmount)} class="btn-u">
          <span class="u-name">Growth Chambers ({forestryState.growthChambers})</span>
          <small>Cost: {formatNumber(calculateChamberCost(buyAmount))} Biofiber</small>
        </button>
        <button onclick={() => upgradeMutationChance(buyAmount)} class="btn-u">
          <span class="u-name">Mutation Chance ({Math.floor(forestryState.mutationChance * 100)}%)</span>
          <small>Cost: {formatNumber(calculateMutationCost(buyAmount))} Resin Gel</small>
        </button>
      </div>
    </div>

    <div class="resource-tabs">
        <button class:active={currentDisplayTab === 'basic'} onclick={() => currentDisplayTab = 'basic'}>BASIC</button>
        <button class:active={currentDisplayTab === 'refined'} onclick={() => currentDisplayTab = 'refined'}>REFINED</button>
        <button class:active={currentDisplayTab === 'advanced'} onclick={() => currentDisplayTab = 'advanced'}>ADVANCED</button>
    </div>

    <div class="resources-grid">
      {#if currentDisplayTab === 'basic'}
        {#each basicTrees as tree (tree.id)}
          <div class="res-item" class:inactive={tree.tier > forestryState.ancientSaplings}>
            <div class="res-name">{tree.name}</div>
            <div class="res-amount">{formatNumber(forestryState.resources[tree.id] || 0)}</div>
            <div class="res-actions">
              <label class="toggle-sm">
                <input type="checkbox" checked={forestryState.autoRefine[tree.id]} onchange={(e) => forestryState.autoRefine[tree.id] = e.target.checked}>
                <span class="slider"></span>
              </label>
              <button class="refine-item-btn" onclick={() => refineBioSingle(tree.id)} disabled={forestryState.resources[tree.id].lt(25)}>EVOLVE</button>
            </div>
          </div>
        {/each}
      {:else if currentDisplayTab === 'refined'}
        {#each refinedBio as res (res.id)}
          <div class="res-item">
            <div class="res-name">{res.name}</div>
            <div class="res-amount">{formatNumber(forestryState.resources[res.id] || 0)}</div>
            <div class="res-actions">
              <label class="toggle-sm">
                <input type="checkbox" checked={forestryState.autoRefine[res.id]} onchange={(e) => forestryState.autoRefine[res.id] = e.target.checked}>
                <span class="slider"></span>
              </label>
              <button class="refine-item-btn" onclick={() => refineBioSingle(res.id)} disabled={forestryState.resources[res.id].lt(25)}>EVOLVE</button>
            </div>
          </div>
        {/each}
      {:else}
        {#each advancedBio as res (res.id)}
          <div class="res-item">
            <div class="res-name">{res.name}</div>
            <div class="res-amount">{formatNumber(forestryState.resources[res.id] || 0)}</div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
</div>

<style>
.forestry-panel { display: flex; flex-direction: column; height: 100%; overflow-y: auto; padding: 10px; }
.locked-msg { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: #666; }
.lock-icon { font-size: 3rem; }
.status-bar { display: flex; justify-content: space-between; margin-bottom: 10px; background: #111; padding: 5px; border: 1px solid #333; }
.highlight { color: #4CAF50; font-weight: bold; }
.growth-bar-container { position: relative; height: 16px; background: #111; border: 1px solid var(--border-subtle); margin-bottom: 10px; overflow: hidden; }
.growth-fill { height: 100%; background: #4CAF50; transition: width 0.1s linear; }
.action-grid { display: grid; grid-template-columns: 1fr; gap: 5px; margin-bottom: 10px; }
.upgrades-section { margin-top: 10px; border-top: 1px solid #333; padding-top: 10px; }
.upgrades-section h4 { font-size: 0.8rem; color: #4CAF50; margin: 0; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.buy-selector { display: flex; gap: 2px; background: #000; padding: 2px; border: 1px solid #333; }
.amt-btn { background: transparent; border: none; color: #666; font-size: 0.65rem; padding: 2px 6px; cursor: pointer; }
.amt-btn.active { background: #4CAF50; color: #000; }
.upgrade-row { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.btn-u { background: #1a1a1a; border: 1px solid #333; color: #ccc; padding: 8px; cursor: pointer; font-family: inherit; font-size: 0.75rem; transition: 0.1s; display: flex; flex-direction: column; align-items: center; }
.btn-u:active { transform: scale(0.95); border-color: #4CAF50; }
.btn-u { align-items: flex-start; text-align: left; }
.btn-u small { font-size: 0.6rem; color: #777; }
.automation-section { margin-top: 10px; border-top: 1px solid #333; padding-top: 10px; }
.auto-row { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.resource-tabs { display: flex; gap: 5px; margin-top: 15px; border-bottom: 1px solid #333; padding-bottom: 5px; }
.resource-tabs button { background: #000; border: 1px solid #333; color: #555; font-size: 0.7rem; padding: 3px 8px; }
.resource-tabs button.active { border-color: #4CAF50; color: #4CAF50; }
.resources-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 10px; }
.res-item { background: #0d0d0d; padding: 5px; border: 1px solid #222; display: flex; flex-direction: column; align-items: center; }
.res-actions { display: flex; align-items: center; gap: 5px; margin-top: 5px; }
.toggle-sm { cursor: pointer; display: flex; align-items: center; }
.toggle-sm input { display: none; }
.toggle-sm .slider { width: 20px; height: 10px; background: #333; position: relative; border-radius: 5px; transition: 0.3s; }
.toggle-sm .slider:before { content: ""; position: absolute; width: 8px; height: 8px; background: #fff; left: 1px; top: 1px; border-radius: 50%; transition: 0.3s; }
input:checked + .slider { background: #4CAF50; }
input:checked + .slider:before { transform: translateX(10px); }
.refine-item-btn { background: #222; border: 1px solid #444; color: #fff; font-size: 0.6rem; padding: 2px 5px; }
.res-item.inactive { opacity: 0.2; }
.res-name { font-size: 0.6rem; color: #888; }
.res-amount { font-size: 0.8rem; color: #fff; font-weight: bold; }
</style>
