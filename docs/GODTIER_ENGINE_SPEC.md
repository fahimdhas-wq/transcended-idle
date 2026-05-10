
# IDLE ENGINE v2 — Godtier Architecture Specification

## Philosophy

Build the fastest, most scalable browser idle-game engine possible. Every architectural decision is made for raw performance, zero GC pressure, and maximum parallelization. Features come second — the engine must never be the bottleneck.

---

## Layer Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RENDER LAYER                                  │
│  Svelte 5 Runes + Canvas/WebGL                                       │
│  Direct TypedArray reads (zero-copy from WASM memory)               │
│  Incremental UI scheduling (dirty-region sync)                       │
├─────────────────────────────────────────────────────────────────────┤
│                        BRIDGE LAYER                                 │
│  SharedArrayBuffer + Atomics                                         │
│  Direct Float64Array/Int32Array memory views                        │
│  No serialization, no postMessage, no cloning                        │
├─────────────────────────────────────────────────────────────────────┤
│                       WORKER LAYER                                   │
│  Coordinator Worker (main) → Simulation Workers (off thread)        │
│  Fixed-tick deterministic loop (20 TPS)                            │
│  Thread pool: Economy | Combat | Persistence                         │
├─────────────────────────────────────────────────────────────────────┤
│                        ENGINE LAYER                                 │
│  Rust → WASM (SIMD + packed memory)                                 │
│  Entity Component System (Sparse Set + SoA layout)                  │
│  Deterministic RNG (seeded Xoroshiro)                               │
│  Memory arenas (zero allocations per tick)                          │
│  Log-space arithmetic for late-game numbers                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Rust WASM Core

### File Structure

```
src_wasm/
├── Cargo.toml              ← Rust project
├── src/
│   ├── lib.rs             ← WASM entry points
│   ├── ecs/
│   │   ├── mod.rs
│   │   ├── components.rs   ← All component types
│   │   ├── systems.rs     ← ECS systems
│   │   └── storage.rs      ← Sparse Set storage
│   ├── decimal/
│   │   ├── mod.rs
│   │   ├── core.rs        ← Decimal mantissa/exponent
│   │   ├── ops.rs          ← add, sub, mul, div, pow
│   │   ├── cmp.rs          ← gte, lt, eq, cmp
│   │   └── math.rs         ← log, exp, normalize
│   ├── combat/
│   │   ├── mod.rs
│   │   ├── damage.rs       ← Damage calculation
│   │   ├── stats.rs        ← Stat aggregation
│   │   └── enemy.rs        ← Enemy generation
│   ├── economy/
│   │   ├── mod.rs
│   │   ├── resources.rs    ← Resource management
│   │   ├── production.rs   ← Production rates
│   │   └── costs.rs        ← Bulk cost formulas
│   ├── tick/
│   │   ├── mod.rs
│   │   ├── state.rs        ← World state (ECS)
│   │   └── loop.rs         ← Fixed-tick loop
│   └── memory/
│       ├── mod.rs
│       ├── buffer.rs       ← SharedArrayBuffer layout
│       └── arena.rs         ← Bump allocator
```

### Decimal Core

Custom Decimal (not Decimal.js) — compiled to WASM with no JS runtime:

```rust
#[derive(Copy, Clone)]
pub struct Decimal {
    pub m: f64,  // mantissa (1.0 <= |m| < 10.0)
    pub e: i32,  // exponent (powers of 10)
}
```

Operations in WASM:
- `add(a, b)` → normalized result
- `sub(a, b)` → normalized result
- `mul(a, b)` → add exponents, multiply mantissas
- `div(a, b)` → subtract exponents, divide mantissas
- `pow(base, exp)` → multiply exponent by exp
- `gte(a, b)` → compare without normalizing
- `log10(a)` → for log-space arithmetic
- `exp10(a)` → for log-space arithmetic

### ECS Storage (Sparse Set + SoA)

```
Component Arrays (SoA — Structure of Arrays):
┌─────────────────────────────────────────────────────┐
│ DECIMAL COMPONENTS                                  │
│ gold:      [d0,  d1,  d2,  d3,  ...]  Float64×N  │
│ xp:        [d0,  d1,  d2,  d3,  ...]              │
│ resources: [d0,  d1,  d2,  d3,  ...]              │
│ production:[d0,  d1,  d2,  d3,  ...]              │
│ costs:     [d0,  d1,  d2,  d3,  ...]              │
├─────────────────────────────────────────────────────┤
│ INT COMPONENTS                                     │
│ level:     [i0,  i1,  i2,  i3,  ...]  Int32×N    │
│ tier:      [i0,  i1,  i2,  i3,  ...]              │
│ flags:     [i0,  i1,  i2,  i3,  ...]              │
├─────────────────────────────────────────────────────┤
│ SPARSE SET INDEX                                   │
│ dense:     [entity_ids in active order]            │
│ sparse:    [positions in dense, -1 if inactive]    │
└─────────────────────────────────────────────────────┘
```

Benefits:
- Cache locality: all gold values adjacent in memory
- SIMD: process 4-8 Decimals in one instruction
- Zero pointer chasing
- O(1) component access
- Zero GC: fixed-size typed arrays

### Entity Types

```
Entity ID encoding:
┌──────────────────────────────────────────────────┐
│ 31 bits: sequential index                        │
│  1 bit:  generation (avoids stale IDs)           │
└──────────────────────────────────────────────────┘

Entity list:
- PLAYER: 1 entity
- ENEMIES: pool of 100 (reused)
- UPGRADES: pool of 500 (upgrade slots)
- RESOURCES: pool of 200 (resource types)
- AUTOMATIONS: pool of 50 (auto-upgrade slots)
```

---

## Phase 2: Worker Layer

### Thread Pool Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MAIN THREAD                               │
│  Svelte 5 UI                                                │
│  Canvas/WebGL renderer                                       │
│  Reads from SharedArrayBuffer (TypedArray views)            │
│  Sends commands via Atomics (no postMessage)               │
└────────────────┬────────────────────────────────────────────┘
                 │
      Atomics + SharedArrayBuffer
                 │
┌────────────────▼────────────────────────────────────────────┐
│              COORDINATOR WORKER                             │
│  Owns ECS world state                                       │
│  Routes simulation requests to threads                       │
│  Fixed 20 TPS tick loop                                     │
│  Manages dirty flags                                         │
└──────┬──────────────────┬──────────────────┬─────────────────┘
       │                  │                  │
┌──────▼──────┐   ┌───────▼──────┐   ┌──────▼──────────┐
│ ECONOMY     │   │ COMBAT       │   │ PERSISTENCE    │
│ WORKER      │   │ WORKER       │   │ WORKER         │
│             │   │              │   │                │
│ - Resources │   │ - Enemy HP   │   │ - Save/load   │
│ - Production│   │ - Damage     │   │ - Compress    │
│ - Costs     │   │ - Rewards   │   │ - Snapshots   │
│ - Upgrades  │   │ - Drops     │   │ - Offline     │
└─────────────┘   └──────────────┘   └────────────────┘
```

### Fixed-Tick Deterministic Loop

```rust
const TICK_RATE_HZ: f64 = 20.0;
const TICK_MS: f64 = 50.0;  // 20 TPS

fn game_loop(&mut self) {
    let mut accumulator = 0.0;
    let mut last_time = now_ms();

    loop {
        let current_time = now_ms();
        accumulator += current_time - last_time;
        last_time = current_time;

        // Cap to prevent spiral of death
        if accumulator > 200.0 { accumulator = 200.0; }

        while accumulator >= TICK_MS {
            self.simulate_tick();
            accumulator -= TICK_MS;
        }

        sleep(1);  // Yield to browser
    }
}
```

### Dirty-Region Synchronization

```rust
// In WASM: set dirty flags instead of syncing everything
fn buy_upgrade(&mut self, upgrade_id: u32, amount: u32) {
    // Mark specific components dirty (not whole state)
    self.dirty.upgrade_costs = true;
    self.dirty.gold = true;
    self.dirty.production_rates = true;
    self.dirty_flags[upgrade_id] = true;
}

// In JS: read only dirty regions
const dirtyView = new Int32Array(buffer, DIRTY_FLAGS_OFFSET, 1024);
if (dirtyView[DIRTY_GOLD]) {
    gold = goldView[0];  // Read directly from WASM memory
    dirtyView[DIRTY_GOLD] = 0;  // Clear flag
}
```

---

## Phase 3: Memory Layout

### SharedArrayBuffer Layout

```
SharedArrayBuffer (fixed layout, never reallocated):
┌─────────────────────────────────────────────────────────────────┐
│ OFFSET 0  — CONTROL BLOCK (64 bytes)                           │
│   0:   tick_count:      u64                                    │
│   8:   dirty_flags:     u64  (bitfield of changed regions)     │
│   16:  rng_seed:        u64                                    │
│   24:  game_speed:      f64                                    │
│   32:  accumulator:     f64                                    │
├─────────────────────────────────────────────────────────────────┤
│ OFFSET 64 — PLAYER STATE (256 bytes)                           │
│   64:  player_gold_m:   f64                                    │
│   72:  player_gold_e:   i32                                     │
│   80:  player_xp_m:     f64                                     │
│   88:  player_xp_e:     i32                                     │
│   ...                                                          │
├─────────────────────────────────────────────────────────────────┤
│ OFFSET 320 — UPGRADE POOL (N × 64 bytes)                       │
│   [id × 64 + 0]:  level:     i32                                │
│   [id × 64 + 4]:  tier:      i32                                │
│   [id × 64 + 8]:  cost_m:    f64                                │
│   [id × 64 + 16]: cost_e:    i32                                │
│   ...                                                          │
├─────────────────────────────────────────────────────────────────┤
│ OFFSET 320 + (N×64) — RESOURCE POOL (M × 32 bytes)             │
│   [id × 32 + 0]:  amount_m:  f64                                │
│   [id × 32 + 8]:  amount_e:  i32                                │
│   [id × 32 + 16]: rate_m:    f64                                │
│   [id × 32 + 24]: rate_e:    i32                                │
├─────────────────────────────────────────────────────────────────┤
│ OFFSET 320 + (N×64) + (M×32) — ENEMY POOL                      │
│   [id × 96 + 0]:  hp_m:     f64                                 │
│   ...                                                          │
└─────────────────────────────────────────────────────────────────┘

Total: ~1MB fixed buffer, zero allocations
```

---

## Phase 4: UI Bridge

### Svelte Reads Directly From Buffer

```svelte
<script>
  // Zero-copy: Svelte reads WASM memory directly
  const goldView = new Float64Array(wasmBuffer, GOLD_OFFSET, 1);
  const goldExpView = new Int32Array(wasmBuffer, GOLD_EXP_OFFSET, 1);
  const dirtyView = new Int32Array(wasmBuffer, DIRTY_FLAGS_OFFSET, 64);

  // Fine-grained: only re-render what changed
  let displayGold = $state('0');

  function renderLoop() {
    if (dirtyView[DIRTY_GOLD]) {
      displayGold = formatDecimal(goldView[0], goldExpView[0]);
      dirtyView[DIRTY_GOLD] = 0;
    }
    requestAnimationFrame(renderLoop);
  }

  // Send commands to WASM
  function buyUpgrade(id: number) {
    Atomics.store(cmdBuffer, 0, CMD_BUY_UPGRADE);
    Atomics.store(cmdBuffer, 1, id);
    Atomics.notify(cmdBuffer, 0, 1);
  }
</script>

<span class="gold">{displayGold}</span>
<button onclick={() => buyUpgrade(42)}>Buy</button>
```

### Incremental UI Scheduling

```
Panel update rates (not everything at 60fps):
┌─────────────────────────────────────┐
│ HP/XP bars       → 30 FPS          │
│ Gold/Resources   → 10 FPS          │
│ Upgrade costs     → 5 FPS (on buy)  │
│ Combat log        → 20 FPS          │
│ Settings panels   → 0 FPS (manual)  │
└─────────────────────────────────────┘
```

---

## Phase 5: Rendering

### Hybrid DOM + Canvas

```
Svelte (DOM):
├── All buttons
├── All panels
├── All menus
├── Upgrade grids (virtualized)
└── Settings

Canvas/WebGL:
├── Floating damage numbers
├── Particle effects
├── Progress bars (thousands)
├── Map/grid visuals
└── Skill tree connections
```

### Canvas Optimization

```typescript
// Batch rendering for thousands of floating numbers
function renderFloatingNumbers(ctx: CanvasRenderingContext2D, numbers: Float64Array) {
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';

    // Pre-compute all positions
    for (let i = 0; i < numbers.length; i += 4) {
        const x = numbers[i];
        const y = numbers[i + 1];
        const value = numbers[i + 2];
        const alpha = numbers[i + 3];
        ctx.globalAlpha = alpha;
        ctx.fillText(formatNumber(value), x, y);
    }
    ctx.globalAlpha = 1;
}
```

---

## Phase 6: Save System

### Binary Save Format

```
┌─────────────────────────────────────────────────────────────┐
│ SAVE FILE FORMAT                                           │
├─────────────────────────────────────────────────────────────┤
│ Header (16 bytes):                                         │
│   MAGIC:        u32  (0x49444C45 = "IDLE")                 │
│   VERSION:      u16                                        │
│   TICK:         u64     (tick count for verification)      │
├─────────────────────────────────────────────────────────────┤
│ Player (32 bytes):                                         │
│   gold_m, gold_e, xp_m, xp_e, level, ...                   │
├─────────────────────────────────────────────────────────────┤
│ Upgrades (N × 16 bytes):                                   │
│   [id, level, tier, ...] × N                               │
├─────────────────────────────────────────────────────────────┤
│ Resources (M × 16 bytes):                                  │
│   [amount_m, amount_e, rate_m, rate_e] × M                 │
├─────────────────────────────────────────────────────────────┤
│ RNG State (8 bytes):                                       │
│   seed: u64                                                │
└─────────────────────────────────────────────────────────────┘

Size: ~50KB (vs ~500KB JSON) — instant save/load
Compression: zstd ~90% ratio → ~5KB saves
```

---

## Implementation Phases

```
PHASE 1: Rust WASM Core (2-3 weeks)
  - Decimal system (all math ops)
  - ECS storage (Sparse Set + SoA)
  - Component definitions
  - WASM memory layout
  - wasm-bindgen exports

PHASE 2: Simulation (2 weeks)
  - Combat system (damage, rewards)
  - Economy system (resources, production)
  - Upgrade system (costs, purchase)
  - Fixed-tick loop with determinism

PHASE 3: Worker Layer (1-2 weeks)
  - Web Worker setup
  - SharedArrayBuffer bridge
  - Atomics synchronization
  - Dirty flag system
  - Thread pool coordination

PHASE 4: UI Bridge (1 week)
  - Svelte TypedArray bindings
  - Command queue (Atomics)
  - Incremental render scheduling
  - Panel update optimization

PHASE 5: Canvas Layer (1 week)
  - Floating number renderer
  - Particle system
  - Progress bar canvas rendering
  - Hybrid DOM/Canvas integration

PHASE 6: Persistence (1 week)
  - Binary save/load
  - zstd compression
  - Offline snapshot system
  - Version migration

TOTAL: 8-12 weeks (solo)
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language | Rust | Best WASM output, SIMD, zero-cost abstractions |
| Decimal | Custom (f64 mantissa) | 2x faster than Decimal.js, WASM-native |
| ECS | Sparse Set + SoA | Cache locality, SIMD-friendly, zero GC |
| Threading | Dedicated workers | Parallel simulation, main thread never blocked |
| Memory | SharedArrayBuffer | Zero-copy between worker and UI |
| Sync | Atomics only | No postMessage serialization |
| UI | Svelte 5 | Already built, fine-grained reactivity |
| Rendering | Canvas 2D | 10x faster than DOM for particles/numbers |
| Save | Binary + zstd | 100x smaller than JSON |
| Determinism | Seeded RNG | Reproducible replays, offline accuracy |

