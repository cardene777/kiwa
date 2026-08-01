---
title: "@kiwa-lab/perf-harness prune-manifest の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>prune-manifest</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/prune-manifest.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>PRUNE&#95;MANIFEST&#95;ENV</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/prune-manifest.ts#L35) <code v-pre>packages/perf-harness/src/prune-manifest.ts</code>

orchestrator が manifest の収集を要求する時に立てる環境変数。

```ts
export declare const PRUNE_MANIFEST_ENV = "KIWA_PERF_PRUNE_STALE";
```

#### <code v-pre>PRUNE&#95;MANIFEST&#95;PATH&#95;ENV</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/prune-manifest.ts#L38) <code v-pre>packages/perf-harness/src/prune-manifest.ts</code>

manifest の置き場を明示する環境変数。 test と orchestrator が使う。

```ts
export declare const PRUNE_MANIFEST_PATH_ENV = "KIWA_PERF_PRUNE_MANIFEST";
```

#### <code v-pre>pruneManifestPath</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/prune-manifest.ts#L57) <code v-pre>packages/perf-harness/src/prune-manifest.ts</code>

manifest の置き場を決める。 明示 (`KIWA_PERF_PRUNE_MANIFEST`) があればそれを使う。 無ければ baseline の path から `.perf-baseline` の位置を探し、 その直下に置く。 profile ごとの dir より上に置くのは、 orchestrator が 1 file を読むだけで全 profile 分を掃除できるようにするため。 `.perf-baseline` を含まない path (test の一時 dir 等) では baseline と同じ dir に置く。

```ts
export declare function pruneManifestPath(baselinePath: string): string;
```

#### <code v-pre>recordPruneManifest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/prune-manifest.ts#L109) <code v-pre>packages/perf-harness/src/prune-manifest.ts</code>

この実行が測った op を manifest に書き足す。 追記だけを行い、 baseline には触れない。 **書けなかったら例外を投げる**。 握り潰してはいけない。 1 実行ぶんの行が欠けた manifest は構文としては正常なので、 掃除する側はそれを完全な一覧として読む。 欠けた実行が測った op は「どの実行にも現れなかった」 ことになり、 stale として 消える = 握り潰すと「掃除されない」 ではなく「消しすぎる」 方に倒れる。 投げれば root の `test:perf` の `&&` chain が止まり、 `--apply` に到達しない。 掃除が 1 回見送られるだけで、 記録は失われない。

```ts
export declare function recordPruneManifest(baselinePath: string, keys: string[]): void;
```

#### <code v-pre>shouldRecordPruneManifest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/prune-manifest.ts#L92) <code v-pre>packages/perf-harness/src/prune-manifest.ts</code>

orchestrator が manifest を集めているか。

```ts
export declare function shouldRecordPruneManifest(): boolean;
```

### 型

#### <code v-pre>PruneManifestRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/prune-manifest.ts#L41) <code v-pre>packages/perf-harness/src/prune-manifest.ts</code>

manifest の 1 行。 JSON Lines で 1 実行 1 行を追記する。

```ts
export interface PruneManifestRecord {
    /** 掃除の対象になる baseline の絶対 path。 */
    baselinePath: string;
    /** この実行が測った op の key 一覧 (`<op>.serial` 等)。 */
    keys: string[];
}
```
