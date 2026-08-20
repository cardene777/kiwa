# test-spec-testcontainers-probe-flow (e2e-generic layer)

container 実体を持つ driver と同じ observation 型を使う mock の HTTP 経路を、
mock 側の返り値の形で確かめる。

**実際に container を起動せず、driver の差し替えも行わない。** mock adapter は決まった文字列を
返すだけで、`reachable` も常に真。 この仕様書が保証するのは mock の route と observation の
「口の形が繋がっている」 ことだけになる。

- module: testcontainers-probe-flow
- layer: e2e-generic

## 対象機能

| 経路 | adapter の op | 実体 |
|---|---|---|
| `/testcontainers-probe` | `driveTestcontainersProbe` | `src/adapters/mock.ts` の定数 |

## 仕様の要約

### mock が返す 4 つの値

実測した値。

| 項目 | 値 |
|---|---|
| `postgresUrl` | `postgresql://postgres:postgres@postgres-mock:5432/orders` |
| `postgresImage` | `postgres:16-alpine` |
| `pgvectorImage` | `pgvector/pgvector:pg16` |
| `reachable` | `true` |

いずれも定数で、入力を取らない。 `driveTestcontainersProbe` は引数を持たない。

### 副作用は 3 つ

呼ぶたびに以下が積み上がる。

| 対象 | 増分 |
|---|---|
| `metrics().testcontainersProbes` | +1 |
| `metrics().latencySamplesMs` | +1 標本 |
| `traces()` | +1 件 (`op: 'driveTestcontainersProbe'`、`ok: true`) |

### real 側との関係

`src/adapters/real.ts` は `POSTGRES_BOOTSTRAP` があれば bootstrap と image の設定値を返し、
無ければ `POSTGRES_ENV_MISSING` を trace に残す。 env がある側では bootstrap が URL または
`host:port` の形かを正規表現で判定し、その結果を `reachable` に入れる。 **e2e は mock だけを
見ており、real 側の env 有無と `reachable` 真偽のいずれにも到達しない**
(`fixture.ts` が `makeMockAdapter()` を固定で呼び、adapter を差し替える口を持たない)。

## 主な品質リスク

- **`reachable` が常に真**。 mock は到達性を何も測っていない。 現在の real adapter も
  bootstrap の文字列形式だけを判定し、接続は試さないため、実際の疎通保証には使えない
- **URL に資格情報が literal で入っている**。 mock の `postgres:postgres` は置き換え文字列だが、
  connected real adapter も `POSTGRES_BOOTSTRAP` を `postgresUrl` としてそのまま応答と trace に載せる。
  bootstrap に実資格情報を含めると現在の実装でも接続情報が露出する
- **image 名が定数**。 実際にその image を引けるかを確かめていない
- **`pg16` と `16-alpine` で版の書き方が揃っていない**。 同じ Postgres 16 を指すが
  文字列としては別で、版を機械的に突き合わせられない
- **real 側の env-gate に到達しない**。 `POSTGRES_BOOTSTRAP` の有無で分かれる分岐は
  e2e が 1 度も通らない

## 推奨テスト構成

`bootAdapterServer()` が mock adapter を載せた server を port 0 で立てる。
`page.goto(origin)` で同じ origin に置いてから `fetch` を投げる。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 口の形 | 4 項目が揃って返る |
| 2 | 値の識別子 | 期待する部分文字列を含む |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | mock の probe が 4 項目を揃えて返す | mock adapter を載せた server と、その origin に置いた page | `/testcontainers-probe` へ空の body を POST する | `ok===true`、`reachable===true`、`postgresUrl` が `postgres-mock` を含み、`postgresImage` が `postgres:16` を、`pgvectorImage` が `pgvector` を含む | P1 | yes | node | `/testcontainers-probe` |

## 自動化方針

**assert は部分一致で書かれている** (`toContain`)。 値そのものを固定していない。

代償として、`postgresImage` が `postgres:16-alpine` から `postgres:16.9` へ変わっても落ちない
(どちらも `postgres:16` を含む)。 版を固定したいなら完全一致にする必要がある。

**この 1 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `metrics().testcontainersProbes` の増分 | できる | `/metrics` を読んでいない |
| trace の追加 | できる | `/traces` を読んでいない |
| 定数の完全一致 | できる | 部分一致で assert している |
| real factory の 2 分岐 (`POSTGRES_BOOTSTRAP` の有無) | **できない** | `fixture.ts` に adapter の注入口が無い |
| env がある時の `reachable` 真偽 (bootstrap の形式判定) | **できない** | 同上 |

最後の 2 件が e2e から到達できない。 単体テストは `makeRealAdapter()` を直接呼び、env 無しと
妥当な URL の env 有りを確かめるが、不正な bootstrap による `reachable: false` は確かめていない。
