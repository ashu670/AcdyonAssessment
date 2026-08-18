import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Return all configured sources with basic stats.
 *
 * @returns {Promise<Source[]>}
 */
export async function listSources() {
  const sources = await prisma.source.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { jobs: true } },
    },
  });

  // Shape into a clean response
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    baseUrl: s.baseUrl,
    enabled: s.enabled,
    jobCount: s._count.jobs,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
}
