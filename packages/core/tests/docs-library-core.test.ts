import { expect, test } from 'vitest';
import { createPool, parseSpec } from '../src/index.js';

test('the quickstart parses a complete table and exposes incomplete columns', () => {
  const markdown = `
- module: wallet-connect
- layer: e2e

| id | observation | given | when | then | priority | automation | mode | route |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E2E-001 | connects a wallet | disconnected user | selects connect | account is shown | P0 | yes | live | /connect |
`;
  const doc = parseSpec(markdown);
  expect(doc).toMatchObject({ module: 'wallet-connect', layer: 'e2e', warnings: [] });
  expect(doc.cases[0]).toMatchObject({ id: 'E2E-001', mode: 'live', route: '/connect' });

  const broken = parseSpec('| id | observation |\n| --- | --- |\n| E2E-002 | missing columns |');
  expect(broken.cases).toEqual([]);
  expect(broken.warnings).toContain('required columns missing: then');
});

test('the how-to resets a lease before the next borrower and releases it on shutdown', async () => {
  type Worker = { id: number; state: string };
  let nextId = 0;
  const resetIds: number[] = [];
  const closedIds: number[] = [];
  const pool = await createPool<Worker>({
    size: 1,
    acquire: async () => ({ id: ++nextId, state: 'clean' }),
    reset: async (worker) => {
      worker.state = 'clean';
      resetIds.push(worker.id);
    },
    release: async (worker) => {
      closedIds.push(worker.id);
    },
  });

  const first = await pool.borrow();
  first.value.state = 'has-session';
  await first.release();
  const second = await pool.borrow();
  expect(second.value).toEqual({ id: 1, state: 'clean' });
  expect(resetIds).toEqual([1]);
  await second.release();
  await pool.stopAll();
  expect(closedIds).toEqual([1]);
});
