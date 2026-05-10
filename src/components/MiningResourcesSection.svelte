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
  .res-tabs { display:flex; gap:4px; margin-bottom:6px; }
  .res-tabs button {
    background:transparent; border:1px solid transparent;
    color:#555; font-size:0.62rem; padding:3px 10px; cursor:pointer;
    font-family:var(--font-display); font-weight:600; letter-spacing:0.08em; transition:border-color var(--t-fast), color var(--t-fast);
  }
  .res-tabs button.active { border-color:var(--accent-warning); color:var(--accent-warning); }
  .res-tabs button:hover:not(.active) { color:var(--color-text); }

  .res-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; }
  .res-card {
    background:var(--panel-inset); border:1px solid var(--border-subtle); padding:7px 6px;
    display:flex; flex-direction:column; align-items:center; gap:3px;
    transition:opacity var(--t-fast);
  }
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
  .mini-toggle input:checked + .mini-slider { background:var(--accent-steel); }
  .mini-toggle input:checked + .mini-slider::before { transform:translateX(10px); background:var(--accent-white); }

  .refine-btn {
    background:transparent; border:1px solid var(--border-mid); color:var(--color-muted);
    font-size:0.55rem; padding:2px 6px; cursor:pointer; transition:border-color var(--t-fast), color var(--t-fast);
    font-family:var(--font-display); font-weight:600; letter-spacing:0.06em;
  }
  .refine-btn:hover:not(:disabled) { border-color:var(--accent-white); color:var(--accent-white); }
  .refine-btn:disabled { opacity:0.3; cursor:not-allowed; }
</style>