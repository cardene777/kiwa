# Skill Test の導入

ここでは、入力を読んでから安全なコマンドだけを実行する小さな runner をテストします。大切なのは spy へ手で記録することではなく、runner の `onToolCall` callback が記録することです。

## インストールする

```bash
pnpm add -D @kiwa-lab/skill-test vitest
```

## 対象の呼び出し地点を配線する

`src/run-task.ts` に、ツールを呼ぶたび callback へ渡す最小の実装を置きます。実際の agent SDK ではこの関数を SDK の tool-call hook として渡します。

```ts
export type ToolCall = (name: string, argumentsJson: string) => void;

export function runTask(input: string, onToolCall: ToolCall) {
  onToolCall('Read', JSON.stringify({ path: 'instructions.md' }));

  if (input.includes('deploy')) {
    onToolCall('Bash', JSON.stringify({ cmd: 'pnpm deploy --dry-run' }));
    return 'dry run started';
  }

  return 'nothing to deploy';
}
```

この例で `onToolCall` は監査用の観測点です。ツール名と引数を受け取るだけで、実行自体を置き換えません。本物のツール実行が別の関数にある場合も、その直前または SDK callback で同じ観測点を呼びます。

## 実行経路をテストする

`tests/run-task.test.ts` に次を保存します。

```ts
import { expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCalledWith,
  assertToolCallOrder,
  assertToolNotCalled,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { runTask } from '../src/run-task';

it('deploy 前に instructions を読み dry run を一度だけ実行する', () => {
  const spy = createToolSpy();

  const result = runTask('deploy this service', spy.record);

  expect(result).toBe('dry run started');
  assertToolCalled(spy, 'Read', { times: 1 });
  assertToolCalledWith(spy, 'Bash', { cmd: 'pnpm deploy --dry-run' });
  assertToolCallOrder(spy, ['Read', 'Bash']);
  assertToolNotCalled(spy, 'Write');
});
```

各 test で `createToolSpy()` を呼びます。spy を共有すると別の test の記録が残り、回数や順序の失敗が実装ではなく test の隔離不足によるものになります。

## 実行して確認する

```bash
pnpm exec vitest run tests/run-task.test.ts
```

`1 passed` と表示されれば、実装が callback を経由して `Read`、`Bash` の順で記録し、`Bash` の引数と回数が期待どおりだったことを示します。`Bash` の中身や deployment の成功を示すものではありません。その確認は command を実行する integration test で行います。

## 失敗を読む

`never invoked` は実装が callback を呼んでいないか、期待する tool 名が違うことを示します。`no call matched expected args` は同名の tool は呼ばれたものの、JSON の構造または値が異なるという意味です。`expected order` は tool の順が逆か、途中に必要な tool がないという意味です。まず `spy.getCalls()` を出力して、実装が実際に記録した名前・引数・順番を確認します。

## skill との使い分け

この library に固有の companion skill はありません。agent の仕様からテストの土台を作る場合は、kiwa plugin を導入して対象に応じた skill を選びます。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

生成されたテストには、実装の tool-call callback を spy に接続する箇所が必要です。生成物をそのまま採用せず、成功条件、禁止する call、厳密にする順序をレビューしてから、対象 file だけを実行してください。

```bash
pnpm exec vitest run tests/run-task.test.ts
```
