<script lang="ts">
  import { summaryState } from '../ui/LogPanelState.svelte.js';
  import { formatValue } from '../systems/formatValue.js';

  let mode = $state<'summary' | 'events'>('summary');

  function eventColor(type: string): string {
    if (type === 'loot')      return 'var(--accent-violet)';
    if (type === 'awakening') return 'var(--accent-amber)';
    if (type === 'system')    return 'var(--accent-steel)';
    return 'var(--color-muted)';
  }
</script>

<div class="log-wrap">

  <div class="log-header">
    <button class="mode-btn" class:active={mode === 'summary'} onclick={() => mode = 'summary'}>SUMMARY</button>
    <button class="mode-btn" class:active={mode === 'events'}  onclick={() => mode = 'events'}>EVENTS</button>
    {#if summaryState.events.length > 0 && mode === 'summary'}
      <span class="badge">{summaryState.events.length}</span>
    {/if}
  </div>

  {#if mode === 'summary'}
    <div class="log-body">
      <div class="log-row live">
        <span class="row-tag">LIVE</span>
        <span class="row-data">
          {formatValue(summaryState.live.kills)} K ·
          {formatValue(summaryState.live.loot)} D ·
          {formatValue(summaryState.live.levels)} L ·
          {formatValue(summaryState.live.verges)} V
        </span>
      </div>
      {#each summaryState.history as log, i (i)}
        <div class="log-row hist">
          <span class="row-tag muted">{log.time}</span>
          <span class="row-data muted">
            {formatValue(log.kills)} K ·
            {formatValue(log.loot)} D ·
            {formatValue(log.levels)} L ·
            {formatValue(log.verges)} V
          </span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="log-body">
      {#if summaryState.events.length === 0}
        <div class="no-events">NO EVENTS</div>
      {:else}
        {#each summaryState.events as ev (ev.ts)}
          <div class="event-row" style="color: {eventColor(ev.type)}">
            {ev.message}
          </div>
        {/each}
      {/if}
    </div>
  {/if}

</div>

<style>
.log-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 2px;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 5px;
  flex-shrink: 0;
}

.mode-btn {
  font-family: var(--font-display);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 3px 8px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-muted);
  cursor: pointer;
  transition: color var(--t-fast), border-color var(--t-fast);
}
.mode-btn:hover { color: var(--color-text); background: transparent; }
.mode-btn.active {
  color: var(--color-text);
  border-bottom-color: var(--accent-white);
  background: transparent;
}

.badge {
  font-family: var(--font-mono);
  font-size: 0.56rem;
  font-weight: 700;
  background: var(--accent-violet);
  color: var(--bg-dark);
  padding: 1px 5px;
  margin-left: 4px;
}

.log-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.log-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.64rem;
}

.row-tag {
  font-family: var(--font-display);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-warning);
  flex-shrink: 0;
  width: 38px;
}
.row-tag.muted { color: var(--color-dim); }

.row-data {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.row-data.muted { color: var(--color-muted); }

.hist .row-data { color: var(--color-muted); }

.event-row {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-events {
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--color-dim);
  text-transform: uppercase;
}
</style>
