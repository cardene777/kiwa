---
title: "@kiwa-lab/edge semantics__cpu-time-limit の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics&#95;&#95;cpu-time-limit</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>completeCpu</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L131) <code v-pre>packages/edge/src/semantics/cpu-time-limit.ts</code>

Finish the invocation. Transitions to `completed` and emits `cpu.completed` with the used ratio. Rejects if the session never started (`idle`).

```ts
export declare function completeCpu(session: CpuSession): AxisStep<CpuState>;
```

#### <code v-pre>startCpu</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L46) <code v-pre>packages/edge/src/semantics/cpu-time-limit.ts</code>

Begin consuming the CPU budget. Transitions `idle` → `running` and emits `cpu.started`. Rejects if the session is not `idle`.

```ts
export declare function startCpu(session: CpuSession): AxisStep<CpuState>;
```

#### <code v-pre>startCpuBudget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L27) <code v-pre>packages/edge/src/semantics/cpu-time-limit.ts</code>

Open a CPU budget. `budgetMs` defaults to 50 (Workers free-plan default) and `warningAtMs` to 40 (80% of the default budget). Emits nothing — the budget is `idle` until {@link startCpu}.

```ts
export declare function startCpuBudget(input: {
    platform: EdgePlatform;
    budgetMs?: number;
    warningAtMs?: number;
}): CpuSession;
```

#### <code v-pre>tickCpu</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L69) <code v-pre>packages/edge/src/semantics/cpu-time-limit.ts</code>

Advance the CPU clock by `deltaMs`. Emits `cpu.limited` when the accumulated time reaches the budget (state → `throttled`), `cpu.budget-warning` when it crosses the warning threshold (state → `warning`), otherwise a `cpu.started` heartbeat carrying the remaining budget. Rejects once the session is `throttled` or `completed`.

```ts
export declare function tickCpu(session: CpuSession, input: {
    deltaMs: number;
}): AxisStep<CpuState>;
```

### 型

#### <code v-pre>CpuSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L13) <code v-pre>packages/edge/src/semantics/cpu-time-limit.ts</code>

```ts
export interface CpuSession {
    platform: EdgePlatform;
    budgetMs: number;
    warningAtMs: number;
    elapsedMs: number;
    state: CpuState;
    history: AxisStep<CpuState>[];
}
```

#### <code v-pre>CpuState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L11) <code v-pre>packages/edge/src/semantics/cpu-time-limit.ts</code>

CPU time limit — per-invocation compute budget. Edge runtimes bill wall-clock loosely but enforce a hard CPU budget (Cloudflare Workers 50ms on the free plan, Vercel + Deno enforce comparable ceilings). The axis accumulates elapsed CPU time across ticks: below a warning threshold it is `running`, at the threshold it flips to `warning`, and once the budget is exhausted the invocation is `throttled` and no further work is admitted.

```ts
export type CpuState = 'idle' | 'running' | 'warning' | 'throttled' | 'completed';
```
