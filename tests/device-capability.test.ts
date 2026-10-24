import { describe, it, expect } from 'vitest';
import { DeviceCapabilityDetector } from '../src/modules/performance/DeviceBenchmark';

describe('Device Performance Detection & Classification', () => {
  it('should detect capabilities with safe fallbacks in test environment', async () => {
    const diag = await DeviceCapabilityDetector.detect();

    expect(diag).toBeDefined();
    expect(diag.hardwareConcurrency).toBeGreaterThanOrEqual(1);
    expect(['LOW', 'MEDIUM', 'HIGH', 'AUTO']).toContain(diag.recommendedPreset);
    expect(diag.storageQuotaMb).toBeGreaterThanOrEqual(0);
  });

  it('should run benchmark and produce valid frame timing metrics', async () => {
    const bench = await DeviceCapabilityDetector.runBenchmark();

    expect(bench.fps).toBeGreaterThanOrEqual(0);
    expect(bench.frameTimeMs).toBeGreaterThan(0);
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(bench.recommendedPreset);
  });
});
