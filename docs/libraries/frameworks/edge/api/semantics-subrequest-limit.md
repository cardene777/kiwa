---
title: "@kiwa-lab/edge semantics-subrequest-limit の API 契約"
---

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics-subrequest-limit</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>completeSubrequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L112) <code v-pre>packages/edge/src/semantics/subrequest-limit.ts</code>

Mark an outbound subrequest as finished. Emits `subrequest.completed` with the final count. Does not mutate state — a completed request that already tripped the limit stays `limited`.

```ts
export declare function completeSubrequest(session: SubrequestSession, input: {
    url: string;
    durationMs: number;
}): AxisStep<SubrequestState>;
```

#### <code v-pre>countSubrequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L72) <code v-pre>packages/edge/src/semantics/subrequest-limit.ts</code>

Count an admitted subrequest against the budget. Increments the count and emits `subrequest.limited` when the count reaches the hard limit (state → `limited`), otherwise `subrequest.counted` — flipping to `approaching-limit` once the warning threshold is crossed.

```ts
export declare function countSubrequest(session: SubrequestSession): AxisStep<SubrequestState>;
```

#### <code v-pre>remainingBudget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L132) <code v-pre>packages/edge/src/semantics/subrequest-limit.ts</code>

Remaining subrequest budget (never negative).

```ts
export declare function remainingBudget(session: SubrequestSession): number;
```

#### <code v-pre>startSubrequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L48) <code v-pre>packages/edge/src/semantics/subrequest-limit.ts</code>

Announce an outbound subrequest. Emits `subrequest.started` but does not advance the count (starting is distinct from counting — a started request only counts once it is admitted via {@link countSubrequest}). Rejects when the budget is already `limited`.

```ts
export declare function startSubrequest(session: SubrequestSession, input: {
    url: string;
}): AxisStep<SubrequestState>;
```

#### <code v-pre>startSubrequestBudget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L27) <code v-pre>packages/edge/src/semantics/subrequest-limit.ts</code>

Open a subrequest budget. `limit` defaults to 50 (Workers free-plan default) and `warningThreshold` to 40 (80% of the default limit). Emits nothing — the budget is inert until the first {@link startSubrequest}.

```ts
export declare function startSubrequestBudget(input: {
    platform: EdgePlatform;
    limit?: number;
    warningThreshold?: number;
}): SubrequestSession;
```

### 型

#### <code v-pre>SubrequestSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L13) <code v-pre>packages/edge/src/semantics/subrequest-limit.ts</code>

```ts
export interface SubrequestSession {
    platform: EdgePlatform;
    count: number;
    limit: number;
    warningThreshold: number;
    state: SubrequestState;
    history: AxisStep<SubrequestState>[];
}
```

#### <code v-pre>SubrequestState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L11) <code v-pre>packages/edge/src/semantics/subrequest-limit.ts</code>

Subrequest limit — outbound fetch budget per invocation. Edge runtimes cap how many subrequests a single handler may issue (Cloudflare Workers default 50 on the free plan, Vercel + Deno enforce comparable ceilings). The axis tracks a running count against the limit: below a warning threshold the session is `ok`, at the threshold it is `approaching-limit`, and once the count reaches the hard limit it is `limited` and further fetches are refused.

```ts
export type SubrequestState = 'ok' | 'approaching-limit' | 'limited';
```
