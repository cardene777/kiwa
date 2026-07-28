# Kaname リファレンス

`@kiwa-lab/kaname` は仕様の分類と分割を提供します。

## 公開 API

`classify` は `SpecDoc` を受け取り、`ClassifyReport` を返します。`splitSpec` は同じ `SpecDoc` を受け取り、formal 用と runtime 用の Markdown、および件数を含む `SplitResult` を返します。入力 item の正確な shape はこのページ後半の API 契約を参照してください。

## 設定

各 item は `id`、`statement`、`layer`、`verifyBy` を持ちます。`classify` は重複 ID、空 statement、空 `verifyBy`、未知 layer、異なる layer 間の `verifyBy` 競合を報告します。重複 ID の後続 item は issue を一件追加して以降の分類処理を行わないため、`perLayer` には数えられません。

## 後始末

API は入力を変更しません。生成した Markdown file は project 側で管理します。`classify` は pure function で、`splitSpec` は文字列を返すだけです。

## 分割結果

`splitSpec` は `specFormal` と `specRuntime` のMarkdown文字列、ならびにtotal、formalCount、runtimeCount、humanCountを持つsummaryを返します。human itemはruntime文書側に残し、人手reviewの `verifyBy` を失わないようにします。split前にclassificationを要求しないため、無効な入力を出力へ渡さないよう呼び出し側でgateしてください。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>classify</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/classify.ts#L16) <code v-pre>packages/kaname/src/classify.ts</code>

Statically classify a SpecDoc and surface layer-model violations. Rules enforced: 1. every item must have a non-empty statement 2. every item must have a non-empty verifyBy target 3. every item must declare a known layer (formal / runtime / human) 4. every item id is unique within the doc 5. no formal item may reuse a verifyBy target that a runtime item also names (this catches the "specified twice, verified nowhere" pattern where the author put the same acceptance criterion in both layers hoping one side would catch it — always ends in a silent gap).

```ts
export declare function classify(doc: SpecDoc): ClassifyReport;
```

#### <code v-pre>splitSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/split.ts#L52) <code v-pre>packages/kaname/src/split.ts</code>

Split a SpecDoc into two paired markdown files: - `specFormal.md` → items with `layer === 'formal'` - `specRuntime.md` → items with `layer === 'runtime'` or `'human'` The intent is that a caller writes each acceptance criterion once, tags it with the layer that will verify it, and gets two files back that never disagree with each other. If the caller wants the same idea verified in two places, they must write two separate items (with distinct verifyBy targets), so the "written but never verified" silent gap is impossible.

```ts
export declare function splitSpec(doc: SpecDoc): SplitResult;
```

### 型

#### <code v-pre>ClassifyIssue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts#L56) <code v-pre>packages/kaname/src/types.ts</code>

```ts
export interface ClassifyIssue {
    itemId: string;
    reason: 'duplicate-id' | 'empty-statement' | 'unknown-layer' | 'empty-verify-by' | 'both-layers-touch-same-artifact';
    message: string;
}
```

#### <code v-pre>ClassifyReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts#L67) <code v-pre>packages/kaname/src/types.ts</code>

```ts
export interface ClassifyReport {
    ok: boolean;
    issues: readonly ClassifyIssue[];
    perLayer: Readonly<Record<SpecLayer, number>>;
}
```

#### <code v-pre>SpecDoc</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts#L33) <code v-pre>packages/kaname/src/types.ts</code>

```ts
export interface SpecDoc {
    /** Human-readable title of the whole specification. */
    title: string;
    /** GitHub issue / Linear ID this spec covers, if any. */
    issueRef?: string;
    /** Ordered list of specification items. Order = source order. */
    items: readonly SpecItem[];
}
```

#### <code v-pre>SpecItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts#L15) <code v-pre>packages/kaname/src/types.ts</code>

```ts
export interface SpecItem {
    /** Stable identifier, e.g. `AC-001`. Must be unique within a SpecDoc. */
    id: string;
    /** One-sentence acceptance criterion. */
    statement: string;
    /** Layer this item must be verified in. */
    layer: SpecLayer;
    /**
     * How this item will be verified.
     * - formal → Lean namespace or orchestrator name (e.g., `Transaction`)
     * - runtime → test path or category (e.g., `tests/integration/auth.test.ts`)
     * - human   → review checkpoint (e.g., `UX walkthrough`, `Product approval`)
     */
    verifyBy: string;
    /** Optional freeform notes. */
    notes?: string;
}
```

#### <code v-pre>SpecLayer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts#L13) <code v-pre>packages/kaname/src/types.ts</code>

```ts
export type SpecLayer = 'formal' | 'runtime' | 'human';
```

#### <code v-pre>SplitResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts#L42) <code v-pre>packages/kaname/src/types.ts</code>

```ts
export interface SplitResult {
    /** Contents of `specFormal.md` — items with `layer === 'formal'`. */
    specFormal: string;
    /** Contents of `specRuntime.md` — items with `layer === 'runtime'` or `'human'`. */
    specRuntime: string;
    /** Coverage summary for downstream tooling. */
    summary: {
        total: number;
        formalCount: number;
        runtimeCount: number;
        humanCount: number;
    };
}
```
<!-- kiwa-public-api:end -->
