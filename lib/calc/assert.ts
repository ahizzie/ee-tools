/** Shared range checks for calculator inputs. Throw with a clear message. */

export function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

export function assertNonNegative(value: number, label: string): void {
  assertFinite(value, label);
  if (!(value >= 0)) {
    throw new Error(`${label} must be ≥ 0.`);
  }
}

export function assertPositive(value: number, label: string): void {
  assertFinite(value, label);
  if (!(value > 0)) {
    throw new Error(`${label} must be greater than zero.`);
  }
}

export function assertInRange(
  value: number,
  min: number,
  max: number,
  label: string,
): void {
  assertFinite(value, label);
  if (value < min || value > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`);
  }
}

export function assertInteger(value: number, label: string): void {
  assertFinite(value, label);
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be a whole number.`);
  }
}

export function assertNonNegativeInteger(value: number, label: string): void {
  assertInteger(value, label);
  if (!(value >= 0)) {
    throw new Error(`${label} must be ≥ 0.`);
  }
}

export function assertPositiveInteger(value: number, label: string): void {
  assertInteger(value, label);
  if (!(value > 0)) {
    throw new Error(`${label} must be a whole number greater than zero.`);
  }
}

export function assertPowerFactor(value: number): void {
  assertFinite(value, "Power factor");
  if (value < 0 || value > 1) {
    throw new Error("Power factor must be between 0 and 1.");
  }
}
