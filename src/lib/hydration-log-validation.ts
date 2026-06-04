export interface HydrationLogValidationError {
  message: string;
}

export function validateCupsConsumed(value: unknown): HydrationLogValidationError | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return { message: 'cupsConsumed must be a positive integer' };
  }
  return null;
}

export function validateCupSize(value: unknown): HydrationLogValidationError | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return { message: 'cupSize must be a positive integer' };
  }
  return null;
}
