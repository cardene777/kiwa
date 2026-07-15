# @kiwa-lab/vector

Vector DB mock harness for kiwa — Pinecone / Weaviate / Qdrant / pgvector の embedding upsert + nearest query + distance primitives を in-process で叩く test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/vector
# or
npm install -D @kiwa-lab/vector
# or
yarn add -D @kiwa-lab/vector
```

## Supported providers

| Provider | Status | Metric support |
|---|---|---|
| Pinecone | ✅ | cosine / euclidean / dot |
| Weaviate | ✅ | cosine / euclidean / dot |
| Qdrant | ✅ | cosine / euclidean / dot |
| pgvector | ✅ | cosine / euclidean / dot |

## Quick start

```ts
import { createVectorClient, queryNearest, cosineSimilarity } from '@kiwa-lab/vector';

const client = createVectorClient({ provider: 'pinecone', namespace: 'docs', dimension: 3 });

await client.upsert([
  { id: 'd1', values: [0.1, 0.2, 0.3], metadata: { title: 'a' } },
  { id: 'd2', values: [0.9, 0.8, 0.7], metadata: { title: 'b' } },
]);

const result = await queryNearest(client, {
  vector: [0.1, 0.2, 0.3], topK: 2, metric: 'cosine',
});
// result.matches = [{ id: 'd1', score: 1.0 }, { id: 'd2', score: ... }]

const sim = cosineSimilarity([1, 0], [0, 1]); // = 0
```

## API reference

- `createVectorClient(options?: CreateVectorClientOptions): VectorClient` — provider mock 生成
- `VectorClient.upsert(records: VectorRecord[]): Promise<UpsertResult>` — 複数 vector 追加/更新
- `VectorClient.fetch(id: string): Promise<VectorRecord | null>` — id 指定取得
- `queryNearest(client, options: QueryOptions): Promise<QueryResult>` — 類似検索 (topK / metric / filter)
- `deleteVectors(client, ids: string[]): DeleteResult` — id 一括削除
- `cosineSimilarity(a, b) / euclideanDistance(a, b) / dotProduct(a, b)` — pure distance primitives

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createVectorClient, queryNearest } from '@kiwa-lab/vector';

describe('RAG retrieval', () => {
  it('cosine で類似 chunk 返却', async () => {
    const c = createVectorClient({ provider: 'pinecone', dimension: 3 });
    await c.upsert([{ id: 'a', values: [1, 0, 0] }]);
    const r = await queryNearest(c, { vector: [1, 0, 0], topK: 1, metric: 'cosine' });
    expect(r.matches[0]!.id).toBe('a');
  });
});
```

`/kiwa-vector` skill を起動すると upsert + query + distance primitive の test を生成できる。

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
