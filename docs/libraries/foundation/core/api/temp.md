---
title: "@kiwa-lab/core temp の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/core</code> <code v-pre>temp</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/core/src/temp.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>&#95;&#95;resetTempScanStateForTests</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/temp.ts#L306) <code v-pre>packages/core/src/temp.ts</code>

test から回収の走査状態を戻すための入口。 production からは呼ばない。

```ts
export declare function __resetTempScanStateForTests(): void;
```

#### <code v-pre>createManagedTempDir</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/temp.ts#L239) <code v-pre>packages/core/src/temp.ts</code>

回収経路を持つ temp dir を掘る。 正常終了は `dispose` が、 異常終了は次回起動時の回収が受ける。 adapter 側が `node:fs` の `mkdtemp` を直接呼ぶと後者が効かないため、 一時 dir はすべて本 API を 通す (`tests/release-smoke/tests/temp-resource-cleanup.test.ts` が機械検査する)。 **消すのは自分たちが作った形の dir だけ**。 名前から作成時刻と PID を読めた entry に 限り、 閾値を超え、 かつ作った process が居なくなっている場合に消す。 **回収の失敗は呼出を止めない**。 掘れることの方が利用者にとって重要で、 消せな かった分は次回に持ち越せる。

```ts
export declare function createManagedTempDir(opts?: ManagedTempDirOptions): ManagedTempDir;
```

### 型

#### <code v-pre>ManagedTempDir</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/temp.ts#L26) <code v-pre>packages/core/src/temp.ts</code>

```ts
export interface ManagedTempDir {
    /** 実体の絶対 path。 */
    readonly path: string;
    /** 明示的に回収する。 成功するまで何度でも呼べる。 */
    dispose(): void;
}
```

#### <code v-pre>ManagedTempDirOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/temp.ts#L33) <code v-pre>packages/core/src/temp.ts</code>

```ts
export interface ManagedTempDirOptions {
    /**
     * 名前空間の中で使う識別子。 どの adapter が掘ったかを読めるようにする。
     *
     * path の区切りと `.` / `..` は受けない。 `join` が正規化するため、 通すと
     * 名前空間の外に dir を作れてしまう。
     */
    label?: string;
    /** 掘る先。 既定は `os.tmpdir()`。 相対 path は呼出時の cwd で絶対化する。 */
    root?: string;
    /** 回収の閾値 (ミリ秒)。 下限は 1 時間で、 それ未満は下限に切り上げる。 */
    reclaimAfterMs?: number;
}
```
