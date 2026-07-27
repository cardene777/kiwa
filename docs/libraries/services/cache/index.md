# @kiwa-lab/cache

`@kiwa-lab/cache` は Redis、Memcached、KeyDB を使うコードの TTL、失効、Pub Sub、counter、複数 node の振る舞いをテストするアダプターです。高速な in-memory または stub と、実コンテナを使う testcontainers を同じ操作面で切り替えます。

![インメモリまたはコンテナで作ったキャッシュ環境のTTL確認と停止](/images/kiwa-docs/services/cache-overview.png)

## 対象にする境界

このパッケージが確認するのは、アプリケーションが cache client に対して行う read、write、expiry、message delivery です。Redis、Memcached、KeyDB の provider 固有の起動を environment に閉じ込め、テスト側では TTL と message の契約を assertion します。

## 使う場面

session cache の失効、rate limit counter、cache invalidation、イベント購読を再現するときに使います。通常の unit test は in-memory または stub で高速に実行し、client compatibility や container 起動を確認したい scenario だけ testcontainers mode に分けます。

## 使わない場面

Redis Cluster の実運用トポロジー、network partition、provider が管理する監視機能をこの adapter だけで検証するものではありません。実 server の性能や failover は環境を明示した integration test で確認します。Memcached の API を Redis 用の `setupCacheEnv` で代用せず、対応する factory を選びます。

## provider を選ぶ

| provider | factory | 高速な mode | 実環境 mode |
| --- | --- | --- | --- |
| Redis | `setupCacheEnv` | `in-memory` | `testcontainers` |
| Memcached | `setupMemcachedEnv` | `stub` | `testcontainers` |
| KeyDB | `setupKeyDBEnv` | `stub` | `testcontainers` |

KeyDB では multi-master replication と cross-region Pub Sub を扱えます。Memcached では一貫性ハッシュ、`add`、`replace`、atomic counter を扱えます。

## lifecycle

environment は namespace が分離されています。ある environment の `flushAll()` や publish が別 environment に影響しません。subscription は `close()`、environment は `stop()` で停止します。testcontainers mode の `stop()` は container と client も閉じます。

## 次に読む

[はじめる](./quickstart) では in-memory Redis の TTL を確認します。[使い方](./how-to) では Pub Sub と provider の使い分けを扱います。command、TTL、mode の制約は [リファレンス](./reference) を参照してください。
