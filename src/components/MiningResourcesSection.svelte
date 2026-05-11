<script lang="ts">
import { miningState, refineSingle } from '../modules/mining.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { Decimal } from '../systems/decimal.js';
import { basicOres, refinedOres, advancedOres } from '../data/resources.js';

const resources = $derived(miningState.resources);
const discovery = $derived(miningState.discovery);
const autoRefine = $derived(miningState.autoRefine);

let resourceTab = $state<'basic' | 'refined' | 'advanced'>('basic');

function fmt(v: any): string { return formatValue(v); }
function getRes(id: string): Decimal { return resources.get(id); }
function canRefine(id: string): boolean { return resources.getRaw(id) >= 50; }

function doRefine(id: string) {
  refineSingle(id);
}
</script>

<div class="res-tabs">
  {#each (['basic','refined','advanced'] as const) as t}
    <button class:active={resourceTab === t} onclick={() => resourceTab = t}>
      {t.toUpperCase()}
    </button>
  {/each}
</div>

<div class="res-grid">
  {#if resourceTab === 'basic'}
    {#each basicOres as ore (ore.id)}
      <div class="res-card" class:locked={(ore.tier ?? 0) > discovery}>
        <span class="res-name">{ore.name}</span>
        <span class="res-amt">{fmt(getRes(ore.id))}</span>
        <div class="res-actions">
          <label class="mini-toggle">
            <input type="checkbox"
              checked={autoRefine[ore.id]}
              onchange={(e) => autoRefine[ore.id] = (e.currentTarget as HTMLInputElement).checked}>
            <span class="mini-slider"></span>
          </label>
          <button class="refine-btn"
            onclick={() => doRefine(ore.id)}
            disabled={!canRefine(ore.id)}>
            REFINE
          </button>
        </div>
      </div>
    {/each}
  {:else if resourceTab === 'refined'}
    {#each refinedOres as ore (ore.id)}
      <div class="res-card">
        <span class="res-name">{ore.name}</span>
        <span class="res-amt">{fmt(getRes(ore.id))}</span>
        <div class="res-actions">
          <label class="mini-toggle">
            <input type="checkbox"
              checked={autoRefine[ore.id]}
              onchange={(e) => autoRefine[ore.id] = (e.currentTarget as HTMLInputElement).checked}>
            <span class="mini-slider"></span>
          </label>
          <button class="refine-btn"
            onclick={() => doRefine(ore.id)}
            disabled={!canRefine(ore.id)}>
            REFINE
          </button>
        </div>
      </div>
    {/each}
  {:else}
    {#each advancedOres as ore (ore.id)}
      <div class="res-card">
        <span class="res-name">{ore.name}</span>
        <span class="res-amt">{fmt(getRes(ore.id))}</span>
      </div>
    {/each}
  {/if}
</div>

<style>
  .res-tabs { display:flex; gap:0; margin-bottom:6px; border-bottom: 1px solid var(--border-mid); }
  .res-tabs button {
    flex:1; padding:6px 0; background:transparent; border:none; 
    border-right: 1px solid var(--border-subtle);
    color:var(--color-muted); font-family:var(--font-display); 
    font-size:0.65rem; font-weight:800; cursor:pointer;
    transition: all 150ms ease;
  }
  .res-tabs button.active { 
    background: var(--accent-steel); color: #000; 
    box-shadow: 0 0 10px hsla(210, 100%, 50%, 0.4); border-right: none;
  }
  .res-tabs button:hover:not(.active) { color:var(--accent-white); background: hsla(210, 100%, 50%, 0.15); }

  .res-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; }
  .res-card {
    background:transparent; border:1px solid var(--border-subtle); padding:7px 6px;
    display:flex; flex-direction:column; align-items:center; gap:3px;
    transition:opacity var(--t-fast);
    position: relative;
  }
  .res-card::before, .res-card::after {
    content: ''; position: absolute;
    width: 4px; height: 4px; border: 1px solid var(--accent-steel);
  }
  .res-card::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .res-card::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }
  .res-card.locked { opacity:0.2; pointer-events:none; }
  .res-name { font-size:0.58rem; color:var(--color-muted); text-align:center; text-transform:uppercase; font-family:var(--font-display); font-weight:600; letter-spacing:0.06em; }
  .res-amt { font-size:0.82rem; color:var(--accent-white); font-weight:700; font-family:var(--font-mono); font-variant-numeric: tabular-nums; }
  .res-actions { display:flex; gap:5px; align-items:center; }

  .mini-toggle { display:inline-block; width:22px; height:12px; position:relative; cursor:pointer; }
  .mini-toggle input { display:none; }
  .mini-slider { position:absolute; inset:0; background:var(--border-mid); transition:background var(--t-mid); }
  .mini-slider::before {
    content:''; position:absolute; width:8px; height:8px;
    background:var(--color-dim); top:2px; left:2px; transition:transform var(--t-mid);
  }
  .mini-toggle input:checked + .mini-slider { background:var(--accent-steel); box-shadow: 0 0 5px var(--accent-steel); }
  .mini-toggle input:checked + .mini-slider::before { transform:translateX(10px); background:var(--accent-white); }

  .refine-btn {
    background:transparent; border:1px solid var(--border-mid); color:var(--color-muted);
    font-size:0.55rem; padding:4px 10px; cursor:pointer; transition:all var(--t-fast);
    font-family:var(--font-display); font-weight:600; letter-spacing:0.06em;
    position: relative;
  }
  .refine-btn::before, .refine-btn::after {
    content: ''; position: absolute;
    width: 4px; height: 4px; border: 1px solid var(--accent-steel);
  }
  .refine-btn::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .refine-btn::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

  .refine-btn:hover:not(:disabled) { border-color:var(--accent-steel); color:var(--accent-white); background: hsla(210, 100%, 50%, 0.1); box-shadow: 0 0 5px hsla(210, 100%, 50%, 0.4); }
  .refine-btn:disabled { opacity:0.3; cursor:not-allowed; }
</style>