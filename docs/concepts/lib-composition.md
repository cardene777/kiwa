# Lib composition pattern

kiwa の各 lib は独立に使えるが、 real SaaS app の test は複数 lib の組合わせで成立する。 本 doc は「lib を組合わせて実 app test を書く」 経路の SSOT。

## 前提思想

test を「1 lib = 1 domain」 で書き分けると、 real app の flow (「login → order → email → webhook → notification」) が横断的に test されない。 kiwa は各 lib の interface を統一しているため、 複数 lib の client を beforeEach で組立てて、 downstream の flow を 1 test で通す pattern を推奨する。

## Pattern 2 — RAG chatbot (3 lib composition)

質問の受付 → 検索 → LLM 応答の 3 stage を、 3 lib で構成する。

```typescript
import { createSearchClient } from '@kiwa-lab/search';
import { createLlmClient } from '@kiwa-lab/ai-llm';
import { createObservabilityClient } from '@kiwa-lab/observability';
import { describe, expect, it } from 'vitest';

describe('RAG chatbot', () => {
  it('question → retrieve → answer → trace', async () => {
    const search = createSearchClient({ provider: 'meilisearch' });
    const llm = createLlmClient({ provider: 'anthropic' });
    const obs = createObservabilityClient();

    // 1. 関連 document を引く
    await search.index([{ id: 'd1', text: 'kiwa は test adapter 群である' }]);
    const hits = await search.query('kiwa とは');
    expect(hits.length).toBeGreaterThan(0);

    // 2. 引いた document を context に LLM へ渡す
    const answer = await llm.complete({
      prompt: `${hits.map((h) => h.text).join('\n')}\n\nQ: kiwa とは`,
    });
    expect(answer.text).toContain('test');

    // 3. 経路を trace として残す
    obs.record({ name: 'rag.answer', attributes: { hits: hits.length } });
    expect(obs.listRecorded()).toHaveLength(1);
  });
});
```

## Pattern 3 — Multi-tenant SaaS (4 lib composition)

tenant 分離 → 認証 → データ操作 → 監視の 4 stage を、 4 lib で構成する。

```typescript
import { createAuthClient } from '@kiwa-lab/auth';
import { setupOrmEnv } from '@kiwa-lab/orm';
import { createQueueClient } from '@kiwa-lab/queue';
import { createObservabilityClient } from '@kiwa-lab/observability';
import { describe, expect, it } from 'vitest';

describe('multi-tenant SaaS', () => {
  it('tenant 分離が data 層まで通る', async () => {
    const auth = createAuthClient({ provider: 'clerk' });
    const env = await setupOrmEnv({ mode: 'mock', orm: 'drizzle', dialect: 'sqlite', schema });
    const queue = createQueueClient({ provider: 'bullmq' });
    const obs = createObservabilityClient();

    // 1. tenant A で sign-in
    const user = await auth.signIn({ email: 'a@tenant-a', password: 'p' });

    // 2. tenant scope 付きで書き込む
    await env.db.insert(items).values({ tenantId: user.tenantId, name: 'x' });

    // 3. 非同期処理を積む
    await queue.add('reindex', { tenantId: user.tenantId });
    expect(queue.listJobs()).toHaveLength(1);

    // 4. tenant 越しに読めないことを確かめる
    const other = await env.db.select().from(items).where(eq(items.tenantId, 'tenant-b'));
    expect(other).toHaveLength(0);

    obs.record({ name: 'tenant.isolation.verified' });
  });
});
```

## Anti-pattern (推奨しない)

- **1 lib のみを深く test して他 lib を無視** = real app flow が verify されない
- **各 lib を別 test file に分割 (composition なし)** = downstream の flow bug (email 送信後の notification 経路等) が検知不能
- **real provider に依存 (mock を混ぜない)** = flaky test + 高 cost、 kiwa の哲学と真逆

## Related

- [Multi-provider mock pattern](./multi-provider-mock) — 単 lib 内 provider 統一
- [Test taxonomy guide](../api/test-taxonomy-guide) — perf / fidelity / skill / integration の 4 category 分類
