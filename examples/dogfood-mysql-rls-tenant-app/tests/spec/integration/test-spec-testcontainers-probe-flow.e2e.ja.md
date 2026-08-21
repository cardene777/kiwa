# test-spec-testcontainers-probe-flow (e2e-generic layer)

mock adapter の probe が返す 4 項目の形を確かめる。

**container を起動しない。 driver の差し替えも行わない。**
この仕様書が保証するのは mock の HTTP 経路と応答の形が繋がっていることだけになる。

- module: testcontainers-probe-flow
- layer: e2e-generic

## 対象機能

| 経路 | adapter の op | 実体 |
|---|---|---|
| `/testcontainers-probe` | `driveTestcontainersProbe` | `src/adapters/mock.ts` の定数 |

## 仕様の要約

### mock が返す 4 つの値

まっさらな server で実測した値。

| 項目 | 値 |
|---|---|
| `mysqlUrl` | `mysql://mysql:mysql@mysql-mock:3306/kiwa` |
| `mysqlImage` | `mysql:8.4` |
| `routerImage` | `mysql/mysql-router:8.4` |
| `reachable` | `true` |

いずれも定数で、入力を取らない。 同じ server で 2 回呼んで応答が完全一致することも確かめた。

### 副作用は 3 つ

| 対象 | 増分 |
|---|---|
| `metrics().testcontainersProbes` | +1 |
| `metrics().latencySamplesMs` | +1 標本 |
| `traces()` | +1 件 (`op: 'driveTestcontainersProbe'`、`ok: true`) |

### real 側との関係

`src/adapters/real.ts` は env の有無で分かれる。 **e2e はどちらの分岐にも到達しない**。
`fixture.ts` が `makeMockAdapter()` を固定で呼び、adapter を差し替える口を持たないため。

## 主な品質リスク

- **`reachable` が常に真**。 到達性を何も測っていないため、この assert が
  確かめるのは mock の固定値が HTTP 応答まで届くことだけになる。mock で真だったことを
  「到達できる」 と読むと、実 container が落ちていても気付けない
- **URL に資格情報が literal で入っている**。 `mysql:mysql` は mock の置き換え文字列だが、
  real 側は `MYSQL_KEY` を初期 `probe` trace の `detail.bootstrap`、応答の `mysqlUrl`、
  `driveTestcontainersProbe` trace の `detail.mysqlUrl` にそのまま載せる。
  DSN に実資格情報があれば 3 箇所に露出する
- **image 名が定数**。 実際にその image を引けるかを確かめていない
- **real 側の分岐に到達しない**。 env の有無で分かれる経路は e2e が 1 度も通らない

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
| T-E2E-001 | mock の probe が 4 項目を揃えて返す | mock adapter を載せた server と、その origin に置いた page | `/testcontainers-probe` へ空の body を POST する | `ok===true`、`reachable===true`、`mysqlUrl` が `mysql-mock` を含み、`mysqlImage` が `mysql:8` を、`routerImage` が `mysql-router` を含む | P1 | yes | node | `/testcontainers-probe` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-mysql-rls-tenant-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 見つけた既存 test — 72 件 (`describe` / `it` / `test`)

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 testcontainers probe reports mock endpoints + reachable=true` (`examples/dogfood-mysql-rls-tenant-app/tests/e2e/testcontainers-probe-flow.spec.ts:31`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P1) — `/testcontainers-probe` が 4 項目を揃えて返すことを確かめる happy path

**assert は部分一致で書かれている** (`toContain`)。 値そのものを固定していない。

代償として、`mysqlImage` が `mysql:8.4` から `mysql:8.0` へ変わっても落ちない
(どちらも `mysql:8` を含む)。 版を固定したいなら完全一致にする必要がある。

**この 1 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `metrics().testcontainersProbes` の増分 | できる | `/metrics` を読んでいない |
| `metrics().latencySamplesMs` の標本追加 | できる | `/metrics` を読んでいない |
| trace の追加 | できる | `/traces` を読んでいない |
| 定数の完全一致 | できる | 部分一致で assert している |
| 2 回目の呼出でも同じ値になること | できる | 1 回しか投げていない |
| real 側の分岐 | **できない** | `fixture.ts` に adapter の注入口が無い |

最後の 1 件だけが到達できない。 real 側は単体テストが `makeRealAdapter()` を直接呼んで確かめる。

## 手動確認でよいテスト

(なし)

## 不足している仕様

(なし)
