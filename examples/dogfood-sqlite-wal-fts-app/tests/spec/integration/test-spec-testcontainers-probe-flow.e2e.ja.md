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

`src/adapters/real.ts` は `SQLITE_KEY` があれば、その値を接続先の bootstrap 文字列として
`sqliteUrl` に返す。 無ければ `SQLITE_ENV_MISSING` を trace に残す。 **e2e server は
mock だけを載せるため、`SQLITE_KEY` の有無にかかわらず real 側の分岐に到達しない**
(`fixture.ts` が `makeMockAdapter()` を固定で呼び、adapter の注入口を持たない)。

## 主な品質リスク

- **`reachable` が常に真**。 到達性を何も測っていないため、この assert が保証するのは
  mock の定数だけになる。 mock で真だったことを real container の到達性と読むと、
  container が落ちていても気付けない
- **image 名が定数**。 実際にその image を引けるかを確かめていない。
  tag (`sqlite:3.45` / `libsql-server:latest`) が消えても検出しない
- **`latest` tag を文字列として返す**。 現在の adapter は image を resolve も pull もしないが、
  後段がこの値をそのまま pull に使うと取得内容を固定できない
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
| 2 | 値の識別子 | 3 つの文字列が期待する部分文字列を含む |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | mock の probe が 4 項目を揃えて返す | mock adapter を載せた server と、その origin に置いた page | `/testcontainers-probe` へ空の body を POST する | `ok===true`、`reachable===true`、`sqliteUrl` が `sqlite-mock` を含み、`sqliteImage` が `sqlite` を、`libsqlImage` が `libsql` を含む | P1 | yes | node | `/testcontainers-probe` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-sqlite-wal-fts-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 11 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 testcontainers probe reports mock endpoints + reachable=true` (`examples/dogfood-sqlite-wal-fts-app/tests/e2e/testcontainers-probe-flow.spec.ts:30`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P1) — `/testcontainers-probe` が 4 項目を揃えて返すことを確かめる happy path

**assert は部分一致で書かれている** (`toContain`)。 そのため image の tag が変わっても、
部分文字列が残る限り test は通る。

代償として、`sqliteUrl` が `file:sqlite-mock.db` から別の `sqlite-mock` を含む値へ
変わっても落ちない。 値そのものを固定したいなら完全一致にする必要がある。

**この 1 件が覆っていない主要な範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `metrics().testcontainersProbes` の増分 | できる | `/metrics` を読んでいない |
| trace の追加 | できる | `/traces` を読んでいない |
| 定数の完全一致 | できる | 部分一致で assert している |
| real adapter (`SQLITE_KEY` 有 / 無) | **できない** | `fixture.ts` が mock を固定で呼び、real adapter を渡す経路が無い |

最後の 1 件だけが、この e2e server の経路から到達できない。 real 側は単体テストが
`makeRealAdapter()` を直接呼んで確かめる。

## 手動確認でよいテスト

(なし)

## 不足している仕様

(なし)
