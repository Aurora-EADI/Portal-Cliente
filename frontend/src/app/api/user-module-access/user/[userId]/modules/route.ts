import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { userId } = await params;

  // Only allow users to fetch their own modules (admins can fetch any)
  const isStaff = auth.user.role === UserRole.ADMIN || auth.user.role === UserRole.EMPLOYEE;
  if (!isStaff && auth.user.id !== userId) {
    return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
  }

  const accesses = await prisma.userModuleAccess.findMany({
    where: { userId },
    include: {
      module: {
        include: {
          sharedItems: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });

  const modules = accesses.map((a) => ({
    id: a.id,
    name: a.module.name,
    description: a.module.description,
    route: a.module.route,
    icon: a.module.icon,
    isEnabled: a.isEnabled,
    userModuleAccessId: a.id,
    sharedItems: a.module.sharedItems,
    activities: [],
    totalActivities: 0,
    activeActivities: 0,
  }));

  return NextResponse.json({ modules });
}
