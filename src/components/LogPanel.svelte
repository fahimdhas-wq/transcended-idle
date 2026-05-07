<script lang="ts">
  import { summaryState } from '../ui/LogPanelState.svelte.js';
  import { formatValue } from '../systems/formatValue.js';

  let mode = $state<'summary' | 'events'>('summary');

  function eventColor(type: string): string {
    if (type === 'loot')      return 'var(--neon-pink)';
    if (type === 'awakening') return 'var(--neon-red)';
    if (type === 'system')    return 'var(--neon-blue)';
    return 'var(--color-muted)';
  }
</script>

<div class="log-wrap">
  <div class="log-header">
    <button class="mode-btn" class:active={mode==='summary'} onclick={() => mode='summary'}>SUMMARY</button>
    <button class="mode-btn" class:active={mode==='events'}  onclick={() => mode='events'}>EVENTS</button>
    {#if summaryState.events.length > 0 && mode === 'summary'}
      <span class="event-badge">{summaryState.events.length}</span>
    {/if}
  </div>

  {#if mode === 'summary'}
    <div class="log-body">
      <div class="log-row current">
        <span class="lt">LIVE</span>
        <span class="lm">
          {formatValue(summaryState.live.kills)} Kills |
          {formatValue(summaryState.live.loot)} Drops |
          {formatValue(summaryState.live.levels)} Lvls |
          {formatValue(summaryState.live.verges)} Verges
        </span>
      </div>
      {#each summaryState.history as log, i (i)}
        <div class="log-row history">
          <span class="lt">[{log.time}]</span>
          <span class="lm">
            {formatValue(log.kills)} Kills |
            {formatValue(log.loot)} Drops |
            {formatValue(log.levels)} Lvls |
            {formatValue(log.verges)} Verges
          </span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="log-body">
      {#if summaryState.events.length === 0}
        <div class="no-events">No notable events yet...</div>
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
.log-wrap { height: 100%; display: flex; flex-direction: column; gap: 3px; }

.log-header {
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 3px;
  position: relative;
}
.mode-btn {
  font-family: var(--font-cyber);
  font-size: 0.55rem;
  padding: 2px 7px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-muted);
  cursor: pointer;
  letter-spacing: 1px;
  transition: 0.1s;
}
.mode-btn.active { border-color: var(--neon-blue); color: var(--neon-blue); }
.event-badge {
  font-size: 0.55rem;
  background: var(--neon-pink);
  color: #000;
  border-radius: 2px;
  padding: 0px 4px;
  font-family: var(--font-cyber);
  font-weight: bold;
  margin-left: 2px;
}

.log-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; gap: 2px; }

.log-row { display: flex; gap: 6px; font-size: 0.68rem; line-height: 1.3; }
.current .lt { color: var(--neon-pink); font-weight: bold; animation: pulse 1.5s infinite; }
.current .lm { color: var(--color-text); }
.history .lt { color: hsl(0, 0%, 35%); }
.history .lm { color: hsl(0, 0%, 52%); }
.lt { font-family: var(--font-cyber); font-size: 0.6rem; flex-shrink: 0; width: 35px; }

.event-row {
  font-size: 0.65rem;
  line-height: 1.4;
  font-family: var(--font-data);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.no-events { font-size: 0.65rem; color: var(--color-muted); font-family: var(--font-cyber); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}
</style>
