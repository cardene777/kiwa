# test-spec-users-repo (orm-query layer)

`src/users-repo.ts` の `UsersRepository` が Drizzle 越しに行う
登録 / 検索 / 連鎖削除を対象にする。

`setupOrmEnv` が返す `db` をそのまま渡せるため、本番と同じ class を
実 DB なしで動かせる。

- module: users-repo
- layer: orm-query
- table: users / posts

## 対象機能

| 関数 | 引数 | 返り値 |
|---|---|---|
| `create(input)` | `{ id, email, displayName }` | `{ ok: true }` または `{ ok: false, reason: 'duplicate-email' }` |
| `findByEmail(email)` | メールアドレス | 行、または `null` |
| `deleteCascading(id)` | user id | `{ deletedPosts: number }` |

## 仕様の要約

### schema

| table | 列 | 制約 |
|---|---|---|
| `users` | `id` | 主キー |
| `users` | `email` | `NOT NULL` かつ一意 |
| `users` | `display_name` | `NOT NULL` |
| `posts` | `author_id` | `NOT NULL`、`users.id` への外部キー (`ON DELETE CASCADE`) |
| `posts` | `published` | `NOT NULL`、既定 `false` (Drizzle 側と SQL 側の両方に宣言がある) |

### 登録が捕まえる例外は 1 種類だけ

```
/UNIQUE constraint failed: users\.email/
```

**この正規表現に一致した時だけ `{ ok: false, reason: 'duplicate-email' }` を返す。**
一致しない例外はそのまま送出する。

同じ `id` で登録すると `UNIQUE constraint failed: users.id` になり、
**同じ一意制約でも列が違うため捕まえず送出する**。

`email` / `display_name` が `NOT NULL` に触れた場合も送出する。

### 検索

`findByEmail` は完全一致で引く。`eq` は大小を区別するため、
大文字にした同じ綴りは `null` になる。

一致が無ければ `null`、あれば先頭の行を返す。

### 連鎖削除

`deleteCascading` は **削除する前に** 対象 user の posts を数え、
その件数を返す。削除自体は外部キーの `ON DELETE CASCADE` が行う。

| 対象 | 返り値 | 副作用 |
|---|---|---|
| posts を持つ user | `{ deletedPosts: N }` | user と その posts が消える |
| posts を持たない user | `{ deletedPosts: 0 }` | user が消える |
| 存在しない id | `{ deletedPosts: 0 }` | 何も起きない (送出しない) |

別の user の posts は消えない。

### 既定値が 2 箇所にある

`published` の既定は **Drizzle の schema と migration の SQL の両方**に宣言がある。

Drizzle 経由で列を省いて挿入すると、Drizzle が値を明示的に送るため
**SQL 側の既定は使われない**。両者がずれても Drizzle 経由の挿入では表面化しない。

## 主な品質リスク

- **捕まえる例外が列名で絞られている**。 同じ `UNIQUE constraint failed` でも
  `users.id` は送出するため、呼出側が `{ ok: false }` だけを想定すると落ちる
- **返す件数は削除前の観測値**。 実際に消えた件数ではなく、
  外部キーの連鎖が働かない設定では両者がずれる
- **存在しない id が成功と区別できない**。 どちらも `{ deletedPosts: 0 }` になる
- **検索が大小を区別する**。 メールアドレスの照合としては直感に反する
- **既定値が 2 箇所にある**。 Drizzle 経由では SQL 側の既定が使われないため、
  両者がずれても Drizzle 経由の挿入では気付けない

## 推奨テスト構成

`setupOrmEnv({ mode: 'mock', orm: 'drizzle', dialect: 'sqlite', schema, migrations })`
で in-memory の SQLite を組む。`seed` で初期行を入れる。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 登録と検索 | 往復、存在しない値 |
| 2 | 一意制約 | `email` の重複、`id` の重複 |
| 3 | 連鎖削除 | 件数、他 user への非波及、存在しない id |
| 4 | 外部キー | 存在しない author を持つ post |
| 5 | 既定値 | `published` |
| 6 | NOT NULL | `email` / `display_name` |
| 7 | 隔離 | 並行 env |

## テストケース一覧

| ID | Observation | Given | Method | Query | Then | Priority | Automation | Table |
|---|---|---|---|---|---|---|---|---|
| T-POC-001 | 登録した user を引ける | 空の DB | insert / select | `create` → `findByEmail` | `{ ok: true }`、引いた行が登録内容と一致 | P0 | yes | users |
| T-POC-002 | 重複した email を検出する | id 1 が登録済 | insert | 同じ email で `create` | `{ ok: false, reason: 'duplicate-email' }` | P0 | yes | users |
| T-POC-003 | 存在しない email は `null` | 空の DB | select | `findByEmail('nobody@example.com')` | `null` | P0 | yes | users |
| T-POC-004 | user 削除で posts も消える | user 1 と posts 2 件 | delete | `deleteCascading(1)` | `deletedPosts===2`、`posts` と `users` が 0 行 | P0 | yes | users / posts |
| T-POC-005 | 別 user の posts は残る | user 1 / 2 と各 1 件の post | delete | `deleteCascading(1)` | 残り 1 行で `authorId===2` | P0 | yes | posts |
| T-POC-006 | 検索は大小を区別する | 小文字で登録済 | select | 大文字にした同じ綴りで `findByEmail` | `null` | P1 | yes | users |
| T-POC-007 | 存在しない author の post を拒む | 空の DB | insert | `posts` に `authorId: 999` | 外部キー制約で送出 | P1 | yes | posts |
| T-POC-008 | 並行 env が互いに影響しない | 2 つの env で同じ id を別名で登録 | insert / select | 各 env で `findByEmail` | それぞれ自分の値を引く | P1 | yes | users |
| T-POC-009 | 重複 id は捕まえず送出する | id 1 が登録済 | insert | 同じ id / 別 email で `create` | `/UNIQUE constraint failed: users\.id/` を送出 | P1 | yes | users |
| T-POC-010 | 存在しない id の削除は 0 件 | 空の DB | delete | `deleteCascading(999)` | `{ deletedPosts: 0 }`、送出しない | P1 | yes | users |
| T-POC-011 | `published` の既定は偽 | user 1 が登録済 | insert / select | `published` を省いて post を挿入 | 引いた行の `published===false` | P2 | yes | posts |
| T-POC-012 | `email` が `NOT NULL` | 空の DB | insert | `email: null` で挿入 | `/NOT NULL constraint failed: users\.email/` を送出 | P2 | yes | users |
| T-POC-013 | `display_name` が `NOT NULL` | 空の DB | insert | `displayName: null` で挿入 | `/NOT NULL constraint failed: users\.display_name/` を送出 | P2 | yes | users |
| T-POC-014 | SQL 側の既定も偽である | user 1 が登録済 | raw SQL | 列を省いた `INSERT` を raw で実行 | 引いた行の `published===0` | P2 | yes | posts |

## 自動化方針

`setupOrmEnv` の `mode: 'mock'` は in-memory の SQLite を使い、実 DB を起動しない。
`afterEach` で `env.stop()` を呼ぶ。

**T-POC-009 は「捕まえない」 ことを固定する。**
登録が捕まえる正規表現は `users.email` に限定されており、
同じ一意制約でも `users.id` は素通しする。
正規表現を列名なしへ広げる変異で落ちる向きになる。

**T-POC-012 / 013 は列ごとに分ける。**
まとめて 1 件にすると、片方の `NOT NULL` が外れても気付けない。

**T-POC-011 と T-POC-014 は別の既定を見る。**
011 は Drizzle 側、014 は SQL 側。 Drizzle 経由の挿入では SQL 側の既定が
使われないため、011 だけでは SQL 側がずれても検知できない (実測で確認した)。

## 自動化すべきテスト

- T-POC-001 〜 T-POC-014 全件自動化推奨
- 実時間を待つものは無い

## 手動確認でよいテスト

- (なし)

## 不足している仕様

- 返す件数が **削除前の観測値** である。 外部キーの連鎖が働かない設定
  (SQLite の `PRAGMA foreign_keys` が無効な場合等) では、
  返り値と実際に消えた件数がずれる。 実際の削除件数を返すべきかが未定義
- 存在しない id と、posts を持たない user の削除が同じ `{ deletedPosts: 0 }` になる。
  区別する必要があるかが未定義
- 検索が大小を区別する。 メールアドレスの照合として意図した挙動かが未定義
- 捕まえる例外が `users.email` の一意制約だけである。 他の制約違反
  (`users.id` の重複、`NOT NULL`、外部キー) を呼出側でどう扱うかが未定義

## 覆えていない範囲

`findByEmail` が `rows[0]` を返す形は **到達する入力を作れない**。
`email` に一意制約があるため `rows` が 2 行以上になる状態を作れず、
先頭を返すか末尾を返すかで結果が変わらない (変異で実測、1 件も落ちない)。

制約を外せば作れるが、それは別の schema の話になる。
