# @kiwa-lab/vector

Vector DB provider mock harness for kiwa — Pinecone / Weaviate / Qdrant / pgvector を統一 interface で invoke する in-process mock。

## API

- `createVectorClient(options)` = provider mock client (upsert / query / delete / stats)
- `upsertVectors(client, vectors)` = batch upsert helper (id + values + metadata)
- `queryNearest(client, query, opts)` = similarity search (cosine / euclidean / dot、 topK / filter)
- `deleteVectors(client, ids)` = id 群一括削除
- `cosineSimilarity` / `euclideanDistance` / `dotProduct` = 距離計算 primitives
