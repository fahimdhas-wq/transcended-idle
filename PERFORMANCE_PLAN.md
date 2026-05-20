# TRANSCENDED — Absolute Performance Architecture Plan

**Date:** 2026-05-20
**Context:** Idle RPG at level 1.5M endgame, complex math (Decimal with exponents up to 1e93450), DOM-based rendering, main thread blocking.

---

## Current State

| Metric | Value |
|--------|-------|
| Files using `Decimal` | 55 files, ~322+ references |
| `$state()` singletons | 20 across 16 module files |
| Game loop | 10 TPS via `setInterval` on **main thread** |
| Rendering | Full DOM (Svelte reactivity → layout → paint) |
| Math model | `{m, e}` Decimal objects — **new allocation per op** |
| GC pressure | ~700 allocs/sec → minor GC every 2-3s |
| Main thread cost | 6-13ms per 100ms tick (logic + reactivity + DOM) |
| 2000 batch ticks | **~300ms freeze** on tab return |
| 30-day offline | **~800ms freeze** |

---

## Principle

**Build the new engine IN PARALLEL with existing code. Zero existing files touched until new engine is verified.** The game keeps working through every phase. Every phase is independently useful. You can abandon at any phase.

---

## Phase 0: Benchmark Harness (2 days)

**What:** Create a truth oracle that captures current game behavior at endgame.

**Files to create:**
```
src/engine/bench/GameOracle.ts     # Records state snapshots
src/engine/bench/benchmark.ts      # Automated perf + correctness tests
```

**How:** Run game at level 1.5M with 2402 seals. Capture:
- `getEffectiveCombatStats()` result (all fields)
- 1 tick of combat output (kills, xp gained, resources)
- 30 day offline output (kills, levels, resources)
- Memory allocation count per tick
- GC pause duration

**Result:** A test suite that the new engine must match EXACTLY. No guessing about correctness.

**Risk:** None. Read-only. No existing files touched.

---

## Phase 1: F64 Math Library (3 days)

**What:** Replace Decimal's `{m, e}` objects with `[m, e]` tuple math using Float64Array storage. Zero allocations in hot path.

**Files to create:**
```
src/engine/math/F64.ts              # F64 type + ops
src/engine/math/F64Pool.ts          # Mutable pool for temp values  
src/engine/math/F64Vector.ts        # Bulk operations on Float64Arrays
src/engine/math/F64Legacy.ts        # Bidirectional conversion to/from Decimal
src/engine/math/index.ts
```

**F64 design:**
```typescript
// One Float64Array = packed [m, e, m, e, m, e, ...]
// Operations write to pre-allocated slots, no object creation

function fmul(out: number, a: number, b: number, buf: Float64Array): void {
  const m = buf[a] * buf[b]
  const e = buf[a+1] + buf[b+1]
  if (m >= 10 || (m < 1 && m > 0)) {
    const shift = Math.floor(Math.log10(Math.abs(m)))
    buf[out] = m / 10**shift
    buf[out+1] = e + shift
  } else {
    buf[out] = m
    buf[out+1] = e
  }
}
```

**F64Legacy adapter** — converts between F64 tuples and existing `Decimal` objects so the new engine can cross-check against the old:

```typescript
function f64ToDecimal(m: number, e: number): Decimal
function decimalToF64(d: Decimal): [number, number]
```

**Benchmark target:**
| Operation | Current | Target | Gain |
|-----------|---------|--------|------|
| `xpNeeded` | 4.39μs | <0.3μs | ~15x |
| `combatStats` | 3.27μs | <0.2μs | ~16x |
| `offlineCombat` | 7.49μs/iter | <0.5μs/iter | ~15x |
| GC | ~700 allocs/sec | 0 allocs | ∞ |

**Existing files touched:** None.

---

## Phase 2: Pure Engine — Combat (5 days)

**What:** Rewrite combat system as pure functions with zero Svelte dependency.

**Files to create:**
```
src/engine/pure/state.ts            # GameState interface (plain data)
src/engine/pure/combat/types.ts     # CombatState, CombatStats types
src/engine/pure/combat/stats.ts     # getEffectiveCombatStats() — pure F64 version
src/engine/pure/combat/tick.ts      # performCombatTick() — pure F64 version
src/engine/pure/combat/offline.ts   # processOfflineCombat() — pure F64 version
src/engine/pure/combat/index.ts
```

**GameState interface** — plain data, no `$state`, no Svelte, no imports:
```typescript
interface GameState {
  character: CharacterData     // level: [m,e], xp: [m,e], kills: [m,e], ...
  combat: CombatData           // enemy, kill count
  mining: GatheringData        // Float64Array-backed resources
  forestry: GatheringData
  skills: SkillsData           // skill tiers
  bestiary: BestiaryData       // per-mob kill counts
  ascension: PrestigeData
  // ... all engine state
}
```

**Pure combat tick:**
```typescript
function processCombatTick(
  state: GameState,
  ticks: number,
  mathBuf: Float64Array
): {
  diff: Partial<GameState>     // what changed
  events: GameEvent[]          // logs, UI notifications
}
```

**Verification:** Run combat tick through existing code AND new pure engine. Compare outputs. Must match exactly against Phase 0 oracle.

**Existing files touched:** None.

---

## Phase 3: Pure Engine — Mining + Forestry (4 days)

**Files to create:**
```
src/engine/pure/gathering/types.ts
src/engine/pure/gathering/mining.ts
src/engine/pure/gathering/forestry.ts
src/engine/pure/gathering/offline.ts
src/engine/pure/gathering/index.ts
```

Mining/forestry already use Float64Array for resources. Pure version extends F64 math to ALL calculations (energy, speed, yields, refining chains).

**Existing files touched:** None.

---

## Phase 4: Full Engine — Skills + Ascension + Bestiary + Rewards (6 days)

**Files to create:**
```
src/engine/pure/skills/
src/engine/pure/ascension/
src/engine/pure/bestiary/
src/engine/pure/rewards/
src/engine/pure/orchestrator/PureEngine.ts
src/engine/pure/offline/
src/engine/pure/index.ts
```

**Pure orchestrator:**
```typescript
class PureEngine {
  private state: GameState
  private mathBuf: Float64Array   // pre-allocated workspace

  tick(ticks: number): EngineOutput {
    // combat → mining → forestry → rewards → achievements
    // All F64 math, zero GC, no Svelte
  }

  processOffline(ms: number): OfflineResult {
    // Same as tick but for offline period
  }

  getSnapshot(): FrozenSnapshot {
    // Structured-clone ready (postMessage-safe)
  }
}
```

**Verification:** Run 1000 ticks + 30-day offline through both old and new engine. Outputs match exactly.

**Existing files touched:** None.

---

## Phase 5: Web Worker Integration (5 days) ⭐ BIGGEST WIN

**What:** Move PureEngine to a Web Worker. Main thread never blocks.

**Files to create:**
```
src/workers/engine.worker.ts       # Web Worker entry
src/workers/workerProtocol.ts      # Typed message definitions
src/workers/workerPool.ts          # Lifecycle management
src/workers/snapshotCache.ts       # Snapshot diffing (skip unchanged fields)
```

**Communication protocol:**
```
MAIN → WORKER:
  { type: 'TICK', count: number }
  { type: 'OFFLINE', ms: number }
  { type: 'ACTION', name: string, args: any[] }

WORKER → MAIN:
  { type: 'SNAPSHOT', state: FrozenGameState, tickId: number }
  { type: 'EVENTS', events: GameEvent[] }
  { type: 'OFFLINE_RESULT', result: OfflineSummary }
```

**Snapshot diffing:** Only send changed values. If combat didn't change, skip it. Reduces structured clone cost by ~90%.

**Fallback:** If Worker fails, game falls back to existing `gameLoop.svelte.ts`. Zero breakage risk.

**Changes to existing files:**
- `src/core/gameLoop.svelte.ts` — Add toggle: `useWorker ? startWorker() : startExistingLoop()`

**Result:**
| Before | After |
|--------|-------|
| Main thread blocked 6-13ms per tick | **0ms — Worker handles everything** |
| 2000 batch ticks = 300ms freeze | **0ms — UI never waits** |
| 30-day offline = 800ms freeze | **0ms — Worker processes in background** |

---

## Phase 6: Canvas Rendering (5 days)

**What:** Replace DOM for hot-updating values with Canvas. Svelte still handles menus/settings/static panels.

**Files to create:**
```
src/components/GameCanvas.svelte     # Canvas overlay component
src/systems/canvasRenderer.ts        # Draw text, bars, icons
src/systems/canvasTheme.ts           # Cyberpunk color palette
```

**Architecture:**
```
┌──────────────────────────────────────┐
│ Svelte Component Tree (menus, panes) │
├──────────────────────────────────────┤
│ Canvas Overlay (HP, resources, bars) │
└──────────────────────────────────────┘
```

Svelte: settings, menus, achievements, inventory (static, rarely changes)
Canvas: HP bar, resource counters, XP bar, combat log, damage numbers (updates every tick)

**Migration:** Start small — just XP bar + HP bar on Canvas. Opt-in per component.

**Result:** 5-10ms/frame DOM cost → 1-2ms Canvas cost. Stable 60fps.

**Existing files touched:** Components can optionally use `<GameCanvas>` — no mandatory changes.

---

## Phase 7: WASM Offline Engine (5 days — OPTIONAL)

**What:** Compile offline batch processing to WASM.

**Stack:** AssemblyScript (NOT Rust — compiles in ~2 seconds, TypeScript syntax).

**Files to create:**
```
src/wasm/offline.ts              # AssemblyScript offline processor
src/wasm/offlineBridge.ts        # JS ↔ WASM bridge
```

**What WASM handles:** Only heaviest batch ops — offline combat (thousands of kills), level-up binary search (thousands of iterations), bulk reward calculation. These are loops over pure float math — WASM's sweet spot (20-50x over JS for numeric loops).

**Fallback:** PureEngine JS path used if WASM unavailable. Zero breakage.

**Result:** 30-day offline: ~10ms (WASM) vs ~50ms (JS F64).

---

## Phase 8: Cross-Platform Packaging (5 days)

**Files to create/modify:**
```
capacitor.config.ts              # Capacitor config
electron/                        # Electron main process
electron-builder.yml             # Build config
package.json                     # Add scripts
```

**Mobile:** Capacitor wraps built web app as Android/iOS native app.
**Desktop:** Electron provides native window, system tray, auto-updates.

**Build command:**
```bash
npm run build:all    # Web + Capacitor mobile + Electron desktop
```

---

## Timeline

```
Phase 0: Benchmark              ██           2 days
Phase 1: F64 Math               ███          3 days
Phase 2: Pure Combat            █████        5 days
Phase 3: Pure Gathering         ████         4 days
Phase 4: Full Engine            ██████       6 days
Phase 5: Web Worker             █████        5 days     ⬅ BIGGEST WIN
Phase 6: Canvas UI              █████        5 days
Phase 7: WASM (optional)        █████        5 days
Phase 8: Packaging              █████        5 days
──────────────────────────────────────────
Total:                          40 days
```

## Performance Projections

| Metric | Current | After Phase 5 | After All |
|--------|---------|---------------|-----------|
| Math per tick | 100μs | 6μs (F64) | 2-3μs |
| Main thread blocking | 6-13ms/tick | **0ms** (Worker) | **0ms** |
| 2000 batch ticks | **300ms freeze** | **0ms** | **0ms** |
| 30-day offline | **800ms freeze** | ~50ms (Worker) | ~10ms (Worker+WASM) |
| GC pauses | 1-3ms every 2s | **0** (no allocs) | **0** |
| DOM render cost | 5-10ms/frame | 5-10ms/frame | 1-2ms/frame (Canvas) |
| Frame drops on tick | Frequent | **Never** | **Never** |
| Tab return smoothness | Janky | **Buttery** | **Buttery** |

## What NEVER changes

The existing code in `src/modules/`, `src/core/`, `src/systems/`, `src/components/` — **none of it is modified during Phases 0-7.** The new engine runs as a parallel system. When Phase 5 activates the Worker, the old game loop stays as a fallback.

You can abandon refactor at any phase. The game still works. Every phase is independently useful.

---

## File Structure After All Phases

```
src/
├── engine/                      # NEW — parallel engine
│   ├── math/                    # F64 math library
│   │   ├── F64.ts
│   │   ├── F64Pool.ts
│   │   ├── F64Vector.ts
│   │   ├── F64Legacy.ts
│   │   └── index.ts
│   ├── pure/                    # Pure engine (no Svelte, no $state)
│   │   ├── state.ts             # GameState interface
│   │   ├── combat/
│   │   ├── gathering/
│   │   ├── skills/
│   │   ├── ascension/
│   │   ├── bestiary/
│   │   ├── rewards/
│   │   ├── orchestrator/        # PureEngine class
│   │   ├── offline/
│   │   └── index.ts
│   ├── bench/                   # Benchmark harness
│   │   ├── GameOracle.ts
│   │   └── benchmark.ts
│   └── index.ts
├── workers/                     # NEW — Web Workers
│   ├── engine.worker.ts
│   ├── workerProtocol.ts
│   ├── workerPool.ts
│   └── snapshotCache.ts
├── wasm/                        # NEW (optional)
│   ├── offline.ts
│   └── offlineBridge.ts
├── systems/
│   ├── canvasRenderer.ts        # NEW
│   └── canvasTheme.ts           # NEW
├── components/
│   ├── GameCanvas.svelte        # NEW
│   └── ...                      # EXISTING — unchanged
├── modules/                     # EXISTING — unchanged
├── core/                        # EXISTING — unchanged (minor toggle in gameLoop)
├── stores/                      # EXISTING — unchanged
└── ...                          # EXISTING — unchanged
```

## Verification Flow

```
Phase 0 Oracle (current behavior)
       │
       ▼
Phase 1 F64 Math ──── test against Oracle ──── pass
       │
       ▼
Phase 2 Pure Combat ── test against Oracle ──── pass
       │
       ▼
Phase 3 Pure Gathering ─ test against Oracle ──── pass
       │
       ▼
Phase 4 Full Engine ─── test against Oracle ──── pass
       │
       ▼
Phase 5 Worker ─────── test against Oracle ──── pass
       │
       ▼
Phase 6 Canvas ─────── visually identical ───── pass
       │
       ▼
Phase 7 WASM ───────── test against Oracle ──── pass
       │
       ▼
Phase 8 Packaging ──── builds for all platforms ─ pass
```

Each phase MUST pass verification before the next begins. No guessing. No "close enough." Exact match against recorded behavior.
