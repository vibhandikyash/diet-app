import { NextResponse } from 'next/server';
import { getHydrationRequestUserId } from '@/lib/hydration-api';
import { listDailyHydrationSummaries } from '@/lib/hydration-summary';

export async function GET(request: Request) {
  try {
    const userId = await getHydrationRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const summaries = await listDailyHydrationSummaries(userId, startDate, endDate);

    return NextResponse.json({ summaries });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch hydration summaries';
    const status = message.includes('Invalid') || message.includes('startDate') ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
