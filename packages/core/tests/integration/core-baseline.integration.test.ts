import { describe, expect, it } from 'vitest';
import { parseSpec, createPool } from '../../src/index.js';

const SAMPLE_SPEC = `# Test Spec

- module: user-auth
- layer: unit

| id    | observation      | given            | when         | then           |
|-------|------------------|------------------|--------------|----------------|
| T-001 | valid login      | credential       | login        | session issued |
| T-002 | invalid pass     | wrong password   | login        | 401 error      |
`;

describe('core integration — parseSpec + createPool workflow', () => {
  it('T-INT-D-001 parseSpec で SpecDoc 生成', () => {
    const doc = parseSpec(SAMPLE_SPEC);
    expect(doc.module).toBe('user-auth');
    expect(doc.cases.length).toBeGreaterThanOrEqual(2);
    expect(doc.cases[0]!.id).toBe('T-001');
  });

  it('T-INT-D-002 createPool + borrow で resource 取得', async () => {
    let counter = 0;
    const pool = await createPool<number>({
      size: 3,
      acquire: async () => ++counter,
    });
    const lease = await pool.borrow();
    expect(typeof lease.value).toBe('number');
    await lease.release();
    await pool.stopAll();
  });

  it('T-INT-D-003 parseSpec + opts.module override', () => {
    const doc = parseSpec(SAMPLE_SPEC, { module: 'override' });
    expect(doc.module).toBe('override');
  });

  it('T-INT-D-004 createPool multiple borrow で isolation', async () => {
    let counter = 0;
    const pool = await createPool<number>({
      size: 5,
      acquire: async () => ++counter,
    });
    const l1 = await pool.borrow();
    const l2 = await pool.borrow();
    const l3 = await pool.borrow();
    expect(l1.value).not.toBe(l2.value);
    expect(l2.value).not.toBe(l3.value);
    await l1.release();
    await l2.release();
    await l3.release();
    await pool.stopAll();
  });

  it('T-INT-D-005 parseSpec + createPool integration', async () => {
    const doc = parseSpec(SAMPLE_SPEC);
    const pool = await createPool<string>({
      size: doc.cases.length,
      acquire: async () => 'r',
    });
    const lease = await pool.borrow();
    expect(lease.value).toBe('r');
    await lease.release();
    await pool.stopAll();
  });
});
