import { Router } from 'express';
import crypto from 'crypto';
import logger from '../infra/logger.js';

const router = Router();

// Global array intentionally retained in memory for chaos simulation
const memoryLeakSink = [];

/**
 * POST /api/v1/diagnostics/cpu-stress
 * Executes compute-intensive synchronous hashing to spike CPU utilization.
 * Validates Prometheus alerts and Grafana CPU graphs.
 */
router.post('/cpu-stress', (req, res) => {
  const durationMs = Math.min(Math.max(parseInt(req.body?.durationMs || '2000', 10), 100), 30000);
  const startTime = Date.now();
  let iterations = 0;

  logger.warn({ durationMs }, 'Chaos: Starting CPU stress test');

  // Busy-wait loop computing SHA-256 hashes
  while (Date.now() - startTime < durationMs) {
    crypto.createHash('sha256').update(`stress-test-${iterations}-${Date.now()}`).digest('hex');
    iterations++;
  }

  const actualDurationMs = Date.now() - startTime;
  logger.warn({ actualDurationMs, iterations }, 'Chaos: CPU stress completed');

  res.status(200).json({
    message: 'CPU stress test completed',
    targetDurationMs: durationMs,
    actualDurationMs,
    iterations
  });
});

/**
 * POST /api/v1/diagnostics/memory-leak
 * Intentionally retains chunks of memory in a global array without de-referencing.
 * Tests V8 heap exhaustion, garbage collection pressure, and Kubernetes OOMKill alerts.
 */
router.post('/memory-leak', (req, res) => {
  const sizeMb = Math.min(Math.max(parseInt(req.body?.sizeMb || '50', 10), 5), 500);

  logger.warn({ sizeMb }, 'Chaos: Inducing memory leak');

  // Allocate chunks of 1MB strings
  for (let i = 0; i < sizeMb; i++) {
    // 1MB = ~1024 * 1024 characters
    const chunk = 'X'.repeat(1024 * 1024);
    memoryLeakSink.push(chunk);
  }

  const mem = process.memoryUsage();

  const heapUsedMb =
  Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100;

  const heapTotalMb =
  Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100;

  const heapUsagePercent =
  mem.heapTotal > 0
    ? Math.round((mem.heapUsed / mem.heapTotal) * 10000) / 100
    : 0;

  const totalLeakedMb = memoryLeakSink.length;

  logger.warn({ totalLeakedMb, heapUsedMb }, 'Chaos: Memory leaked into global sink');

  res.status(200).json({
    message: `Allocated ~${sizeMb} MB to global memory sink`,
    allocatedMb: sizeMb,
    totalLeakedMb,
    heapUsedMb,
    heapTotalMb,
    heapUsagePercent
  });
});

/**
 * POST /api/v1/diagnostics/crash
 * Forcefully terminates the Node process with exit code 1.
 * Tests Docker restart-policy and Kubernetes Pod crash-loop-backoff detection.
 */
router.post('/crash', (req, res) => {
  logger.fatal('Chaos: Crash endpoint invoked! Triggering process.exit(1)');

  res.status(200).json({
    message: 'Server will exit immediately with code 1'
  });

  // Small delay so HTTP client receives the response before process dies
  if (process.env.NODE_ENV !== 'test') {
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
});

export { memoryLeakSink };

export default router;
