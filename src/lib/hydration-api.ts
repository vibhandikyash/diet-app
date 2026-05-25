import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getHydrationRequestUserId(request: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    return session.user.id;
  }

  if (process.env.NODE_ENV !== 'production') {
    const { searchParams } = new URL(request.url);
    return request.headers.get('x-user-id') || searchParams.get('userId');
  }

  return null;
}

export function parsePositiveInt(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
