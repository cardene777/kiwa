---
title: kiwa test-taxonomy guide — 5 分類 SSOT + meta lint + CLI + real driver
---

# kiwa test-taxonomy guide

kiwa monorepo の各 lib (`packages/*`) が持つべき test の 5 分類 SSOT + それを担保する meta 経路 (meta lint / 実行 CLI) の user-facing guide。

**SSOT** = `docs/concepts/test-taxonomy.md`、 本 guide は使い方に focus する。

## 1. 5 分類 SSOT

各 lib は以下 5 分類の test を持つ。

| 分類 | dir | 命名 | 対象 lib | mode |
|---|---|---|---|---|
| unit | `tests/` 直下 | `*.test.ts` | 全 lib | 常時 |
| perf | `tests/perf/` | `*.perf.ts` | 全 lib (9 pkg exempt) | fail |
| fidelity | `tests/fidelity/` | `*.fidelity.test.ts` | 9 lib (mock adapter 提供 lib) | fail |
| skill | `tests/skill/` | `*.skill.test.ts` | 3 lib (agent / mcp / cli) | fail |
| integration | `tests/integration/` | `*.integration.test.ts` | 3 lib (他 lib 依存) | fail |

**前提思想** = 汎用 tool で domain 精度は落ちる、 domain 判断は各 lib 開発者の頭に置く。 meta lint + CLI は 「test が正しく組立てられ実行して通っているか」 の構造的 gate に特化する。

## 2. meta lint (Q1) — 存在 chk

`tests/release-smoke/tests/test-taxonomy-existence.test.ts` が全 lib を横断走査、 各 lib の `packages/{lib}/tests/{dir}/*.{suffix}` 存在を machine chk する。 phase 2 = fail、 test file 追加漏れは PR gate で構造的 block。

config = `tests/release-smoke/test-taxonomy.config.json`。

```json
{
  "requireFidelity": {
    "mode": "fail",
    "mockAdapterLibs": ["auth", "cache", "queue", "search", "ai-llm", "realtime", "streaming", "payment", "orm"]
  },
  "requireSkill": {
    "mode": "fail",
    "skillLibs": ["agent", "mcp", "cli"]
  },
  "requireIntegration": {
    "mode": "fail",
    "integrationLibs": ["dapp", "e2e", "component"]
  }
}
```

追加した lib が該当分類必須と判定される場合、 `mockAdapterLibs` 等の array に追加、 逆に免除する場合は `exempt` 記載 + 理由明記。

## 3. fidelity primitive (Q2) — `assertFidelity`

**package** = `@kiwa-lab/quality-metrics`。 mock adapter と reference impl の挙動を case ごとに比較、 fidelity ratio を返す。

```typescript
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createInMemoryCacheEnv } from '../../src/index.js';

function referenceCache() {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async set(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('cache mock fidelity vs reference Map impl', () => {
  it('未 set key = 両実装で null', async () => {
    const mock = createInMemoryCacheEnv({});
    const real = referenceCache();

    const result = await assertFidelity({
      mockFn: async (key: string) => mock.get(key),
      realFn: async (key: string) => real.get(key),
      cases: [
        { name: 'missing key', args: ['never-set'] },
      ],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });
});
```

**契約**。

- `mockFn` + `realFn` = 同 args で同 shape の値を返す関数
- `cases` = `{ name, args, compare? }` array、 compare 省略時 = `deepStrictEqual`
- 返り値 = `{ passed, failed, ratio (0-100), divergences }`
- 両 fn が throw = 一致扱い、 片方だけ throw = divergence 扱い

`compare` custom で shape 一致のみに絞ることも可能 (id / timestamp 等不安定 field を除外する用途)。

## 4. skill-test primitive (Q4) — 4 assertion + tool spy

**package** = `@kiwa-lab/skill-test`。 skill / agent / tool 発火 assertion を提供、 `createToolSpy` で tool 呼出を spy 化する。

```typescript
import { assertToolCalled, assertToolCalledWith, createToolSpy } from '@kiwa-lab/skill-test';
import { describe, expect, it } from 'vitest';

describe('agent skill flow', () => {
  it('reply flow が Read tool を 1 回呼出', async () => {
    const spy = createToolSpy();
    const agent = createAgent({ tools: spy.tools });

    await agent.reply('read the file');

    assertToolCalled(spy, 'Read');
    assertToolCalledWith(spy, 'Read', { file_path: expect.any(String) });
  });
});
```

**契約**。

- `createToolSpy()` = `{ tools, calls }`、 tools = spy 済 tool set、 calls = 呼出 history
- `assertToolCalled(spy, toolName)` = 該当 tool 呼出 ≥ 1 件
- `assertToolNotCalled(spy, toolName)` = 該当 tool 呼出 = 0 件
- `assertToolCalledWith(spy, toolName, expectedArgs)` = 該当 tool + args 一致
- `assertToolCallOrder(spy, [tool1, tool2, ...])` = 呼出順序一致

## 5. integration test (Q3)

**pattern** = 他 lib を real import で組合せて動作検証、 mock 使用禁止。

```typescript
import type { TestEnvBase } from '@kiwa-lab/core';
import { describe, expect, it } from 'vitest';
import { setupE2eEnv } from '../../src/index.js';

describe('e2e × core integration', () => {
  it('setupE2eEnv 戻り値が core TestEnvBase interface に structurally 準拠', async () => {
    const env = await setupE2eEnv({ staticHtml: '<title>e2e</title>' });
    const envAsBase: TestEnvBase = env;
    expect(typeof envAsBase.mode).toBe('string');
    expect(typeof envAsBase.stop).toBe('function');
    await env.stop();
  });
});
```

**契約**。

- real import (`import { X } from '@kiwa-lab/other-lib'`) 経由の cross-lib flow
- mock 混ぜず real dependency で回す (integration 分類 SSOT)
- 実 backend が必要 (Playwright browser / real Postgres) は Q6 real fidelity 経路

## 6. taxonomy-run CLI (Q5) — 実行 chk

meta lint (存在) 単独では 「file がある = OK」 で中身 broken の silent fail が起き得る。 CLI は「実際に vitest 走らせて pass するか」 を lib × category matrix で確認する。

```bash
# 基本 (該当 lib 横断)
pnpm test:taxonomy -- --category fidelity
pnpm test:taxonomy -- --category skill --lib agent
pnpm test:taxonomy -- --category integration --format json

# real driver test 含む (KIWA_MODE=real auto)
pnpm test:taxonomy -- --category fidelity --include-real
```

**引数**。

- `--category <name>` = perf / fidelity / skill / integration のいずれか (必須)
- `--lib <name>` = 単一 lib 指定 (省略 = config 記載の該当 lib 全走査)
- `--format <fmt>` = table (default) or json
- `--include-real` = `*.real.<category>.test.ts` (real driver test) を実行対象に含める、 KIWA_MODE=real env auto 注入
- exit code = 0 (全 pass) / 1 (1 件でも fail or compile-fail)

**出力例**。

```
[taxonomy-run] auth × fidelity ... pass 3/3
[taxonomy-run] cache × fidelity ... pass 3/3
...

## test-taxonomy matrix — category=fidelity

| lib | status |
| --- | ------ |
| auth | pass 3/3 |
| cache | pass 3/3 |
| ...

summary: pass=9 fail=0 no-files=0 total=9
```

## 7. real driver env-gate (Q6) — `resolveRealFidelityMode`

**package** = `@kiwa-lab/quality-metrics`。 static fidelity (mock ↔ Map reference) を補完し、 mock adapter が real backend (testcontainers Redis / real Postgres 等) 挙動を再現しているか動的検証する経路。 `KIWA_MODE=real` + 必須 env keys の 2 条件で opt-in、 default = skip。

```typescript
import { assertFidelity, resolveRealFidelityMode } from '@kiwa-lab/quality-metrics';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createInMemoryCacheEnv, setupCacheEnv } from '../../src/index.js';

const gate = resolveRealFidelityMode({
  lib: 'cache',
  requiredEnvKeys: [],  // testcontainers Redis は env 不要
});

describe.skipIf(!gate.enabled)('cache real fidelity vs testcontainers Redis', () => {
  let mock, real;

  beforeAll(async () => {
    mock = createInMemoryCacheEnv({});
    real = await setupCacheEnv({ mode: 'testcontainers', client: 'ioredis' });
  }, 120_000);

  afterAll(async () => {
    await mock.stop?.();
    await real.stop?.();
  }, 30_000);

  it('set → get で同 value を返す', async () => {
    await mock.set('k', 'v');
    await real.set('k', 'v');

    const result = await assertFidelity({
      mockFn: async () => mock.get('k'),
      realFn: async () => real.get('k'),
      cases: [{ name: 'set→get 一致', args: [] }],
    });
    expect(result.ratio).toBe(100);
  });
});
```

**契約**。

- 命名 = `*.real.fidelity.test.ts` (2 段 suffix、 CLI `--include-real` で識別)
- `resolveRealFidelityMode({ lib, requiredEnvKeys })` = 判定結果 `{ enabled, skipReason, missingKeys }`
- `describe.skipIf(!gate.enabled)` で default skip、 `KIWA_MODE=real` + 必須 env 全 set 時のみ実行
- 具体的な testcontainers 起動 / real driver 接続は各 lib の既存 API (`setupCacheEnv({ mode: 'testcontainers' })` 等) 経由

**実 exemplar** = kiwa v1.65 現在。

- `packages/cache/tests/fidelity/redis-real.real.fidelity.test.ts` = testcontainers Redis
- `packages/queue/tests/fidelity/bullmq-real.real.fidelity.test.ts` = testcontainers BullMQ (Redis backend)
- `packages/orm/tests/fidelity/postgres-real.real.fidelity.test.ts` = testcontainers Postgres

## 8. 役割分担 SSOT

|軸 | 誰の責務 | 具体経路 |
|---|---|---|
| domain-specific test 中身 (case 網羅 / edge / real-world) | 各 lib 開発者 | SPEC + test file |
| test 実行して pass | test runner (vitest) | 各 lib `pnpm test` |
| 「test が正しく組立てられているか」 の存在 chk | meta lint | Q1 = `test-taxonomy-existence.test.ts` |
| 「test を実行して通っているか」 の CLI chk | Q5 CLI | `pnpm test:taxonomy -- --category X` |
| real driver 動的 fidelity 保証 | Q6 real fidelity | `resolveRealFidelityMode` + testcontainers |

meta lint + CLI は「構造的組立 + 実行 pass」 の gate に特化、 domain 判断は各 lib に置く分離が SSOT (汎用 tool で精度落ちる anti-pattern 回避)。

## 9. 新規 lib 追加時の手順

1. `packages/<lib>/tests/` 直下に `<name>.test.ts` (unit) を追加 = 全 lib 必須
2. `packages/<lib>/tests/perf/<name>.perf.ts` (perf) 追加 = 全 lib 必須、 免除は config `requirePerf.exempt` + 理由明記
3. mock adapter 提供する lib は `tests/fidelity/<name>.fidelity.test.ts` 追加 + config `requireFidelity.mockAdapterLibs` に lib 名追加
4. skill 実装する lib は `tests/skill/<name>.skill.test.ts` 追加 + config `requireSkill.skillLibs` に追加
5. 他 lib 依存する lib は `tests/integration/<name>.integration.test.ts` 追加 + config `requireIntegration.integrationLibs` に追加
6. `pnpm test:taxonomy -- --category <name>` で該当 lib pass 確認、 `pnpm --filter tests/release-smoke test` で meta lint pass 確認
7. real driver 経路整備する lib は `tests/fidelity/<name>.real.fidelity.test.ts` 追加、 `pnpm test:taxonomy -- --category fidelity --lib <lib> --include-real` で動作確認

## 10. 参考

- SSOT = `docs/concepts/test-taxonomy.md` (5 分類定義 + phase 履歴)
- meta lint = `tests/release-smoke/tests/test-taxonomy-existence.test.ts`
- CLI = `scripts/kiwa-taxonomy-run.mjs`
- fidelity primitive = `packages/quality-metrics/src/fidelity-assert.ts` + `packages/quality-metrics/src/real-fidelity-gate.ts`
- skill-test primitive = `packages/skill-test/`
