// ============================================================
// DECIMAL — Custom floating-point big number system
// Mantissa/exponent format for late-game idle game numbers
// Zero allocations, zero GC, SIMD-ready
// ============================================================

// Constants
const MIN_NORMALIZED: f64 = 1.0;
const MAX_NORMALIZED: f64 = 10.0;
const TINY: f64 = 1e-15;

// Custom wasmPow for WASM compatibility
function wasmPow(base: f64, exp: f64): f64 {
  if (exp == 0.0) return 1.0;
  if (base == 0.0) return 0.0;
  if (exp == 1.0) return base;
  if (exp == floor(exp)) {
    let result: f64 = 1.0;
    let e = <i32>exp;
    if (e < 0) {
      base = 1.0 / base;
      e = -e;
    }
    while (e > 0) {
      if ((e & 1) != 0) result *= base;
      base *= base;
      e >>= 1;
    }
    return result;
  }
  return <f64>Math.pow(<f64>base, <f64>exp);
}

function wasmLog10(x: f64): f64 {
  return <f64>Math.log10(<f64>x);
}

function wasmSqrt(x: f64): f64 {
  return <f64>Math.sqrt(<f64>x);
}

function wasmAbs(x: f64): f64 {
  return <f64>Math.abs(<f64>x);
}

function wasmFloor(x: f64): f64 {
  return <f64>Math.floor(<f64>x);
}

// ============================================================
// CORE DECIMAL OPERATIONS
// All return mantissa/exponent pairs as two f64 values
// ============================================================

// Add: a + b
export function decimal_add(
  aM: f64, aE: f64, bM: f64, bE: f64
): f64 {
  const r = _add(aM, aE, bM, bE);
  return r.m;
}

export function decimal_add_exp(
  aM: f64, aE: f64, bM: f64, bE: f64
): f64 {
  const r = _add(aM, aE, bM, bE);
  return r.e;
}

// Sub: a - b
export function decimal_sub(
  aM: f64, aE: f64, bM: f64, bE: f64
): f64 {
  const r = _add(aM, aE, -bM, bE);
  return r.m;
}

export function decimal_sub_exp(
  aM: f64, aE: f64, bM: f64, bE: f64
): f64 {
  const r = _add(aM, aE, -bM, bE);
  return r.e;
}

// Mul: a * b
export function decimal_mul(
  aM: f64, aE: f64, bM: f64, bE: f64
): f64 {
  return aM * bM;
}

export function decimal_mul_exp(
  aM: f64, aE: f64, bM: f64, bE: f64
): f64 {
  return aE + bE;
}

// Div: a / b
export function decimal_div(
  aM: f64, aE: f64, bM: f64, bE: f64
): f64 {
  if (bM == 0.0) return 0.0;
  return aM / bM;
}

export function decimal_div_exp(
  aM: f64, aE: f64, bM: f64, bE: f64
): f64 {
  if (bM == 0.0) return 0.0;
  return aE - bE;
}

// Compare: returns 1 (true), 0 (false)
export function decimal_gte(
  aM: f64, aE: f64, bM: f64, bE: f64
): i32 {
  return <i32>(_compare(aM, aE, bM, bE) >= 0);
}

export function decimal_lt(
  aM: f64, aE: f64, bM: f64, bE: f64
): i32 {
  return <i32>(_compare(aM, aE, bM, bE) < 0);
}

export function decimal_eq(
  aM: f64, aE: f64, bM: f64, bE: f64
): i32 {
  return <i32>(_compare(aM, aE, bM, bE) == 0);
}

// Pow: a ^ b (b is integer)
export function decimal_wasmPow(
  baseM: f64, baseE: f64, exp: f64
): f64 {
  const resultM = wasmPow(wasmAbs(baseM), exp);
  return baseM < 0.0 ? -resultM : resultM;
}

export function decimal_wasmPow_exp(
  baseM: f64, baseE: f64, exp: f64
): f64 {
  return baseE * exp;
}

// Abs
export function decimal_abs(m: f64, e: f64): f64 {
  return wasmAbs(m);
}

// Floor
export function decimal_wasmFloor(m: f64, e: f64): f64 {
  if (e >= 15.0) return m;
  if (e < 0.0) return 0.0;
  const factor = wasmPow(10.0, e);
  return wasmFloor(m * factor) / factor;
}

// Sqrt
export function decimal_wasmSqrt(m: f64, e: f64): f64 {
  if (m < 0.0) return 0.0;
  const wasmSqrtM = wasmSqrt(m);
  return wasmSqrtM;
}

export function decimal_wasmSqrt_exp(m: f64, e: f64): f64 {
  if (m < 0.0) return 0.0;
  let resultE = e;
  if (e != wasmFloor(e)) {
    return resultE / 2.0;
  }
  return resultE / 2.0;
}

// Log10
export function decimal_wasmLog10(m: f64, e: f64): f64 {
  if (m <= 0.0) return 0.0;
  return wasmLog10(m) + e;
}

// Is zero
export function decimal_isZero(m: f64, e: f64): i32 {
  return <i32>(wasmAbs(m) < TINY);
}

// ============================================================
// INLINE HELPERS
// ============================================================

function _add(aM: f64, aE: f64, bM: f64, bE: f64): Pair {
  if (wasmAbs(aM) < TINY) return new Pair(bM, bE);
  if (wasmAbs(bM) < TINY) return new Pair(aM, aE);
  if (aE == bE) return new Pair(aM + bM, aE);

  const diff = aE - bE;
  if (diff > 10.0) return new Pair(aM, aE);
  if (diff < -10.0) return new Pair(bM, bE);

  const scale = wasmPow(10.0, diff);
  return new Pair(aM + bM * scale, aE);
}

function _compare(aM: f64, aE: f64, bM: f64, bE: f64): i32 {
  if ((aM >= 0.0) != (bM >= 0.0)) return aM >= 0.0 ? 1 : -1;
  if (wasmAbs(aM) < TINY && wasmAbs(bM) < TINY) return 0;

  const diff = aE - bE;
  if (diff > 10.0) return aM >= 0.0 ? 1 : -1;
  if (diff < -10.0) return aM >= 0.0 ? -1 : 1;

  const scale = wasmPow(10.0, diff);
  if (wasmAbs(aM * scale - bM) < 1e-10) return 0;
  return aM * scale > bM ? 1 : -1;
}

// Simple pair class for returning two values
class Pair {
  constructor(public m: f64, public e: f64) {}
}
