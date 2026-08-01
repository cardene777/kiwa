---
title: "@kiwa-lab/perf-harness baseline の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>baseline</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>BASELINE&#95;SCHEMA</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L293) <code v-pre>packages/perf-harness/src/baseline.ts</code>

保存する baseline の schema 版。 v2 で各 result に基準 op の記録が付く (#1737)。 読む側は v1 も受け付ける (`normalizeToEnvelope`)。

```ts
export declare const BASELINE_SCHEMA = 2;
```

#### <code v-pre>baselinePathFor</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L119) <code v-pre>packages/perf-harness/src/baseline.ts</code>

baseline の置き場を組み立てる。 層を跨いで 1 箇所に集約するための入口。 perf suite の多くは `path.join(REPO_ROOT, '.perf-baseline', ...)` を自前で組んで いる。 そこに profile を足し忘れると、 その suite だけ環境を跨いで同じ file を 共有し、 別の機械の記録を上書きする。 組み立てをここに集めて、 呼出側は層と module 名だけを渡す。 `layer` は `saas` / `framework` のような区分。 省略すると profile 直下に置く。

```ts
export declare function baselinePathFor(root: string, moduleName: string, layer?: string): string;
```

#### <code v-pre>CANONICAL&#95;ENV&#95;PROFILE</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L206) <code v-pre>packages/perf-harness/src/baseline.ts</code>

git が追跡する唯一の profile。 checkout した直後から比較できるようにするには baseline を追跡する必要があるが (#1708 T004)、 全ての機械の分を追跡すると 148 file が機械の数だけ増える。 1 つを決めて追跡し、 他は `.gitignore` で外す。 ここを変える時は `.gitignore` と `docs/quality/perf-thresholds.md` も同時に直す。 3 箇所が揃っていることは `tests/canonical-profile.test.ts` が確かめる。

```ts
export declare const CANONICAL_ENV_PROFILE = "darwin-arm64--apple-m4-pro-43c7d7--node24";
```

#### <code v-pre>captureEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L296) <code v-pre>packages/perf-harness/src/baseline.ts</code>

現行環境の env metadata を取得する。 git 未 install / 非 repo 環境では gitSha は "unknown"。

```ts
export declare function captureEnv(): BaselineEnv;
```

#### <code v-pre>defaultBaselinePath</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L105) <code v-pre>packages/perf-harness/src/baseline.ts</code>

baseline の既定の置き場を決める。 `process.cwd()` をそのまま使うと、 同じ module の baseline が起動場所ごとに 別 file に分かれる。 kiwa では `pnpm --filter &lt;pkg&gt; test:perf` (cwd = package) と repo root からの起動が混在し、 `&lt;root&gt;/.perf-baseline/` と `packages/&lt;name&gt;/.perf-baseline/` の 2 箇所に同じ module の値が溜まっていた。 片方だけを読む実行は毎回「baseline が無い」 と判断して作り直すため、 回帰判定がいつまでも成立しない。 workspace の目印 (`pnpm-workspace.yaml` / `.git`) を cwd から上に辿って 見つかった場所を基準にする。 目印が無い単体 package からの利用では 従来どおり cwd を使うので、 repo の外の呼出には影響しない。

```ts
export declare function defaultBaselinePath(moduleName: string): string;
```

#### <code v-pre>envProfile</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L140) <code v-pre>packages/perf-harness/src/baseline.ts</code>

baseline を置き分ける環境の名前。 例 `darwin-arm64--apple-m4-pro-43c7d7--node24`。 baseline は記録した機械でしか比較に使えない (`isComparableEnv` が platform / CPU / Node 版の一致を要求する)。 同じ path に書くと、 別の機械で回した実行が 前の機械の記録を自分の値で上書きし、 追跡している file が汚れる。 名前に入れるのは platform と CPU model と Node の major まで。 patch 版まで 入れると Node を上げるたびに全 baseline が無効になる。 逆に major を落とすと V8 の変化を跨いで比較してしまう。 cpu 数は入れない。 同じ機械でも measurement 中の負荷や container の割当で `os.cpus().length` が変わることがあり、 その都度 profile が分かれると 比較対象を見失う。 数の違いは `isComparableEnv` が別途弾く。

```ts
export declare function envProfile(env?: BaselineEnv | ProfileEnv): string;
```

#### <code v-pre>isCanonicalEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L209) <code v-pre>packages/perf-harness/src/baseline.ts</code>

今の環境が追跡対象か。 report に「他の環境で測った」 と出すために使う。

```ts
export declare function isCanonicalEnv(env?: BaselineEnv | ProfileEnv): boolean;
```

#### <code v-pre>isComparableEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L316) <code v-pre>packages/perf-harness/src/baseline.ts</code>

baseline を比較対象として使えるかを判定する。 `gitSha` や `hostname` の違いは測定値の意味を変えないが、GC を呼べるかどうかは memory 測定の前提そのものを変える。前提が違う baseline と比べると、実装が 変わっていなくても回帰と判定されてしまう。

```ts
export declare function isComparableEnv(baseline: BaselineEnv, current: BaselineEnv): boolean;
```

#### <code v-pre>loadBaseline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L20) <code v-pre>packages/perf-harness/src/baseline.ts</code>

Baseline を load して現行環境と envelope の env を比較、 mismatch field を検出する。 legacy schema (単一 MeasureResult) は自動 upgrade して読む。

```ts
export declare function loadBaseline(path: string): Promise<BaselineLoadResult | null>;
```

#### <code v-pre>MEASUREMENT&#95;PREMISE</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L287) <code v-pre>packages/perf-harness/src/baseline.ts</code>

測定の取り方の版。 機械も Node も同じでも測り方が変われば、 保存済みの値は 比較対象にならない。 そのとき baseline を手で消して回るのではなく、 ここを 1 上げて「前提が違う」 と宣言し、 測定が成立している次の実行で作り直させる。 - 版 1 = workspace も vitest の file も並列で測っていた頃 (この field 自体が無い) - 版 2 = workspace を `--workspace-concurrency=1`、 vitest を `fileParallelism: false` にして 1 件ずつ測る (#1708) - 版 3 = memory 測定に空回しを入れた (#1708)。 それまでは初回の 1 回きりの 確保が反復数で割られて「1 回あたりの保持」 に載っており、 同じ実装でも arrayBuffers の増分が変わる。 serial / concurrent の測り方は版 2 と同じ (標本数の引き上げは試したが効果が確認できず戻した) - 版 4 = op を測る前に測定系の分解能を測るようになった (#1718)。 空の関数を 200 回まわしてから 1 つ目の op に入るため、 版 3 までは冷えたまま測られていた 最初の op が暖まった状態で測られる。 判定軸を p95 から p10 へ移した変更自体は 保存する値の意味を変えないが、 この空回しは同じ実装の測定値を動かす - 版 5 = op を基準 op と 1 呼出ずつ交互に測るようになった (#1737)。 対象の各 呼出の直前に基準 op が挟まるため、 cache と分岐予測の状態が版 4 までと違う。 比較に要る基準 p10 が版 4 以前の記録には無い、 という理由でも作り直しになる。 実 API 経路 (`runPerf3LayerLive`) は交互測定を使わないため、 この版でも `reference` を持たない記録を書く = 版だけでは 2 経路を区別できない。 正規化が成立するかは `reference` の有無が決める #1739 で baseline に「対象 p10 ÷ 基準 p10」 の履歴が付いたが、 版は上げていない。 測り方は版 5 と同じで、 履歴を持たない記録は幅を推定できないだけ (従来の相対閾値に 落ちる) だから。 版を上げると全 baseline が作り直しになり、 その 1 回の実行に退行が 含まれていれば現在値が新しい正として焼き付いて以後検出できない。 上げる条件は「同じ実装を測っても値が変わる」 変更に限る。 閾値や判定の変更は 測り方ではないので上げない。

```ts
export declare const MEASUREMENT_PREMISE = 5;
```

#### <code v-pre>nonCanonicalEnvNotice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L220) <code v-pre>packages/perf-harness/src/baseline.ts</code>

canonical でない環境で測った時に report へ出す 1 行。 canonical なら空配列。 数値だけを見た読み手が「git に入っている記録と比べた結果」 と受け取らないよう、 実際の比較相手がどこにあるかを書く。 mock 経路と実 API 経路の両方から呼ぶ (片方だけに置くと、 もう片方の report で同じ誤読が起きる)。

```ts
export declare function nonCanonicalEnvNotice(env?: BaselineEnv | ProfileEnv): string[];
```

#### <code v-pre>resolveBaselineRoot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L235) <code v-pre>packages/perf-harness/src/baseline.ts</code>

workspace の目印を cwd から上に辿る。 見つからなければ起点をそのまま返す。 起点は symlink を解いてから辿る。 解かないと、 同じ package を実体経由と link 経由で起動した時に別の root を掴み、 baseline が分裂する。

```ts
export declare function resolveBaselineRoot(start: string): string;
```

#### <code v-pre>saveBaseline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L42) <code v-pre>packages/perf-harness/src/baseline.ts</code>

単一結果 baseline を保存する compat 経路。 内部で envelope に wrap して保存する。 `moduleName` は複数 op を 1 baseline に集約する時 (three-layer) に使う default key。

```ts
export declare function saveBaseline(path: string, result: MeasureResult, opts?: {
    key?: string;
}): Promise<void>;
```

#### <code v-pre>saveBaselineEnvelope</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L63) <code v-pre>packages/perf-harness/src/baseline.ts</code>

Envelope を直接保存する経路。 three-layer 等で複数 op を集約する場合に使う。 読み戻せない envelope は書かない。 `loadBaseline` は 2 件未満の標本を持つ記録を 読めない記録として弾くため、 そのまま保存すると次の実行がまた弾いて作り直す、を 繰り返して比較が永久に成立しない。 しかも「比較していない」 ことは report の `n/a (baseline seeded)` からしか読めない。 書く側で止めて理由を伝える。

```ts
export declare function saveBaselineEnvelope(path: string, envelope: BaselineEnvelope): Promise<void>;
```


