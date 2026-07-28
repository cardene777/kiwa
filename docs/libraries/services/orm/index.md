# @kiwa-lab/orm

`@kiwa-lab/orm` は、Drizzle、Prisma、Kysely の query を、in-memory SQLite または Testcontainers の Postgres と MySQL で検証する adapter です。ORM client と raw driver を同じ environment から取得できます。

## 実行経路

<img src="/images/kiwa-docs/services/orm-overview.webp" alt="mockまたはliveのORM環境でqueryを確認して停止する流れ" width="1774" height="887" loading="lazy" decoding="async">

mock mode は SQLite を使い、live mode は Docker 上の database container を使います。mode、ORM、dialect は discriminated union なので、`env.mode`、`env.orm`、`env.dialect` で絞り込んで client を使います。

## 対応する組み合わせ

| ORM | mock | live |
| --- | --- | --- |
| Drizzle | SQLite | Postgres、MySQL |
| Prisma | SQLite | Postgres、MySQL |
| Kysely | SQLite | Postgres、MySQL |

Prisma は caller が生成した `PrismaClient` と `schema.prisma` を渡します。Kysely の schema は TypeScript の phantom type です。Drizzle の schema は table export の record です。

## 向いている場面

query 結果、migration、seed、SQL dialect の差、database 制約を検証するときに向いています。mock SQLite だけでは Postgres と MySQL の実挙動を証明できないため、dialect 固有の確認は live mode で実行します。

## 最初の一歩

最初は Drizzle と in-memory SQLite の mock mode を使います。必要な package、migration、environment の停止を含む一つの test file は [はじめる](./quickstart) にあります。Postgres や MySQL 固有の SQL を確認する段階で、Docker を使える job に live mode を分けます。

## 読み進める

[はじめる](./quickstart) で SQLite query を検証します。[使い方](./how-to) で migration と live mode を選びます。[リファレンス](./reference) で provider ごとの option と raw SQL helper を確認します。
