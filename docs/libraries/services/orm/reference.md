# @kiwa-lab/orm リファレンス

ORM environment、migration、raw SQL assertion の公開 API です。

## setupOrmEnv

`setupOrmEnv(options)` は ORM、dialect、mode の組み合わせに対応した `OrmTestEnv` を返します。

| ORM | mock option | live option |
| --- | --- | --- |
| Drizzle | SQLite と `schema` | Postgres または MySQL と `schema` |
| Prisma | SQLite、`prismaClient`、`schemaPath` | Postgres または MySQL、`prismaClient`、`schemaPath` |
| Kysely | SQLite と type schema | Postgres または MySQL と type schema |

Drizzle と Kysely の environment は `db` と `raw` を持ちます。Prisma の environment は `client` を持ち、mock では `dbPath` と `datasourceUrl`、live では `connectionUri` を持ちます。live environment はいずれも `connectionUri` を持ちます。

## migration と seed

`migrations` は SQL string、SQL string array、folder object です。`seed` は migration 後に ORM client を受け取る callback です。seed が reject すると setup も reject します。

`containerImage` は live Drizzle、Prisma、Kysely の database image を上書きします。Drizzle の既定は Postgres `postgres:16-alpine`、MySQL `mysql:8.4` です。

## query assertion

```ts
await expectQuery(env, "SELECT id FROM users", [{ id: 1 }], expect);
await expectRowCount(env, "users", 1, expect);
```

両 helper は `MinimalExpect` を最後の引数に受け取ります。Vitest では `expect` を渡します。

`expectQuery` は raw SQL の rows を deep equality で比較します。`expectRowCount` は SQLite と Postgres では double quote、MySQL では backtick で table identifier を quote します。row count 以外の SQL は caller が安全に組み立てます。

## stop

すべての environment は `mode` と非同期の `stop()` を持ちます。mock Drizzle と Kysely は SQLite connection を閉じます。Prisma は `$disconnect` を試行して temporary directory または container を cleanup します。live mode は driver と container を停止します。

## semantic helper

package root は ORM production semantics の state machine も export します。これらは database connection を作らない純粋関数であり、複製、CDC、RLS などの event sequence を test するときに使います。ORM query environment と混同せず、必要な semantics API の型定義を確認してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>updateGtidSet: duplicate gtid $&#123;input.gtid&#125;</code> | [packages/orm/src/semantics/binlog.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L100) |
| <code v-pre>negotiateBinlogFormat: requires gtid-updated state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/binlog.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L122) |
| <code v-pre>detectGtidGap: requires format-negotiated state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/binlog.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L144) |
| <code v-pre>detectGtidGap: expectedGtid is already present</code> | [packages/orm/src/semantics/binlog.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L147) |
| <code v-pre>advanceBinlogPosition: file is required</code> | [packages/orm/src/semantics/binlog.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L65) |
| <code v-pre>advanceBinlogPosition: position must be positive</code> | [packages/orm/src/semantics/binlog.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L68) |
| <code v-pre>advanceBinlogPosition: position must advance</code> | [packages/orm/src/semantics/binlog.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L71) |
| <code v-pre>updateGtidSet: requires positioned state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/binlog.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L94) |
| <code v-pre>updateGtidSet: gtid is required</code> | [packages/orm/src/semantics/binlog.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L97) |
| <code v-pre>appendOutbox: requires decoding / buffered / ordered state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/cdc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L110) |
| <code v-pre>appendOutbox: no event to append (decoded buffer is empty)</code> | [packages/orm/src/semantics/cdc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L116) |
| <code v-pre>markEventOrdered: outbox is empty</code> | [packages/orm/src/semantics/cdc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L142) |
| <code v-pre>markEventOrdered: LSN out of order ($&#123;event.lsn&#125; &lt;= $&#123;prev&#125;)</code> | [packages/orm/src/semantics/cdc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L147) |
| <code v-pre>confirmDelivery: requires ordered / delivered state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/cdc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L178) |
| <code v-pre>confirmDelivery: upToLsn $&#123;input.upToLsn&#125; regresses confirmedLsn $&#123;session.confirmedLsn&#125;</code> | [packages/orm/src/semantics/cdc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L183) |
| <code v-pre>confirmDelivery: upToLsn $&#123;input.upToLsn&#125; exceeds outbox high-water $&#123;highWaterLsn&#125;</code> | [packages/orm/src/semantics/cdc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L189) |
| <code v-pre>decodeEvent: lsn must be positive</code> | [packages/orm/src/semantics/cdc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L75) |
| <code v-pre>waitInQueue: pool has spare capacity — call acquire instead</code> | [packages/orm/src/semantics/connection-pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L128) |
| <code v-pre>idleTimeout: pool session is $&#123;session.state&#125; (terminal), cannot evict from terminal state</code> | [packages/orm/src/semantics/connection-pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L158) |
| <code v-pre>idleTimeout: unknown client id $&#123;input.clientId&#125;</code> | [packages/orm/src/semantics/connection-pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L164) |
| <code v-pre>idleTimeout: client not idle long enough ($&#123;idle&#125;ms &lt; $&#123;session.idleTimeoutMs&#125;ms)</code> | [packages/orm/src/semantics/connection-pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L168) |
| <code v-pre>statementTimeout: pool session is $&#123;session.state&#125; (terminal), cannot cancel from terminal state</code> | [packages/orm/src/semantics/connection-pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L198) |
| <code v-pre>statementTimeout: unknown or inactive client id $&#123;input.clientId&#125;</code> | [packages/orm/src/semantics/connection-pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L204) |
| <code v-pre>statementTimeout: elapsed $&#123;input.elapsedMs&#125;ms below limit $&#123;session.statementTimeoutMs&#125;ms</code> | [packages/orm/src/semantics/connection-pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L209) |
| <code v-pre>createPoolSession: maxConnections must be positive</code> | [packages/orm/src/semantics/connection-pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L57) |
| <code v-pre>acquire: pool session is $&#123;session.state&#125; (terminal), start a new session</code> | [packages/orm/src/semantics/connection-pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L89) |
| <code v-pre>acquire: pool saturated ($&#123;session.active.size&#125;/$&#123;session.maxConnections&#125;)</code> | [packages/orm/src/semantics/connection-pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L94) |
| <code v-pre>matchFts5Query: requires tokenized state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/fts5.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L118) |
| <code v-pre>matchFts5Query: query is required</code> | [packages/orm/src/semantics/fts5.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L121) |
| <code v-pre>matchFts5Query: rank must be finite</code> | [packages/orm/src/semantics/fts5.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L124) |
| <code v-pre>inspectFts5Vocab: requires matched state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/fts5.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L146) |
| <code v-pre>inspectFts5Vocab: term is required</code> | [packages/orm/src/semantics/fts5.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L149) |
| <code v-pre>inspectFts5Vocab: occurrences must be non-negative</code> | [packages/orm/src/semantics/fts5.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L152) |
| <code v-pre>createFts5VirtualTable: requires empty state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/fts5.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L65) |
| <code v-pre>createFts5VirtualTable: at least one column is required</code> | [packages/orm/src/semantics/fts5.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L68) |
| <code v-pre>tokenizeFts5Document: requires virtual-table-created state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/fts5.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L92) |
| <code v-pre>tokenizeFts5Document: document must contain tokens</code> | [packages/orm/src/semantics/fts5.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L96) |
| <code v-pre>trackReplicationOrigin: requires streaming state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/logical-replication-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L100) |
| <code v-pre>trackReplicationOrigin: originId is required</code> | [packages/orm/src/semantics/logical-replication-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L103) |
| <code v-pre>trackReplicationOrigin: remoteLsn cannot precede startLsn</code> | [packages/orm/src/semantics/logical-replication-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L106) |
| <code v-pre>confirmTwoSafeCommit: requires origin-tracked state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/logical-replication-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L133) |
| <code v-pre>confirmTwoSafeCommit: at least one synchronous standby is required</code> | [packages/orm/src/semantics/logical-replication-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L136) |
| <code v-pre>confirmTwoSafeCommit: confirmedFlushLsn cannot regress</code> | [packages/orm/src/semantics/logical-replication-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L139) |
| <code v-pre>syncCascadedSubscription: requires two-safe-confirmed state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/logical-replication-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L165) |
| <code v-pre>syncCascadedSubscription: upstreamId and subscriberId must differ</code> | [packages/orm/src/semantics/logical-replication-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L170) |
| <code v-pre>startLogicalStreaming: requires idle state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/logical-replication-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L67) |
| <code v-pre>startLogicalStreaming: startLsn must be positive</code> | [packages/orm/src/semantics/logical-replication-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L70) |
| <code v-pre>startLogicalStreaming: protocolVersion must be &gt;= 1</code> | [packages/orm/src/semantics/logical-replication-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L73) |
| <code v-pre>syncSubscription: no publication exists yet</code> | [packages/orm/src/semantics/logical-replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L115) |
| <code v-pre>resolveConflict: requires synced / conflict-resolved state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/logical-replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L152) |
| <code v-pre>resolveConflict: subscriber $&#123;input.subscriberId&#125; is not synced</code> | [packages/orm/src/semantics/logical-replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L157) |
| <code v-pre>resolveConflict: strategy 'reject' forbids subscriber wins</code> | [packages/orm/src/semantics/logical-replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L162) |
| <code v-pre>heartbeat: timestamp must be monotonically increasing</code> | [packages/orm/src/semantics/logical-replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L195) |
| <code v-pre>createPublication: at least one table is required</code> | [packages/orm/src/semantics/logical-replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L82) |
| <code v-pre>createPublication: cannot overwrite publication under live topology (state=$&#123;session.state&#125;)</code> | [packages/orm/src/semantics/logical-replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L85) |
| <code v-pre>measureBloat: requires visibility-checked state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/mvcc-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L101) |
| <code v-pre>measureBloat: tuple counts must be positive in total</code> | [packages/orm/src/semantics/mvcc-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L105) |
| <code v-pre>applyHotUpdate: requires bloat-measured state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/mvcc-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L132) |
| <code v-pre>applyHotUpdate: oldTupleId and newTupleId must differ</code> | [packages/orm/src/semantics/mvcc-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L135) |
| <code v-pre>applyHotUpdate: chainLength must be positive</code> | [packages/orm/src/semantics/mvcc-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L138) |
| <code v-pre>detectXidWraparound: requires hot-updated state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/mvcc-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L167) |
| <code v-pre>detectXidWraparound: warningAge must be positive</code> | [packages/orm/src/semantics/mvcc-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L170) |
| <code v-pre>detectXidWraparound: xid age is below warning threshold</code> | [packages/orm/src/semantics/mvcc-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L174) |
| <code v-pre>createMvccAdvancedSession: currentXid must be positive</code> | [packages/orm/src/semantics/mvcc-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L50) |
| <code v-pre>checkTupleVisibility: tupleId is required</code> | [packages/orm/src/semantics/mvcc-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L70) |
| <code v-pre>checkTupleVisibility: tuple xmin is newer than snapshot</code> | [packages/orm/src/semantics/mvcc-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L73) |
| <code v-pre>abortSerializable: requires serializable isolation (got $&#123;session.isolation&#125;)</code> | [packages/orm/src/semantics/mvcc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L108) |
| <code v-pre>abortSerializable: txn already $&#123;session.state&#125;</code> | [packages/orm/src/semantics/mvcc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L113) |
| <code v-pre>blockPhantom: read-committed does not prevent phantom reads</code> | [packages/orm/src/semantics/mvcc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L141) |
| <code v-pre>blockPhantom: txn is $&#123;session.state&#125;</code> | [packages/orm/src/semantics/mvcc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L146) |
| <code v-pre>detectDeadlock: cycle must include at least 2 txns</code> | [packages/orm/src/semantics/mvcc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L182) |
| <code v-pre>detectDeadlock: session txn $&#123;session.txnId&#125; not in cycle</code> | [packages/orm/src/semantics/mvcc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L185) |
| <code v-pre>detectDeadlock: txn already $&#123;session.state&#125;, cannot overwrite terminal state</code> | [packages/orm/src/semantics/mvcc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L190) |
| <code v-pre>takeSnapshot: txn is $&#123;session.state&#125;</code> | [packages/orm/src/semantics/mvcc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L78) |
| <code v-pre>takeSnapshot: txn is phantom-blocked, resolve the predicate lock first</code> | [packages/orm/src/semantics/mvcc.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L81) |
| <code v-pre>detectClusterConflict: requires primary-elected state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/mysql-cluster.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L120) |
| <code v-pre>detectClusterConflict: unknown winner $&#123;input.winnerMemberId&#125;</code> | [packages/orm/src/semantics/mysql-cluster.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L123) |
| <code v-pre>detectClusterConflict: transactionId is required</code> | [packages/orm/src/semantics/mysql-cluster.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L126) |
| <code v-pre>leaveClusterMember: unknown member $&#123;input.memberId&#125;</code> | [packages/orm/src/semantics/mysql-cluster.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L149) |
| <code v-pre>joinClusterMember: memberId is required</code> | [packages/orm/src/semantics/mysql-cluster.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L65) |
| <code v-pre>joinClusterMember: member $&#123;input.memberId&#125; already joined</code> | [packages/orm/src/semantics/mysql-cluster.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L68) |
| <code v-pre>joinClusterMember: weight must be non-negative</code> | [packages/orm/src/semantics/mysql-cluster.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L71) |
| <code v-pre>electClusterPrimary: unknown member $&#123;input.memberId&#125;</code> | [packages/orm/src/semantics/mysql-cluster.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L94) |
| <code v-pre>electClusterPrimary: primary election requires single-primary mode</code> | [packages/orm/src/semantics/mysql-cluster.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L97) |
| <code v-pre>declarePartition: duplicate name $&#123;input.name&#125;</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L100) |
| <code v-pre>prunePartitions: no partitions declared</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L128) |
| <code v-pre>prunePartitions: keptCount $&#123;input.keptCount&#125; out of range &#91;0, $&#123;session.buckets.length&#125;&#93;</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L131) |
| <code v-pre>partitionWiseJoin: partitions must be declared first</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L169) |
| <code v-pre>partitionWiseJoin: matchedBuckets must be positive</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L172) |
| <code v-pre>partitionWiseJoin: matchedBuckets $&#123;input.matchedBuckets&#125; exceeds declared $&#123;session.buckets.length&#125;</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L175) |
| <code v-pre>partitionWiseJoin: matchedBuckets $&#123;input.matchedBuckets&#125; below declared $&#123;session.buckets.length&#125;, partial matches are not partition-wise</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L180) |
| <code v-pre>routeInsert: partitions must be declared first</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L210) |
| <code v-pre>routeInsert: no bucket matches key $&#123;String(input.key)&#125;</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L227) |
| <code v-pre>declarePartition: range strategy requires low + high</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L77) |
| <code v-pre>declarePartition: range high must exceed low</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L80) |
| <code v-pre>declarePartition: list strategy requires values</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L84) |
| <code v-pre>declarePartition: hash strategy requires modulus + remainder</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L88) |
| <code v-pre>declarePartition: hash modulus must be positive</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L91) |
| <code v-pre>declarePartition: hash remainder must be in &#91;0, modulus)</code> | [packages/orm/src/semantics/partitioning.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L94) |
| <code v-pre>warmPoolConnections: requires healthy state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/pool-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L101) |
| <code v-pre>warmPoolConnections: connectionCount below minWarmConnections</code> | [packages/orm/src/semantics/pool-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L104) |
| <code v-pre>drainPoolGracefully: requires warmed-up state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/pool-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L126) |
| <code v-pre>drainPoolGracefully: deadlineMs must be positive</code> | [packages/orm/src/semantics/pool-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L129) |
| <code v-pre>exportPoolMetrics: requires draining state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/pool-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L152) |
| <code v-pre>exportPoolMetrics: metrics must be non-negative</code> | [packages/orm/src/semantics/pool-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L155) |
| <code v-pre>createPoolAdvancedSession: minWarmConnections must be positive</code> | [packages/orm/src/semantics/pool-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L49) |
| <code v-pre>runPoolHealthCheck: requires cold / healthy state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/pool-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L69) |
| <code v-pre>runPoolHealthCheck: health check failed</code> | [packages/orm/src/semantics/pool-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L72) |
| <code v-pre>runPoolHealthCheck: latencyMs must be non-negative</code> | [packages/orm/src/semantics/pool-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L75) |
| <code v-pre>markReplicaLagged: session is promoted (terminal), primary was demoted</code> | [packages/orm/src/semantics/replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L122) |
| <code v-pre>markReplicaLagged: unknown replica id $&#123;input.replicaId&#125;</code> | [packages/orm/src/semantics/replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L128) |
| <code v-pre>markReplicaLagged: appliedLsn $&#123;input.appliedLsn&#125; exceeds primaryLsn $&#123;session.primaryLsn&#125;</code> | [packages/orm/src/semantics/replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L131) |
| <code v-pre>startFailover: cannot restart failover in state $&#123;session.state&#125;</code> | [packages/orm/src/semantics/replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L163) |
| <code v-pre>promoteReplica: requires failover-in-progress state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L187) |
| <code v-pre>promoteReplica: unknown replica id $&#123;input.replicaId&#125;</code> | [packages/orm/src/semantics/replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L193) |
| <code v-pre>primaryWrite: failover in progress, primary is unavailable</code> | [packages/orm/src/semantics/replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L92) |
| <code v-pre>primaryWrite: session is promoted (terminal), primary was demoted</code> | [packages/orm/src/semantics/replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L95) |
| <code v-pre>primaryWrite: bytes must be positive</code> | [packages/orm/src/semantics/replication.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L98) |
| <code v-pre>filterTenant: requires policy-installed state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/rls.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L109) |
| <code v-pre>bypassRls: requires an installed policy</code> | [packages/orm/src/semantics/rls.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L138) |
| <code v-pre>installPolicy: policy name required</code> | [packages/orm/src/semantics/rls.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L77) |
| <code v-pre>triggerWalCheckpoint: requires threshold-crossed state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/sqlite-wal.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L113) |
| <code v-pre>mapSharedMemory: requires checkpointed state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/sqlite-wal.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L137) |
| <code v-pre>mapSharedMemory: regionBytes must be positive</code> | [packages/orm/src/semantics/sqlite-wal.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L140) |
| <code v-pre>switchJournalMode: requires rollback-journal state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/sqlite-wal.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L66) |
| <code v-pre>crossWalSizeThreshold: requires wal-enabled state (got $&#123;session.state&#125;)</code> | [packages/orm/src/semantics/sqlite-wal.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L88) |
| <code v-pre>crossWalSizeThreshold: walSizeBytes must exceed thresholdBytes</code> | [packages/orm/src/semantics/sqlite-wal.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L91) |
| <code v-pre>blockNonRepeatableRead: requires repeatable-read or serializable (got $&#123;session.level&#125;)</code> | [packages/orm/src/semantics/txn-isolation.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L112) |
| <code v-pre>blockNonRepeatableRead: dirty read guard must run first</code> | [packages/orm/src/semantics/txn-isolation.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L117) |
| <code v-pre>blockPhantomRead: requires serializable isolation (got $&#123;session.level&#125;)</code> | [packages/orm/src/semantics/txn-isolation.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L143) |
| <code v-pre>blockPhantomRead: non-repeatable read guard must run first</code> | [packages/orm/src/semantics/txn-isolation.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L146) |
| <code v-pre>blockDirtyRead: isolation level has not been set</code> | [packages/orm/src/semantics/txn-isolation.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L87) |
| <code v-pre>blockDirtyRead: read-uncommitted permits dirty reads</code> | [packages/orm/src/semantics/txn-isolation.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L90) |
| <code v-pre>knnSearch: no index built</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L123) |
| <code v-pre>knnSearch: query dim $&#123;input.query.length&#125; != index dim $&#123;session.index.dimensions&#125;</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L126) |
| <code v-pre>knnSearch: k must be positive</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L131) |
| <code v-pre>hybridSearch: no index built</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L160) |
| <code v-pre>hybridSearch: query dim $&#123;input.query.length&#125; != index dim $&#123;session.index.dimensions&#125;</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L163) |
| <code v-pre>hybridSearch: k must be positive</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L168) |
| <code v-pre>hybridSearch: vectorWeight must be in &#91;0, 1&#93;</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L171) |
| <code v-pre>hybridSearch: keyword required</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L174) |
| <code v-pre>computeDistance: vector length mismatch</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L203) |
| <code v-pre>computeDistance: empty vectors</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L206) |
| <code v-pre>buildIndex: dimensions must be positive</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L83) |
| <code v-pre>buildIndex: ivfflat requires positive &#96;lists&#96;</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L87) |
| <code v-pre>buildIndex: hnsw requires positive &#96;m&#96;</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L91) |
| <code v-pre>buildIndex: hnsw requires positive &#96;efConstruction&#96;</code> | [packages/orm/src/semantics/vector-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L94) |
| <code v-pre>@kiwa-lab/orm: failed to start Postgres testcontainer (image=$&#123;image&#125;). Verify the Docker daemon is running (&#92;&#96;docker ps&#92;&#96; should succeed). Original error: $&#123;msg&#125;</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L100) |
| <code v-pre>"@kiwa-lab/orm: live MySQL mode requires '@testcontainers/mysql' + 'mysql2' + 'drizzle-orm/mysql2'. Install with &#96;pnpm add -D @testcontainers/mysql mysql2 drizzle-orm&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L160) |
| <code v-pre>@kiwa-lab/orm: failed to start MySQL testcontainer (image=$&#123;image&#125;). Verify the Docker daemon is running (&#92;&#96;docker ps&#92;&#96; should succeed). Original error: $&#123;msg&#125;</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L172) |
| <code v-pre>@kiwa-lab/orm: could not resolve mysql2/promise createPool export.</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L186) |
| <code v-pre>@kiwa-lab/orm: prisma db push failed (status=$&#123;result.status&#125;). stderr=$&#123;result.stderr ?? ''&#125; stdout=$&#123;result.stdout ?? ''&#125;</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L254) |
| <code v-pre>"@kiwa-lab/orm: live Prisma Postgres mode requires '@testcontainers/postgresql'. Install with &#96;pnpm add -D @testcontainers/postgresql&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L297) |
| <code v-pre>@kiwa-lab/orm: failed to start Postgres testcontainer (image=$&#123;image&#125;). Verify the Docker daemon is running (&#92;&#96;docker ps&#92;&#96; should succeed). Original error: $&#123;msg&#125;</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L309) |
| <code v-pre>@kiwa-lab/orm: prisma db push failed against testcontainers Postgres (status=$&#123;result.status&#125;). Verify the schema.prisma datasource has provider="postgresql" + url = env("$&#123;envName&#125;"). stderr=$&#123;result.stderr ?? ''&#125;</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L332) |
| <code v-pre>"@kiwa-lab/orm: live Prisma MySQL mode requires '@testcontainers/mysql'. Install with &#96;pnpm add -D @testcontainers/mysql&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L372) |
| <code v-pre>@kiwa-lab/orm: failed to start MySQL testcontainer (image=$&#123;image&#125;). Verify the Docker daemon is running (&#92;&#96;docker ps&#92;&#96; should succeed). Original error: $&#123;msg&#125;</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L384) |
| <code v-pre>@kiwa-lab/orm: prisma db push failed against testcontainers MySQL (status=$&#123;result.status&#125;). Verify the schema.prisma datasource has provider="mysql" + url = env("$&#123;envName&#125;"). stderr=$&#123;result.stderr ?? ''&#125;</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L407) |
| <code v-pre>@kiwa-lab/orm v0.7: kysely FileMigrationProvider is not exposed by the installed kysely build. Ensure kysely &gt;= 0.27 is installed.</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L455) |
| <code v-pre>@kiwa-lab/orm v0.7: kysely Migrator.migrateToLatest failed (folder=$&#123;folder&#125;, failed=&#91;$&#123;failed.join(', ')&#125;&#93;). Original error: $&#123;error instanceof Error ? error.message : String(error)&#125;</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L471) |
| <code v-pre>"@kiwa-lab/orm: live Kysely (Postgres) mode requires '@testcontainers/postgresql' + 'pg' + 'kysely'. Install with &#96;pnpm add -D @testcontainers/postgresql pg kysely&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L523) |
| <code v-pre>@kiwa-lab/orm: failed to start Postgres testcontainer (image=$&#123;image&#125;). Verify the Docker daemon is running (&#92;&#96;docker ps&#92;&#96; should succeed). Original error: $&#123;msg&#125;</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L535) |
| <code v-pre>"@kiwa-lab/orm: live Kysely (MySQL) mode requires '@testcontainers/mysql' + 'mysql2' + 'kysely'. Install with &#96;pnpm add -D @testcontainers/mysql mysql2 kysely&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L590) |
| <code v-pre>@kiwa-lab/orm: failed to start MySQL testcontainer (image=$&#123;image&#125;). Verify the Docker daemon is running. Original error: $&#123;msg&#125;</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L602) |
| <code v-pre>@kiwa-lab/orm: could not resolve mysql2/promise createPool export.</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L614) |
| <code v-pre>@kiwa-lab/orm v0.7: prisma adapter supports mode='mock'+dialect='sqlite', mode='live'+dialect='postgres', and mode='live'+dialect='mysql' (received mode='$&#123;(opts as &#123; mode: string &#125;).mode&#125;' / dialect='$&#123;(opts as &#123; dialect: string &#125;).dialect&#125;').</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L740) |
| <code v-pre>@kiwa-lab/orm v0.7: kysely adapter only supports mock+sqlite / live+postgres / live+mysql (received mode='$&#123;(opts as &#123; mode: string &#125;).mode&#125;' / dialect='$&#123;(opts as &#123; dialect: string &#125;).dialect&#125;').</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L754) |
| <code v-pre>@kiwa-lab/orm v0.7 only supports orm='drizzle' / 'prisma' / 'kysely' (received '$&#123;(opts as &#123; orm: string &#125;).orm&#125;').</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L759) |
| <code v-pre>@kiwa-lab/orm v0.7: unsupported combination mode='$&#123;(opts as &#123; mode: string &#125;).mode&#125;' / orm='$&#123;(opts as &#123; orm: string &#125;).orm&#125;' / dialect='$&#123;(opts as &#123; dialect: string &#125;).dialect&#125;'. See README for the supported matrix.</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L772) |
| <code v-pre>"@kiwa-lab/orm: live mode requires '@testcontainers/postgresql' + 'postgres' + 'drizzle-orm/postgres-js'. Install with &#96;pnpm add -D @testcontainers/postgresql postgres drizzle-orm&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/orm/src/setup-orm-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L88) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [expectations.ts](./api/expectations) | 2 | 1 |
| [index.ts](./api/index) | 1 | 0 |
| [semantics/binlog.ts](./api/semantics__binlog) | 5 | 3 |
| [semantics/cdc.ts](./api/semantics__cdc) | 5 | 4 |
| [semantics/connection-pool.ts](./api/semantics__connection-pool) | 5 | 3 |
| [semantics/fidelity.ts](./api/semantics__fidelity) | 2 | 2 |
| [semantics/fts5.ts](./api/semantics__fts5) | 5 | 3 |
| [semantics/logical-replication.ts](./api/semantics__logical-replication) | 5 | 3 |
| [semantics/logical-replication-advanced.ts](./api/semantics__logical-replication-advanced) | 5 | 2 |
| [semantics/mvcc.ts](./api/semantics__mvcc) | 5 | 3 |
| [semantics/mvcc-advanced.ts](./api/semantics__mvcc-advanced) | 5 | 2 |
| [semantics/mysql-cluster.ts](./api/semantics__mysql-cluster) | 5 | 2 |
| [semantics/partitioning.ts](./api/semantics__partitioning) | 5 | 4 |
| [semantics/pool-advanced.ts](./api/semantics__pool-advanced) | 5 | 2 |
| [semantics/replication.ts](./api/semantics__replication) | 5 | 3 |
| [semantics/rls.ts](./api/semantics__rls) | 5 | 4 |
| [semantics/sqlite-wal.ts](./api/semantics__sqlite-wal) | 5 | 2 |
| [semantics/transaction-orchestrator.ts](./api/semantics__transaction-orchestrator) | 2 | 4 |
| [semantics/txn-isolation.ts](./api/semantics__txn-isolation) | 5 | 3 |
| [semantics/types.ts](./api/semantics__types) | 1 | 5 |
| [semantics/vector-store.ts](./api/semantics__vector-store) | 5 | 5 |
| [setup-orm-env.ts](./api/setup-orm-env) | 1 | 0 |
| [types.ts](./api/types) | 0 | 29 |

<!-- kiwa-public-api:end -->
