# test-spec-testcontainers-probe-flow (e2e-generic layer)

container 実体を持つ driver に差し替えられる形になっているかを、
mock 側の返り値の形で確かめる。

**実際に container を起動しない。** mock adapter は決まった文字列を返すだけで、
`reachable` も常に真。 この仕様書が保証するのは「口の形が揃っている」 ことだけになる。

- module: testcontainers-probe-flow
- layer: e2e-generic

## 対象機能

| 経路 | adapter の op | 実体 |
|---|---|---|
| `/testcontainers-probe` | `driveTestcontainersProbe` | `src/adapters/mock.ts` の定数 3 つ |

## 仕様の要約

### mock が返す 4 つの値

| 項目 | 値 | 由来 |
|---|---|---|
| `sqliteUrl` | `file:sqlite-mock.db` | `MOCK_SQLITE_URL` |
| `sqliteImage` | `sqlite:3.45` | `SQLITE_IMAGE_DEFAULT` |
| `libsqlImage` | `ghcr.io/tursodatabase/libsql-server:latest` | `LIBSQL_IMAGE_DEFAULT` |
| `reachable` | `true` | 定数 |

いずれも module scope の定数で、入力を取らない。 `driveTestcontainersProbe` は引数を持たない。

### 副作用は 3 つ

呼ぶたびに以下が積み上がる。

| 対象 | 増分 |
|---|---|
| `metrics().testcontainersProbes` | +1 |
| `metrics().latencySamplesMs` | +1 標本 |
| `traces()` | +1 件 (`op: 'driveTestcontainersProbe'`、`ok: true`) |

### real 側との関係

`src/adapters/real.ts` は `SQLITE_KEY` があれば container の URL を返し、無ければ
`SQLITE_ENV_MISSING` を trace に残す形になっている。 **e2e は mock だけを見ており、
real 側の分岐に到達しない** (`fixture.ts` が `makeMockAdapter()` を固定で呼ぶ)。

## 主な品質リスク

- **`reachable` が常に真**。 到達性を何も測っていないため、この値の assert は
  real driver に差し替えるまで意味を持たない。 mock で真だったことを
  「到達できる」 と読むと、実 container が落ちていても気付けない
- **image 名が定数**。 実際にその image を引けるかを確かめていない。
  tag (`sqlite:3.45` / `libsql-server:latest`) が消えても検出しない
- **`latest` tag を使っている**。 `libsqlImage` が固定版でないため、
  real driver に差し替えた時に取得する中身が時期で変わる
- **real 側の env-gate に到達しない**。 `SQLITE_KEY` の有無で分かれる分岐は
  e2e が 1 度も通らない

## 推奨テスト構成

`bootAdapterServer()` が mock adapter を載せた server を port 0 で立てる。
`page.goto(origin)` で同じ origin に置いてから `fetch` を投げる
(`about:blank` からだと CORS の事前確認で落ちる)。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 口の形 | 4 項目が揃って返る |
| 2 | 値の由来 | mock の定数と一致する |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | mock の probe が 4 項目を揃えて返す | mock adapter を載せた server と、その origin に置いた page | `/testcontainers-probe` へ空の body を POST する | `ok===true`、`reachable===true`、`sqliteUrl` が `sqlite-mock` を含み、`sqliteImage` が `sqlite` を、`libsqlImage` が `libsql` を含む | P1 | yes | node | `/testcontainers-probe` |

## 自動化方針

**assert は部分一致で書かれている** (`toContain`)。 完全一致にしていないのは、
image の tag が変わっても口の形は保たれるという意図と読める。

代償として、`sqliteUrl` が `file:sqlite-mock.db` から別の `sqlite-mock` を含む値へ
変わっても落ちない。 値そのものを固定したいなら完全一致にする必要がある。

**この 1 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `metrics().testcontainersProbes` の増分 | できる | `/metrics` を読んでいない |
| trace の追加 | できる | `/traces` を読んでいない |
| 定数の完全一致 | できる | 部分一致で assert している |
| real 側の `SQLITE_ENV_MISSING` | **できない** | `fixture.ts` が mock を固定で呼ぶため、real adapter が e2e の経路に現れない |

最後の 1 件だけが到達できない。 real 側は単体テストが `makeRealAdapter()` を直接呼んで確かめる。
