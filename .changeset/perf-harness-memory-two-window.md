---
"@kiwa-lab/perf-harness": minor
---

memory 測定を 2 区間に分け、後半の区間だけを上限判定に使う。

`arrayBuffers` の増分は、fs を多く触る op では実装の保持量を表していなかった。
Node の Buffer は 8KB の pool 単位で確保され、その伸びは反復ごとに一定量ではなく累積の確保回数に応じて段階的に現れる。
空回し (`memoryWarmup`) は固定回数なので、反復数を増やすとその先で pool がまた伸びる。

実測では同じ実装を測り直しただけで `file_scaffold_workflow` の増分が 118,387 から 198,899 B まで動き、上限 102,400 B を跨いでいた。

**追加した API。**

| API | 既定 | 内容 |
|---|---|---|
| `measureMemory({ windows })` | 1 | 測定区間を分ける数。最後の区間の増分を代表値として返す |
| `runPerf3Layer({ memoryWindows })` | 2 | 同上。kiwa 内部の 3 層測定はこの問題を踏んでいる側なので既定で有効 |

`MemorySample` に `windowCount` と `arrayBuffersDeltaByWindowBytes` が増えた。
後者は区間ごとの増分で、report の `区間 Δ` 列に出る。
最後の区間が小さい理由が飽和なのか、そもそも確保していないのかを判別するための証跡である。

**利用者への影響。**

`measureMemory` を直接呼んでいる場合、既定は 1 区間のままなので挙動は変わらない。

`runPerf3Layer` を使っている場合、memory 測定で `fn` を呼ぶ回数が倍になる。
副作用や件数依存を持つ op では測定対象そのものが変わるため、従来の挙動に戻すには `memoryWindows: 1` を渡す。

memory 軸が報告する値も変わる。fs を触る op では pool の伸びが落ちて小さくなる。
上限を跨いでいた op が通るようになるのが本変更の目的である。

**効かない範囲。**

1 回の呼出で megabyte 単位を確保する op には効かない。
`@kiwa-lab/visual` の `comparePngBuffersFullDiff` は 2 区間でも判定値が 4 回で 10.8MB 動き、waiver を残している。
pool の飽和が起きていないため、飽和を待つ区間に待つ対象がない。

JS heap 側の保持を検知できない点は従来どおり変わらない。

live 経路 (`runPerfLive`) は 1 区間のままで、実 API 呼出を倍にしない。

詳細と却下した案は `docs/quality/perf-thresholds.md` § Memory delta target を参照。
