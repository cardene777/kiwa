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

`VerifyOptions.packageName` は使われなくなったため削除した。 `leanToolchain` は残り、 既定は `leanprover/lean4:v4.15.0`。

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

### 検証

Lean 4.15.0 を実際に install して実行した。 以下を test で固定した (`tests/lean-toolchain.test.ts`)。

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
