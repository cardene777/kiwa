---
title: "@kiwa-lab/component chromatic の API 契約"
---

# <code v-pre>@kiwa-lab/component</code> <code v-pre>chromatic</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/chromatic.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createChromaticVisualMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/chromatic.ts#L73) <code v-pre>packages/component/src/chromatic.ts</code>

ChromaticVisualMock を新規作成する。 baseline / current / review を全て in-memory Map で保持し、 reset() で全 clear できる (test isolation 用)。

```ts
export declare function createChromaticVisualMock(config?: ChromaticConfig): ChromaticVisualMock;
```

### 型

#### <code v-pre>ChromaticConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/chromatic.ts#L200) <code v-pre>packages/component/src/chromatic.ts</code>

```ts
export interface ChromaticConfig {
    /** viewport 名の default (未指定 story の 1 件 capture 時に使う)。 */
    defaultViewport?: string;
    /** parameters.chromatic.diffThreshold 未指定時の default。 default = 0 (完全一致で pass)。 */
    defaultDiffThreshold?: number;
    /** capturedAt / reviewedAt 用の deterministic time source (test 決定性)。 */
    now?: () => number;
}
```

#### <code v-pre>ChromaticVisualMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/chromatic.ts#L29) <code v-pre>packages/component/src/chromatic.ts</code>

Chromatic 型の visual regression mock。 real Chromatic は Storybook 8 を headless で snapshot 撮り、 baseline JSON を server 側に置いて diff を pixel single で計算する。 mock harness は browser を起動せず、 mount 後の MockNode を `renderMarkup` で pseudo-HTML 化 → SHA-256 hash → hash 比較で changed 判定を行う (pixel diff は hash 完全一致 = 0、 不一致 = 1、 partial diff の連続値は mock 対象外)。 mock で意味のある semantic は 4 つ ... (1) baseline capture (未登録なら status='new'、 hash を保存) (2) current capture + diff (hash 一致で passed、 不一致で failed / changed) (3) diffThreshold の適用 (StoryEntry.parameters.chromatic.diffThreshold) (4) accept / reject workflow (accept で baseline を current で置換) multi viewport support = parameters.chromatic.viewports に列挙された viewport 名を 1 回ずつ capture し、 viewport × storyId 単位で baseline / diff を管理。

```ts
export interface ChromaticVisualMock {
    /** baseline / current 群を全 clear。 test 間の isolation 用。 */
    reset(): void;
    /** baseline を明示 seed (test setup で初期状態を作る時使う)。 */
    seedBaseline(input: {
        storyId: string;
        viewport: string;
        markup: string;
        capturedAt?: number;
    }): VisualBaseline;
    /** 1 story × 1 viewport を capture、 baseline 不在なら status='new'。 */
    capture(input: {
        entry: StoryEntry;
        canvas: CanvasElement;
        viewport?: string;
        now?: number;
    }): VisualDiff;
    /**
     * 1 story を parameters.chromatic.viewports 全 viewport で一括 capture。
     * viewports 未指定 or 空なら 'default' viewport 1 件のみ。 disabled story は
     * skip (空配列を返す)。
     */
    captureAll(input: {
        entry: StoryEntry;
        canvas: CanvasElement;
        now?: number;
    }): VisualDiff[];
    /** accept / reject 1 件。 accept は baseline を current 相当で置換する。 */
    review(input: {
        storyId: string;
        viewport: string;
        action: VisualReviewAction;
        reviewedAt?: number;
    }): VisualReviewEntry;
    /** review 履歴一覧 (test で workflow を assert する時使う)。 */
    reviewHistory(): VisualReviewEntry[];
    /** baseline 一覧 (test 用 introspection)。 */
    baselines(): VisualBaseline[];
}
```
