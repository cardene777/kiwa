---
"@kiwa-lab/orm": patch
---

live setup が container 起動後の失敗で container と driver を残さなくなった。

`setupOrmEnv` の live mode は container を起こしてから driver 構築 / migration / seed と進むが、
この間に throw すると `stop` を返す前に reject するため、 container も driver も残っていた。
Drizzle / Prisma / Kysely × Postgres / MySQL の 6 経路すべてが同じ形だった。

同じ file の `createPool` 解決失敗の経路だけは `container.stop()` してから throw しており、
片付けの契約が経路ごとに食い違っていた。

6 経路とも起動後を `try` で囲み、 `catch` で driver を先、 container を後の順に閉じてから
再 throw する形にした。 片付け中の例外は握り潰すので、 呼び手が受け取るのは最初に起きた理由。

あわせて Kysely + MySQL の container 起動失敗の案内文に `docker ps` の確認を足した。
6 経路のうちここだけ欠けていた。
