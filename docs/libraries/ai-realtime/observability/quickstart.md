# Observability を始める

`@kiwa-lab/observability` はテスト結果を履歴へ変換し、flaky なテストと仕様カバレッジの不足を確認します。

## インストール

```sh
pnpm add -D @kiwa-lab/observability @kiwa-lab/core vitest
```

Node.js 20 以降が必要です。

## 実行履歴を集める

```ts
import { expect, test } from 'vitest';
import { collectRunHistory, detectFlaky } from '@kiwa-lab/observability';

test('passed と failed が混在する test を flaky とする', () => {
  const history = collectRunHistory({
    records: [
      { testId: 'T-API-001', fullName: 'T-API-001 returns a user', status: 'passed', durationMs: 12, runId: 'ci-1', startedAt: 1 },
      { testId: 'T-API-001', fullName: 'T-API-001 returns a user', status: 'failed', durationMs: 8, runId: 'ci-2', startedAt: 2 },
    ],
    maxPerTest: 20,
  });
  const flaky = detectFlaky({ history, minRuns: 2, threshold: 0.1 });

  expect(flaky).toHaveLength(1);
  expect(flaky[0]).toMatchObject({ testId: 'T-API-001', failureRate: 0.5 });
});
```

この例を `tests/flaky.test.ts` に保存して `pnpm exec vitest run tests/flaky.test.ts` を実行します。collectRunHistory はtest IDごとに履歴を保持し、上限を超えた古い記録を削除します。保存先は返り値だけです。次のCI runへ残す場合は、呼び出し側でhistoryをserializeして渡してください。

detectFlaky はskippedを数えず、最低run数を満たし、成功と失敗が混在し、failure rateがthreshold以上のtestだけを返します。常に成功または常に失敗するtestはflakyとしては返しません。

## 次に進む

[使い方](./how-to) で、spec coverage、telemetry、log と trace の結び付きを確認します。collector と dashboard の公開 API は [リファレンス](./reference) を参照してください。
<!-- skill-guide -->
## skill で実行結果を読む

`/kiwa:kiwa-observe` は test を生成する skill ではありません。既にある Vitest の JSON 結果と、任意の Layer 1 spec を照合して dashboard を出力します。初回だけ kiwa plugin を導入してから、対象 test を JSON reporter で実行します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```bash
pnpm exec vitest run --reporter=json --outputFile=tests/reports/vitest-results.json
```

次に module と入出力を指定します。

```text
/kiwa:kiwa-observe --module checkout --vitest-json tests/reports/vitest-results.json --out tests/reports/checkout-dashboard.md
```

skill は `tests/reports/checkout-dashboard.md` に run history、flaky 判定、spec coverage gap を書き出します。`--module` に対応する spec または test がまだない場合は、`--spec` と `--test` で明示します。skill の引数と dashboard の形式は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-observe/SKILL.md) を参照してください。
