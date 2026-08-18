import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Maximum limits per query page
const MAX_LIMIT = 100;

// Lists jobs with dynamic text search, company filtering, and pagination
export async function listJobs({ page = 1, limit = 20, search, location, company } = {}) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
  const skip = (safePage - 1) * safeLimit;

  // Build dynamic Prisma WHERE conditions
  const where = buildWhereClause({ search, location, company });

  const [total, data] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { postedAt: 'desc' },
      include: {
        source: { select: { name: true, type: true } },
      },
    }),
  ]);

  return {
    data,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
    },
  };
}

// Fetches single job record by ID
export async function getJobById(id) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      source: { select: { name: true, type: true } },
    },
  });
}

// Constructs case-insensitive Prisma search conditions
function buildWhereClause({ search, location, company } = {}) {
  const conditions = [];

  if (search && search.trim()) {
    const q = search.trim();
    conditions.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (location && location.trim()) {
    conditions.push({
      location: { contains: location.trim(), mode: 'insensitive' },
    });
  }

  if (company && company.trim()) {
    conditions.push({
      company: { contains: company.trim(), mode: 'insensitive' },
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}
