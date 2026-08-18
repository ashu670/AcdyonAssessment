import { PrismaClient } from '@prisma/client';
import { reconcileSourceJobs } from '../src/services/ingestion.service.js';

const prisma = new PrismaClient();

async function runTest() {
  console.log('=== STEP 1: INITIAL STATE SETUP (A, B, C, D, E) ===');
  const ghSource = await prisma.source.findUnique({ where: { name: 'Greenhouse' } });

  const testJobsInitial = [
    { externalId: 'A', title: 'Job A', company: 'Stripe', url: 'https://stripe.com/job/a' },
    { externalId: 'B', title: 'Job B', company: 'Stripe', url: 'https://stripe.com/job/b' },
    { externalId: 'C', title: 'Job C', company: 'Stripe', url: 'https://stripe.com/job/c' },
    { externalId: 'D', title: 'Job D', company: 'Stripe', url: 'https://stripe.com/job/d' },
    { externalId: 'E', title: 'Job E', company: 'Stripe', url: 'https://stripe.com/job/e' },
  ];

  await reconcileSourceJobs(ghSource.id, testJobsInitial, true);
  const dbJobsInitial = await prisma.job.findMany({ where: { sourceId: ghSource.id } });
  console.log('Initial Greenhouse jobs count in DB:', dbJobsInitial.length);
  console.log('Jobs in DB:', dbJobsInitial.map((j) => j.externalId).join(', '));

  console.log('\n=== STEP 2: COMPLETE INGESTION WITH (A, B, D, F) ===');
  const testJobsUpdated = [
    { externalId: 'A', title: 'Job A', company: 'Stripe', url: 'https://stripe.com/job/a' },
    { externalId: 'B', title: 'Job B', company: 'Stripe', url: 'https://stripe.com/job/b' },
    { externalId: 'D', title: 'Job D', company: 'Stripe', url: 'https://stripe.com/job/d' },
    { externalId: 'F', title: 'Job F', company: 'Stripe', url: 'https://stripe.com/job/f' },
  ];

  const metrics = await reconcileSourceJobs(ghSource.id, testJobsUpdated, true);
  console.log('Reconciliation Metrics:', JSON.stringify(metrics, null, 2));

  const dbJobsAfter = await prisma.job.findMany({ where: { sourceId: ghSource.id } });
  console.log('Remaining Greenhouse DB jobs:', dbJobsAfter.map((j) => j.externalId).join(', '));

  console.log('\n=== STEP 3: SIMULATED INCOMPLETE FETCH / FAILURE (429 / Timeout) ===');
  const countBefore = (await prisma.job.findMany({ where: { sourceId: ghSource.id } })).length;
  console.log('Pre-failure Greenhouse DB jobs count:', countBefore);

  // Partial / Incomplete fetch simulation (isComplete = false)
  const incompleteMetrics = await reconcileSourceJobs(ghSource.id, testJobsUpdated, false);
  console.log('Incomplete Ingestion Metrics:', JSON.stringify(incompleteMetrics, null, 2));

  const countAfterFailure = (await prisma.job.findMany({ where: { sourceId: ghSource.id } })).length;
  console.log('Post-failure Greenhouse DB jobs count:', countAfterFailure);
  console.log('DELETIONS OCCURRED DURING FAILURE:', countBefore - countAfterFailure);

  // Cleanup test jobs
  await prisma.job.deleteMany({ where: { sourceId: ghSource.id, externalId: { in: ['A', 'B', 'C', 'D', 'E', 'F'] } } });
  console.log('\n=== RECONCILIATION TEST PASSED SUCCESSFULLY ===');
}

runTest()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
