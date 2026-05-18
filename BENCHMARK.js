// BENCHMARK: Current game math performance
// Run with: node BENCHMARK.js

class Decimal {
  constructor(m, e = 0) {
    if (m instanceof Decimal) { this.m = m.m; this.e = m.e; return; }
    if (typeof m === 'number' && !Number.isFinite(m)) { this.m = 1; this.e = 308; return; }
    if (m < 1 && m > 0) { this.m = m * 10; this.e = e - 1; return; }
    if (m >= 10) { const log10 = Math.floor(Math.log10(m)); this.m = m / Math.pow(10, log10); this.e = e + log10; return; }
    if (m === 0) { this.m = 0; this.e = 0; return; }
    this.m = m; this.e = e;
  }
  static get TEN() { return new Decimal(1, 1); }
  static get ONE() { return new Decimal(1, 0); }
  static get ZERO() { return new Decimal(0, 0); }
  mul(o) {
    o = o instanceof Decimal ? o : new Decimal(o);
    let nm = this.m * o.m;
    let ne = this.e + o.e;
    if (nm >= 10) { nm /= 10; ne++; }
    if (nm < 1 && nm > 0) { nm *= 10; ne--; }
    return new Decimal(nm, ne);
  }
  div(o) {
    o = o instanceof Decimal ? o : new Decimal(o);
    let nm = this.m / o.m;
    let ne = this.e - o.e;
    if (nm < 1 && nm > 0) { nm *= 10; ne--; }
    if (nm >= 10) { nm /= 10; ne++; }
    return new Decimal(nm, ne);
  }
  add(o) {
    o = o instanceof Decimal ? o : new Decimal(o);
    if (this.e > o.e + 15) return new Decimal(this.m, this.e);
    if (o.e > this.e + 15) return new Decimal(o.m, o.e);
    const diff = this.e - o.e;
    let nm, ne;
    if (diff >= 0) { nm = this.m + o.m * Math.pow(10, -diff); ne = this.e; }
    else { nm = o.m + this.m * Math.pow(10, diff); ne = o.e; }
    if (nm >= 10) { nm /= 10; ne++; }
    return new Decimal(nm, ne);
  }
  sub(o) {
    o = o instanceof Decimal ? o : new Decimal(o);
    const diff = this.e - o.e;
    let nm, ne;
    if (diff >= 0) { nm = this.m - o.m * Math.pow(10, -diff); ne = this.e; }
    else { nm = o.m - this.m * Math.pow(10, diff); ne = o.e; }
    if (nm < 1 && nm > 0) { nm *= 10; ne--; }
    return new Decimal(nm, ne);
  }
  pow(n) {
    if (n instanceof Decimal) n = n.m * Math.pow(10, n.e);
    if (n === 0) return Decimal.ONE;
    if (n === 1) return this;
    const logResult = Math.log10(this.m) + this.e;
    const newE = Math.floor(n * logResult);
    const frac = n * logResult - newE;
    const newM = Math.pow(10, frac);
    return new Decimal(newM, newE);
  }
  gte(o) { o = o instanceof Decimal ? o : new Decimal(o); return this.e > o.e || (this.e === o.e && this.m >= o.m); }
  lt(o) { return !this.gte(o); }
  toNumber() { return this.m * Math.pow(10, this.e); }
  toString() { return this.m.toFixed(3) + 'e' + this.e; }
}

// Simulate player at level 1.5e6 with max seals
const LEVEL = 1500000;
const SEALS = 2402;
const SOULS = 500;

// Helper: random between -1 and 1
function randOffset() { return (Math.random() * 2) - 1; }

// ============ BENCHMARK 1: XP Needed ============
function xpNeeded(level) {
  const expGrowth = new Decimal(1.001).pow(level - 1);
  const polyGrowth = new Decimal(Math.max(1, Math.pow(level, 2)));
  return Decimal.TEN.mul(expGrowth).mul(polyGrowth);
}

console.log('=== BENCHMARK 1: xpNeeded (10,000 calls) ===');
const start1 = process.hrtime.bigint();
for (let i = 0; i < 10000; i++) {
  xpNeeded(LEVEL + i);
}
const end1 = process.hrtime.bigint();
const ms1 = Number(end1 - start1) / 1e6;
console.log(`  Total: ${ms1.toFixed(2)}ms`);
console.log(`  Per call: ${(ms1 / 10000 * 1000).toFixed(2)}μs`);
console.log(`  Result: ${xpNeeded(LEVEL).toString()}`);
console.log();

// ============ BENCHMARK 2: Stat Growth ============
function statGrowth(level) {
  return new Decimal(1.15).pow(level - 1);
}

console.log('=== BENCHMARK 2: statGrowth (10,000 calls) ===');
const start2 = process.hrtime.bigint();
for (let i = 0; i < 10000; i++) {
  statGrowth(LEVEL + i);
}
const end2 = process.hrtime.bigint();
const ms2 = Number(end2 - start2) / 1e6;
console.log(`  Total: ${ms2.toFixed(2)}ms`);
console.log(`  Per call: ${(ms2 / 10000 * 1000).toFixed(2)}μs`);
console.log(`  Result: ${statGrowth(LEVEL).toString()}`);
console.log();

// ============ BENCHMARK 3: Full Combat Stats ============
function getCombatStats(level, seals, souls) {
  const growth = new Decimal(1.15).pow(level - 1);
  const baseAtk = Decimal.TEN.mul(growth);
  const baseHp = new Decimal(100).mul(growth);
  const sealMult = Decimal.TEN.pow(seals);
  const soulMult = Decimal.ONE.add(souls * 0.01);
  const baseMult = sealMult.mul(soulMult);
  const atkMult = baseMult;
  const hpMult = baseMult;
  const finalAtk = baseAtk.mul(atkMult);
  const finalHp = baseHp.mul(hpMult);
  const critChance = 0.05;
  const critMult = new Decimal(2);
  const avgDmg = finalAtk.mul((1 - critChance) + critChance * critMult.toNumber());
  return { finalAtk, finalHp, avgDmg };
}

console.log('=== BENCHMARK 3: Combat Stats (10,000 calls) ===');
const start3 = process.hrtime.bigint();
for (let i = 0; i < 10000; i++) {
  getCombatStats(LEVEL + Math.floor(randOffset()), SEALS, SOULS);
}
const end3 = process.hrtime.bigint();
const ms3 = Number(end3 - start3) / 1e6;
console.log(`  Total: ${ms3.toFixed(2)}ms`);
console.log(`  Per call: ${(ms3 / 10000 * 1000).toFixed(2)}μs`);
const stats = getCombatStats(LEVEL, SEALS, SOULS);
console.log(`  Result ATK: ${stats.finalAtk.toString()}`);
console.log();

// ============ BENCHMARK 4: Simulated Offline Combat (1,000 iterations) ============
function offlineCombat(level, seals, souls, ticks) {
  let kills = 0;
  for (let i = 0; i < ticks && i < 1000; i++) {
    const enemyLvl = level + randOffset();
    const growth = new Decimal(1.15).pow(Math.max(0, enemyLvl - 1));
    const enemyHp = new Decimal(50).mul(growth);
    const stats = getCombatStats(level, seals, souls);
    const dmg = stats.avgDmg;
    if (dmg.gte(enemyHp)) {
      kills++;
    }
  }
  return kills;
}

console.log('=== BENCHMARK 4: Offline Combat (1,000 iterations) ===');
const start4 = process.hrtime.bigint();
const kills = offlineCombat(LEVEL, SEALS, SOULS, 1000);
const end4 = process.hrtime.bigint();
const ms4 = Number(end4 - start4) / 1e6;
console.log(`  Total: ${ms4.toFixed(2)}ms`);
console.log(`  Kills: ${kills}`);
console.log();

// ============ BENCHMARK 5: XP Reward Chain ============
function xpReward(level, seals, kills) {
  const enemyLvl = level;
  const baseExp = Decimal.TEN.mul(new Decimal(enemyLvl).pow(1.5));
  const sealMult = Decimal.TEN.pow(seals);
  const xpMult = new Decimal(1 + 0.5 * Math.pow(2, 107)); // tier 108
  const omni = new Decimal(1.2).mul(new Decimal(Math.pow(2, 107)));
  return baseExp.mul(kills).mul(xpMult).mul(sealMult).mul(omni);
}

console.log('=== BENCHMARK 5: XP Reward (10,000 calls) ===');
const start5 = process.hrtime.bigint();
for (let i = 0; i < 10000; i++) {
  xpReward(LEVEL, SEALS, 1);
}
const end5 = process.hrtime.bigint();
const ms5 = Number(end5 - start5) / 1e6;
console.log(`  Total: ${ms5.toFixed(2)}ms`);
console.log(`  Per call: ${(ms5 / 10000 * 1000).toFixed(2)}μs`);
console.log(`  Result: ${xpReward(LEVEL, SEALS, 1).toString()}`);
console.log();

// Summary
console.log('========================================');
console.log('=== SUMMARY ===');
console.log(`xpNeeded:       ${(ms1 / 10000 * 1000).toFixed(2)}μs/call`);
console.log(`statGrowth:     ${(ms2 / 10000 * 1000).toFixed(2)}μs/call`);
console.log(`combatStats:    ${(ms3 / 10000 * 1000).toFixed(2)}μs/call`);
console.log(`offlineCombat:  ${(ms4 / 1000 * 1000).toFixed(2)}μs/iter`);
console.log(`xpReward:       ${(ms5 / 10000 * 1000).toFixed(2)}μs/call`);
