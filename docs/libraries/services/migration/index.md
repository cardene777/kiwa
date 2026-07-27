# @kiwa-lab/migration

`@kiwa-lab/migration` は、migration の適用履歴、rollback、schema 差分をプロセス内で検証する test harness です。Prisma、Drizzle、Kysely、Knex を provider 名で表しますが、実データベースへ SQL を送る library ではありません。

![migrationを適用し履歴とrollbackを確認する流れ](/images/kiwa-docs/services/migration-overview.png)

## 適用順と rollback の契約を確認する

`runUp` は migration を applied history に追加し、`runDown` は id を指定して同じ record を rolled back history へ移します。複数 migration を扱う `applyPendingMigrations` は id 昇順で適用し、すでに applied の id は重複して追加しません。結果だけでなく履歴を確認すると、どの migration が残るべきかを test できます。

未適用の id を rollback しても例外は送出されません。`failed` と `not applied` を返すため、失敗を assertion に含める必要があります。実行後の DB transaction や SQL の妥当性は、この結果からは分かりません。

## 変更を実行前に判断する

`diffSchema` はテーブルと列の追加、削除、型、null 許可の差分を返します。`planDryRun` は SQL を実行せず、破壊的な操作を destructive、変更リスクのある操作を risky として分類します。schema の意図と危険な migration を早期に review する test に使えます。

実際の provider 固有 SQL、lock、transaction、production data への影響は各 database の integration environment で確認してください。この package の client は履歴をメモリに保持するだけです。

## 読み進める

[Quickstart](./quickstart) では一つの migration を適用して取り消します。[使い方](./how-to) では複数 migration、schema diff、dry run を扱います。公開 API と戻り値は [リファレンス](./reference) にあります。
