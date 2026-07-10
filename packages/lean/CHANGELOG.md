# @kiwa-lab/lean

## 0.5.0

### Minor Changes

非破壊的な追加。 Lean を走らせる 3 つの入口に、 event loop を止めない版を足した。 同期版は 1 行も変わらない。

#### `execFileSync` は Lean が終わるまで process 全体を止める

計測した。

```
execFileSync が走った時間            139 ms
その間に発火した 5ms timer の回数      0 (期待値 27)
```

build plugin / watch mode / 同一 process 上の server は、 Lean が elaborate している間まるごと固まる。 逃げ道は無かった。 `verifyLeanSpec` と `checkLeanTable` が唯一の入口で、 どちらも同期だからだ。

#### 機械は 1 台ずつしか検証できなかった

`checkLeanTable` は仕様を 1 つ取る。 5 台持つ呼出は Lean を 5 回、 順番に起動する。 API が他の形を許さないからだ。

```
直列   checkLeanTable × 5            957 ms
並行   checkLeanTableAsync × 5       216 ms   77% 短縮
```

仕事は互いに独立している。 直列である必然性は API の形以外に無かった。

#### 追加した 3 関数

| 関数 | 戻り値 |
|---|---|
| `verifyLeanSpecAsync(specs, opts?)` | `Promise<VerifyResult>` |
| `checkLeanTableAsync(spec, opts?)` | `Promise<LeanTableReport>` |
| `extractLeanTableAsync(source, spec, opts?)` | `Promise<ExtractResult>` |

`concurrency` option は付けない。 `checkLeanTableAsync` は仕様を 1 つ取る。 何本同時に走らせるかは、 全部を持っている呼出側の `Promise.all` の話だ。

#### 2 経路が別々のことを学ばないようにする

`runLeanSource` は「純粋な前処理 → Lean 起動 → 純粋な後処理」 だった。 違うのは真ん中だけなので、 前後を関数に切り出して同期版と非同期版の双方が呼ぶ形にした。

二重に書けば片方が忘れる。 実際に一度起きている。 `KIWA_LEAN_SKIP_VERIFY` は `verifyLeanSpec` だけが読み、 `extractLeanTable` は読まなかった。 Lean を切った build で、 2 つのうち 1 つが Lean を走らせていた。

#### 共有しても、 なお違っていたもの

`execFile` は同じ事象を別の名前で綴る。 実測。

| 事象 | `execFileSync` | `execFile` |
|---|---|---|
| `maxBuffer` 超過 | `code: 'ENOBUFS'` | `code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'` |
| timeout | `code: 'ETIMEDOUT'` + `signal: 'SIGTERM'` | `code: null` + `signal: 'SIGTERM'` |
| 非ゼロ終了 | `code` 無し | `code: 3` (数値) |

`classifyFailure` は `ENOBUFS` しか知らなかったので、 非同期経路の buffer 溢れが `verification-failed` として返った。 「道具の限界」 が「仕様が誤り」 として報告される、 この package が 31 回潰してきたのと同じ形だ。

`T-ASYNC-021` が実装中にこれを捕まえた。 `OVERFLOW_CODES` に 2 つの綴りを持たせ、 `T-RUNNER-035..037` で 3 つの形を直接固定した。

### Patch Changes

`SpawnFailure.code` の型が `string | number | null | undefined` になった (`execFile` が終了コードを数値で入れるため)。 内部型で、 公開 API には現れない。

## 0.4.0

### Major Changes

破壊的変更。 `ExtractStatus` に `verification-failed` が加わり、 `checkLeanTable` と `extractLeanTable` が返す status が 1 つ変わった。

#### `checkLeanTable` は証明の失敗を「抽出の失敗」 と呼んでいた

Lean が source を撥ねた時、 v0.3.0 は `extraction-failed` を返していた。 何も抽出に失敗していない。 Lean は表を印字する段階まで到達せず、 file を拒否したのだ。

```
偽の absorbing 定理を食わせた時 (v0.3.0)
  status:      extraction-failed
  diagnostics: Specs.lean:68:23: error: tactic 'rfl' failed, ...
```

`diagnostics` には真実が入っている。 分岐に使う `status` には入っていなかった。 読み手は印字の不具合を疑いに行く。

`CheckLeanTableOptions.source` の使い道は「手元に置いた `.lean` file を渡して、 それがまだ仕様の表を保持しているか確かめる」 ことだと文書に書いてある。 まさにその file が typecheck を通らなくなる場合が、 この status の主戦場だった。 `VerifyStatus` は同じ事象を `verification-failed` と呼んでおり、 2 つの語彙が食い違っていた。

v0.4.0 では 2 つを分ける。

| status | 意味 |
|---|---|
| `verification-failed` | Lean が source を撥ねた。 parse できない、 elaborate できない、 定理が偽 |
| `extraction-failed` | Lean は source を受理して走らせた。 返ってきた表がこの機械の表ではない (cell 不足 / cell 重複 / 読めない行) |

`extraction-failed` は消えていない。 `#eval IO.println` で cell を 1 つ余計に印字する source は elaborate に成功し、 exit 0 で壊れた表を返す。 2 つの枝はどちらも到達可能で、 `T-EXTRACT-043` がそれを固定している。

##### 移行

`status === 'extraction-failed'` で分岐している呼出は、 証明の失敗を捕まえられなくなる。

```ts
// v0.3.0
if (report.status === 'extraction-failed') { /* 何かがおかしい */ }

// v0.4.0
if (report.status === 'verification-failed') { /* 仕様か Lean file が誤り */ }
if (report.status === 'extraction-failed')   { /* Lean は正しく、 表が壊れている */ }
```

`ok` の意味は変わらない。 status を読まず `report.ok` だけを見ている呼出は影響を受けない。

### Patch Changes

`examples/dogfood-lean-orchestrator-specs-app` が `verifyLeanSpec` と `generateLakeProject` を実際に呼ぶようになった。 どちらも export され、 文書化され、 自分自身の unit test 以外どこからも呼ばれていなかった。 利用者がやること (生成した `.lean` を repo に置き、 `lake build` で証明する) を、 この repo は一度もやっていなかった。

`examples/.../specs/` に Lake project の実体が入り、 test が 5 機械分の `.olean` が建つことと、 checked-in file が仕様から drift したら落ちることを固定する。

## 0.3.0

### Major Changes

破壊的変更。 生成される Lean の意味論と、 検証経路の両方を直した。 v0.2.1 まで、 この package が主張していた形式検証は成立していなかった。

#### 1. `dispatch_total` は何も証明していなかった

v0.2.1 が生成していた定理はこれだった。

```lean
theorem dispatch_total (s : State) (e : Event) : ∃ s', dispatch s e = s' := by
  exact ⟨dispatch s e, rfl⟩
```

`∃ s', f x = s'` は任意の関数について `rfl` で証明できる。 Lean の関数は定義上すべて全域なので、 この定理は「`dispatch` は関数である」 以上のことを述べていない。 40 cell 中 1 cell も定義していない表でも `lean` は 0 で終了する (実測)。

v0.3 で削除した。 網羅の保証は定理ではなく型検査が担う。

#### 2. 書き忘れた cell が黙って自己遷移になっていた

`| s, _ => s` という catch-all が、 表に書かれなかった cell をすべて恒等写像にしていた。 意図して書いた自己遷移 (`{ from: 'queued', event: 'enqueue-succeeded', to: 'queued' }`) と、 単に書き忘れた cell が、 実行時に区別できなかった。 `types.ts` の doc comment は「省略された cell は `invalidTransition` case に落ちる」 と書いていたが、 そんな case は生成されていなかった。

v0.3 は次状態と拒否を型で分ける。

```lean
inductive Step where
  | to : State → Step
  | invalid : Step

def dispatch : State → Event → Step
  | .Beginning, .BeginCompleted => .to .Active
  | .Beginning, .QueryExecuted  => .invalid
  -- 40 cell を全て列挙する。 catch-all は置かない。
```

catch-all が無いので、 cell が欠ければ Lean が落ちる。 しかも欠けた cell の名前を挙げる。

```
error: missing cases:
State.Active, Event.Timeout
```

#### 3. 定理は表から導ける、 反証可能なものだけになった

4 種を出す。 いずれも表と矛盾すれば証明が通らない。

| 定理 | 対象 | 述べていること |
|---|---|---|
| `<state>_absorbing` | 終端状態 | どの event も `invalid` |
| `<state>_can_leave` | 出ていける状態 | 別の状態へ動かす event がある (証人付き) |
| `<state>_no_escape` | sink | event を受理するが、 どれも外へ出さない |
| `<state>_reachable` | `initial` を与えた場合 | 初期状態からの最短経路 (証人付き) |

#### 3-a. sink は終端ではない

自己遷移しか持たない状態は event を受理するので終端ではない。 だが二度と出られない。 「有効な event が 1 つでもあるか」 を出口の条件にすると、 この状態を「出口がある」 と報告してしまう。 実際に `JOB_SPEC` の `dlq` がこれに当たる。 `dlq-inspected` を受理して `dlq` に留まるので、 job は永遠に `dlq` にいる。

そこで `escapes` を生成し、 「別の状態へ動かすか」 を問う。

```lean
def escapes (s : State) (e : Event) : Bool :=
  match dispatch s e with
  | .to s' => !(decide (s' = s))
  | .invalid => false
```

`meta.sinkStates` に列挙する。 sink は意図されたものか事故かのどちらかで、 どちらであれ名前を付ける価値がある。

#### 3-b. 到達可能性 (`initial` を与えた場合)

`initial` を与えると、 他の全状態への最短経路を幅優先で求め、 経路を証人とする定理を出す。

```lean
theorem authed_reachable : steps .Init [.AuthSucceeded] = .to .Authed := rfl
```

経路を持たない状態には定理を書けない。 生成が停止し、 その状態名を挙げる。 何も到達できない状態は、 型の中にしか存在しない。

#### 3-c. `terminal` は著者の主張であり、 表と突き合わせる

終端だと宣言した状態に出口がある場合と、 出口のない状態を宣言し忘れた場合の双方で停止する。 どちらも著者の意図と表の食い違いで、 常に表が正しいとは限らない。

#### 4. `lean --check` は存在しない引数だった

`verifyLeanSpec` は `lean --check <file>` を実行していた。 Lean にその flag は無く、 `unrecognized option` で常に非零終了する。 つまり Lean が入っている環境では、 正しい spec も壊れた spec も等しく `verification-failed` を返していた。 toolchain を入れて実行する test が 1 件も無かったため、 誰も気付けなかった。

正しい起動は `lean <file>` で、 elaborate すること自体が検査になる。

#### 5. 失敗の理由が捨てられていた

Lean は診断を stdout に書く。 `VerifyResult.stderr` は常に空文字列だった。 `diagnostics` field を足し、 実際に喋った側の stream を載せる。

#### 6. 生成される Lake project は何も建てていなかった

`lakefile.lean` の `lean_lib` に `@[default_target]` が無く、 `lake build` は対象を 1 つも持たなかった。 型エラーを含む spec を置いても `Build completed successfully` と表示して 0 で終了する (実測)。

さらに根 module は spec を `import` せず、 `globs` も無かった。 仮に対象があっても、 spec file は 1 度もコンパイルされない。 `lakefile.lean` 自身のコメントが「含めるには自分で追加せよ」 と書いていた。

v0.3 は `@[default_target]` と `globs := #[.andSubmodules \`<rootNamespace>]` を出す。 `modules` を渡すと根 module が各 spec を `import` するので、 `import <rootNamespace>` だけで全 spec に届く。

```lean
@[default_target]
lean_lib «KiwaSpecs» where
  globs := #[.andSubmodules `KiwaSpecs]
```

#### 7. `verifyLeanSpec` は使わない Lake project を書いていた

`generateLakeProject` の出力を一時 directory に書き、 `lake` を 1 度も呼ばずに `lean <file>` を実行していた。 `lakefile.lean` と根 module は何にも影響していない。

影響していたのは `lean-toolchain` だけで、 `elan` がこの file を作業 directory から読んで実行する Lean の版を決める。 v0.3 はこの 1 file だけを書く。 生成 spec は何も `import` しないので、 検査に build system は要らない。

`VerifyOptions.packageName` は使われなくなったため削除した。

#### 8. 同じ `path` を持つ 2 spec は、 先のものが黙って消えていた

`verifyLeanSpec` は spec ごとに file を書いていたので、 `moduleName` が同じ 2 spec は同じ file に書かれた。 先の spec は Lean が読む前に上書きされ、 検査されないまま `verifiedFiles` に載る。 壊れた spec を先に渡し、 正しい spec を後に渡すと `ok` が返った (実測)。

v0.3 は `path` の重複を拒否する。 `skip` や Lean 不在よりも先に検査する。 渡された物を検査しようがない呼出は、 この run が検査するかどうかに関わらず誤りだからだ。

#### 9. Lean の起動を 1 回にまとめた

`lean` は file を 1 つしか受け取らない (`Expected exactly one file name`)。 spec ごとに起動していたため、 5 spec で約 660 ms かかっていた。 生成 spec は各自の namespace を開閉し何も import しないので、 1 file に結合しても Lean が検査する内容は変わらない。 結合後は約 310 ms。

namespace が重複する 2 spec は結合すると衝突し、 Lean が 2 つ目を名指しで拒否する。 これは正しい。 root module が両方を import する Lake project でも同じく衝突するからだ。

診断の位置は結合 file ではなく spec の名前で述べる。 `KiwaSpecs/JobOrchestrator.lean:32:2` は呼出側が持っている言葉で、 一時 directory の path は読む頃には消えている。

#### 10. 版の固定を既定から外した

`verifyLeanSpec` は既定で `lean-toolchain` を書かない。 machine の Lean が検査する。 版を固定すると、 既に Lean を持っている人が同じ判定に至るためだけに 2 つ目の toolchain を download することになる。 `leanToolchain` を渡した時だけ固定する。

checked-in する Lake project は従来通り固定する。 repository は固定すべきだからだ。

### 移行

`OrchestratorSpec.transitions` の要素は 2 形になった。

```ts
{ from: 'active', event: 'query-executed', to: 'active' }    // 意図した自己遷移
{ from: 'active', event: 'commit-requested', invalid: true } // 拒否
```

宣言されていない cell があると `generateLeanSpec` が停止し、 cell 名を挙げる。 表の大半が拒否である場合は `unspecified: 'invalid'` を渡す。 これは一度だけ明示的に宣言する経路で、 既定 (`'error'`) は「誰も決めていない cell」 を通さない。

```ts
const spec: OrchestratorSpec = {
  moduleName: 'SessionOrchestrator',
  namespace: 'Session',
  states: [...],
  events: [...],
  unspecified: 'invalid',
  transitions: [...],
};
```

生成された `dispatch` の戻り値が `State` から `Step` になったため、 Lean 側で `dispatch` を使う証明は `.to s` / `.invalid` で分岐する必要がある。

`initial` と `terminal` は任意で、 与えなければ従来通り動く。 与えると到達可能性と終端の突き合わせが有効になる。

```ts
const spec: OrchestratorSpec = {
  ...,
  initial: 'queued',
  terminal: ['completed'],
};
```

### 追加 — `checkConformance`

#### 11. 「同 SSOT」 は文書にしか無かった

`docs/concepts/lean-spec-generator.md` は「TypeScript impl と Lean spec は 同じ 5 state / 8 event / 40 cell definition を共有」 と書き、 `MANIFESTO.md` は「同 SSOT を 両層で駆動」 と書いていた。 それを検査するものは、 code にも test にも 1 つも無かった。 Lean 側の表を 1 cell 変えても、 TS 側を 1 cell 変えても、 全 test が通る。

`checkConformance(spec, observe)` を追加した。 spec の全 cell を実装に問い、 食い違いを 4 種に分けて報告する。

| kind | 意味 |
|---|---|
| `different-target` | 双方が受理し、 着地する状態が違う |
| `impl-rejects` | spec は遷移先を持つが、 実装が event を拒否した |
| `impl-accepts` | spec が拒否する event を、 実装が受理して動いた |
| `unknown-state` | 実装が状態空間の外へ出た |

`impl-accepts` は、 spec の正常系から書いた test が決して到達しない側だ。 「起きえない」 と宣言した event を機械が受理する。

実装の書き方は問わない。 何をもって「拒否した」 とするかは呼出側が決める。 throw なのか、 error を返すのか、 状態を変えず log に印を残すのかを知っているのは呼出側だけだからだ。

`examples/dogfood-lean-orchestrator-specs-app/tests/conformance.test.ts` が本番実装 5 台 (orm / auth / cache / queue / cli-test) に対して 200 cell を突き合わせる。 今日は全 cell 一致する。 実装を 1 行変えても、 spec を 1 cell 動かしても落ちることを実測した。

#### 12. 生成器が cell を移動しても、 誰も気付かなかった

3 者 (spec / TypeScript 実装 / Lean file) のうち、 `checkConformance` が結ぶのは前 2 者だ。 3 辺目は生成器を通る暗黙の辺で、 検査するものが無かった。

生成器が 1 cell を誤った遷移先に render すると、 Lean file は compile し、 全定理が証明され、 表だけが違う。 定理は生成器と同じ表から導かれるので、 表が間違っていれば定理も揃って間違う。 Lean の網羅性検査が捕まえるのは cell の**欠落**であって、 **移動**ではない。

実測した。 `authed + timeout` を `expired` から `authed` に移すと、 `expired_absorbing` も `authed_can_leave` も `authed_reachable` も証明され、 `verifyLeanSpec` は `ok` を返す。 この cell はどの定理にも現れない。

`checkLeanTable(spec)` を追加した。 生成 Lean に `lean --run` で自分の表を出力させ、 spec と突き合わせる。

```
authed + timeout: the spec says expired, the generated Lean says authed
```

循環していない。 検査対象は `dispatch` で、 spec はそれとは独立に読む。 constructor 名の対応表は spec から生成するが、 それが誤っていれば複数 cell が一斉にずれるので隠れられない。

`source` を渡せば、 手元にある Lean file が今も spec の表を持っているかを検査できる。 生成器が書いた source を渡した場合は必ず一致するので、 この関数が食い違いを報告できることは、 手を入れた source を渡す test で確かめてある。

Lean が無ければ `status: 'lean-not-installed'` かつ `ok: false` を返す。 走らなかった検査は何も確立していない。

#### 13. Lean の起動処理を 1 箇所にまとめた

`src/lean-runner.ts` の `runLeanSource` を `verifyLeanSpec` と `extractLeanTable` の双方が使う。 2 箇所に書けば、 片方だけが「Lean は診断を stdout に書く」「版を固定するのは `lean-toolchain` だけ」 を知っている状態になる。

#### 14. 表の意味論を 1 箇所にまとめた

`src/table.ts` の `resolveTable` を、 生成器と突き合わせの双方が読む。 spec を 2 箇所で解釈すれば、 片方だけが `unspecified` policy を知る状態に必ず drift する。 v0.3 の初期は生成器の中に表の組み立てが埋まっており、 hook が同じ規則を `awk` で書き直していたのと同じ形だった。

#### 15. spec は user 入力で、 生成される Lean は文字列だった

名前は Lean の constructor / file 名 / 定理名になる。 何も検査していなかったので、 3 step 下流の compiler が代わりに文句を言っていた。

| 入力 | v0.2 の結末 |
|---|---|
| `states: ['a', 'a']` | Lean kernel: `duplicate constructor name M.State.A` |
| `states: ['a-b', 'aB']` | Lean kernel: `duplicate constructor name M.State.AB` |
| `states: ['ab', 'aB']` | 2 state が同じ定理名を持つ |
| `namespace: 'My Space'` | Lean parser: `unexpected identifier` |
| `moduleName: '../../etc/passwd'` | `path` がそのまま呼出側の書込先になる |
| `events: ['1st']` | identifier ではない |
| `states` に引用符 | 名前を運ぶ文字列から escape する |

最後の 1 つは cosmetic ではない。 `cellKey` は `state::event` なので、 state `a::b` と event `b::c` は state `a` + event `b::c` と同じ cell を指す。 2 cell が 1 つに融合し、 後者が前者の遷移先を継ぎ、 未宣言 cell の検査は宣言済みだと判断した。 名前を identifier に限ったので、 この衝突は到達不能になった。

`validateSpec` は `resolveTable` から呼ばれる。 spec を読む者は全て検査を通る (生成器も突き合わせも)、 それぞれが error 中で自分の名を名乗る。 `generateLakeProject` も自分の入力を検査する。 file 名と import 文になるからだ。

#### 16. error に型が無かった

`SpecError` (spec が機械にならない) と `UsageError` (spec が何であれ呼出が誤り)、 いずれも `LeanError` を継ぐ。 型が区別しなければ呼出側は message 文字列を照合するしかなく、 文言を改善した瞬間に壊れる。

#### 17. 偽の Lean が全 spec を検証済みにしていた

`--version` に 0 を返す program は Lean ではない。 `/bin/echo` は 0 を返す。 `leanBin` をそこに向けると、 何も見ていない pass が返っていた。 Lean は自分が誰か名乗る (`Lean (version 4.15.0, ...)`)、 `detectLeanBinary` はその答えを読む。

#### 18. timeout が「仕様が誤り」 として返っていた

`timeoutMs` を超えた run は `verification-failed` と `spawnSync lean ETIMEDOUT` を返した。 Lean が読み終えていない表の bug を探しに行くことになる。 `timed-out` を独立した status にした (`verifyLeanSpec` / `checkLeanTable` 双方)。

Lean は state ごとに定理を elaborate するので、 検証コストは state 数で伸びる。 900 cell で 2.5 秒、 2500 cell で 16 秒、 既定の 60 秒はその先で尽きる。 message はどの knob を回すか述べる。

#### 19. `KIWA_LEAN_SKIP_VERIFY` を片方しか見ていなかった

`verifyLeanSpec` は読み、 `checkLeanTable` は読まなかった。 build が Lean を切っても、 2 つのうち 1 つは Lean を起動していた。 `ExtractOptions.skip` を足し、 env も読む。 skip は pass ではない (`ok: false`)。

#### 20. `rootNamespace` が検査されていなかった

`verifiedFiles` は呼出側が spec を書き込む path で、 Lake project の library 名でもある。 `../../etc` は namespace ではない。

#### 21. 依存 0 になった

`@kiwa-lab/core` を dependencies に持っていたが、 `src` から 1 度も参照していない。 利用者に不要な package を引かせていた。 Node 組込のみを使う。 `sideEffects: false` を宣言し、 `CHANGELOG.md` を配布物に入れた。

#### 22. 観測関数の壊れを、 実装の欠陥と取り違えていた

`checkConformance` は observer が返したものをそのまま読んでいた。 `{ kind: 'to' }` に `state` が無ければ `undefined` という名の state として扱われ、 全 cell が `unknown-state` として報告される。 呼出側の関数が壊れているのに、 機械が悪いと読める report が返っていた。 `{}` も `{ kind: 'maybe' }` も同様。

TypeScript は形を述べる。 だが公開 package の利用者はいずれ TypeScript を使わない誰かになる。 v0.3 は `UsageError` を投げ、 どの cell を観測していたかを名指しする。

observer が throw した場合は素通しする。 呼出側の code の中で起きたことは呼出側が見るべきものだからだ。

#### 23. `workDir` の誤りが素の Error だった

`workDir: '/nope'` は `ENOENT: mkdtemp '/nope/kiwa-lean-'` を投げた。 呼出側が書いていない path を名指しし、 どの option がそれを生んだかを述べない。 `UsageError` に揃えた。

#### 24. 失敗 message が 400 行になり得た

20 state × 20 event が全 cell で食い違うと 400 行印字していた。 400 行目は誰も読まない。 20 件で打ち切り、 残り件数を述べる (`undeclaredError` と同じ規約)。 全件は `report.disagreements` に残る。

#### 25. 印字した cell に marker を付けた

Lean と source は stdout を共有する。 全行を cell として読んでいたので、 source 中の `#eval` や Lean が出力する warning が `unreadable line from Lean` になり、 正しい spec を落としていた。 marker 付きの行だけを読む。 これにより「印字された cell 数が machine の cell 数と一致するか」 の検査が到達可能になり、 test で固定できるようになった。

#### 26. 配布物を、 利用者が導入するように導入して使う

`pnpm test` は `src` を読む。 公開される package は `dist` と exports map と型定義で、 いずれも他の test が全て通ったまま壊れうる。 `tests/package.test.ts` が build → pack → install を行い、 ESM / CommonJS / `tsc` (strict, `skipLibCheck: false`) から使う。 `@ts-expect-error` を 2 箇所に置き、 型が誤用を弾くことを compiler に主張させる。

`prepublishOnly` がこれを走らせる。 利用者が導入できない / require できない / 型検査を通らない package は publish されない。 3 通りに壊して `pnpm publish --dry-run` が止まることを実測した。

書いている最中に 2 つ見つけた。 lifecycle は `npm_config_*` を環境に撒く。 `pack_destination` もその 1 つで、 `npm pack` が指定と違う場所に tarball を書いた。 内側の command は利用者の build が持つ環境で走らせる。 そして `beforeAll` が throw すると test は skip として数えられる。 飛ばされた検査は通った検査と見分けがつかない。 導入の失敗は `T-PKG-000` の失敗として現れる。

#### 27. `namespace` が Lean の予約語だと、 生成 file が壊れた

`validateSpec` は `namespace` が identifier であることを検査していた。 `end` は identifier だ。 そして生成器は `namespace end` と bare で書いていたので、 Lean は `unexpected token 'end'; expected identifier` と答えた。 検査が防ぐと謳っていた「3 step 下流の compiler が代わりに文句を言う」 状態そのもの。

候補 80 語のうち **65 語** が生成 file を壊した (`end` / `def` / `theorem` / `where` / `by` / `match` / `Type` / `Prop` / `Sort` / ...)。

Lean の予約語一覧を手で保つ道は採らない。 この package は Lean の文法を他の面では追っていないので、 次の release で語が増えれば漏れる。 かわりに `«»` で囲む。 任意の identifier が名前になる。 `lake.ts` が package 名と library 名に対して昔から採っていた記法と同じ。

```lean
namespace «Session»
...
end «Session»
```

`extractLeanTable` の `open` と型注釈も同じ扱いにした。 v4.12.0 / v4.15.0 / v4.23.0 / v4.31.0 の 4 版で確認。

state / event 名は影響を受けない。 PascalCase の constructor になるので、 `end` は `End` になり、 自身の型の中に住む。 `moduleName` も Lean source に現れない。

#### 28. 出力が buffer を超えると、 「仕様が誤り」 として返っていた

`execFileSync` の既定 `maxBuffer` は 1 MB。 表を印字する program は 1 cell あたり約 68 bytes を出すので、 15,000 cell で満ちる。 超えると Node は `ENOBUFS` を投げ、 Lean の答えは失われる。 tool の限界が spec への verdict として届く。 `timed-out` が防いでいるのと同じ混同。

`maxOutputBytes` (既定 64 MiB = 約 100 万 cell) を option にし、 超過を `output-too-large` として返す。 `timed-out` と同じく `ok: false`、 何も確立していない。

#### 29. 同じ cell を 2 度印字されても、 件数は変わらなかった

`extractLeanTable` は印字を Map に入れる。 同じ鍵が 2 度来れば上書きされ、 `table.size` は変わらない。 2 つ目の値は `dispatch` 以外のどこから来たものでもよい。 鍵の重複を拒否する。

「件数が検査の全て」 という comment は、 重複を排除して初めて正しい。

#### 30. 常に真になる主張が 1 件あった

`generator.test.ts` の `l.includes('active_can_leave') === false` は、 ほぼ全ての行で真になる。 主張は「`beginning` の証人行が存在する」 に潰れており、 `active` の証人選択が壊れても通る。 証人そのものを固定する形に書き直した。

#### 31. 溢れの修正が、 溢れを timeout として報告していた

`ENOBUFS` と `SIGTERM` は同時に届く。 buffer が満ちると Node は子を殺し、 殺すことは timeout がすることでもあるからだ。 判定は signal を先に読んでいたので、 満ちた buffer が timeout として報告される。 読み手は間違った knob を回しに行く。

`ENOBUFS` は Node が知っていることで、 `SIGTERM` はそれに対してしたことだ。 前者を先に読む。

Lean は Node が殺す前に印字を終えるので、 この組合せは Lean 経由では再現できない。 分類を `classifyFailure` として切り出し、 直接 test した。 再現できない経路を、 再現できないまま放置しない。

これら 5 件 (27-31) のうち 4 件は独立した adversarial review が指摘した。 私は 26 件を自分で見つけたが、 この 4 件は見落としていた。 5 件目 (31) は、 その 4 件目を直す過程で私が作った。

### 移行 (v0.3 の入力規約)

- state / event 名は `[A-Za-z][A-Za-z0-9_-]*` (kebab-case / underscore 可)
- `namespace` は Lean の予約語でもよい (`«»` で囲まれる)、 生成物の見た目が `namespace «Session»` に変わる
- `moduleName` は `[A-Za-z][A-Za-z0-9_]*` (ハイフン不可、 Lean module 名になるため)
- `namespace` / `rootNamespace` は Lean identifier
- 2 state が同じ constructor 名 / 定理名になる組合せは拒否

### 対応する Lean の版

生成 source を **v4.12.0 / v4.15.0 / v4.23.0 / v4.31.0** の 4 版で検証した。 4 版とも、 完全な表を受理し、 同じ壊れ方 (cell の欠落 / 偽の absorbing 定理 / 偽の到達経路) を拒否する。

診断の文言は版で変わる。 `missing cases` は v4.23 で `Missing cases` になり、 `tactic 'rfl' failed` は ``Tactic `rfl` failed`` になった。 変わらないのは Lean が echo し返す識別子で、 test はそちらを見る。

行列は `tests/lean-versions.test.ts` に置いた。 各版が別 download なので opt-in にしてある。

```bash
elan toolchain install leanprover/lean4:v4.31.0
KIWA_LEAN_TOOLCHAINS=v4.15.0,v4.31.0 pnpm test
```

### 検証

Lean を実際に install して実行した。 以下を test で固定した (`tests/lean-toolchain.test.ts`)。

- 生成 spec が elaborate に成功する
- cell を 1 つ削ると `missing cases` で落ち、 Lean が cell 名を挙げる
- `absorbing` 定理を偽にすると `rfl` が失敗する
- sink に `can_leave` を主張すると型が合わない
- 出ていける状態に `no_escape` を主張すると `rfl` が失敗する
- 到達経路の証人を誤らせると証明が通らない
- 削除した `dispatch_total` は遷移ゼロの表でも通る
- 生成 Lake project を `lake build` すると spec が実際に建てられ、 壊れた spec で落ちる
- `lean-toolchain` に存在しない版を書くと検証が失敗する (版の固定が効いている証拠)

実食 app の 5 台 (transaction / session / cache / job / cli) は全状態が初期状態から到達可能で、 実 toolchain の検証を通る。 `job` の `dlq` だけが sink として検出される。

端の場合も固定した。 初期状態自身が sink で他に状態があれば、 それらは到達不能として停止する。 状態が 1 つだけで自己遷移する機械は sink として扱われ、 到達可能性の定理を 1 つも持たないまま検証を通る。

toolchain が無い環境では skip され、 skip は pass として報告されない。
