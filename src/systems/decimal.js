/**
 * A robust Scientific Notation library to handle numbers far beyond JavaScript's 1.79e308 limit.
 * Supports numbers up to 10^1,000,000,000 and beyond.
 */
export class Decimal {
  constructor(m, e = 0) {
    if (m instanceof Decimal) {
      this.m = m.m;
      this.e = m.e;
    } else if (typeof m === 'object' && m !== null && 'm' in m && 'e' in m) {
      this.m = Number(m.m) || 0;
      this.e = Number(m.e) || 0;
    } else if (typeof m === 'number') {
      this.m = m;
      this.e = e;
      this.normalize();
    } else if (typeof m === 'string') {
      let parts = m.split('e');
      this.m = parseFloat(parts[0]) || 0;
      this.e = parseInt(parts[1]) || 0;
      this.normalize();
    } else {
      this.m = 0;
      this.e = 0;
    }
    if (isNaN(this.m) || isNaN(this.e)) {
      this.m = 0;
      this.e = 0;
    }
  }

  normalize() {
    if (this.m === 0 || isNaN(this.m) || Math.abs(this.m) < 1e-15) {
      this.m = 0;
      this.e = 0;
      return this;
    }
    if (!isFinite(this.m)) {
       this.m = this.m > 0 ? 1 : -1;
       this.e = 1000000;
       return this;
    }
    let absM = Math.abs(this.m);
    if (absM >= 10 || (absM < 1 && absM > 0)) {
      let shift = Math.floor(Math.log10(absM));
      if (isFinite(shift)) {
        this.m /= Math.pow(10, shift);
        this.e += shift;
      }
    }
    if (Math.abs(this.m) < 1e-15) {
      this.m = 0;
      this.e = 0;
    }
    if (isNaN(this.e)) this.e = 0;
    return this;
  }

  floor() {
    if (this.e >= 15) return this;
    if (this.e < 0) return new Decimal(0);
    return new Decimal(Math.floor(this.m * Math.pow(10, this.e)), 0).normalize();
  }

  ceil() {
    if (this.e >= 15) return this;
    if (this.e < 0) return new Decimal(1);
    return new Decimal(Math.ceil(this.m * Math.pow(10, this.e)), 0).normalize();
  }

  static from(val) {
    return new Decimal(val);
  }

  static max(a, b) {
    return new Decimal(a).max(b);
  }

  static min(a, b) {
    return new Decimal(a).min(b);
  }

  add(other) {
    const o = new Decimal(other);
    if (o.m === 0) return this;
    if (this.m === 0) return o;
    const diff = this.e - o.e;
    if (diff > 15) return this;
    if (diff < -15) return o;
    return new Decimal(this.m + o.m * Math.pow(10, -diff), this.e).normalize();
  }

  sub(other) {
    const o = new Decimal(other);
    if (o.m === 0) return this;
    if (this.m === 0) return new Decimal(-o.m, o.e).normalize();
    const diff = this.e - o.e;
    if (diff > 15) return this;
    if (diff < -15) return new Decimal(-o.m, o.e).normalize();
    
    let newM = this.m - o.m * Math.pow(10, -diff);
    if (Math.abs(newM) < 1e-15) newM = 0;
    return new Decimal(newM, this.e).normalize();
  }

  mul(other) {
    const o = new Decimal(other);
    if (this.m === 0 || o.m === 0) return new Decimal(0);
    return new Decimal(this.m * o.m, this.e + o.e).normalize();
  }

  div(other) {
    const o = new Decimal(other);
    if (o.m === 0) return new Decimal(1.79e308); // Safety max
    if (this.m === 0) return new Decimal(0);
    return new Decimal(this.m / o.m, this.e - o.e).normalize();
  }

  mod(other) {
    const o = new Decimal(other);
    if (o.m === 0) return new Decimal(0);
    // If this is significantly larger than other, the remainder is effectively 0 for large integers
    if (this.e - o.e >= 16) return new Decimal(0);
    return this.sub(this.div(o).floor().mul(o));
  }

  pow(num) {
    let n = (num instanceof Decimal) ? num.toNumber() : Number(num);
    if (isNaN(n)) return this;
    if (n === 0) return new Decimal(1);
    if (this.m === 0) return new Decimal(0);

    let newM = Math.pow(this.m, n);
    let newE = this.e * n;
    if (!isFinite(newM) || Math.abs(newE) > 1e15) {
       let totalLog = n * (Math.log10(Math.abs(this.m)) + this.e);
       newE = Math.floor(totalLog);
       newM = Math.pow(10, totalLog - newE) * (this.m < 0 && n % 2 !== 0 ? -1 : 1);
    }
    return new Decimal(newM, newE).normalize();
  }

  abs() {
    return new Decimal(Math.abs(this.m), this.e);
  }

  log10() {
    if (this.m <= 0) return -Infinity;
    return Math.log10(this.m) + this.e;
  }

  max(other) {
    const o = new Decimal(other);
    if (this.gt(o)) return this;
    return o;
  }

  min(other) {
    const o = new Decimal(other);
    if (this.lt(o)) return this;
    return o;
  }

  gt(other) {
    const o = new Decimal(other);
    if (this.m === 0) return o.m < 0;
    if (o.m === 0) return this.m > 0;
    
    if (this.m > 0 && o.m < 0) return true;
    if (this.m < 0 && o.m > 0) return false;
    
    if (this.e > o.e) return this.m > 0;
    if (this.e < o.e) return this.m < 0;
    
    return this.m > o.m;
  }

  gte(other) {
    const o = new Decimal(other);
    if (this.m === o.m && this.e === o.e) return true;
    return this.gt(o);
  }

  lt(other) { return !this.gte(other); }
  lte(other) { return !this.gt(other); }

  toNumber() {
    if (isNaN(this.m) || isNaN(this.e)) return 0;
    if (this.e > 308) return this.m >= 0 ? Infinity : -Infinity;
    if (this.e < -308) return 0;
    return this.m * Math.pow(10, this.e);
  }

  toString() {
    return this.m.toFixed(2) + "e" + this.e;
  }
}
