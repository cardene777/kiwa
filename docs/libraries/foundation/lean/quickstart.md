# Lean の導入

ここでは `idle` と `active` の二状態を持つ session を例に、表を生成し、実装と比較します。まずは Lean の実行を必要としない部分から始めます。生成と実装比較だけなら Node.js 20 以降で動きます。

## インストールする

アプリケーションまたは検証用の workspace にライブラリとテストランナーを追加します。

```bash
pnpm add -D @kiwa-lab/lean vitest
```

`verifyLeanSpec` まで実行する環境には Lean 4 も必要です。macOS で Homebrew を使う場合の一例は次です。

```bash
brew install elan-init
elan toolchain install leanprover/lean4:v4.15.0
lean --version
```

`lean --version` が表示されない環境では、先に生成と実装比較だけを実行してください。`lean-not-installed` をテストの成功として扱ってはいけません。

## 最初の状態表を書く

`tests/session-machine.test.ts` を作成し、次の内容を保存します。表の四つのセルを意図して埋めています。`idle + start` と `active + stop` は遷移し、それ以外は拒否します。

```ts
import { expect, it } from 'vitest';
import { checkConformance, generateLeanSpec } from '@kiwa-lab/lean';

const session = {
  moduleName: 'Session',
  namespace: 'Session',
  states: ['idle', 'active'],
  events: ['start', 'stop'],
  transitions: [
    { from: 'idle', event: 'start', to: 'active' },
    { from: 'idle', event: 'stop', invalid: true },
    { from: 'active', event: 'start', invalid: true },
    { from: 'active', event: 'stop', to: 'idle' },
  ],
  initial: 'idle',
} as const;

it('仕様表と実装の判断が一致する', () => {
  const generated = generateLeanSpec(session);

  expect(generated.meta).toMatchObject({
    cellCount: 4,
    validTransitionCount: 2,
    invalidTransitionCount: 2,
  });
  expect(generated.source).toContain('def dispatch');

  const report = checkConformance(session, (state, event) => {
    if (state === 'idle' && event === 'start') return { kind: 'to', state: 'active' };
    if (state === 'active' && event === 'stop') return { kind: 'to', state: 'idle' };
    return { kind: 'rejected' };
  });

  expect(report).toMatchObject({ ok: true, checked: 4 });
});
```

`as const` は状態名とイベント名を文字列リテラルとして保つためではなく、ここではテストの表を変更しない意思を表すために使っています。実際のアプリケーションでは、同じ表を専用の仕様ファイルへ切り出して構いません。

## 実行して確認する

保存したファイルだけを実行します。

```bash
pnpm exec vitest run tests/session-machine.test.ts
```

`1 passed` が出て、`checked: 4` の期待値が満たされれば、四つのセルについて observer と表が一致しています。ここでは Lean は起動していません。次の節で、生成物を実際の Lean に渡します。

## Lean で検査する

Lean を導入済みなら、同じテストに次を追加します。

```ts
import { verifyLeanSpec } from '@kiwa-lab/lean';

it('Lean が生成した仕様を検査する', () => {
  const generated = generateLeanSpec(session);
  const result = verifyLeanSpec([generated], {
    workDir: process.cwd(),
    leanToolchain: 'leanprover/lean4:v4.15.0',
  });

  expect(result.status).toBe('ok');
  expect(result.verifiedFiles).toEqual(['KiwaSpecs/Session.lean']);
});
```

`status` が `verification-failed` なら `diagnostics` を読み、表と宣言した到達性・終端状態のどちらが意図と異なるかを直します。`timed-out` や `output-too-large` は判定不能です。timeout を延ばす前に、生成した表が不必要に大きくなっていないか確認してください。

## skill と組み合わせる

状態遷移の項目を仕様から整理したい場合は、Kaname companion skill を使えます。初回だけ kiwa plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

導入後、対象機能を指定して実行します。

```text
/kiwa:kaname --feature session
```

skill が出力した項目は設計のたたき台です。状態、イベント、拒否、初期状態をレビューしてから、このページの状態表へ転記してください。toolchain がない環境で skill が verification を skip と報告した場合は、生成した Lean ソースを確認し、Lean を導入した CI または開発環境で `verifyLeanSpec` を改めて実行します。
