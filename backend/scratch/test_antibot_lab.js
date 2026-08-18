import { PrismaClient } from '@prisma/client';
import { runOrchestratedIngestion } from '../src/services/orchestrator.service.js';
import { sandboxService } from '../src/services/sandbox.service.js';
import { circuitBreakerService } from '../src/services/circuit-breaker.service.js';
import { requestGovernanceService } from '../src/services/request-governance.service.js';

const prisma = new PrismaClient();

async function runScenarioTest(name, setupFn) {
  console.log(`\n==================================================`);
  console.log(`SCENARIO TEST: ${name}`);
  console.log(`==================================================`);

  // Reset state before setting setup scenario
  await circuitBreakerService.resetTestHealth();
  requestGovernanceService.resetGovernance();

  if (setupFn) {
    await setupFn();
  }

  const result = await runOrchestratedIngestion();

  console.log(`Status: ${result.status}`);
  console.log(`Final Source Used: ${result.sourceUsed || 'NONE (All Failed)'}`);
  console.log(`Attempted Sources:`);
  result.attemptedSources.forEach((a, i) => {
    console.log(
      `  ${i + 1}. [${a.name || a.source}] Status: ${a.status} ${a.error ? `(${a.error})` : ''} | Fetched: ${a.jobsFetched} | Deleted: ${a.jobsDeleted || 0}`
    );
  });
  console.log(`Summary:`, JSON.stringify(result.summary, null, 2));

  return result;
}

async function main() {
  console.log('STARTING ANTIBOT LAB & RESILIENCE SUITE VERIFICATION\n');

  // Test 1: Normal Ingestion
  await runScenarioTest('1. Normal Ingestion', async () => {
    sandboxService.clearOverrides();
  });

  // Test 2: HTTP 429 Rate Limit on Greenhouse
  await runScenarioTest('2. HTTP 429 Rate Limit (Greenhouse)', async () => {
    sandboxService.setOverride('greenhouse', { type: '429', status: 429, retryAfter: 30 });
  });

  // Test 3: HTTP 403 / Restricted Access on Greenhouse
  await runScenarioTest('3. HTTP 403 Restricted Access (Greenhouse)', async () => {
    sandboxService.setOverride('greenhouse', { type: 'restricted', status: 403 });
  });

  // Test 4: CAPTCHA Challenge on Greenhouse & Lever
  await runScenarioTest('4. CAPTCHA Challenge (Greenhouse & Lever)', async () => {
    sandboxService.setOverride('greenhouse', { type: 'captcha', status: 403 });
    sandboxService.setOverride('lever', { type: 'captcha', status: 403 });
  });

  // Test 5: High Request Frequency on Greenhouse
  await runScenarioTest('5. High Request Frequency (Greenhouse)', async () => {
    sandboxService.setOverride('greenhouse', { type: 'high_frequency' });
  });

  // Test 6: Header Anomaly (Missing User-Agent) on Greenhouse
  await runScenarioTest('6. Header Anomaly (Greenhouse)', async () => {
    sandboxService.setOverride('greenhouse', { type: 'header_anomaly' });
  });

  // Test 7: Session Inconsistency on Greenhouse
  await runScenarioTest('7. Session Inconsistency (Greenhouse)', async () => {
    sandboxService.setOverride('greenhouse', { type: 'session_inconsistent' });
  });

  // Test 8: Request Timeout on Greenhouse
  await runScenarioTest('8. Request Timeout (Greenhouse)', async () => {
    sandboxService.setOverride('greenhouse', { type: 'timeout' });
  });

  // Test 9: Schema Drift / Malformed JSON on Greenhouse
  await runScenarioTest('9. Schema Drift / Malformed JSON (Greenhouse)', async () => {
    sandboxService.setOverride('greenhouse', { type: 'schema_drift' });
  });

  // Test 10: All Sources Unavailable (Greenhouse, Lever, Ashby, Arbeitnow failed)
  await runScenarioTest('10. All Sources Unavailable', async () => {
    sandboxService.setOverride('greenhouse', { type: '429' });
    sandboxService.setOverride('lever', { type: '500' });
    sandboxService.setOverride('ashby', { type: 'timeout' });
    sandboxService.setOverride('arbeitnow', { type: 'captcha' });
  });

  // Test 11: Recovery After Reset
  await runScenarioTest('11. Recovery After Reset', async () => {
    await circuitBreakerService.resetTestHealth();
    requestGovernanceService.resetGovernance();
  });

  console.log('\n==================================================');
  console.log('ALL 11 SCENARIO TESTS EXECUTED SUCCESSFULLY!');
  console.log('==================================================\n');
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
