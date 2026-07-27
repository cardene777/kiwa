# Kaname の導入

仕様項目を検証方法ごとに分類し、形式検証用と実行時検証用の文書へ分けます。

## 前提

仕様には ID、本文、layer、verifyBy を持つ項目を用意します。

```bash
pnpm add -D @kiwa-lab/kaname @kiwa-lab/lean vitest
```

## 実行

```ts
import { expect, it } from 'vitest';
import { classify, splitSpec, type SpecDoc } from '@kiwa-lab/kaname';

const spec: SpecDoc = {
  title: 'Signup',
  items: [
    {
      id: 'AC-001',
      statement: 'session transitions follow the documented states',
      layer: 'formal',
      verifyBy: 'Session',
    },
    {
      id: 'AC-002',
      statement: 'signup persists the account',
      layer: 'runtime',
      verifyBy: 'tests/integration/signup.test.ts',
    },
  ],
};

it('分類できた仕様を formal と runtime に分ける', () => {
  const report = classify(spec);
  expect(report.ok).toBe(true);
  if (!report.ok) return;

  const files = splitSpec(spec);
  expect(files.specFormal).toContain('formal');
  expect(files.specRuntime).toContain('runtime');
});
```

`report.ok` が false のときは分割せず、`issues` の `duplicate-id`、`empty-statement`、`unknown-layer`、`empty-verify-by` を修正します。一つの item は `formal`、`runtime`、`human` のいずれか一層だけに置きます。

異なるlayerのitemが同じ `verifyBy` を使うと `both-layers-touch-same-artifact` になります。同じ要件を二つの方法で確認したい場合も、verifyByを別の検証artifactへ分け、個別itemとして記述してください。

## 実行して確認する

この例を `tests/kaname.spec.test.ts` に保存して実行します。

```bash
pnpm exec vitest run tests/kaname.spec.test.ts
```

成功時は Vitest が `1 passed` と表示し、classification は成功、`specFormal` には formal item、`specRuntime` には runtime item が入ります。`report.ok` が false なら `splitSpec` の文字列を保存せず、`issues` の reason を修正してから再実行します。

## 次に読む

[使い方](./how-to) と [リファレンス](./reference) で分類結果と生成物を確認します。
<!-- skill-guide -->
## skill との使い分け

`@kiwa-lab/kaname` には `kaname` skill があります。Claude Code を使う場合は、まず plugin を導入します。すでに導入済みならこの操作は不要です。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

[skills guide](/kiwa/guides/skills) の手順で plugin を導入すると、plugin 経由では `/kiwa:kaname` と実行します。skill は受け入れ条件を対話で集め、formal、runtime、human に分けた文書を作ります。package API を使う test の代わりではありません。

```text
/kiwa:kaname --feature signup
```

formal item がある場合は Lean の検証を試みます。Lean toolchain がない場合は formal verification だけが skip されるため、runtime と human の文書を使った test と review は続けられます。引数と出力先は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kaname/SKILL.md) を参照してください。
