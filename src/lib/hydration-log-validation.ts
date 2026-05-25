export type HydrationLogData = {
  cupsConsumed?: number;
  cupSize?: number;
};

type HydrationLogInput = {
  cupsConsumed?: unknown;
  cupSize?: unknown;
};

type ValidationResult =
  | { data: HydrationLogData; error?: undefined }
  | { data?: undefined; error: string };

export function validateHydrationLogInput(
  input: HydrationLogInput,
  requireAllFields = false
): ValidationResult {
  const data: HydrationLogData = {};

  for (const field of ['cupsConsumed', 'cupSize'] as const) {
    const value = input[field];

    if (value === undefined) {
      if (requireAllFields) {
        return { error: `${field} is required` };
      }
      continue;
    }

    if (!Number.isInteger(value) || value <= 0) {
      return { error: `${field} must be a positive integer` };
    }

    data[field] = value;
  }

  if (!requireAllFields && Object.keys(data).length === 0) {
    return { error: 'cupsConsumed or cupSize is required' };
  }

  return { data };
}
