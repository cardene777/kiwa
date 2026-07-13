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
});
