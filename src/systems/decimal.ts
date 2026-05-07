export type DecimalSource = number | string | Decimal | { m: number; e: number };

export class Decimal {
  readonly m: number;
  readonly e: number;

  constructor(m: DecimalSource = 0, e: number = 0) {
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
      return;
    } else if (typeof m === 'string') {
      const parts = m.split('e');
      this.m = parseFloat(parts[0]) || 0;
      this.e = parseInt(parts[1]) || 0;
      this.normalize();
      return;
    } else {
      this.m = 0;
      this.e = 0;
    }

    if (isNaN(this.m) || isNaN(this.e)) {
      (this as { m: number }).m = 0;
      (this as { e: number }).e = 0;
    }
  }

  private normalize(): this {
    if (this.m === 0 || isNaN(this.m) || Math.abs(this.m) < 1e-15) {
      (this as { m: number }).m = 0;
      (this as { e: number }).e = 0;
      return this;
    }

    if (!isFinite(this.m)) {
      (this as { m: number }).m = this.m > 0 ? 1 : -1;
      (this as { e: number }).e = 1000000;
      return this;
    }

    const absM = Math.abs(this.m);
    if (absM >= 10 || (absM < 1 && absM > 0)) {
      const shift = Math.floor(Math.log10(absM));
      if (isFinite(shift)) {
        (this as { m: number }).m /= Math.pow(10, shift);
        (this as { e: number }).e += shift;
      }
    }

    if (Math.abs(this.m) < 1e-15) {
      (this as { m: number }).m = 0;
      (this as { e: number }).e = 0;
    }
    if (isNaN(this.e)) (this as { e: number }).e = 0;
    return this;
  }

  floor(): Decimal {
    if (this.e >= 15) return this;
    if (this.e < 0) return new Decimal(0);
    return new Decimal(Math.floor(this.m * Math.pow(10, this.e)), 0);
  }

  ceil(): Decimal {
    if (this.e >= 15) return this;
    if (this.e < 0) return new Decimal(1);
    return new Decimal(Math.ceil(this.m * Math.pow(10, this.e)), 0);
  }

  static from(val: DecimalSource): Decimal {
    return new Decimal(val);
  }

  static max(a: DecimalSource, b: DecimalSource): Decimal {
    return new Decimal(a).max(b);
  }

  static min(a: DecimalSource, b: DecimalSource): Decimal {
    return new Decimal(a).min(b);
  }

  add(other: DecimalSource): Decimal {
    const o = new Decimal(other);
    if (o.m === 0) return this;
    if (this.m === 0) return o;
    const diff = this.e - o.e;
    if (diff > 15) return this;
    if (diff < -15) return o;
    return new Decimal(this.m + o.m * Math.pow(10, -diff), this.e);
  }

  sub(other: DecimalSource): Decimal {
    const o = new Decimal(other);
    if (o.m === 0) return this;
    if (this.m === 0) return new Decimal(-o.m, o.e);
    const diff = this.e - o.e;
    if (diff > 15) return this;
    if (diff < -15) return new Decimal(-o.m, o.e);
    let newM = this.m - o.m * Math.pow(10, -diff);
    if (Math.abs(newM) < 1e-15) newM = 0;
    return new Decimal(newM, this.e);
  }

  mul(other: DecimalSource): Decimal {
    const o = new Decimal(other);
    if (this.m === 0 || o.m === 0) return new Decimal(0);
    return new Decimal(this.m * o.m, this.e + o.e);
  }

  div(other: DecimalSource): Decimal {
    const o = new Decimal(other);
    if (o.m === 0) return new Decimal(1.79e308);
    if (this.m === 0) return new Decimal(0);
    return new Decimal(this.m / o.m, this.e - o.e);
  }

  mod(other: DecimalSource): Decimal {
    const o = new Decimal(other);
    if (o.m === 0) return new Decimal(0);
    if (this.e - o.e >= 16) return new Decimal(0);
    return this.sub(this.div(o).floor().mul(o));
  }

  pow(num: DecimalSource): Decimal {
    const n = num instanceof Decimal ? num.toNumber() : Number(num);
    if (isNaN(n)) return this;
    if (n === 0) return new Decimal(1);
    if (this.m === 0) return new Decimal(0);
    if (this.m < 0 && !Number.isInteger(n)) return new Decimal(0);

    let newM = Math.pow(this.m, n);
    let newE = this.e * n;
    if (!isFinite(newM) || Math.abs(newE) > 1e15) {
      const totalLog = n * (Math.log10(Math.abs(this.m)) + this.e);
      newE = Math.floor(totalLog);
      newM = Math.pow(10, totalLog - newE) * (this.m < 0 && n % 2 !== 0 ? -1 : 1);
    }
    return new Decimal(newM, newE);
  }

  abs(): Decimal {
    return new Decimal(Math.abs(this.m), this.e);
  }

  log10(): number {
    if (this.m <= 0) return -Infinity;
    return Math.log10(this.m) + this.e;
  }

  max(other: DecimalSource): Decimal {
    const o = new Decimal(other);
    return this.gt(o) ? this : o;
  }

  min(other: DecimalSource): Decimal {
    const o = new Decimal(other);
    return this.lt(o) ? this : o;
  }

  gt(other: DecimalSource): boolean {
    const o = new Decimal(other);
    if (this.m === 0) return o.m < 0;
    if (o.m === 0) return this.m > 0;
    if (this.m > 0 && o.m < 0) return true;
    if (this.m < 0 && o.m > 0) return false;
    if (this.e > o.e) return this.m > 0;
    if (this.e < o.e) return this.m < 0;
    return this.m > o.m;
  }

  gte(other: DecimalSource): boolean {
    const o = new Decimal(other);
    if (this.m === o.m && this.e === o.e) return true;
    return this.gt(o);
  }

  lt(other: DecimalSource): boolean {
    return !this.gte(other);
  }

  lte(other: DecimalSource): boolean {
    return !this.gt(other);
  }

  toNumber(): number {
    if (isNaN(this.m) || isNaN(this.e)) return 0;
    if (this.e > 308) return this.m >= 0 ? Infinity : -Infinity;
    if (this.e < -308) return 0;
    return this.m * Math.pow(10, this.e);
  }

  valueOf(): number {
    return this.toNumber();
  }

  toString(): string {
    return this.m.toFixed(2) + 'e' + this.e;
  }
}
