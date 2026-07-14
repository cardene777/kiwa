import { describe, expect, it } from 'vitest';
import { parseSpec, createPool } from '../../src/index.js';

describe('core fidelity — parseSpec / createPool contract', () => {
  it('T-FID-D-001 parseSpec は同 markdown で idempotent (2 回目 = 1 回目)', () => {
    const md = `# Spec\n\n- module: mod-a\n- layer: unit\n\n| id | observation | given | when | then |\n|----|-------------|-------|------|------|\n| T-1 | ok | in | call | out |`;
    const doc1 = parseSpec(md);
    const doc2 = parseSpec(md);
    expect(doc1.module).toBe(doc2.module);
    expect(doc1.cases.length).toBe(doc2.cases.length);
  });

  it('T-FID-D-002 createPool で size 通りの resource 供給', async () => {
    let counter = 0;
    const pool = await createPool<number>({
      size: 3,
      acquire: async () => ++counter,
    });
    const leases = [] as Array<{ value: number; release: () => Promise<void> }>;
    for (let i = 0; i < 3; i++) leases.push(await pool.borrow());
    expect(leases.length).toBe(3);
    for (const l of leases) await l.release();
    await pool.stopAll();
  });

  it('T-FID-D-003 createPool の size ≤ 0 で throw', async () => {
    await expect(
      createPool<number>({
        size: 0,
        acquire: async () => 0,
      }),
    ).rejects.toThrow(/positive integer/);
  });

  it('T-FID-D-004 parseSpec で cases 順序保持', () => {
    const md = `# Spec\n\n- module: order-test\n- layer: unit\n\n| id | observation | given | when | then |\n|----|-------------|-------|------|------|\n| T-1 | first | in | call | out |\n| T-2 | second | in | call | out |\n| T-3 | third | in | call | out |`;
    const doc = parseSpec(md);
    expect(doc.cases.map((c) => c.id)).toEqual(['T-1', 'T-2', 'T-3']);
  });

  it('T-FID-D-005 pool release 後 re-borrow で同 resource', async () => {
    const pool = await createPool<number>({
      size: 1,
      acquire: async () => 42,
    });
    const l1 = await pool.borrow();
    const v1 = l1.value;
    await l1.release();
    const l2 = await pool.borrow();
    expect(l2.value).toBe(v1);
    await l2.release();
    await pool.stopAll();
  });
});
