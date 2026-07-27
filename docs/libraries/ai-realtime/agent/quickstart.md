# @kiwa-lab/agent を始める

`@kiwa-lab/agent` を使うと、状態を受け取り更新を返すノードを接続して、外部サービスなしでエージェントの分岐をテストできます。

## インストール

```sh
pnpm add -D @kiwa-lab/agent vitest
```

Node.js 20 以降が必要です。

## 最小のグラフ

```ts
import { expect, test } from 'vitest';
import { END, START, StateGraph } from '@kiwa-lab/agent';

type State = { input: string; reply?: string };

test('入力を reply node が更新する', async () => {
  const graph = new StateGraph<State>()
    .addNode('reply', (state) => ({ reply: `received ${state.input}` }))
    .addEdge(START, 'reply')
    .addEdge('reply', END);
  const result = await graph.compile().invoke({ input: 'hello' });

  expect(result).toEqual({ input: 'hello', reply: 'received hello' });
});
```

この例を `tests/agent.test.ts` に保存して `pnpm exec vitest run tests/agent.test.ts` を実行します。`invoke` はノードが返す部分状態を元の状態へ shallow merge した最終状態を返します。

同じkeyをnodeが返すと前の値を置き換えます。ネストしたobjectのdeep mergeはしません。実行stepを確認する場合は `stream` を使うと、node名、patch、merge後のstateをnodeごとに取得できます。

## 次に進む

[使い方](./how-to) では、tool call で停止した run にアプリケーションが結果を渡し、完了まで進む flow を扱います。run status と graph の制約を調べるときは [リファレンス](./reference) を参照してください。
<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の code を test に書き、state の入力から最終値までの境界を直接確認してください。仕様から unit test の下書きを作る場合は、初回だけ Claude Code で plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次に対象 module の仕様と Vitest test の下書きを作ります。

```text
/kiwa:kiwa-design --layer unit --module reply-agent
/kiwa:kiwa-vitest --module reply-agent
```

生成した test は node 名、初期 state、更新される key、終了条件を実際の graph に合わせて確認してから実行します。既定の出力先を使う場合は、次の command でその file だけを実行します。

```bash
pnpm exec vitest run test/unit/reply-agent.test.ts
```

失敗時は START edge が一つだけか、各 node が END までの edge を持つか、LLM や tool の実行結果を mock の assertion に混ぜていないかを確認してください。
