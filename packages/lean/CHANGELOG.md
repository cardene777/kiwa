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

終端状態には `<state>_absorbing` (どの event でも `invalid`)、 非終端状態には `<state>_has_exit` (少なくとも 1 つ出口があり、 証人は生成器が知っている) を出す。 表と矛盾すれば証明が通らない。

#### 4. `lean --check` は存在しない引数だった

`verifyLeanSpec` は `lean --check <file>` を実行していた。 Lean にその flag は無く、 `unrecognized option` で常に非零終了する。 つまり Lean が入っている環境では、 正しい spec も壊れた spec も等しく `verification-failed` を返していた。 toolchain を入れて実行する test が 1 件も無かったため、 誰も気付けなかった。

正しい起動は `lean <file>` で、 elaborate すること自体が検査になる。

#### 5. 失敗の理由が捨てられていた

Lean は診断を stdout に書く。 `VerifyResult.stderr` は常に空文字列だった。 `diagnostics` field を足し、 実際に喋った側の stream を載せる。

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

### 検証

Lean 4.15.0 を実際に install して実行した。 生成 spec が elaborate に成功すること、 cell を 1 つ削ると `missing cases` で落ちること、 `absorbing` 定理を偽にすると `rfl` が失敗すること、 削除した `dispatch_total` が遷移ゼロの表でも通ることを、 それぞれ test で固定した (`tests/lean-toolchain.test.ts`)。 toolchain が無い環境では skip され、 skip は pass として報告されない。
