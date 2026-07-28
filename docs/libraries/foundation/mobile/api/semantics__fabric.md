---
title: "@kiwa-lab/mobile semantics__fabric の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics&#95;&#95;fabric</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>commitShadowTree</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L57) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

```ts
export declare function commitShadowTree(session: FabricSession, input: {
    nodeCount: number;
}): AxisStep<FabricState>;
```

#### <code v-pre>completeFabricMount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L79) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

```ts
export declare function completeFabricMount(session: FabricSession): AxisStep<FabricState>;
```

#### <code v-pre>initFabric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L36) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

```ts
export declare function initFabric(input: {
    target: MobileTarget;
    rootId: string;
}): FabricSession;
```

#### <code v-pre>scheduleFabricRender</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L48) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

```ts
export declare function scheduleFabricRender(session: FabricSession, priority: 'discrete' | 'continuous' | 'idle'): AxisStep<FabricState>;
```

#### <code v-pre>updateFabricPriority</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L70) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

```ts
export declare function updateFabricPriority(session: FabricSession, priority: 'discrete' | 'continuous' | 'idle'): AxisStep<FabricState>;
```

### 型

#### <code v-pre>FabricSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L8) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

```ts
export interface FabricSession {
    target: MobileTarget;
    rootId: string;
    state: FabricState;
    scheduledPriority: 'discrete' | 'continuous' | 'idle' | null;
    shadowNodeCount: number;
    history: AxisStep<FabricState>[];
}
```

#### <code v-pre>FabricState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fabric.ts#L6) <code v-pre>packages/mobile/src/semantics/fabric.ts</code>

v1.52 fabric axis — React Native 0.76+ Fabric renderer (concurrent + priority + shadow tree)。

```ts
export type FabricState = 'idle' | 'scheduled' | 'shadow-committed' | 'priority-updated' | 'mounted';
```
