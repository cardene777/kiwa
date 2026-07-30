---
name: kiwa-cache
description: |
  @kiwa-lab/cache を用いて Redis、Memcached、KeyDB の application-level cache test を作る skill。
  TTL、Pub Sub、既存値だけの更新、counter、master 間の可視化を、既定の in-process environment で検証する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-cache cache test を作る

`@kiwa-lab/cache` の factory を使い、application が cache に期待する振る舞いを Vitest で表現する。実 database や cache server を運用する skill ではない。通常は Docker を使わない既定 mode で test を作り、実 client wire の確認だけ testcontainers mode に分離する。

## 入力と出力

`--module` は対象名、`--output` は生成する test file の path、`--provider` は `redis`、`memcached`、`keydb` のいずれかを指定する。`--spec-path` を指定した場合は、その仕様から対象の振る舞いを読む。出力先を省略したときは `tests/{module}.cache.test.ts` を使う。

仕様がある場合は `/kiwa:kiwa-design --layer cache --module {module}` で先に作れるが、仕様の作成は必須ではない。既存の application code、失効条件、キー設計、利用中の provider が分かれば test を作れる。

## 生成する test

Redis では `setupCacheEnv` を使い、`set`、`get`、`assertTTL`、`subscribe`、`publish`、`assertPublished` を必要な範囲で組み合わせる。subscription は `finally` で `close()`、environment は `finally` または `afterEach` で `stop()` する。

Memcached では `setupMemcachedEnv` を使う。Pub Sub は存在しないため、`add`、`replace`、`increment`、`decrement`、`serverFor`、TTL を test する。KeyDB では `setupKeyDBEnv` を使い、`master` を指定した write と read、必要な場合だけ `replicationLagMs` を用いた可視化待ちを test する。

`testcontainers` を選ぶ場合は、Docker と provider 用の external URL が必要である。Redis は `redis.url`、Memcached と KeyDB は `testcontainers.url` を指定する。unit test を container 必須にしない。

## 実行と確認

生成後は出力 file を読み、キー名、TTL の範囲、選んだ provider、resource cleanup が application の契約と一致することを確認する。次に対象 file だけを実行する。

```bash
pnpm exec vitest run {output}
```

Redis の TTL は経過時間の影響を受けるため、通常は exact value ではなく範囲で assertion する。存在しない key は `-2`、有効期限のない key は `-1` である。KeyDB の別 master に直後の read-after-write を要求する application では、同じ master を読むか、replication の完了を待つ設計にする。

## 実行例

```text
/kiwa:kiwa-cache --module profile --provider redis --output tests/profile.cache.test.ts
/kiwa:kiwa-cache --module rate-limit --provider memcached --output tests/rate-limit.cache.test.ts
/kiwa:kiwa-cache --module profile-replica --provider keydb --output tests/profile-replica.cache.test.ts
```
