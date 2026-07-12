import { describe, expect, it } from 'vitest';
import {
  classifyFailure,
  detectLeanBinary,
  detectLeanBinaryAsync,
  runLeanSource,
  runLeanSourceAsync,
} from '../src/lean-runner.js';
import { generateLeanSpec } from '../src/generator.js';
import { extractLeanTable, extractLeanTableAsync } from '../src/extract.js';
import { verifyLeanSpec, verifyLeanSpecAsync } from '../src/verify.js';
import type { OrchestratorSpec } from '../src/types.js';

const MINI_SPEC: OrchestratorSpec = {
  moduleName: 'MiniState',
  namespace: 'Mini',
  states: ['a', 'b'],
  events: ['e1', 'e2'],
  transitions: [
    { from: 'a', event: 'e1', to: 'b' },
    { from: 'a', event: 'e2', invalid: true },
    { from: 'b', event: 'e1', invalid: true },
    { from: 'b', event: 'e2', to: 'a' },
  ],
};

describe('classifyFailure defensive branches', () => {
  it('reports overflowed when error.code is ENOBUFS string', () => {
    expect(classifyFailure({ code: 'ENOBUFS' })).toEqual({ timedOut: false, overflowed: true });
  });

  it('reports overflowed when error.code is ERR_CHILD_PROCESS_STDIO_MAXBUFFER', () => {
    expect(classifyFailure({ code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' })).toEqual({
      timedOut: false,
      overflowed: true,
    });
  });

  it('reports timedOut when error.code is ETIMEDOUT', () => {
    expect(classifyFailure({ code: 'ETIMEDOUT' })).toEqual({ timedOut: true, overflowed: false });
  });

  it('reports timedOut when error.signal is SIGTERM', () => {
    expect(classifyFailure({ signal: 'SIGTERM' })).toEqual({ timedOut: true, overflowed: false });
  });

  it('reports neither timedOut nor overflowed for numeric exit code', () => {
    expect(classifyFailure({ code: 1 })).toEqual({ timedOut: false, overflowed: false });
  });

  it('reports neither for undefined code and no signal', () => {
    expect(classifyFailure({})).toEqual({ timedOut: false, overflowed: false });
  });

  it('reports neither for unknown string code', () => {
    expect(classifyFailure({ code: 'EPERM' })).toEqual({ timedOut: false, overflowed: false });
  });
});

describe('detectLeanBinary defensive branches', () => {
  it('returns null when explicit bin does not exist', () => {
    const result = detectLeanBinary('/nonexistent/path/to/lean');
    expect(result).toBeNull();
  });

  it('returns null when bin is /bin/echo (not Lean)', () => {
    // /bin/echo exits zero for any args but its output does not match the Lean banner
    const result = detectLeanBinary('/bin/echo');
    expect(result).toBeNull();
  });

  it('defaults to lean when no explicit binary is given', () => {
    // returns either null or 'lean' depending on whether Lean is installed locally
    const result = detectLeanBinary();
    expect(result === null || result === 'lean').toBe(true);
  });
});

describe('runLeanSource defensive branches', () => {
  it('returns lean-not-installed when binary is missing', () => {
    const result = runLeanSource('def main : IO Unit := pure ()', [], {
      leanBin: '/nonexistent/path/to/lean',
    });
    expect(result).toBe('lean-not-installed');
  });
});

describe('async lean-runner defensive branches', () => {
  it('detectLeanBinaryAsync returns null when explicit bin does not exist', async () => {
    const result = await detectLeanBinaryAsync('/nonexistent/path/to/lean');
    expect(result).toBeNull();
  });

  it('detectLeanBinaryAsync returns null when bin is /bin/echo (not Lean)', async () => {
    const result = await detectLeanBinaryAsync('/bin/echo');
    expect(result).toBeNull();
  });

  it('runLeanSourceAsync returns lean-not-installed when binary is missing', async () => {
    const result = await runLeanSourceAsync('def main : IO Unit := pure ()', [], {
      leanBin: '/nonexistent/path/to/lean',
    });
    expect(result).toBe('lean-not-installed');
  });
});

describe('extractLeanTableAsync defensive branches', () => {
  it('returns skipped-by-env when opts.skip=true', async () => {
    const result = await extractLeanTableAsync(
      'def main : IO Unit := pure ()',
      MINI_SPEC,
      { skip: true },
    );
    expect(result.status).toBe('skipped-by-env');
  });

  it('returns lean-not-installed when binary is missing', async () => {
    const result = await extractLeanTableAsync(
      'def main : IO Unit := pure ()',
      MINI_SPEC,
      { leanBin: '/nonexistent/path/to/lean' },
    );
    expect(result.status).toBe('lean-not-installed');
  });

  it('returns skipped-by-env when KIWA_LEAN_SKIP_VERIFY=1', async () => {
    const prev = process.env.KIWA_LEAN_SKIP_VERIFY;
    process.env.KIWA_LEAN_SKIP_VERIFY = '1';
    try {
      const result = await extractLeanTableAsync('def main : IO Unit := pure ()', MINI_SPEC);
      expect(result.status).toBe('skipped-by-env');
    } finally {
      if (prev === undefined) delete process.env.KIWA_LEAN_SKIP_VERIFY;
      else process.env.KIWA_LEAN_SKIP_VERIFY = prev;
    }
  });
});

describe('verifyLeanSpecAsync defensive branches', () => {
  it('throws UsageError when specs array is empty', async () => {
    await expect(verifyLeanSpecAsync([])).rejects.toThrow(/at least one spec is required/);
  });

  it('throws UsageError when rootNamespace is not a Lean identifier', async () => {
    const spec = generateLeanSpec(MINI_SPEC);
    await expect(verifyLeanSpecAsync([spec], { rootNamespace: '../etc' })).rejects.toThrow(
      /rootNamespace .* is not a Lean identifier/,
    );
  });

  it('returns skipped-by-env when opts.skip=true', async () => {
    const spec = generateLeanSpec(MINI_SPEC);
    const result = await verifyLeanSpecAsync([spec], { skip: true });
    expect(result.status).toBe('skipped-by-env');
  });

  it('returns skipped-by-env when KIWA_LEAN_SKIP_VERIFY=1', async () => {
    const spec = generateLeanSpec(MINI_SPEC);
    const prev = process.env.KIWA_LEAN_SKIP_VERIFY;
    process.env.KIWA_LEAN_SKIP_VERIFY = '1';
    try {
      const result = await verifyLeanSpecAsync([spec]);
      expect(result.status).toBe('skipped-by-env');
    } finally {
      if (prev === undefined) delete process.env.KIWA_LEAN_SKIP_VERIFY;
      else process.env.KIWA_LEAN_SKIP_VERIFY = prev;
    }
  });

  it('returns lean-not-installed when binary is missing', async () => {
    const spec = generateLeanSpec(MINI_SPEC);
    const result = await verifyLeanSpecAsync([spec], { leanBin: '/nonexistent/path/to/lean' });
    expect(result.status).toBe('lean-not-installed');
  });
});

describe('extractLeanTable defensive branches', () => {
  it('returns skipped-by-env when opts.skip=true', () => {
    const result = extractLeanTable('def main : IO Unit := pure ()', MINI_SPEC, { skip: true });
    expect(result.status).toBe('skipped-by-env');
  });

  it('returns lean-not-installed when binary is missing', () => {
    const result = extractLeanTable('def main : IO Unit := pure ()', MINI_SPEC, {
      leanBin: '/nonexistent/path/to/lean',
    });
    expect(result.status).toBe('lean-not-installed');
  });

  it('returns skipped-by-env when KIWA_LEAN_SKIP_VERIFY=1', () => {
    const prev = process.env.KIWA_LEAN_SKIP_VERIFY;
    process.env.KIWA_LEAN_SKIP_VERIFY = '1';
    try {
      const result = extractLeanTable('def main : IO Unit := pure ()', MINI_SPEC);
      expect(result.status).toBe('skipped-by-env');
    } finally {
      if (prev === undefined) delete process.env.KIWA_LEAN_SKIP_VERIFY;
      else process.env.KIWA_LEAN_SKIP_VERIFY = prev;
    }
  });
});

describe('generateLeanSpec defensive branches', () => {
  it('generates spec when terminal is undefined', () => {
    const spec = generateLeanSpec(MINI_SPEC);
    expect(spec.path).toBe('MiniState.lean');
    expect(spec.source.length).toBeGreaterThan(0);
  });

  it('generates spec when terminal is defined and agrees', () => {
    const specWithTerminal: OrchestratorSpec = { ...MINI_SPEC, terminal: [] };
    const spec = generateLeanSpec(specWithTerminal);
    expect(spec.path).toBe('MiniState.lean');
    expect(spec.source.length).toBeGreaterThan(0);
  });
});

describe('verifyLeanSpec defensive branches', () => {
  it('throws UsageError when specs array is empty', () => {
    expect(() => verifyLeanSpec([])).toThrow(/at least one spec is required/);
  });

  it('throws UsageError when rootNamespace is not a Lean identifier', () => {
    const spec = generateLeanSpec(MINI_SPEC);
    expect(() => verifyLeanSpec([spec], { rootNamespace: '../etc' })).toThrow(
      /rootNamespace .* is not a Lean identifier/,
    );
  });

  it('throws UsageError when rootNamespace starts with digit', () => {
    const spec = generateLeanSpec(MINI_SPEC);
    expect(() => verifyLeanSpec([spec], { rootNamespace: '1foo' })).toThrow(
      /rootNamespace .* is not a Lean identifier/,
    );
  });

  it('returns skipped-by-env when opts.skip=true and rootNamespace is valid', () => {
    const spec = generateLeanSpec(MINI_SPEC);
    const result = verifyLeanSpec([spec], { skip: true });
    expect(result.status).toBe('skipped-by-env');
    expect(result.reason).toContain('opts.skip=true');
  });

  it('returns skipped-by-env when KIWA_LEAN_SKIP_VERIFY=1', () => {
    const spec = generateLeanSpec(MINI_SPEC);
    const prev = process.env.KIWA_LEAN_SKIP_VERIFY;
    process.env.KIWA_LEAN_SKIP_VERIFY = '1';
    try {
      const result = verifyLeanSpec([spec]);
      expect(result.status).toBe('skipped-by-env');
      expect(result.reason).toContain('KIWA_LEAN_SKIP_VERIFY=1');
    } finally {
      if (prev === undefined) delete process.env.KIWA_LEAN_SKIP_VERIFY;
      else process.env.KIWA_LEAN_SKIP_VERIFY = prev;
    }
  });

  it('returns lean-not-installed when binary is missing', () => {
    const spec = generateLeanSpec(MINI_SPEC);
    const result = verifyLeanSpec([spec], { leanBin: '/nonexistent/path/to/lean' });
    expect(result.status).toBe('lean-not-installed');
  });
});
