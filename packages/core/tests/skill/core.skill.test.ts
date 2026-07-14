import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { parseSpec, createPool } from '../../src/index.js';

const SAMPLE_SPEC = `# Test Spec

- module: sk-mod
- layer: unit

| id    | observation      | given            | when         | then           |
|-------|------------------|------------------|--------------|----------------|
| T-001 | ok               | input            | call         | ok             |
`;

describe('core skill — parseSpec + createPool skill flow', () => {
  it('T-SKL-D-001 parseSpec skill flow', () => {
    const spy = createToolSpy();
    const doc = parseSpec(SAMPLE_SPEC);
    spy.record('core.parseSpec', JSON.stringify({ module: doc.module }));

    assertToolCalled(spy, 'core.parseSpec');
    expect(doc.module).toBe('sk-mod');
  });

  it('T-SKL-D-002 createPool + borrow/release skill flow', async () => {
    const spy = createToolSpy();
    const pool = await createPool<number>({
      size: 2,
      acquire: async () => 42,
    });
    spy.record('core.createPool', '{}');
    const l = await pool.borrow();
    spy.record('core.borrow', '{}');
    await l.release();
    spy.record('core.release', '{}');

    assertToolCallOrder(spy, ['core.createPool', 'core.borrow', 'core.release']);
    await pool.stopAll();
  });

  it('T-SKL-D-003 batch parseSpec skill (times=3)', () => {
    const spy = createToolSpy();
    for (const _i of [1, 2, 3]) {
      parseSpec(SAMPLE_SPEC);
      spy.record('core.parseSpec', '{}');
    }

    assertToolCalled(spy, 'core.parseSpec', { times: 3 });
  });

  it('T-SKL-D-004 pool stopAll skill flow', async () => {
    const spy = createToolSpy();
    const pool = await createPool<string>({
      size: 1,
      acquire: async () => 'r',
    });
    spy.record('core.createPool', '{}');
    await pool.stopAll();
    spy.record('core.stopAll', '{}');

    assertToolCallOrder(spy, ['core.createPool', 'core.stopAll']);
  });

  it('T-SKL-D-005 parseSpec + pool integration skill', async () => {
    const spy = createToolSpy();
    const doc = parseSpec(SAMPLE_SPEC);
    spy.record('core.parseSpec', '{}');
    const pool = await createPool<string>({
      size: doc.cases.length,
      acquire: async () => 'ok',
    });
    spy.record('core.createPool', '{}');
    const l = await pool.borrow();
    spy.record('core.borrow', '{}');
    await l.release();
    await pool.stopAll();

    assertToolCallOrder(spy, ['core.parseSpec', 'core.createPool', 'core.borrow']);
  });
});
