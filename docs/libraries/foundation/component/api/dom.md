---
title: "@kiwa-lab/component dom の API 契約"
---

# <code v-pre>@kiwa-lab/component</code> <code v-pre>dom</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>addHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L53) <code v-pre>packages/component/src/dom.ts</code>

event handler を登録、 同一 event に複数 handler を許容する。

```ts
export declare function addHandler(node: MockNode, event: string, handler: (event: MockEvent) => void): void;
```

#### <code v-pre>appendChild</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L47) <code v-pre>packages/component/src/dom.ts</code>

node に child を追加、 parent back reference も更新する。

```ts
export declare function appendChild(parent: MockNode, child: MockNode): void;
```

#### <code v-pre>createCanvas</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L76) <code v-pre>packages/component/src/dom.ts</code>

CanvasElement 生成 — root node と lookup helpers を wrap する。 mount 完了後 story / component test / visual capture の全経路で使う。

```ts
export declare function createCanvas(root: MockNode): CanvasElement;
```

#### <code v-pre>createNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L17) <code v-pre>packages/component/src/dom.ts</code>

node factory — attrs / children / text / value を任意で与える。

```ts
export declare function createNode(tag: string, options?: NodeOptions): MockNode;
```

#### <code v-pre>findByRole</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L144) <code v-pre>packages/component/src/dom.ts</code>

role 属性 (`role="button"`) or implicit role (button tag) と、 aria-label / text で一致する node を返す。 mock は最小 subset (button / link / heading / textbox / checkbox) のみ。

```ts
export declare function findByRole(node: MockNode, role: string, accessibleName?: string): MockNode | null;
```

#### <code v-pre>findByText</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L130) <code v-pre>packages/component/src/dom.ts</code>

text 一致で最初に見つかった node を返す。 深い node を優先する — root 側の aggregated text ではなく、 実際に text を持つ leaf 相当の node を先に返す (Storybook / Testing Library の getByText 挙動と揃える)。

```ts
export declare function findByText(node: MockNode, text: string): MockNode | null;
```

#### <code v-pre>fireEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L64) <code v-pre>packages/component/src/dom.ts</code>

event を発火する。 実 DOM のような bubble はせず target 単発、 mock harness では component 側で bubble 相当を実装する。 fill 相当は input event を発火。

```ts
export declare function fireEvent(node: MockNode, event: MockEvent): void;
```

#### <code v-pre>hashMarkup</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L121) <code v-pre>packages/component/src/dom.ts</code>

markup 文字列を deterministic SHA-256 hex substring (先頭 16) に変換。

```ts
export declare function hashMarkup(markup: string): string;
```

#### <code v-pre>query</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L215) <code v-pre>packages/component/src/dom.ts</code>

querySelector の最小 subset。 tag / .class / #id / [attr=value] / 子孫 (space) 結合子を support する。 実 CSS selector 全対応ではないが、 mock 用途では十分。 MockNode tree では canvas.root が component 自体を指すため、 root も検査対象 に含める (実 DOM の `document.querySelector` は container を除くが、 mock は component rendering root = 検索対象という semantics に揃える)。

```ts
export declare function query(root: MockNode, selector: string, all: boolean): MockNode[];
```

#### <code v-pre>renderMarkup</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L105) <code v-pre>packages/component/src/dom.ts</code>

MockNode subtree を deterministic な pseudo-HTML 文字列に変換する。 event handler は含めず、 tag / attrs / text / children のみ。 Chromatic の hash / markup 保存に使う。

```ts
export declare function renderMarkup(node: MockNode): string;
```

### 型

#### <code v-pre>NodeOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L38) <code v-pre>packages/component/src/dom.ts</code>

```ts
export interface NodeOptions {
    attrs?: Record<string, string>;
    text?: string;
    value?: string;
    children?: MockNode[];
    on?: Record<string, (event: MockEvent) => void>;
}
```
