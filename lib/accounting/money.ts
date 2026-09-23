export function roundChf(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function isPositiveChf(value: number): boolean {
  return Number.isFinite(value) && roundChf(value) > 0;
}
