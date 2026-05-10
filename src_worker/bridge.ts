
// ============================================================
// WORKER BRIDGE — WASM Engine Connection
// Zero-copy memory reads from WASM
// ============================================================

// Memory offsets (must match WASM ecs.ts)
const OFF_GOLD = 0;
const OFF_XP = 8;
const OFF_LEVEL = 16;
const OFF_KILLS = 24;
const OFF_MOMENTUM = 32;
const OFF_OVERCHARGE = 40;
const OFF_SEALS = 48;
const OFF_AWAKENING = 52;
const OFF_ATK = 64;
const OFF_DEF = 72;
const OFF_HP = 80;
const OFF_MAX_HP = 88;
const OFF_CRIT = 96;
const OFF_ENEMY_HP = 104;
const OFF_ENEMY_MAX_HP = 112;
const OFF_ENEMY_ATK = 120;
const OFF_ENEMY_DEF = 128;
const OFF_ENEMY_LEVEL = 136;
const OFF_COMBAT_ACTIVE = 140;
const OFF_TICK_COUNT = 144;
const OFF_DIRTY_FLAGS = 152;

// Upgrade pool offsets
const UPGRADE_OFF = 256;
const UPGRADE_STRIDE = 32;
const MAX_UPGRADE_ID = 512;

// Resource pool
const RESOURCE_OFF = UPGRADE_OFF + UPGRADE_STRIDE * MAX_UPGRADE_ID;
const RESOURCE_STRIDE = 24;
const MAX_RESOURCE_ID = 256;

// Dirty flag indices
const DIRTY_GOLD = 0;
const DIRTY_XP = 1;
const DIRTY_LEVEL = 2;
const DIRTY_KILLS = 3;
const DIRTY_STATS = 4;
const DIRTY_ENEMY = 5;
const DIRTY_UPGRADE_BASE = 8;

// ============================================================
// ENGINE CLASS
// ============================================================

class Engine {
  private wasmInstance: WebAssembly.Instance | null = null;
  private memory: WebAssembly.Memory | null = null;
  private buffer: ArrayBuffer | null = null;
  private f64View: Float64Array | null = null;
  private i32View: Int32Array | null = null;
  private i64View: BigInt64Array | null = null;
  private u8View: Uint8Array | null = null;
  private ready = false;

  async init(): Promise<void> {
    try {
      // Load WASM
      const response = await fetch('/engine.wasm');
      if (!response.ok) {
        throw new Error(`Failed to fetch WASM: ${response.status}`);
      }
      const bytes = await response.arrayBuffer();

      const importObject = {
        env: {
          memory: new WebAssembly.Memory({ initial: 16, maximum: 256 }),
          abort: (msg: number, file: number, line: number, col: number) => {
            console.error(`WASM abort at ${line}:${col}`);
          }
        }
      };

      const result = await WebAssembly.instantiate(bytes, importObject);
      this.wasmInstance = result.instance;
      this.memory = importObject.env.memory as WebAssembly.Memory;
      this.buffer = this.memory.buffer;

      // Set up typed array views for zero-copy reads
      this.f64View = new Float64Array(this.buffer);
      this.i32View = new Int32Array(this.buffer);
      this.i64View = new BigInt64Array(this.buffer);
      this.u8View = new Uint8Array(this.buffer);

      // Initialize world
      const exports = this.wasmInstance.exports as Record<string, Function>;
      if (exports['world_init']) {
        (exports['world_init'] as () => void)();
      }
      if (exports['combat_spawnEnemy']) {
        (exports['combat_spawnEnemy'] as (level: number) => number)(1);
      }

      this.ready = true;
      console.log('[ENGINE] WASM initialized successfully');
    } catch (e) {
      console.error('[ENGINE] Failed to initialize WASM:', e);
      this.ready = false;
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  // ============================================================
  // EXECUTE WORLD TICKS
  // ============================================================

  tick(ticks: number): number {
    if (!this.ready || !this.wasmInstance) return 0;
    const exports = this.wasmInstance.exports as Record<string, Function>;
    const fn = exports['world_tick'] as (t: number) => number;
    return fn(ticks);
  }

  // ============================================================
  // PLAYER STATE (zero-copy from WASM memory)
  // ============================================================

  getGold(): number {
    if (!this.f64View || !this.ready) return 0;
    return this.f64View[OFF_GOLD / 8];
  }

  setGold(value: number): void {
    if (!this.f64View || !this.ready) return;
    this.f64View[OFF_GOLD / 8] = value;
    this.markDirty(DIRTY_GOLD);
  }

  addGold(value: number): void {
    if (!this.f64View || !this.ready) return;
    this.f64View[OFF_GOLD / 8] += value;
    this.markDirty(DIRTY_GOLD);
  }

  getXP(): number {
    if (!this.f64View || !this.ready) return 0;
    return this.f64View[OFF_XP / 8];
  }

  setXP(value: number): void {
    if (!this.f64View || !this.ready) return;
    this.f64View[OFF_XP / 8] = value;
    this.markDirty(DIRTY_XP);
  }

  getLevel(): number {
    if (!this.i32View || !this.ready) return 1;
    return this.i32View[OFF_LEVEL / 4];
  }

  getKills(): bigint {
    if (!this.i64View || !this.ready) return 0n;
    return this.i64View[OFF_KILLS / 8];
  }

  getMomentum(): number {
    if (!this.f64View || !this.ready) return 0;
    return this.f64View[OFF_MOMENTUM / 8];
  }

  getOvercharge(): number {
    if (!this.f64View || !this.ready) return 0;
    return this.f64View[OFF_OVERCHARGE / 8];
  }

  getSeals(): number {
    if (!this.i32View || !this.ready) return 0;
    return this.i32View[OFF_SEALS / 4];
  }

  // ============================================================
  // COMBAT STATS (zero-copy)
  // ============================================================

  getAtk(): number {
    if (!this.f64View || !this.ready) return 0;
    return this.f64View[OFF_ATK / 8];
  }

  getDef(): number {
    if (!this.f64View || !this.ready) return 0;
    return this.f64View[OFF_DEF / 8];
  }

  getHP(): number {
    if (!this.f64View || !this.ready) return 0;
    return this.f64View[OFF_HP / 8];
  }

  getMaxHP(): number {
    if (!this.f64View || !this.ready) return 100;
    return this.f64View[OFF_MAX_HP / 8];
  }

  getCrit(): number {
    if (!this.f64View || !this.ready) return 0.01;
    return this.f64View[OFF_CRIT / 8];
  }

  // ============================================================
  // ENEMY STATE (zero-copy)
  // ============================================================

  getEnemyHP(): number {
    if (!this.f64View || !this.ready) return 0;
    return this.f64View[OFF_ENEMY_HP / 8];
  }

  getEnemyMaxHP(): number {
    if (!this.f64View || !this.ready) return 1;
    return this.f64View[OFF_ENEMY_MAX_HP / 8];
  }

  getEnemyAtk(): number {
    if (!this.f64View || !this.ready) return 0;
    return this.f64View[OFF_ENEMY_ATK / 8];
  }

  getEnemyDef(): number {
    if (!this.f64View || !this.ready) return 0;
    return this.f64View[OFF_ENEMY_DEF / 8];
  }

  getEnemyLevel(): number {
    if (!this.i32View || !this.ready) return 0;
    return this.i32View[OFF_ENEMY_LEVEL / 4];
  }

  isCombatActive(): boolean {
    if (!this.i32View || !this.ready) return false;
    return this.i32View[OFF_COMBAT_ACTIVE / 4] !== 0;
  }

  // ============================================================
  // WORLD METRICS
  // ============================================================

  getTickCount(): bigint {
    if (!this.i64View || !this.ready) return 0n;
    return this.i64View[OFF_TICK_COUNT / 8];
  }

  // ============================================================
  // UPGRADE POOL (zero-copy)
  // ============================================================

  getUpgradeLevel(id: number): number {
    if (!this.i32View || !this.ready) return 0;
    if (id < 0 || id >= MAX_UPGRADE_ID) return 0;
    const offset = UPGRADE_OFF + id * UPGRADE_STRIDE;
    return this.i32View[offset / 4];
  }

  setUpgradeLevel(id: number, level: number): void {
    if (!this.i32View || !this.ready) return;
    if (id < 0 || id >= MAX_UPGRADE_ID) return;
    const offset = UPGRADE_OFF + id * UPGRADE_STRIDE;
    this.i32View[offset / 4] = level;
    this.markDirty(DIRTY_UPGRADE_BASE + id);
  }

  getUpgradeCostBase(id: number): number {
    if (!this.f64View || !this.ready) return 0;
    if (id < 0 || id >= MAX_UPGRADE_ID) return 0;
    const offset = UPGRADE_OFF + id * UPGRADE_STRIDE + 4;
    return this.f64View[offset / 8];
  }

  getUpgradeCostGain(id: number): number {
    if (!this.f64View || !this.ready) return 0;
    if (id < 0 || id >= MAX_UPGRADE_ID) return 0;
    const offset = UPGRADE_OFF + id * UPGRADE_STRIDE + 12;
    return this.f64View[offset / 8];
  }

  getUpgradeCostType(id: number): number {
    if (!this.i32View || !this.ready) return 0;
    if (id < 0 || id >= MAX_UPGRADE_ID) return 0;
    const offset = UPGRADE_OFF + id * UPGRADE_STRIDE + 20;
    return this.i32View[offset / 4];
  }

  setUpgradeCostParams(id: number, base: number, gain: number, type: number): void {
    if (!this.i32View || !this.f64View || !this.ready) return;
    if (id < 0 || id >= MAX_UPGRADE_ID) return;
    const off = UPGRADE_OFF + id * UPGRADE_STRIDE + 4;
    this.f64View[off / 8] = base;
    this.f64View[(off + 8) / 8] = gain;
    this.i32View[(off + 16) / 4] = type;
  }

  // ============================================================
  // RESOURCE POOL (zero-copy)
  // ============================================================

  getResourceAmount(id: number): number {
    if (!this.f64View || !this.ready) return 0;
    if (id < 0 || id >= MAX_RESOURCE_ID) return 0;
    const offset = RESOURCE_OFF + id * RESOURCE_STRIDE;
    return this.f64View[offset / 8];
  }

  setResourceAmount(id: number, value: number): void {
    if (!this.f64View || !this.ready) return;
    if (id < 0 || id >= MAX_RESOURCE_ID) return;
    const offset = RESOURCE_OFF + id * RESOURCE_STRIDE;
    this.f64View[offset / 8] = value;
  }

  getResourceRate(id: number): number {
    if (!this.f64View || !this.ready) return 0;
    if (id < 0 || id >= MAX_RESOURCE_ID) return 0;
    const offset = RESOURCE_OFF + id * RESOURCE_STRIDE + 8;
    return this.f64View[offset / 8];
  }

  setResourceRate(id: number, value: number): void {
    if (!this.f64View || !this.ready) return;
    if (id < 0 || id >= MAX_RESOURCE_ID) return;
    const offset = RESOURCE_OFF + id * RESOURCE_STRIDE + 8;
    this.f64View[offset / 8] = value;
  }

  // ============================================================
  // COST CALCULATIONS (WASM)
  // ============================================================

  calcLinearCost(level: number, amount: number, base: number, gain: number): number {
    if (!this.wasmInstance || !this.ready) return 0;
    const exports = this.wasmInstance.exports as Record<string, Function>;
    const fn = exports['cost_linear'] as (l: number, a: number, b: number, g: number) => number;
    return fn(level, amount, base, gain);
  }

  calcGeometricCost(level: number, amount: number, base: number, mult: number): number {
    if (!this.wasmInstance || !this.ready) return 0;
    const exports = this.wasmInstance.exports as Record<string, Function>;
    const fn = exports['cost_geometric'] as (l: number, a: number, b: number, m: number) => number;
    return fn(level, amount, base, mult);
  }

  calcMaxAffordableLinear(budget: number, level: number, base: number, gain: number): number {
    if (!this.wasmInstance || !this.ready) return 0;
    const exports = this.wasmInstance.exports as Record<string, Function>;
    const fn = exports['cost_maxAffordable_linear'] as (b: number, l: number, ba: number, g: number) => number;
    return fn(budget, level, base, gain);
  }

  // ============================================================
  // STAT AGGREGATION (WASM)
  // ============================================================

  aggregateStats(
    baseAtk: number, baseDef: number, baseHP: number, baseCrit: number,
    omniMult: number, soulMult: number, awakenMult: number,
    bestiaryMult: number, overclockMult: number,
    sealCount: number
  ): void {
    if (!this.wasmInstance || !this.ready) return;
    const exports = this.wasmInstance.exports as Record<string, Function>;
    const fn = exports['stats_aggregate'] as (
      a: number, b: number, c: number, d: number,
      e: number, f: number, g: number,
      h: number, i: number,
      j: number
    ) => void;
    fn(baseAtk, baseDef, baseHP, baseCrit, omniMult, soulMult, awakenMult, bestiaryMult, overclockMult, sealCount);
  }

  // ============================================================
  // COMBAT (WASM)
  // ============================================================

  spawnEnemy(playerLevel: number): void {
    if (!this.wasmInstance || !this.ready) return;
    const exports = this.wasmInstance.exports as Record<string, Function>;
    const fn = exports['combat_spawnEnemy'] as (level: number) => number;
    fn(playerLevel);
  }

  combatTick(): number {
    if (!this.wasmInstance || !this.ready) return 0;
    const exports = this.wasmInstance.exports as Record<string, Function>;
    const fn = exports['combat_tick'] as () => number;
    return fn();
  }

  // ============================================================
  // DIRTY FLAGS (for incremental UI)
  // ============================================================

  markDirty(flag: number): void {
    if (!this.i32View || !this.ready) return;
    if (flag >= 0 && flag < 16) {
      this.i32View[(OFF_DIRTY_FLAGS + flag * 4) / 4] = 1;
    }
  }

  getDirtyFlags(): number {
    if (!this.i32View || !this.ready) return 0;
    let flags = 0;
    for (let i = 0; i < 16; i++) {
      flags |= this.i32View[(OFF_DIRTY_FLAGS + i * 4) / 4];
    }
    return flags;
  }

  clearDirty(flag: number): void {
    if (!this.i32View || !this.ready) return;
    if (flag >= 0 && flag < 16) {
      this.i32View[(OFF_DIRTY_FLAGS + flag * 4) / 4] = 0;
    }
  }

  clearAllDirty(): void {
    if (!this.i32View || !this.ready) return;
    for (let i = 0; i < 16; i++) {
      this.i32View[(OFF_DIRTY_FLAGS + i * 4) / 4] = 0;
    }
  }
}

// ============================================================
// SINGLETON
// ============================================================

let _engine: Engine | null = null;

export function getEngine(): Engine {
  if (!_engine) {
    _engine = new Engine();
  }
  return _engine;
}

export async function initEngine(): Promise<void> {
  const engine = getEngine();
  await engine.init();
}

// ============================================================
// FORMAT HELPERS
// ============================================================

export function formatNumber(n: number): string {
  if (n === 0) return '0';
  if (!isFinite(n)) return '∞';
  if (n >= 1e15) return n.toExponential(2);
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  if (n < 0.01 && n !== 0) return n.toExponential(2);
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatBigInt(n: bigint): string {
  const num = Number(n);
  if (num >= 1e15) return num.toExponential(2);
  return num.toLocaleString('en-US');
}
