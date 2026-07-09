# @kiwa-lab/lean

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

#### 12. 表の意味論を 1 箇所にまとめた

`src/table.ts` の `resolveTable` を、 生成器と突き合わせの双方が読む。 spec を 2 箇所で解釈すれば、 片方だけが `unspecified` policy を知る状態に必ず drift する。 v0.3 の初期は生成器の中に表の組み立てが埋まっており、 hook が同じ規則を `awk` で書き直していたのと同じ形だった。

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
