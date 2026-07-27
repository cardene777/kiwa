import {
  createVectorClient,
  deleteVectors,
  queryNearest,
  upsertVectors,
} from '@kiwa-lab/vector';
import { describe, expect, it } from 'vitest';

describe('library documentation vector recipes', () => {
  it('returns the closest document for a cosine query', async () => {
    const client = createVectorClient({ provider: 'pinecone', dimension: 3 });
    await upsertVectors(client, [
      { id: 'handbook', values: [1, 0, 0], metadata: { source: 'docs' } },
      { id: 'pricing', values: [0, 1, 0], metadata: { source: 'site' } },
    ]);

    const result = queryNearest(client, [1, 0, 0], { topK: 2, metric: 'cosine' });
    expect(result.matches.map((match) => match.id)).toEqual(['handbook', 'pricing']);
  });

  it('uses a metadata predicate to narrow retrieval', async () => {
    const client = createVectorClient({ provider: 'pgvector', dimension: 2 });
    await client.upsert([
      { id: 'ja-1', values: [1, 0], metadata: { lang: 'ja' } },
      { id: 'en-1', values: [0.9, 0.1], metadata: { lang: 'en' } },
    ]);

    const result = queryNearest(client, [1, 0], {
      topK: 5,
      filter: (metadata) => metadata?.lang === 'ja',
    });
    expect(result.matches.map((match) => match.id)).toEqual(['ja-1']);
  });

  it('rejects an invalid dimension and removes a record', async () => {
    const client = createVectorClient({ provider: 'qdrant', dimension: 2 });
    await client.upsert([{ id: 'old', values: [1, 0] }]);

    await expect(client.upsert([{ id: 'bad', values: [1, 2, 3] }])).rejects.toThrow(
      /dimension mismatch/,
    );
    await expect(deleteVectors(client, ['old', 'missing'])).resolves.toMatchObject({
      deletedCount: 1,
    });
    expect(client.size()).toBe(0);
  });
});
