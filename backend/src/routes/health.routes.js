import { Router } from 'express';
import database from '../infra/database.js';
import redis from '../infra/redis.js';

const router = Router();

const bytesToMb = (bytes) =>
  Math.round((bytes / 1024 / 1024) * 100) / 100;

/**
 * Liveness Probe: GET /healthz/live
 * Evaluates whether the Node.js process and event loop are responsive.
 */
router.get('/live', (req, res) => {
  const mem = process.memoryUsage();

  const heapUsedMb = bytesToMb(mem.heapUsed);
  const heapTotalMb = bytesToMb(mem.heapTotal);

  const heapUsagePercent =
    mem.heapTotal > 0
      ? Math.round((mem.heapUsed / mem.heapTotal) * 10000) / 100
      : 0;

  res.status(200).json({
    status: 'UP',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    pid: process.pid,
    memory: {
      rssMb: bytesToMb(mem.rss),
      heapUsedMb,
      heapTotalMb,
      heapUsagePercent
    }
  });
});

/**
 * Readiness Probe: GET /healthz/ready
 * Actively pings PostgreSQL connection pool and Redis client.
 * Returns HTTP 200 if both are healthy, or HTTP 503 if any dependency is degraded.
 */
router.get('/ready', async (req, res) => {
  const [dbCheck, redisCheck] = await Promise.all([
    database.healthCheck(),
    redis.healthCheck()
  ]);

  const isReady = dbCheck.ok && redisCheck.ok;
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString(),
    dependencies: {
      database: {
        status: dbCheck.ok ? 'UP' : 'DOWN',
        latencyMs: dbCheck.latencyMs,
        ...(dbCheck.error && { error: dbCheck.error })
      },
      redis: {
        status: redisCheck.ok ? 'UP' : 'DOWN',
        latencyMs: redisCheck.latencyMs,
        ...(redisCheck.error && { error: redisCheck.error })
      }
    }
  });
});

export default router;
