<script lang="ts">
  import { summaryState } from '../ui/LogPanelState.svelte.js';
  import { formatValue } from '../systems/formatValue.js';

  let mode = $state<'summary' | 'events'>('summary');

  function eventColor(type: string): string {
    if (type === 'loot') return 'var(--purple)';
    if (type === 'awakening') return 'var(--gold)';
    if (type === 'system') return 'var(--cyan)';
    if (type === 'danger') return 'var(--red)';
    if (type === 'success') return 'var(--green)';
    return 'var(--text-2)';
  }
</script>

<div class="log-wrap">
  <!-- Header -->
  <div class="log-header">
    <button class="mode-btn" class:active={mode === 'summary'} onclick={() => mode = 'summary'}>
      <span class="btn-icon">◈</span> STATS
    </button>
    <button class="mode-btn" class:active={mode === 'events'} onclick={() => mode = 'events'}>
      <span class="btn-icon">▸</span> EVENTS
    </button>
    {#if summaryState.events.length > 0 && mode === 'summary'}
      <span class="badge">{summaryState.events.length}</span>
    {/if}
  </div>

  <!-- Summary Mode -->
  {#if mode === 'summary'}
    <div class="log-body">
      <div class="live-row">
        <span class="live-indicator"></span>
        <span class="live-tag">LIVE</span>
        <span class="live-data">
          {formatValue(summaryState.live.kills)} K ·
          {formatValue(summaryState.live.loot)} D ·
          {formatValue(summaryState.live.levels)} L ·
          {formatValue(summaryState.live.verges)} V
        </span>
      </div>
      {#each summaryState.history as log, i (i)}
        <div class="log-row">
          <span class="row-tag">{log.time}</span>
          <span class="row-data">
            {formatValue(log.kills)} K ·
            {formatValue(log.loot)} D ·
            {formatValue(log.levels)} L ·
            {formatValue(log.verges)} V
          </span>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Events Mode -->
    <div class="log-body">
      {#if summaryState.events.length === 0}
        <div class="no-events">
          <span class="no-events-icon">◇</span>
          <span>NO EVENTS</span>
        </div>
      {:else}
        {#each summaryState.events as ev, i (ev.ts + '_' + i)}
          <div class="event-row" style="--event-color: {eventColor(ev.type)}">
            <span class="event-marker">▸</span>
            <span class="event-message">{ev.message}</span>
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
  overflow: hidden;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 5px 10px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text-2);
}

.mode-btn:hover {
  border-color: var(--cyan-bright);
  color: var(--cyan);
}

.mode-btn.active {
  background: hsl(185 100% 55% / 0.1);
  border-color: var(--cyan);
  color: var(--cyan);
}

.btn-icon {
  font-size: 0.6rem;
}

.badge {
  font-family: var(--font-data);
  font-size: 0.5rem;
  font-weight: 700;
  background: var(--purple);
  color: var(--text-0);
  padding: 2px 5px;
  margin-left: 4px;
}

.log-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.live-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: hsl(145 85% 55% / 0.08);
  border: 1px solid hsl(145 85% 55% / 0.2);
  margin-bottom: 4px;
}

.live-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px var(--green);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.live-tag {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--green);
}

.live-data {
  font-family: var(--font-data);
  font-size: 0.65rem;
  color: var(--text-0);
}

.log-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--line);
}

.row-tag {
  font-family: var(--font-hud);
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-2);
  flex-shrink: 0;
  width: 36px;
}

.row-data {
  font-family: var(--font-data);
  font-size: 0.6rem;
  color: var(--text-1);
}

.event-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 5px 6px;
  background: var(--bg-2);
  border-left: 2px solid var(--event-color);
}

.event-marker {
  font-family: var(--font-data);
  font-size: 0.6rem;
  color: var(--event-color);
  flex-shrink: 0;
}

.event-message {
  font-family: var(--font-data);
  font-size: 0.6rem;
  color: var(--text-0);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-events {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--text-2);
}

.no-events-icon {
  font-size: 1.5rem;
  opacity: 0.3;
}

.no-events span:last-child {
  font-family: var(--font-hud);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
</style>
