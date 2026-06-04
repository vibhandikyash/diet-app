/**
 * Validation helpers for hydration log operations
 */

export interface HydrationLogValidationError {
  field: string;
  message: string;
}

export function validateCupsConsumed(
  cupsConsumed: unknown
): HydrationLogValidationError | null {
  if (typeof cupsConsumed !== 'number' || !Number.isInteger(cupsConsumed)) {
    return { field: 'cupsConsumed', message: 'cupsConsumed must be a whole number' };
  }

  if (cupsConsumed <= 0) {
    return { field: 'cupsConsumed', message: 'cupsConsumed must be greater than 0' };
  }

  return null;
}

export function validateCupSize(
  cupSize: unknown
): HydrationLogValidationError | null {
  if (typeof cupSize !== 'number' || !Number.isInteger(cupSize)) {
    return { field: 'cupSize', message: 'cupSize must be a whole number' };
  }

  if (cupSize <= 0) {
    return { field: 'cupSize', message: 'cupSize must be greater than 0' };
  }

  return null;
}
