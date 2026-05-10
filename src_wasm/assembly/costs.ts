// ============================================================
// COSTS — Bulk cost formulas (closed-form, no loops)
// ============================================================

// Cost formula types
const COST_LINEAR: i32 = 0;
const COST_GEOMETRIC: i32 = 1;

// ============================================================
// LINEAR COST
// sum_{i=L}^{L+k-1} (base + gain * i)
// = k*base + gain * (k*L + k*(k-1)/2)
// ============================================================

export function cost_linear(currentLevel: i32, amount: i32, base: f64, gain: f64): f64 {
  if (amount <= 0) return 0.0;
  const k = <f64>amount;
  const L = <f64>currentLevel;
  const term1 = k * base;
  const term2 = gain * (k * L + k * (k - 1.0) * 0.5);
  return term1 + term2;
}

// Bulk linear cost (all levels from 0 to current)
export function cost_bulkLinear(maxLevel: i32, targetLevel: i32, base: f64, gain: f64): f64 {
  if (targetLevel <= 0) return 0.0;
  return cost_linear(0, targetLevel, base, gain);
}

// ============================================================
// GEOMETRIC COST
// sum_{i=L}^{L+k-1} (base * mult^i)
// = base * mult^L * (mult^k - 1) / (mult - 1)
// ============================================================

export function cost_geometric(currentLevel: i32, amount: i32, base: f64, multiplier: f64): f64 {
  if (amount <= 0) return 0.0;
  if (absD(multiplier - 1.0) < 1e-10) {
    // Linear case
    return base * <f64>amount;
  }

  const L = <f64>currentLevel;
  const k = <f64>amount;
  const term1 = base * pow(multiplier, L);
  const numerator = pow(multiplier, k) - 1.0;
  const denominator = multiplier - 1.0;
  return term1 * (numerator / denominator);
}

// Bulk geometric cost (sum from 0 to level)
export function cost_bulkGeometric(targetLevel: i32, base: f64, multiplier: f64): f64 {
  if (targetLevel <= 0) return 0.0;
  return cost_geometric(0, targetLevel, base, multiplier);
}

// ============================================================
// MIXED COST (linear base + geometric scaling)
// Used for upgrades that scale geometrically
// ============================================================

export function cost_mixed(currentLevel: i32, amount: i32, base: f64, scale: f64, growth: f64): f64 {
  if (amount <= 0) return 0.0;
  let total = 0.0;
  for (let i = 0; i < amount; i++) {
    const level = currentLevel + i;
    // cost at level = base * scale^level + growth * level
    const geomPart = base * pow(scale, <f64>level);
    const linPart = growth * <f64>level;
    total += geomPart + linPart;
  }
  return total;
}

// ============================================================
// MAX AFFORDABLE (binary search)
// Find max amount purchasable with given budget
// ============================================================

export function cost_maxAffordable_linear(budget: f64, currentLevel: i32, base: f64, gain: f64): i32 {
  if (budget <= 0.0 || gain <= 0.0) return 0;
  if (budget < base + gain * <f64>currentLevel) return 0;

  // Solve: k*base + gain*(k*L + k*(k-1)/2) <= budget
  // quadratic: 0.5*gain*k^2 + (gain*L + base - 0.5*gain)*k - budget <= 0
  // k = floor((-b + sqrt(b^2 + 2*gain*budget)) / gain)
  const L = <f64>currentLevel;
  const a = 0.5 * gain;
  const b = gain * L + base - 0.5 * gain;
  const discriminant = b * b + 2.0 * gain * budget;
  if (discriminant < 0.0) return 0;

  const kFloat = floor((-b + sqrt(discriminant)) / gain);
  const k = <i32>maxI(kFloat, 0.0);

  // Verify
  const actualCost = cost_linear(currentLevel, k, base, gain);
  if (actualCost > budget) {
    return k - 1;
  }
  return k;
}

export function cost_maxAffordable_geometric(budget: f64, currentLevel: i32, base: f64, multiplier: f64): i32 {
  if (budget <= 0.0 || currentLevel < 0) return 0;

  if (absD(multiplier - 1.0) < 1e-10) {
    return <i32>maxI(floor(budget / base), 0.0);
  }

  // Binary search for max k
  let low = 0;
  let high = 100000; // Safety cap

  while (low < high) {
    const mid = (low + high + 1) / 2;
    const cost = cost_geometric(currentLevel, mid, base, multiplier);
    if (cost <= budget) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low;
}

// ============================================================
// DISCOUNT / MULTIPLIER applications
// ============================================================

export function cost_withDiscount(cost: f64, discountPercent: f64): f64 {
  return cost * (1.0 - discountPercent);
}

export function cost_withBulkDiscount(cost: f64, amount: i32, discountPer10: f64): f64 {
  // Every 10 purchases gets discountPer10 percent off
  const discountGroups = amount / 10;
  const effectiveCost = cost * (1.0 - discountPer10 * discountGroups);
  return maxF(effectiveCost, cost * 0.1); // Cap at 90% discount
}

// ============================================================
// XP / LEVEL calculations
// ============================================================

export function xp_forLevel(level: i32): f64 {
  // XP needed = 100 * 1.5^(level-1)
  if (level <= 1) return 100.0;
  return 100.0 * pow(1.5, <f64>(level - 1));
}

export function xp_forLevelRange(startLevel: i32, endLevel: i32): f64 {
  if (endLevel <= startLevel) return 0.0;
  let total = 0.0;
  for (let lv = startLevel; lv < endLevel; lv++) {
    total += xp_forLevel(lv);
  }
  return total;
}

// ============================================================
// INLINE HELPERS
// ============================================================

function absD(x: f64): f64 { return x < 0.0 ? -x : x; }
function maxI(a: f64, b: f64): f64 { return a > b ? a : b; }
function maxF(a: f64, b: f64): f64 { return a > b ? a : b; }
function floor(x: f64): f64 {
  return x < 0.0 ? -floor(-x) : <f64>(<i64>x);
}
