---
title: "@kiwa-lab/nextjs semantics-types の API 契約"
---

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>semantics-types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>providerEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L136) <code v-pre>packages/nextjs/src/semantics/types.ts</code>

```ts
export declare function providerEventName(target: NextTarget, neutral: NeutralEventName): string;
```

### 型

#### <code v-pre>AxisStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L47) <code v-pre>packages/nextjs/src/semantics/types.ts</code>

```ts
export interface AxisStep<TState extends string> {
    neutralEvent: NeutralEventName;
    providerEvent: string;
    state: TState;
    amountCents: number;
    metadata: Record<string, string | number | boolean>;
}
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L19) <code v-pre>packages/nextjs/src/semantics/types.ts</code>

```ts
export type NeutralEventName = 'action.form_submitted' | 'action.revalidate_path' | 'action.revalidate_tag' | 'action.redirected' | 'ppr.static_shell_rendered' | 'ppr.dynamic_hole_opened' | 'ppr.streaming_boundary_flushed' | 'ppr.completed' | 'intercept.current_segment' | 'intercept.parent_segment' | 'intercept.root_catchall' | 'intercept.modal_opened' | 'parallel.default_rendered' | 'parallel.loading_rendered' | 'parallel.error_boundary_captured' | 'parallel.slot_navigated' | 'turbopack.module_updated' | 'turbopack.hmr_boundary_found' | 'turbopack.hmr_applied' | 'turbopack.fast_refresh_completed' | 'transition.started' | 'transition.pending' | 'transition.interrupted' | 'transition.committed';
```

#### <code v-pre>NextAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L10) <code v-pre>packages/nextjs/src/semantics/types.ts</code>

```ts
export type NextAxis = 'server-action-advanced' | 'partial-prerendering' | 'interception-routes' | 'parallel-routes-advanced' | 'turbopack-hmr' | 'concurrent-transitions';
```

#### <code v-pre>NextTarget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L8) <code v-pre>packages/nextjs/src/semantics/types.ts</code>

Advanced Next.js semantics — target-neutral axis SSOT. The helpers model App Router, Pages Router, and Edge Runtime behavior as pure state machines. Tests can assert the neutral event while still seeing a target-specific dialect through providerEventName.

```ts
export type NextTarget = 'app-router' | 'pages-router' | 'edge-runtime';
```
