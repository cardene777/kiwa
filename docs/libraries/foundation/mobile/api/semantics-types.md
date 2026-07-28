---
title: "@kiwa-lab/mobile semantics-types の API 契約"
---

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics-types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>providerEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L230) <code v-pre>packages/mobile/src/semantics/types.ts</code>

```ts
export declare function providerEventName(target: MobileTarget, neutral: NeutralEventName): string;
```

### 型

#### <code v-pre>AxisStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L82) <code v-pre>packages/mobile/src/semantics/types.ts</code>

```ts
export interface AxisStep<TState extends string> {
    neutralEvent: NeutralEventName;
    providerEvent: string;
    state: TState;
    metadata: Record<string, string | number | boolean>;
}
```

#### <code v-pre>MobileAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L10) <code v-pre>packages/mobile/src/semantics/types.ts</code>

```ts
export type MobileAxis = 'react-native' | 'expo' | 'metro' | 'navigation' | 'reanimated' | 'async-storage' | 'secure-storage' | 'fabric' | 'turbo-modules' | 'codegen' | 'new-architecture';
```

#### <code v-pre>MobileTarget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L8) <code v-pre>packages/mobile/src/semantics/types.ts</code>

```ts
export type MobileTarget = 'ios' | 'android' | 'web';
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/types.ts#L25) <code v-pre>packages/mobile/src/semantics/types.ts</code>

```ts
export type NeutralEventName = 'rn.component_mounted' | 'rn.native_module_invoked' | 'rn.gesture_recognized' | 'rn.component_unmounted' | 'expo.build_config_loaded' | 'expo.deep_link_resolved' | 'expo.push_notification_received' | 'expo.build_completed' | 'metro.bundle_started' | 'metro.module_resolved' | 'metro.hmr_applied' | 'metro.bundle_completed' | 'navigation.stack_pushed' | 'navigation.tab_switched' | 'navigation.modal_opened' | 'navigation.deep_link_navigated' | 'reanimated.shared_value_updated' | 'reanimated.worklet_executed' | 'reanimated.animation_started' | 'reanimated.animation_completed' | 'async-storage.item_set' | 'async-storage.item_read' | 'async-storage.item_removed' | 'async-storage.batch_flushed' | 'secure-storage.credential_stored' | 'secure-storage.credential_retrieved' | 'secure-storage.biometric_challenged' | 'secure-storage.credential_removed' | 'fabric.render_scheduled' | 'fabric.shadow_tree_committed' | 'fabric.priority_updated' | 'fabric.mount_completed' | 'turbo-modules.spec_registered' | 'turbo-modules.jsi_bound' | 'turbo-modules.method_invoked' | 'turbo-modules.unregistered' | 'codegen.schema_loaded' | 'codegen.spec_generated' | 'codegen.type_emitted' | 'codegen.build_completed' | 'new-architecture.init_started' | 'new-architecture.concurrent_enabled' | 'new-architecture.interop_bridged' | 'new-architecture.ready';
```
