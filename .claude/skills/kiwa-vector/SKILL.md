---
name: kiwa-vector
description: |
  @kiwa-lab/vector (Pinecone / Weaviate / Qdrant / pgvector 統一 mock harness) を使った vector DB 経路の test 生成 skill。
  `createVectorClient` + `upsertVectors` / `queryNearest` / `deleteVectors` を統一 interface で叩き、 cosine / euclidean / dot product 距離計算 primitives も直接 assert 可能。 RAG pipeline の embedding storage + similarity search を real DB 不要で test 化する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-vector — vector DB (embeddings) test 生成

`@kiwa-lab/vector` の 4 provider (Pinecone / Weaviate / Qdrant / pgvector) 統一 mock を使った vector DB test を Vitest 形式で生成する。 real DB 接続なしで upsert / query / distance 計算の test を書く。

## 目的

RAG (Retrieval Augmented Generation) app / semantic search / recommender で「document → embedding → upsert → query nearest → topK retrieval」 の complete path を test 化する。 provider 差 (Pinecone namespaces / Weaviate class + property / Qdrant collection + point / pgvector SQL) を吸収した抽象。

## 前提

- `pnpm add -D @kiwa-lab/vector` install 済
- Vitest 環境
- 対象 module に vector DB 経路 (embedding storage / RAG retrieval 等) が存在

## オプション

- `--module {name}` — test 対象 module (rag-search / recommend / semantic-index 等)
- `--provider {pinecone|weaviate|qdrant|pgvector}` — 主要 provider (省略時 = 4 provider 全対応)
- `--output {path}` — 生成 test の path

## 実行フロー

### Step 1: upsert test 生成

`createVectorClient({ provider, dimension: 384 })` で client、 `upsertVectors(client, [{ id, values, metadata }...])` で batch upsert、 `client.stats()` で `count` + `dimension` を assert。 metadata 検索用 field も含める。

### Step 2: nearest query test 生成

`queryNearest(client, { values: [...] }, { topK: 3, metric: 'cosine' })` で similarity search、 return `matches[]` の順序 (score 降順) + topK 数を assert。 cosine / euclidean / dot metric を it.each で cover、 metadata filter (`filter: { category: 'doc' }`) も追加。

### Step 3: distance primitive test 生成

`cosineSimilarity([1,0,0], [0,1,0])` = 0、 `euclideanDistance([0,0], [3,4])` = 5、 `dotProduct([1,2], [3,4])` = 11 等の pure function assertion で計算精度を verify。

## 使用例

```bash
/kiwa-vector --module rag-search --provider pinecone
/kiwa-vector --module recommend --provider pgvector
```
