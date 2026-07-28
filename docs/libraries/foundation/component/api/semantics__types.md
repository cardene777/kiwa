---
title: "@kiwa-lab/component semantics__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/component</code> <code v-pre>semantics&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>providerEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/types.ts#L112) <code v-pre>packages/component/src/semantics/types.ts</code>

```ts
export declare function providerEventName(target: ComponentTarget, neutral: NeutralEventName): string;
```

### 型

#### <code v-pre>AxisStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/types.ts#L47) <code v-pre>packages/component/src/semantics/types.ts</code>

```ts
export interface AxisStep<TState extends string> {
    neutralEvent: NeutralEventName;
    providerEvent: string;
    state: TState;
    amountCents: number;
    metadata: Record<string, string | number | boolean>;
}
```

#### <code v-pre>ComponentAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/types.ts#L10) <code v-pre>packages/component/src/semantics/types.ts</code>

```ts
export type ComponentAxis = 'rsc-harness' | 'streaming-ssr' | 'view-transitions' | 'form-action-advanced' | 'react-19-actions' | 'islands-architecture';
```

#### <code v-pre>ComponentTarget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/types.ts#L8) <code v-pre>packages/component/src/semantics/types.ts</code>

Advanced component semantics — target-neutral axis SSOT. The component package spans Storybook 8, Playwright Component Testing, and Chromatic. These helpers model the observable semantics without importing any of those runtimes, so the same axis can be replayed against each target.

```ts
export type ComponentTarget = 'storybook8' | 'playwright-ct' | 'chromatic';
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/types.ts#L19) <code v-pre>packages/component/src/semantics/types.ts</code>

```ts
export type NeutralEventName = 'rsc.render_started' | 'rsc.suspense_boundary' | 'rsc.html_chunk_streamed' | 'rsc.render_completed' | 'ssr.suspense_pending' | 'ssr.error_boundary_captured' | 'ssr.progressive_hydration_started' | 'ssr.selective_hydration_completed' | 'transition.element_started' | 'transition.element_finished' | 'transition.document_started' | 'transition.animation_asserted' | 'form.status_pending' | 'form.optimistic_applied' | 'form.progressive_enhanced' | 'form.action_resolved' | 'action.state_initialized' | 'action.transition_pending' | 'action.optimistic_committed' | 'action.resolved' | 'islands.registered' | 'islands.hydration_started' | 'islands.interactive_ready' | 'islands.static_boundary_asserted';
```
