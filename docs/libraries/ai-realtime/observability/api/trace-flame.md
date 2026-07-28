---
title: "@kiwa-lab/observability trace-flame の API 契約"
---

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>trace-flame</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildSpanTree</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L49) <code v-pre>packages/observability/src/trace-flame.ts</code>

Build a tree of SpanNodes from a flat span array. Spans reference their parent by `parentSpanName`; when the parent is null the span becomes a root. Children order preserves the collector insertion order (matches call order in the SUT).

```ts
export declare function buildSpanTree(spans: SpanRecord[]): SpanNode[];
```

#### <code v-pre>drillDown</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L142) <code v-pre>packages/observability/src/trace-flame.ts</code>

Drill-down — return the subtree rooted at the first node whose name matches. Depth is normalized so the drilled-in root sits at depth 0. Returns null when no matching node exists.

```ts
export declare function drillDown(roots: FlameNode[], name: string): FlameNode | null;
```

#### <code v-pre>flattenFlame</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L172) <code v-pre>packages/observability/src/trace-flame.ts</code>

Flatten a flame tree into a depth-first list. Handy for kiwa assertions that need to iterate every node without recursing.

```ts
export declare function flattenFlame(roots: FlameNode[]): FlameNode[];
```

#### <code v-pre>renderFlameGraph</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L103) <code v-pre>packages/observability/src/trace-flame.ts</code>

Render a flame graph structure. Nodes with the same name at the same depth in the same parent chain collapse into one flame node whose `samples` counts how many spans contributed. Only closed spans (endedAt != null) contribute to the numeric aggregate; open spans are counted but contribute 0 ms.

```ts
export declare function renderFlameGraph(roots: SpanNode[]): FlameNode[];
```

### 型

#### <code v-pre>FlameNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L29) <code v-pre>packages/observability/src/trace-flame.ts</code>

```ts
export interface FlameNode {
    name: string;
    depth: number;
    totalMs: number;
    selfMs: number;
    /**
     * Sample count — how many spans with this name aggregated into
     * this flame node. When multiple root/parent chains share a name
     * they collapse into a single flame node.
     */
    samples: number;
    children: FlameNode[];
}
```

#### <code v-pre>SpanNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L16) <code v-pre>packages/observability/src/trace-flame.ts</code>

```ts
export interface SpanNode {
    name: string;
    attributes: Record<string, unknown>;
    startedAt: number;
    endedAt: number | null;
    /** Total time (endedAt - startedAt); null when span is still open. */
    totalMs: number | null;
    /** Time spent in this node minus time spent in its children. */
    selfMs: number | null;
    children: SpanNode[];
    depth: number;
}
```
