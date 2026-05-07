let _totalGameTicks = 0;

/**
 * Read-only tick counter for non-reactive hot-path caching.
 * Avoids Svelte `$state` proxy invalidation every tick.
 */
export function getTotalTicks(): number {
  return _totalGameTicks;
}

export function incrementTotalTicks(): void {
  _totalGameTicks++;
}

export function addTotalTicks(val: number): void {
  _totalGameTicks += val;
}
