# Vector の導入

ベクトルを保存し、最も近い文書を検索します。

## 前提

Node.js 20 以降が必要です。

## 実行

```sh
pnpm add -D @kiwa-lab/vector vitest
```

```ts
import { expect, test } from 'vitest';
import { createVectorClient, queryNearest } from '@kiwa-lab/vector';

test('最も近い vector を返し、dimension の違いを拒否する', async () => {
  const client = createVectorClient({ provider: 'pinecone', namespace: 'docs', dimension: 3 });
  await client.upsert([{ id: 'd1', values: [0.1, 0.2, 0.3], metadata: { title: 'a' } }]);
  const result = queryNearest(client, [0.1, 0.2, 0.3], { topK: 1, metric: 'cosine' });

  expect(result.matches[0]?.id).toBe('d1');
  expect(result.matches).toHaveLength(1);
  await expect(client.upsert([{ id: 'bad', values: [1, 2] }])).rejects.toThrow(/dimension mismatch/);
});
```

## 確認

この例を `tests/vector.test.ts` に保存して `pnpm exec vitest run tests/vector.test.ts` を実行します。`result.matches` には cosine では大きい score 順、euclidean では小さい score 順のベクトルが入ります。`dimension: 3` の client には長さ3の record だけを `upsert` してください。

`topK` の既定値は10です。metadata は常に match へ入り、values は `includeValues: true` のときだけ入ります。0 vector を cosine で比較した score は0です。
<!-- skill-guide -->
## skill で test を作る

この library には `/kiwa:kiwa-vector` という companion skill があります。初回だけ kiwa plugin を導入し、この Quickstart の package 導入も済ませてください。skill は library の挙動を実行時に置き換えるものではなく、ここで確認したい境界を test の形にする入口です。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の例では、対象を表す名前を `--module` に渡します。生成先を変えたい場合は、skill の仕様にある `--output` を指定してください。

```text
/kiwa:kiwa-vector --module rag-search --provider pinecone
```

生成された test file を読み、`upsert` 後の件数、`queryNearest` の順位、dimension 不一致の rejection が期待値になっていることを確認します。既定の出力先を使った場合は、次でその file だけを実行します。

```bash
pnpm exec vitest run tests/rag-search.vector.test.ts
```

`--output` を指定すれば生成先を固定できます。実 provider の index build、network、認可、retry は in-memory client が扱わないため、別の integration test で確認します。引数の詳細は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-vector/SKILL.md) を参照してください。
