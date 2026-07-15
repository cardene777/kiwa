# Lib composition pattern

kiwa の 26 lib は独立に使えるが、 real SaaS app の test は複数 lib の組合わせで成立する。 本 doc は「lib を組合わせて実 app test を書く」 経路の SSOT。

## 前提思想

test を「1 lib = 1 domain」 で書き分けると、 real app の flow (「login → order → email → webhook → notification」) が横断的に test されない。 kiwa は各 lib の interface を統一しているため、 複数 lib の client を beforeEach で組立てて、 downstream の flow を 1 test で通す pattern を推奨する。

## Pattern 1 — E-commerce order flow (5 lib composition)

order commit → payment charge → email send → notification schedule → analytics track の 5 stage を、 5 lib で構成する。

```typescript
import { createAuthClient } from '@kiwa-lab/auth';
import { createPaymentClient } from '@kiwa-lab/payment';
import { createEmailClient } from '@kiwa-lab/email';
import { createNotificationClient, sendPush } from '@kiwa-lab/notification';
import { createQueryClient, mutate } from '@kiwa-lab/query';
import { describe, expect, it, beforeEach } from 'vitest';

describe('e-commerce order flow', () => {
  let auth: ReturnType<typeof createAuthClient>;
  let payment: ReturnType<typeof createPaymentClient>;
  let email: ReturnType<typeof createEmailClient>;
  let notification: ReturnType<typeof createNotificationClient>;
  let query: ReturnType<typeof createQueryClient>;

  beforeEach(() => {
    auth = createAuthClient({ provider: 'supabase' });
    payment = createPaymentClient({ provider: 'stripe' });
    email = createEmailClient({ provider: 'resend' });
    notification = createNotificationClient({ push: { provider: 'fcm' } });
    query = createQueryClient({ provider: 'tanstack-query' });
  });

  it('sign-in → order → charge → email → push notification', async () => {
    // 1. Auth
    const user = await auth.signIn({ email: 'a@x', password: 'p' });
    expect(user.id).toBeDefined();

    // 2. Order create (via query mutation for cache invalidation)
    const order = await mutate(query, async () => createOrder({ userId: user.id, total: 1500 }), {
      invalidates: [['orders', user.id]],
    });
    expect(order.status).toBe('success');

    // 3. Payment charge
    const charge = await payment.charge({ amount: 1500, currency: 'jpy', source: 'pm_test' });
    expect(charge.status).toBe('succeeded');

    // 4. Confirmation email
    await email.send({
      from: 'shop@x',
      to: user.email,
      subject: `Order confirmed: ${order.data.id}`,
    });
    expect(email.listSent()).toHaveLength(1);

    // 5. Push notification
    await sendPush(notification, {
      token: user.deviceToken,
      title: 'Order ready',
      body: `Order ${order.data.id} confirmed`,
    });
    expect(notification.listSent()).toHaveLength(1);
  });
});
```

5 lib の composition で「real app の end-to-end user journey」 を 1 test で verify する。 各 lib は互いに疎結合、 provider 変更は独立に行える。

## Pattern 2 — RAG chatbot (4 lib composition)

user query → vector search → LLM completion → response cache の 4 stage を組合わせる。

```typescript
import { createAiLlmClient } from '@kiwa-lab/ai-llm';
import { createVectorClient, upsertVectors, queryNearest } from '@kiwa-lab/vector';
import { createCacheClient } from '@kiwa-lab/cache';
import { createI18nClient, translate } from '@kiwa-lab/i18n';

describe('multilingual RAG chatbot', () => {
  it('ja user query → doc retrieve → LLM answer → translate + cache', async () => {
    const llm = createAiLlmClient({ provider: 'anthropic' });
    const vector = createVectorClient({ provider: 'pinecone', dimension: 384 });
    const cache = createCacheClient({ provider: 'redis' });
    const i18n = createI18nClient({ provider: 'next-intl', defaultLocale: 'ja' });

    // 1. Vector store setup
    await upsertVectors(vector, [
      { id: 'doc-1', values: embedText('kiwa email test'), metadata: { lang: 'en' } },
    ]);

    const query = 'kiwaでメールをテストする方法';
    const cacheKey = `chat:${query}`;

    // 2. Cache check
    let answer = await cache.get(cacheKey);
    if (!answer) {
      // 3. Vector search
      const matches = queryNearest(vector, embedText(query), { topK: 3 });
      const context = matches.matches.map((m) => m.metadata?.title).join('\n');

      // 4. LLM completion
      const llmRes = await llm.complete({
        model: 'claude-sonnet',
        prompt: `Context:\n${context}\n\nQ: ${query}`,
      });

      // 5. Translate answer to user locale
      answer = translate(i18n, 'chatbot.answer', { values: { text: llmRes.text } }).text;

      // 6. Cache result
      await cache.set(cacheKey, answer, { ttl: 3600 });
    }

    expect(answer).toBeDefined();
  });
});
```

## Pattern 3 — Multi-tenant SaaS (7 lib composition)

tenant isolation + auth + orm + queue + observability + feature-flag + audit を組合わせる大規模 pattern。

```typescript
import { createAuthClient } from '@kiwa-lab/auth';
import { createOrmClient } from '@kiwa-lab/orm';
import { createQueueClient } from '@kiwa-lab/queue';
import { createObservabilityClient } from '@kiwa-lab/observability';
import { createFlagClient, evaluateFlag } from '@kiwa-lab/feature-flag';
import { createWorkflowClient, defineWorkflow, executeWorkflow } from '@kiwa-lab/workflow';

describe('tenant onboarding workflow', () => {
  it('new tenant sign up → org create → invite team → feature flags → provisioning workflow', async () => {
    const auth = createAuthClient({ provider: 'supabase' });
    const orm = createOrmClient({ provider: 'prisma' });
    const queue = createQueueClient({ provider: 'bullmq' });
    const obs = createObservabilityClient({ provider: 'sentry' });
    const flags = createFlagClient({ provider: 'growthbook', flags: [{ key: 'new-billing', defaultValue: false }] });
    const workflow = createWorkflowClient({ provider: 'temporal' });

    const owner = await auth.signUp({ email: 'owner@newco.x', password: 'p' });
    const org = await orm.create('organizations', { name: 'NewCo', ownerId: owner.id });
    await queue.enqueue('send-invites', { orgId: org.id, emails: ['team@x'] });

    const wf = defineWorkflow('provisioning', [
      { id: 'create-billing', fn: async () => ({ customerId: 'cus_1' }) },
      { id: 'setup-integrations', fn: async () => ({ ok: true }) },
    ]);
    const result = await executeWorkflow(workflow, wf, { orgId: org.id });
    expect(result.status).toBe('completed');

    const newBilling = evaluateFlag(flags, 'new-billing', { id: owner.id });
    expect(newBilling.value).toBeDefined();
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
