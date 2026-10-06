import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import createApp from '../../src/app.js';
import { memoryLeakSink } from '../../src/routes/diagnostics.routes.js';

describe('Chaos & Incident Injection API (Integration)', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  describe('POST /api/v1/diagnostics/cpu-stress', () => {
    it('should complete CPU stress loop and return 200 with stats', async () => {
      // Use small duration (100ms) for fast unit/integration testing
      const res = await request(app)
        .post('/api/v1/diagnostics/cpu-stress')
        .send({ durationMs: 100 });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('CPU stress test completed');
      expect(res.body.iterations).toBeGreaterThan(0);
      expect(res.body.actualDurationMs).toBeGreaterThanOrEqual(90);
    });
  });

  describe('POST /api/v1/diagnostics/memory-leak', () => {
    it('should allocate memory into global sink and return heap information', async () => {
      const initialSinkLength = memoryLeakSink.length;

      const res = await request(app)
        .post('/api/v1/diagnostics/memory-leak')
        .send({ sizeMb: 5 });

      expect(res.status).toBe(200);
      expect(res.body.allocatedMb).toBe(5);
      expect(res.body.totalLeakedMb).toBe(initialSinkLength + 5);
      expect(res.body.heapUsedMb).toBeTypeOf('number');
      expect(res.body.heapTotalMb).toBeTypeOf('number');
      expect(res.body.heapUsagePercent).toBeTypeOf('number');
      expect(res.body.heapUsagePercent).toBeGreaterThanOrEqual(0);
      expect(res.body.heapUsagePercent).toBeLessThanOrEqual(100);
    });
  });

  describe('POST /api/v1/diagnostics/crash', () => {
    it('should respond with 200 warning of impending process exit', async () => {
      const res = await request(app).post('/api/v1/diagnostics/crash');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('exit immediately');
    });
  });
});
