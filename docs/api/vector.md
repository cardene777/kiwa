# @kiwa-lab/vector API reference

## Overview

`@kiwa-lab/vector` は Pinecone / Weaviate / Qdrant / pgvector 4 provider を統一 interface で mock する vector DB test infra。 embedding upsert + nearest neighbor query (cosine / euclidean / dot product) を real DB 不要で叩ける。

RAG pipeline (embedding storage + similarity search) の test を real bucket / real Pinecone に接続せず、 in-process で決定的に verify する。

## Supported providers

| provider | native distance | max dim | metadata filter |
|---|---|---|---|
| pinecone | cosine / euclidean / dot | 20000 | key-value |
| weaviate | cosine / euclidean / dot | 65535 | GraphQL where |
| qdrant | cosine / euclidean / dot | 65536 | JSON payload |
| pgvector | cosine / euclidean / L2 | 16000 | SQL WHERE |

## Main API

### `createVectorClient(options: CreateVectorClientOptions): VectorClient`

provider 別 mock client、 `dimension` + `metric` + `index` を config。

### `upsertVectors(client, records: VectorRecord[]): Promise<UpsertVectorsResult>`

複数 vector を一括 upsert、 `{ upserted, updated, elapsedMs }` を返す。

### `queryNearest(client, vector: number[], options: QueryOptions): QueryResult`

top-k nearest neighbor 検索、 `{ matches: [{ id, score, vector?, metadata? }] }` を返す。 metadata filter 対応。

### `deleteVectors(client, ids: string[]): Promise<DeleteResult>`

id 指定で削除、 `{ deleted, notFound }` を返す。

### `cosineSimilarity(a, b) / euclideanDistance(a, b) / dotProduct(a, b): number`

vector primitives、 provider 経由せず直接距離を計算。

## Types

- `VectorProvider = 'pinecone' | 'weaviate' | 'qdrant' | 'pgvector'`
- `VectorRecord` = `{ id, values: number[], metadata?: VectorMetadata }`
- `VectorMetadata = Record<string, string | number | boolean>`
- `DistanceMetric = 'cosine' | 'euclidean' | 'dot' | 'l2'`
- `QueryMatch` = `{ id, score, vector?, metadata? }`

## Usage examples

### RAG embedding pipeline test

```typescript
import { createVectorClient, upsertVectors, queryNearest } from '@kiwa-lab/vector';
import { describe, expect, it } from 'vitest';

describe('document search RAG', () => {
  it('user query に対して top-3 doc を返す', async () => {
    const client = createVectorClient({ provider: 'pinecone', dimension: 384, metric: 'cosine' });
    await upsertVectors(client, [
      { id: 'doc-1', values: embedText('kiwa test infra'), metadata: { title: 'kiwa docs' } },
      { id: 'doc-2', values: embedText('nextjs server actions'), metadata: { title: 'Next.js' } },
      { id: 'doc-3', values: embedText('vector database RAG'), metadata: { title: 'RAG' } },
    ]);
    const result = queryNearest(client, embedText('how to test with kiwa'), { topK: 3 });
    expect(result.matches[0].id).toBe('doc-1');
    expect(result.matches).toHaveLength(3);
  });
});
```

### Distance primitives 直接使用

```typescript
import { cosineSimilarity, euclideanDistance } from '@kiwa-lab/vector';

const a = [1, 0, 0];
const b = [0.9, 0.1, 0];
console.log(cosineSimilarity(a, b)); // ~0.994
console.log(euclideanDistance(a, b)); // ~0.141
```

## Related skills

- [`/kiwa-vector`](../skills/kiwa-vector) — vector DB test 生成 skill
- [`/kiwa-ai-llm`](../skills/kiwa-ai-llm) — RAG pipeline test (related)
