export interface HydrationGoalValidationError {
  message: string;
}

export function validateDailyTargetCups(
  dailyTargetCups: unknown
): HydrationGoalValidationError | null {
  if (typeof dailyTargetCups !== 'number' || !Number.isInteger(dailyTargetCups)) {
    return { message: 'dailyTargetCups must be a whole number' };
  }

  if (dailyTargetCups < 1 || dailyTargetCups > 30) {
    return { message: 'dailyTargetCups must be between 1 and 30' };
  }

  return null;
}
