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
  .res-tabs { display:flex; gap:0; margin-bottom:6px; border-bottom: 1px solid var(--line); }
  .res-tabs button {
    flex:1; padding:6px 0; background:transparent; border:none;
    border-right: 1px solid var(--line);
    color:var(--text-2); font-family:var(--font-hud);
    font-size:0.65rem; font-weight:800; cursor:pointer;
    transition: all 150ms ease;
  }
  .res-tabs button.active {
    background: var(--cyan); color: #000;
    box-shadow: 0 0 10px hsl(185 100% 55% / 0.4); border-right: none;
  }
  .res-tabs button:hover:not(.active) { color:var(--text-0); background: hsl(185 100% 55% / 0.15); }

  .res-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; }
  .res-card {
    background:transparent; border:1px solid var(--line); padding:7px 6px;
    display:flex; flex-direction:column; align-items:center; gap:3px;
    transition:opacity var(--fast);
    position: relative;
  }
  .res-card::before, .res-card::after {
    content: ''; position: absolute;
    width: 4px; height: 4px; border: 1px solid var(--cyan);
  }
  .res-card::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .res-card::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }
  .res-card.locked { opacity:0.2; pointer-events:none; }
  .res-name { font-size:0.58rem; color:var(--text-2); text-align:center; text-transform:uppercase; font-family:var(--font-hud); font-weight:600; letter-spacing:0.06em; }
  .res-amt { font-size:0.82rem; color:var(--text-0); font-weight:700; font-family:var(--font-data); font-variant-numeric: tabular-nums; }
  .res-actions { display:flex; gap:5px; align-items:center; }

  .mini-toggle { display:inline-block; width:22px; height:12px; position:relative; cursor:pointer; }
  .mini-toggle input { display:none; }
  .mini-slider { position:absolute; inset:0; background:var(--bg-3); transition:background var(--fast); }
  .mini-slider::before {
    content:''; position:absolute; width:8px; height:8px;
    background:var(--text-2); top:2px; left:2px; transition:transform var(--fast);
  }
  .mini-toggle input:checked + .mini-slider { background:var(--cyan); box-shadow: 0 0 5px var(--cyan); }
  .mini-toggle input:checked + .mini-slider::before { transform:translateX(10px); background:var(--text-0); }

  .refine-btn {
    background:transparent; border:1px solid var(--line); color:var(--text-2);
    font-size:0.55rem; padding:4px 10px; cursor:pointer; transition:all var(--fast);
    font-family:var(--font-hud); font-weight:600; letter-spacing:0.06em;
    position: relative;
  }
  .refine-btn::before, .refine-btn::after {
    content: ''; position: absolute;
    width: 4px; height: 4px; border: 1px solid var(--cyan);
  }
  .refine-btn::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .refine-btn::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

  .refine-btn:hover:not(:disabled) { border-color:var(--cyan); color:var(--text-0); background: hsl(185 100% 55% / 0.1); box-shadow: 0 0 5px hsl(185 100% 55% / 0.4); }
  .refine-btn:disabled { opacity:0.3; cursor:not-allowed; }
</style>