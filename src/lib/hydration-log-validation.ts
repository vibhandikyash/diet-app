export interface HydrationLogValidationError {
  message: string;
}

export function validateHydrationAmount(
  amount: unknown,
  fieldName: string
): HydrationLogValidationError | null {
  if (typeof amount !== 'number' || !Number.isInteger(amount)) {
    return { message: `${fieldName} must be a positive whole number` };
  }

  if (amount <= 0) {
    return { message: `${fieldName} must be greater than 0` };
  }

  return null;
}
