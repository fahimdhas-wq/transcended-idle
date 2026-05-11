<script lang="ts">
import { forestryState, refineBioSingle } from '../modules/forestry.svelte.js';
import { formatValue } from '../systems/formatValue.js';
import { Decimal } from '../systems/decimal.js';
import { basicTrees, refinedTrees, advancedTrees } from '../data/resources.js';

const resources = $derived(forestryState.resources);
const autoRefine = $derived(forestryState.autoRefine);
const ancientSaplings = $derived(forestryState.ancientSaplings);

let resourceTab = $state<'basic' | 'refined' | 'advanced'>('basic');

function fmt(v: any): string { return formatValue(v); }
function getRes(id: string): Decimal { return resources.get(id); }

function doRefine(id: string) {
  refineBioSingle(id);
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
    {#each basicTrees as tree (tree.id)}
      <div class="res-card" class:locked={(tree.tier ?? 0) > ancientSaplings}>
        <span class="res-name">{tree.name}</span>
        <span class="res-amt">{fmt(getRes(tree.id))}</span>
        <div class="res-actions">
          <label class="mini-toggle">
            <input type="checkbox"
              checked={autoRefine[tree.id]}
              onchange={(e) => autoRefine[tree.id] = (e.currentTarget as HTMLInputElement).checked}>
            <span class="mini-slider"></span>
          </label>
          <button class="refine-btn"
            onclick={() => doRefine(tree.id)}
            disabled={!getRes(tree.id).gte(25)}>
            EVOLVE
          </button>
        </div>
      </div>
    {/each}
  {:else if resourceTab === 'refined'}
    {#each refinedTrees as res (res.id)}
      <div class="res-card">
        <span class="res-name">{res.name}</span>
        <span class="res-amt">{fmt(getRes(res.id))}</span>
        <div class="res-actions">
          <label class="mini-toggle">
            <input type="checkbox"
              checked={autoRefine[res.id]}
              onchange={(e) => autoRefine[res.id] = (e.currentTarget as HTMLInputElement).checked}>
            <span class="mini-slider"></span>
          </label>
          <button class="refine-btn"
            onclick={() => doRefine(res.id)}
            disabled={!getRes(res.id).gte(25)}>
            EVOLVE
          </button>
        </div>
      </div>
    {/each}
  {:else}
    {#each advancedTrees as res (res.id)}
      <div class="res-card">
        <span class="res-name">{res.name}</span>
        <span class="res-amt">{fmt(getRes(res.id))}</span>
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
    background: var(--red); color: #fff;
    box-shadow: 0 0 10px hsl(0 100% 60% / 0.4); border-right: none;
  }
  .res-tabs button:hover:not(.active) { color:var(--text-0); background: hsl(0 100% 60% / 0.1); }

  .res-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; }
  .res-card {
    background:transparent; border:1px solid var(--line); padding:7px 6px;
    display:flex; flex-direction:column; align-items:center; gap:3px;
    position: relative;
  }
  .res-card::before, .res-card::after {
    content: ''; position: absolute;
    width: 4px; height: 4px; border: 1px solid var(--red);
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
  .mini-toggle input:checked + .mini-slider { background:var(--red); box-shadow: 0 0 5px var(--red); }
  .mini-toggle input:checked + .mini-slider::before { transform:translateX(10px); background:var(--text-0); }

  .refine-btn {
    background:transparent; border:1px solid var(--line); color:var(--text-2);
    font-size:0.55rem; padding:2px 6px; cursor:pointer; transition:all var(--fast);
    font-family:var(--font-hud); font-weight:600; letter-spacing:0.06em;
  }
  .refine-btn:hover:not(:disabled) { border-color:var(--red); color:var(--text-0); background: hsl(0 100% 60% / 0.1); box-shadow: 0 0 5px hsl(0 100% 60% / 0.4); }
  .refine-btn:disabled { opacity:0.3; cursor:not-allowed; }
</style>