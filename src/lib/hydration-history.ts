const DAY_IN_MS = 24 * 60 * 60 * 1000;

function normalizeUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function formatHydrationDate(date: Date): string {
  return normalizeUtcDay(date).toISOString().slice(0, 10);
}

export function getSevenDayHydrationWindow(currentDate: Date = new Date()): string[] {
  const today = normalizeUtcDay(currentDate);

  return Array.from({ length: 7 }, (_value, index) => {
    const offset = index - 6;
    return formatHydrationDate(new Date(today.getTime() + offset * DAY_IN_MS));
  });
}

export function getHydrationStatus(
  totalCups: number,
  dailyTargetCups: number | null | undefined
): { status: 'achieved' | 'partial' | 'missed'; tone: 'green' | 'yellow' | 'red'; label: string } {
  if (!dailyTargetCups || dailyTargetCups <= 0) {
    return { status: 'missed', tone: 'red', label: 'No goal set' };
  }

  const progress = totalCups / dailyTargetCups;

  if (progress >= 1) {
    return { status: 'achieved', tone: 'green', label: 'Goal achieved' };
  }

  if (progress >= 0.5) {
    return { status: 'partial', tone: 'yellow', label: 'Partial progress' };
  }

  return { status: 'missed', tone: 'red', label: 'Missed goal' };
}
