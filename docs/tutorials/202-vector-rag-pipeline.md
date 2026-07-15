# Tutorial 28 — Vector DB RAG pipeline (Pinecone + embedding + similarity search)

## 目的

`@kiwa-lab/vector` を使って RAG (Retrieval Augmented Generation) pipeline を end-to-end で test する。 embedding upsert + metadata filter + top-k similarity search + rerank + context injection を real Pinecone / Weaviate 接続なしで verify する。

## 前提

- `pnpm add -D @kiwa-lab/vector vitest`
- 対象 app に `embedText(text): number[]` (embedding 関数、 決定的 mock でよい)

## Step 1 — Vector client setup

Pinecone を対象に、 384 dim + cosine metric で mock client を立てる。 provider 切替は `provider: 'weaviate' | 'qdrant' | 'pgvector'` で 1 引数変更。

```typescript
import { createVectorClient } from '@kiwa-lab/vector';
import { describe, expect, it, beforeEach } from 'vitest';

// deterministic embedding mock (real は OpenAI ada-002 等)
const embedText = (text: string): number[] => {
  const arr = new Array(384).fill(0);
  for (let i = 0; i < text.length; i++) {
    arr[i % 384] += text.charCodeAt(i) / 100;
  }
  return arr;
};

describe('RAG document search', () => {
  let client: ReturnType<typeof createVectorClient>;

  beforeEach(() => {
    client = createVectorClient({
      provider: 'pinecone',
      dimension: 384,
      metric: 'cosine',
      index: 'kiwa-docs',
    });
  });
});
```

## Step 2 — Document embedding upsert

複数 doc を metadata (title / category / language) 付きで一括 upsert。

```typescript
import { upsertVectors } from '@kiwa-lab/vector';

it('10 doc を upsert + counts が一致', async () => {
  const docs = [
    { id: 'doc-1', title: 'kiwa email test guide', category: 'test-infra' },
    { id: 'doc-2', title: 'Next.js Server Actions patterns', category: 'framework' },
    { id: 'doc-3', title: 'Pinecone RAG best practices', category: 'vector-db' },
    { id: 'doc-4', title: 'RSA JWT verification', category: 'crypto' },
    { id: 'doc-5', title: 'GraphQL server mocking', category: 'test-infra' },
    // ... 10 個
  ];
  const records = docs.map((d) => ({
    id: d.id,
    values: embedText(d.title),
    metadata: { title: d.title, category: d.category },
  }));
  const result = await upsertVectors(client, records);
  expect(result.upserted).toBe(docs.length);
});
```

## Step 3 — Top-k similarity search

user query に対して top-3 nearest doc を検索、 cosine similarity で ranking。

```typescript
import { queryNearest } from '@kiwa-lab/vector';

it('user query "how to test email with kiwa" で top-3 に email doc が含まれる', async () => {
  const queryVector = embedText('how to test email with kiwa');
  const result = queryNearest(client, queryVector, { topK: 3 });
  expect(result.matches).toHaveLength(3);
  const topIds = result.matches.map((m) => m.id);
  expect(topIds).toContain('doc-1'); // "kiwa email test guide"
  // scores は降順
  expect(result.matches[0].score).toBeGreaterThanOrEqual(result.matches[1].score);
});
```

## Step 4 — Metadata filter query

category = 'test-infra' に絞って top-2 を検索、 RAG で「特定 domain の doc だけ context に入れる」 経路を verify。

```typescript
it('category=test-infra filter で email + graphql に絞れる', async () => {
  const queryVector = embedText('mock test infra');
  const result = queryNearest(client, queryVector, {
    topK: 2,
    filter: { category: 'test-infra' },
  });
  expect(result.matches).toHaveLength(2);
  for (const match of result.matches) {
    expect(match.metadata?.category).toBe('test-infra');
  }
});
```

## Step 5 — Distance primitive で単独計算

`cosineSimilarity(a, b)` で 2 vector 間の距離を直接計算、 provider 経由せず primitive を verify。

```typescript
import { cosineSimilarity, euclideanDistance, dotProduct } from '@kiwa-lab/vector';

it('cosineSimilarity で類似 doc pair の score が > 0.8', () => {
  const a = embedText('kiwa email test');
  const b = embedText('kiwa email verify');
  const c = embedText('completely unrelated topic');
  expect(cosineSimilarity(a, b)).toBeGreaterThan(0.8);
  expect(cosineSimilarity(a, c)).toBeLessThan(cosineSimilarity(a, b));
});

it('euclideanDistance と dotProduct も primitives 一致', () => {
  const a = [1, 0, 0];
  const b = [0.9, 0.1, 0];
  expect(cosineSimilarity(a, b)).toBeCloseTo(0.994, 2);
  expect(euclideanDistance(a, b)).toBeCloseTo(0.141, 2);
  expect(dotProduct(a, b)).toBeCloseTo(0.9, 2);
});
```

## Step 6 — RAG context injection full flow

query → top-k retrieve → context injection → LLM prompt build までの全 pipeline test。 LLM は mock で、 context に doc が含まれるかを verify。

```typescript
it('user query から context injected prompt を build', async () => {
  const userQuery = 'how do I test email delivery webhooks in kiwa?';
  const queryVector = embedText(userQuery);
  const search = queryNearest(client, queryVector, { topK: 3 });

  const context = search.matches
    .map((m) => `[${m.metadata?.title}] score: ${m.score.toFixed(3)}`)
    .join('\n');

  const prompt = `Answer using ONLY the following context:\n\n${context}\n\nQuestion: ${userQuery}`;
  expect(prompt).toContain('kiwa email test guide');
  expect(prompt).toContain(userQuery);
  expect(prompt.length).toBeLessThan(4000); // token budget check
});
```

## Step 7 — Delete + re-upsert for document updates

doc 更新時は同 id で upsert (upsert = update)、 削除は `deleteVectors`。

```typescript
import { deleteVectors, upsertVectors } from '@kiwa-lab/vector';

it('doc-1 削除後の query で doc-1 が返らない', async () => {
  const del = await deleteVectors(client, ['doc-1']);
  expect(del.deleted).toBe(1);

  const queryVector = embedText('kiwa email test guide');
  const result = queryNearest(client, queryVector, { topK: 5 });
  expect(result.matches.map((m) => m.id)).not.toContain('doc-1');
});
```

## 期待結果

- 全 7 assertion PASS、 real Pinecone / OpenAI embedding API に 1 度も接続せず
- deterministic embedding mock で test 間の score が固定 (flaky なし)
- 4 provider (pinecone / weaviate / qdrant / pgvector) で同 test を横展開可能

## 関連

- API reference: [`/api/vector`](../api/vector)
- Skill: [`/kiwa-vector`](../skills/kiwa-vector)
- Related: [`/tutorials/06-anthropic-chatbot-streaming`](./06-anthropic-chatbot-streaming) (LLM streaming)
