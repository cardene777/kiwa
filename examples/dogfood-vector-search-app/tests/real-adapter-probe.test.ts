import { describe, expect, it } from 'vitest';
import { detectRealEnv, makeRealAdapter, SkippedError } from '../src/adapters/real.js';
import { ivfFlatIndex } from '../src/index-store/index.js';

describe('real adapter env-gated probe', () => {
  it('T-DVR-ENV-001 detectRealEnv returns null when VECTOR_KEY is unset', () => {
    const previous = process.env.VECTOR_KEY;
    delete process.env.VECTOR_KEY;
    try {
      expect(detectRealEnv()).toBeNull();
    } finally {
      if (previous !== undefined) process.env.VECTOR_KEY = previous;
    }
  });

  it('T-DVR-ENV-002 detectRealEnv reads VECTOR_KEY + defaults clientId', () => {
    const prevKey = process.env.VECTOR_KEY;
    const prevClient = process.env.VECTOR_CLIENT_ID;
    process.env.VECTOR_KEY = 'postgres://user:pass@localhost:5432/kiwa';
    delete process.env.VECTOR_CLIENT_ID;
    try {
      const env = detectRealEnv();
      expect(env?.bootstrap).toBe('postgres://user:pass@localhost:5432/kiwa');
      expect(env?.clientId).toBe('dogfood-vector-search-app');
    } finally {
      if (prevKey !== undefined) process.env.VECTOR_KEY = prevKey;
      else delete process.env.VECTOR_KEY;
      if (prevClient !== undefined) process.env.VECTOR_CLIENT_ID = prevClient;
    }
  });

  it('T-DVR-ENV-003 makeRealAdapter without env returns skipped adapter with VECTOR_ENV_MISSING traces', async () => {
    const previous = process.env.VECTOR_KEY;
    delete process.env.VECTOR_KEY;
    try {
      const adapter = await makeRealAdapter();
      const index = ivfFlatIndex({ name: 'p', dimensions: 4, lists: 2 });
      await expect(
        adapter.driveIndexBuild({ docs: [], index }),
      ).rejects.toThrowError(SkippedError);
      const trace = adapter.traces();
      expect(trace).toHaveLength(1);
      expect(trace[0]!.errorKind).toBe('VECTOR_ENV_MISSING');
    } finally {
      if (previous !== undefined) process.env.VECTOR_KEY = previous;
    }
  });

  it('T-DVR-ENV-004 makeRealAdapter with valid DSN records probe.ok=true', async () => {
    const previous = process.env.VECTOR_KEY;
    process.env.VECTOR_KEY = 'postgres://user:pass@localhost:5432/kiwa';
    try {
      const adapter = await makeRealAdapter();
      const probeTrace = adapter.traces().find((t) => t.op === 'probe');
      expect(probeTrace?.ok).toBe(true);
    } finally {
      if (previous !== undefined) process.env.VECTOR_KEY = previous;
      else delete process.env.VECTOR_KEY;
    }
  });

  it('T-DVR-ENV-005 makeRealAdapter connected variant reports REAL_ADAPTER_NOT_IMPLEMENTED', async () => {
    const previous = process.env.VECTOR_KEY;
    process.env.VECTOR_KEY = 'postgres://user:pass@localhost:5432/kiwa';
    try {
      const adapter = await makeRealAdapter();
      const index = ivfFlatIndex({ name: 'p', dimensions: 4, lists: 2 });
      await expect(
        adapter.driveIndexBuild({ docs: [], index }),
      ).rejects.toThrowError(/REAL_ADAPTER_NOT_IMPLEMENTED/);
      const trace = adapter.traces();
      const nonProbe = trace.filter((t) => t.op !== 'probe');
      expect(nonProbe.some((t) => t.errorKind === 'REAL_ADAPTER_NOT_IMPLEMENTED')).toBe(
        true,
      );
    } finally {
      if (previous !== undefined) process.env.VECTOR_KEY = previous;
      else delete process.env.VECTOR_KEY;
    }
  });
});
