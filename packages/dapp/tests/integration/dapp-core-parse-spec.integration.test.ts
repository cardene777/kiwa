/**
 * integration test — `docs/concepts/test-taxonomy.md § integration` pattern。
 *
 * @kiwa-lab/dapp が @kiwa-lab/core から re-export する `parseSpec` を real import
 * で組合せて end-to-end で動作することを検証する。 dapp 側 API と core 側 API が
 * 単一 module 経路で consistent に振る舞うことを保証する経路。
 *
 * mock 混ぜず real dependency で回す = integration 契約 (SSOT 前提思想)。
 */
import { describe, expect, it } from 'vitest';
import { parseSpec } from '../../src/index.js';

const SAMPLE_SPEC = `# Test Spec

- module: user-auth
- layer: unit

| id    | observation      | given            | when         | then           |
|-------|------------------|------------------|--------------|----------------|
| T-001 | valid login      | 正しい credential | login 実行   | session 発行   |
| T-002 | invalid password | 誤 password       | login 実行   | 401 error      |
`;

describe('dapp × core integration — parseSpec re-export end-to-end', () => {
  it('dapp 経路 (src/index.ts の re-export) で core の parseSpec を呼出し、 全 case を parse できる', () => {
    const doc = parseSpec(SAMPLE_SPEC);

    expect(doc.module).toBe('user-auth');
    expect(doc.cases.length).toBeGreaterThanOrEqual(2);
    const ids = doc.cases.map((c) => c.id);
    expect(ids).toContain('T-001');
    expect(ids).toContain('T-002');
  });

  it('dapp の re-export が core の parseSpec と referentially 同一 (single-source consistency)', async () => {
    const coreDirect = await import('@kiwa-lab/core');
    expect(parseSpec).toBe(coreDirect.parseSpec);
  });

  it('parseSpec が opts.module override を受け付ける (dapp 経路経由でも仕様維持)', () => {
    const doc = parseSpec(SAMPLE_SPEC, { module: 'override-mod' });
    expect(doc.module).toBe('override-mod');
  });

  it('cases 内容が given / when / then まで正しく parse される (core spec 契約)', () => {
    const doc = parseSpec(SAMPLE_SPEC);
    const t001 = doc.cases.find((c) => c.id === 'T-001');
    expect(t001).toBeDefined();
    // 各 case は given / when / then field を持つ (core parser 契約)
    expect(t001?.given).toContain('正しい');
    expect(t001?.when).toContain('login');
    expect(t001?.then).toContain('session');
  });

  it('layer 抽出 = spec の layer 指定に従う (unit で parse される)', () => {
    const doc = parseSpec(SAMPLE_SPEC);
    expect(doc.layer).toBe('unit');
  });

  it('空 spec = cases 0 件 + warnings 記録', () => {
    const emptySpec = '# Empty Test Spec\n\n- module: empty\n';
    const doc = parseSpec(emptySpec);
    expect(doc.module).toBe('empty');
    expect(doc.cases).toEqual([]);
    expect(doc.warnings.length).toBeGreaterThan(0);
  });

  it('複数 spec を独立に parse (state 共有なし、 core 契約)', () => {
    const spec1 = `- module: spec-a
- layer: unit

| id | observation | given | when | then |
|----|-------------|-------|------|------|
| A-1 | one | g1 | w1 | t1 |
`;
    const spec2 = `- module: spec-b
- layer: unit

| id | observation | given | when | then |
|----|-------------|-------|------|------|
| B-1 | one | g1 | w1 | t1 |
| B-2 | two | g2 | w2 | t2 |
`;
    const doc1 = parseSpec(spec1);
    const doc2 = parseSpec(spec2);

    expect(doc1.module).toBe('spec-a');
    expect(doc1.cases.length).toBe(1);
    expect(doc2.module).toBe('spec-b');
    expect(doc2.cases.length).toBe(2);
    // state 共有なし (第 1 spec parse が第 2 spec に影響しない)
    expect(doc1.cases[0]?.id).toBe('A-1');
    expect(doc2.cases.map((c) => c.id)).toEqual(['B-1', 'B-2']);
  });
});
