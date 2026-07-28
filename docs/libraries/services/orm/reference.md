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

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>abortSerializable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L103) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

Abort a serializable transaction due to serialization failure. Requires isolation === 'serializable'; a serialization abort at a lower isolation level is a bug. Emits `mvcc.serializable-aborted`.

```ts
export declare function abortSerializable(session: MvccSession, input: {
    reason: string;
}): AxisStep<MvccState>;
```

#### <code v-pre>acquire</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L84) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

Acquire a connection. If the pool is at capacity, throws — call {@link waitInQueue} first when saturation is expected. Emits `pool.acquired` and moves the session into 'in-use' (or 'saturated' when the acquisition tips the pool over the cap). Rejects when the session is in a terminal outcome (`cancelled` from `statementTimeout` or `evicted` from `idleTimeout`) — silently reviving a cancelled / evicted session masks the prior fault and breaks the telemetry invariant that a terminal pool session stays terminal.

```ts
export declare function acquire(session: PoolSession, input: {
    clientId: string;
    at: number;
}): AxisStep<PoolState>;
```

#### <code v-pre>advanceBinlogPosition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L60) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export declare function advanceBinlogPosition(session: BinlogSession, input: {
    file: string;
    position: number;
}): AxisStep<BinlogState>;
```

#### <code v-pre>appendOutbox</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L101) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

Append the last decoded event (or an explicitly supplied one) to the Debezium-style outbox table. Emits `cdc.outbox-appended`. Requires the session to be 'decoding', 'buffered', or 'ordered' — an idle session or a session already 'delivered' cannot append silently, so the JSDoc-declared precondition is enforced at runtime to prevent silent state regression (e.g. `delivered → buffered`).

```ts
export declare function appendOutbox(session: CdcSession, input: {
    event?: CdcEvent;
}): AxisStep<CdcState>;
```

#### <code v-pre>applyHotUpdate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L127) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

```ts
export declare function applyHotUpdate(session: MvccAdvancedSession, input: {
    oldTupleId: string;
    newTupleId: string;
    chainLength: number;
}): AxisStep<MvccAdvancedState>;
```

#### <code v-pre>AXIS&#95;TO&#95;EVENTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fidelity.ts#L36) <code v-pre>packages/orm/src/semantics/fidelity.ts</code>

Static axis → neutral event lookup. Kept as a `Record&lt;OrmAxis, NeutralEventName[]&gt;` so the compiler enforces that every axis is present and every neutral event is spelled correctly.

```ts
export declare const AXIS_TO_EVENTS: Record<OrmAxis, NeutralEventName[]>;
```

#### <code v-pre>backendEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts#L362) <code v-pre>packages/orm/src/semantics/types.ts</code>

Translate a neutral event name to the backend dialect. Optional provider argument applies a per-ORM overlay on top of the backend dialect (used for Prisma). Falls back to the neutral name if the backend has no specific dialect entry — this makes the map partial-safe without silent typos.

```ts
export declare function backendEventName(backend: OrmBackend, neutral: NeutralEventName, provider?: OrmProvider): string;
```

#### <code v-pre>blockDirtyRead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L82) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export declare function blockDirtyRead(session: TxnIsolationSession, input: {
    readerTxnId: string;
}): AxisStep<TxnIsolationState>;
```

#### <code v-pre>blockNonRepeatableRead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L107) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export declare function blockNonRepeatableRead(session: TxnIsolationSession, input: {
    rowKey: string;
}): AxisStep<TxnIsolationState>;
```

#### <code v-pre>blockPhantom</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L136) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

Signal that a phantom read was blocked by predicate / gap locks. Requires isolation at least 'repeatable-read'; read-committed does not prevent phantoms so blocking one at that level is a bug. Emits `mvcc.phantom-blocked`.

```ts
export declare function blockPhantom(session: MvccSession, input: {
    predicate: string;
    blockingTxn: string;
}): AxisStep<MvccState>;
```

#### <code v-pre>blockPhantomRead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L138) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export declare function blockPhantomRead(session: TxnIsolationSession, input: {
    predicate: string;
}): AxisStep<TxnIsolationState>;
```

#### <code v-pre>buildIndex</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L78) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

Build an ANN index. IVFFlat requires `lists`; HNSW requires `m` + `efConstruction`. Emits `vector.indexed`.

```ts
export declare function buildIndex(session: VectorStoreSession, input: VectorIndex): AxisStep<VectorState>;
```

#### <code v-pre>bypassRls</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L133) <code v-pre>packages/orm/src/semantics/rls.ts</code>

Simulate a `bypass_rls` role usage. Requires a policy to be installed — a bypass without a policy is a bug. Marks the session 'bypassed' and emits `rls.bypass-used`. Subsequent `filterTenant` calls will throw until the caller re-installs / re-arms the policy.

```ts
export declare function bypassRls(session: RlsSession, input: {
    roleId: string;
    reason: string;
}): AxisStep<RlsState>;
```

#### <code v-pre>checkTupleVisibility</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L65) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

```ts
export declare function checkTupleVisibility(session: MvccAdvancedSession, input: {
    tupleId: string;
    xmin: number;
    xmax?: number;
    snapshotXmin: number;
}): AxisStep<MvccAdvancedState>;
```

#### <code v-pre>collectFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fidelity.ts#L143) <code v-pre>packages/orm/src/semantics/fidelity.ts</code>

Collect the provider × backend × axis coverage grid. Callers pass the providers + backends to inspect — usually all 3 × 3. The output row count is `providers.length * backends.length * axes.length` (144 for the default 3 × 3 × 16 grid) plus roll-up lists so callers can assert on grid dimensions.

```ts
export declare function collectFidelityCoverage(input: {
    providers: OrmProvider[];
    backends: OrmBackend[];
}): FidelityCoverage;
```

#### <code v-pre>computeDistance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L198) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

Compute the raw distance between two vectors using the session's distance kind. Deterministic, side-effect free. Emits `vector.distance-computed` for telemetry and returns the distance in metadata.

```ts
export declare function computeDistance(session: VectorStoreSession, input: {
    a: number[];
    b: number[];
}): AxisStep<VectorState>;
```

#### <code v-pre>confirmDelivery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L173) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

Confirm at-least-once delivery up to a given LSN. Requires prior `markEventOrdered` so that ordering is asserted before ack. Emits `cdc.at-least-once-delivered` and advances `confirmedLsn`. Rejects when `upToLsn` exceeds the outbox high-water mark (the max LSN currently in the outbox) — acknowledging events that were never appended silently corrupts the delivery invariant.

```ts
export declare function confirmDelivery(session: CdcSession, input: {
    upToLsn: number;
}): AxisStep<CdcState>;
```

#### <code v-pre>confirmTwoSafeCommit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L128) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

```ts
export declare function confirmTwoSafeCommit(session: LogicalReplicationAdvancedSession, input: {
    confirmedFlushLsn: number;
    synchronousStandbys: number;
}): AxisStep<LogicalReplicationAdvancedState>;
```

#### <code v-pre>createBinlogSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L42) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export declare function createBinlogSession(input: {
    serverId: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): BinlogSession;
```

#### <code v-pre>createCdcSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L48) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

Create a CDC session bound to a logical slot / consumer id. State starts at 'idle' with an empty decoded / outbox buffer.

```ts
export declare function createCdcSession(input: {
    slotName: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): CdcSession;
```

#### <code v-pre>createFts5Session</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L42) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export declare function createFts5Session(input: {
    tableName: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): Fts5Session;
```

#### <code v-pre>createFts5VirtualTable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L60) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export declare function createFts5VirtualTable(session: Fts5Session, input: {
    columns: string[];
    tokenizer: Fts5Tokenizer;
}): AxisStep<Fts5State>;
```

#### <code v-pre>createLogicalReplicationAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L44) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

```ts
export declare function createLogicalReplicationAdvancedSession(input: {
    streamId: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): LogicalReplicationAdvancedSession;
```

#### <code v-pre>createLogicalRepSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L49) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

Create a logical replication session bound to a publisher id. State starts at 'unpublished' with no publication and no subscribers.

```ts
export declare function createLogicalRepSession(input: {
    publisherId: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): LogicalRepSession;
```

#### <code v-pre>createMvccAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L43) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

```ts
export declare function createMvccAdvancedSession(input: {
    tableName: string;
    provider: OrmProvider;
    backend: OrmBackend;
    currentXid: number;
}): MvccAdvancedSession;
```

#### <code v-pre>createMvccSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L47) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

Create an MVCC transaction session. State starts at 'active' with the requested isolation level and no snapshot taken.

```ts
export declare function createMvccSession(input: {
    txnId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    isolation: IsolationLevel;
}): MvccSession;
```

#### <code v-pre>createMysqlClusterSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L43) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

```ts
export declare function createMysqlClusterSession(input: {
    groupName: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): MysqlClusterSession;
```

#### <code v-pre>createPartitioningSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L50) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

Create a partitioning session bound to a table. State starts at 'undeclared' and no buckets exist.

```ts
export declare function createPartitioningSession(input: {
    tableId: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): PartitioningSession;
```

#### <code v-pre>createPoolAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L42) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

```ts
export declare function createPoolAdvancedSession(input: {
    poolId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    minWarmConnections: number;
}): PoolAdvancedSession;
```

#### <code v-pre>createPoolSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L48) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

Create a pool session with a cap on connections and per-connection idle / statement timeouts (both in milliseconds). State starts at 'idle'.

```ts
export declare function createPoolSession(input: {
    poolId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    maxConnections: number;
    idleTimeoutMs: number;
    statementTimeoutMs: number;
}): PoolSession;
```

#### <code v-pre>createPublication</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L77) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

Create a publication over one or more tables. Moves the session into 'published'. Emits `logical.publication-created`. Rejects when the session already has a live subscription (`synced` / `conflict-resolved`) — overwriting the publication under a live topology silently orphans subscribers from the new publication and corrupts the replication invariant. Callers must drop subscribers first or start a new session.

```ts
export declare function createPublication(session: LogicalRepSession, input: {
    name: string;
    tables: string[];
}): AxisStep<LogicalRepState>;
```

#### <code v-pre>createReplicationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L56) <code v-pre>packages/orm/src/semantics/replication.ts</code>

Create a replication session with a primary and initial set of replicas. State starts at 'streaming' and primary LSN starts at 0. Emits `replication.primary-write` for the initial "snapshot" so history is non-empty on inspection.

```ts
export declare function createReplicationSession(input: {
    primaryId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    replicaIds: string[];
}): ReplicationSession;
```

#### <code v-pre>createRlsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L52) <code v-pre>packages/orm/src/semantics/rls.ts</code>

Create an RLS session bound to a table. State starts at 'no-policy'; the caller must call `installPolicy` before any filter / bypass step.

```ts
export declare function createRlsSession(input: {
    tableId: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): RlsSession;
```

#### <code v-pre>createSqliteWalSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L43) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

```ts
export declare function createSqliteWalSession(input: {
    databasePath: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): SqliteWalSession;
```

#### <code v-pre>createTxnIsolationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L47) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export declare function createTxnIsolationSession(input: {
    txnId: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): TxnIsolationSession;
```

#### <code v-pre>createVectorStoreSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L56) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

Create a vector store session. State starts at 'unindexed' with no index. Caller picks the distance kind (cosine / L2 / inner product).

```ts
export declare function createVectorStoreSession(input: {
    storeId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    distanceKind: VectorDistanceKind;
}): VectorStoreSession;
```

#### <code v-pre>crossWalSizeThreshold</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L83) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

```ts
export declare function crossWalSizeThreshold(session: SqliteWalSession, input: {
    walSizeBytes: number;
    thresholdBytes: number;
}): AxisStep<SqliteWalState>;
```

#### <code v-pre>declarePartition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L71) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

Declare a new partition bucket. Range partitions require low + high; list partitions require `values`; hash partitions require `modulus` + `remainder`. Emits `partition.declared`.

```ts
export declare function declarePartition(session: PartitioningSession, input: PartitionBucket): AxisStep<PartitionState>;
```

#### <code v-pre>decodeEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L70) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

Decode a single change log entry into a neutral CDC event. Appends to the decoded buffer and moves the session into 'decoding'. Emits `cdc.decoded`.

```ts
export declare function decodeEvent(session: CdcSession, input: {
    event: CdcEvent;
}): AxisStep<CdcState>;
```

#### <code v-pre>detectClusterConflict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L115) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

```ts
export declare function detectClusterConflict(session: MysqlClusterSession, input: {
    transactionId: string;
    winnerMemberId: string;
}): AxisStep<MysqlClusterState>;
```

#### <code v-pre>detectDeadlock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L177) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

Detect a deadlock involving this txn. Emits `mvcc.deadlock-detected` and moves the txn into 'deadlocked'. The caller supplies the deadlock cycle (an array of participating txn ids) so telemetry can identify the ring. Rejects when the txn is already in a terminal outcome (`aborted` / `deadlocked`) — overwriting the terminal state with `deadlocked` erases the true termination cause (e.g. `aborted → deadlocked`) and breaks the post-mortem invariant that a txn ends exactly once.

```ts
export declare function detectDeadlock(session: MvccSession, input: {
    cycle: string[];
}): AxisStep<MvccState>;
```

#### <code v-pre>detectGtidGap</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L139) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export declare function detectGtidGap(session: BinlogSession, input: {
    expectedGtid: string;
}): AxisStep<BinlogState>;
```

#### <code v-pre>detectXidWraparound</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L162) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

```ts
export declare function detectXidWraparound(session: MvccAdvancedSession, input: {
    freezeXid: number;
    warningAge: number;
}): AxisStep<MvccAdvancedState>;
```

#### <code v-pre>dispatchTransactionEvent</code>

公開 entry point から解決しています。

<code v-pre>dispatchEvent</code> を <code v-pre>dispatchTransactionEvent</code> として公開しています。

```ts
export {
  startTransaction,
  dispatchEvent as dispatchTransactionEvent,
  summarizeTransaction,
} from './transaction-orchestrator.js';
```

#### <code v-pre>drainPoolGracefully</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L121) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

```ts
export declare function drainPoolGracefully(session: PoolAdvancedSession, input: {
    deadlineMs: number;
}): AxisStep<PoolAdvancedState>;
```

#### <code v-pre>electClusterPrimary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L89) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

```ts
export declare function electClusterPrimary(session: MysqlClusterSession, input: {
    memberId: string;
    mode: 'single-primary' | 'multi-primary';
}): AxisStep<MysqlClusterState>;
```

#### <code v-pre>expectQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/expectations.ts#L25) <code v-pre>packages/orm/src/expectations.ts</code>

Run a raw SQL query against the underlying driver and assert that the returned rows deeply equal `expected`. SQLite mock uses better-sqlite3's synchronous `prepare(...).all()`; Postgres live uses postgres.js's tagged template via `sql.unsafe(...)`.

```ts
export declare function expectQuery<TRow = unknown>(env: OrmTestEnv, sql: string, expected: ReadonlyArray<TRow>, expect: MinimalExpect): Promise<void>;
```

#### <code v-pre>expectRowCount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/expectations.ts#L76) <code v-pre>packages/orm/src/expectations.ts</code>

Assert that the row count of `table` equals `expected`.

```ts
export declare function expectRowCount(env: OrmTestEnv, table: string, expected: number, expect: MinimalExpect): Promise<void>;
```

#### <code v-pre>exportPoolMetrics</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L147) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

```ts
export declare function exportPoolMetrics(session: PoolAdvancedSession, input: {
    active: number;
    idle: number;
    waiting: number;
}): AxisStep<PoolAdvancedState>;
```

#### <code v-pre>filterTenant</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L104) <code v-pre>packages/orm/src/semantics/rls.ts</code>

Simulate a per-tenant filter application on a query. Requires a policy to be installed and the session to be 'policy-installed' (not bypassed). Emits `rls.tenant-isolated`. Metadata carries the tenant id and the operation kind.

```ts
export declare function filterTenant(session: RlsSession, input: {
    tenantId: string;
    operation: 'read' | 'write';
}): AxisStep<RlsState>;
```

#### <code v-pre>heartbeat</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L190) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

Send a heartbeat from publisher to subscribers. Does not change state (heartbeat is passive), but bumps `lastHeartbeatAt`. Emits `logical.heartbeat`.

```ts
export declare function heartbeat(session: LogicalRepSession, input: {
    at: number;
}): AxisStep<LogicalRepState>;
```

#### <code v-pre>hybridSearch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L155) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

Run a hybrid search — combine vector similarity + a keyword / full-text score with a weight in [0, 1]. Requires an index. Emits `vector.hybrid-searched`.

```ts
export declare function hybridSearch(session: VectorStoreSession, input: {
    query: number[];
    k: number;
    keyword: string;
    vectorWeight: number;
}): AxisStep<VectorState>;
```

#### <code v-pre>idleTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L153) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

Evict a connection whose idle time exceeds `idleTimeoutMs`. Requires the connection to be idle for at least that long — a premature eviction is a bug. Emits `pool.idle-timeout` and returns the pool to 'idle' when it was the last active handle.

```ts
export declare function idleTimeout(session: PoolSession, input: {
    clientId: string;
    at: number;
}): AxisStep<PoolState>;
```

#### <code v-pre>inspectFts5Vocab</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L141) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export declare function inspectFts5Vocab(session: Fts5Session, input: {
    term: string;
    occurrences: number;
}): AxisStep<Fts5State>;
```

#### <code v-pre>installPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L72) <code v-pre>packages/orm/src/semantics/rls.ts</code>

Install a policy over a table. Requires an unused tenant column name. Emits `rls.policy-installed`.

```ts
export declare function installPolicy(session: RlsSession, input: {
    name: string;
    tenantColumn: string;
}): AxisStep<RlsState>;
```

#### <code v-pre>joinClusterMember</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L60) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

```ts
export declare function joinClusterMember(session: MysqlClusterSession, input: {
    memberId: string;
    weight: number;
}): AxisStep<MysqlClusterState>;
```

#### <code v-pre>knnSearch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L118) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

Run a k-NN search over the built index. Requires an index and a query whose dimension matches the index. Emits `vector.knn-searched` and bumps `searchCount`.

```ts
export declare function knnSearch(session: VectorStoreSession, input: {
    query: number[];
    k: number;
}): AxisStep<VectorState>;
```

#### <code v-pre>leaveClusterMember</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L144) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

```ts
export declare function leaveClusterMember(session: MysqlClusterSession, input: {
    memberId: string;
}): AxisStep<MysqlClusterState>;
```

#### <code v-pre>logAudit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L156) <code v-pre>packages/orm/src/semantics/rls.ts</code>

Append an audit log entry. Audit is passive; it does not change state. Records the tenant, operation, whether the operation was allowed, and a reason string. Emits `rls.audit-logged`.

```ts
export declare function logAudit(session: RlsSession, input: RlsAuditEntry): AxisStep<RlsState>;
```

#### <code v-pre>mapSharedMemory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L132) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

```ts
export declare function mapSharedMemory(session: SqliteWalSession, input: {
    regionBytes: number;
}): AxisStep<SqliteWalState>;
```

#### <code v-pre>markEventOrdered</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L140) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

Assert strict LSN ordering on the outbox. Walks the outbox and rejects if an event has a smaller LSN than a predecessor. Emits `cdc.event-ordered`. The check is deterministic and idempotent — repeated calls after further appends stay valid as long as ordering holds.

```ts
export declare function markEventOrdered(session: CdcSession): AxisStep<CdcState>;
```

#### <code v-pre>markReplicaLagged</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L117) <code v-pre>packages/orm/src/semantics/replication.ts</code>

Mark a specific replica as lagged. Sets the session state to 'lagged' if any replica has non-zero lag. Emits `replication.replica-lagged`. Throws if the replica id is unknown so silent typos are impossible.

```ts
export declare function markReplicaLagged(session: ReplicationSession, input: {
    replicaId: string;
    appliedLsn: number;
}): AxisStep<ReplicationState>;
```

#### <code v-pre>matchFts5Query</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L113) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export declare function matchFts5Query(session: Fts5Session, input: {
    query: string;
    rank: number;
}): AxisStep<Fts5State>;
```

#### <code v-pre>measureBloat</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L96) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

```ts
export declare function measureBloat(session: MvccAdvancedSession, input: {
    liveTuples: number;
    deadTuples: number;
}): AxisStep<MvccAdvancedState>;
```

#### <code v-pre>negotiateBinlogFormat</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L117) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export declare function negotiateBinlogFormat(session: BinlogSession, input: {
    format: BinlogFormat;
}): AxisStep<BinlogState>;
```

#### <code v-pre>partitionWiseJoin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L164) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

Signal that a partition-wise join was planned between this table and another partitioned table on the same key. Requires both sides to have matching partition counts (Postgres constraint). Emits `partition.wise-joined`. Rejects when `matchedBuckets` is strictly less than the declared bucket count — Postgres partition-wise join requires **all** buckets on both sides to match (a partial match falls back to a global join plan and is not partition-wise). Permitting partial matches silently mislabels a non-partition-wise plan as `joined`.

```ts
export declare function partitionWiseJoin(session: PartitioningSession, input: {
    otherTable: string;
    matchedBuckets: number;
}): AxisStep<PartitionState>;
```

#### <code v-pre>primaryWrite</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L87) <code v-pre>packages/orm/src/semantics/replication.ts</code>

Record a primary write. Bumps primary LSN by `bytes` and marks the session 'streaming' unless it is currently in a failover flow. Emits `replication.primary-write`. Rejects when the session has been promoted — the old primary is terminal after `promoteReplica` and cannot resume writes. Regressing a terminal `promoted` state to `streaming` corrupts the failover invariant.

```ts
export declare function primaryWrite(session: ReplicationSession, input: {
    bytes: number;
}): AxisStep<ReplicationState>;
```

#### <code v-pre>promoteReplica</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L182) <code v-pre>packages/orm/src/semantics/replication.ts</code>

Promote a specific replica to primary. Requires the session to be 'failover-in-progress' (a promotion outside a failover flow is a bug). Overwrites the session `primaryId` with the promoted replica id and drops that replica from the `replicas` map. Emits `replication.promoted`.

```ts
export declare function promoteReplica(session: ReplicationSession, input: {
    replicaId: string;
}): AxisStep<ReplicationState>;
```

#### <code v-pre>prunePartitions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L123) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

Prune partitions that cannot match a predicate. `keptCount` must be smaller than or equal to the current bucket count. Emits `partition.pruned`.

```ts
export declare function prunePartitions(session: PartitioningSession, input: {
    predicate: string;
    keptCount: number;
}): AxisStep<PartitionState>;
```

#### <code v-pre>resolveConflict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L143) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

Resolve a divergent write conflict between publisher and subscriber. The caller picks the strategy; the mock records the winner + strategy in metadata. Requires the session to be 'synced' first (a conflict without a synced subscriber is a bug). Emits `logical.conflict-resolved`.

```ts
export declare function resolveConflict(session: LogicalRepSession, input: {
    subscriberId: string;
    strategy: ConflictStrategy;
    winner: 'publisher' | 'subscriber';
}): AxisStep<LogicalRepState>;
```

#### <code v-pre>routeInsert</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L205) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

Route a single row insert to a specific partition. Deterministic on the partition strategy: range picks the bucket whose bounds enclose the key, list picks the bucket whose values include the key, hash uses key % modulus === remainder. Emits `partition.route-selected` and returns the chosen bucket name in metadata.

```ts
export declare function routeInsert(session: PartitioningSession, input: {
    key: number | string;
}): AxisStep<PartitionState>;
```

#### <code v-pre>runPoolHealthCheck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L64) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

```ts
export declare function runPoolHealthCheck(session: PoolAdvancedSession, input: {
    latencyMs: number;
    ok: boolean;
}): AxisStep<PoolAdvancedState>;
```

#### <code v-pre>setTxnIsolationLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L63) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export declare function setTxnIsolationLevel(session: TxnIsolationSession, input: {
    level: TxnIsolationLevel;
}): AxisStep<TxnIsolationState>;
```

#### <code v-pre>setupOrmEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L682) <code v-pre>packages/orm/src/setup-orm-env.ts</code>

```ts
export declare function setupOrmEnv<TSchema extends DrizzleSchema = DrizzleSchema>(opts: MockSqliteOptions<TSchema>): Promise<OrmTestEnvMockT<TSchema>>;
export declare function setupOrmEnv<TSchema extends DrizzleSchema = DrizzleSchema>(opts: LivePostgresOptions<TSchema>): Promise<OrmTestEnvLiveT<TSchema>>;
export declare function setupOrmEnv<TSchema extends DrizzleSchema = DrizzleSchema>(opts: LiveMysqlOptions<TSchema>): Promise<OrmTestEnvLiveMysqlT<TSchema>>;
export declare function setupOrmEnv<TClient>(opts: MockPrismaSqliteOptions<TClient>): Promise<OrmTestEnvMockPrismaT<TClient>>;
export declare function setupOrmEnv<TClient>(opts: LivePrismaPostgresOptions<TClient>): Promise<import('./types.js').OrmTestEnvLivePrismaPostgres<TClient>>;
export declare function setupOrmEnv<TClient>(opts: LivePrismaMysqlOptions<TClient>): Promise<import('./types.js').OrmTestEnvLivePrismaMysql<TClient>>;
export declare function setupOrmEnv<TDatabase extends KyselyDatabase>(opts: MockKyselySqliteOptions<TDatabase>): Promise<OrmTestEnvMockKyselyT<TDatabase>>;
export declare function setupOrmEnv<TDatabase extends KyselyDatabase>(opts: LiveKyselyPostgresOptions<TDatabase>): Promise<OrmTestEnvLiveKyselyPostgresT<TDatabase>>;
export declare function setupOrmEnv<TDatabase extends KyselyDatabase>(opts: LiveKyselyMysqlOptions<TDatabase>): Promise<OrmTestEnvLiveKyselyMysqlT<TDatabase>>;
```

#### <code v-pre>startFailover</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L158) <code v-pre>packages/orm/src/semantics/replication.ts</code>

Start a failover flow. Requires the session to be either 'streaming' or 'lagged'; a failover that is already 'failover-in-progress' or 'promoted' is rejected so re-entry does not silently corrupt state. Emits `replication.failover-started`.

```ts
export declare function startFailover(session: ReplicationSession, input: {
    reason: string;
}): AxisStep<ReplicationState>;
```

#### <code v-pre>startLogicalStreaming</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L62) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

```ts
export declare function startLogicalStreaming(session: LogicalReplicationAdvancedSession, input: {
    startLsn: number;
    protocolVersion: number;
}): AxisStep<LogicalReplicationAdvancedState>;
```

#### <code v-pre>startTransaction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts#L36) <code v-pre>packages/orm/src/semantics/transaction-orchestrator.ts</code>

```ts
export declare function startTransaction(input: {
    timestamp: string;
}): TransactionSession;
```

#### <code v-pre>statementTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L193) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

Cancel a client's statement because it exceeded `statementTimeoutMs`. Requires the client to be currently active. Emits `pool.statement-timeout` and moves the session into 'cancelled'.

```ts
export declare function statementTimeout(session: PoolSession, input: {
    clientId: string;
    elapsedMs: number;
}): AxisStep<PoolState>;
```

#### <code v-pre>summarizeTransaction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts#L152) <code v-pre>packages/orm/src/semantics/transaction-orchestrator.ts</code>

```ts
export declare function summarizeTransaction(session: TransactionSession): TransactionSummary;
```

#### <code v-pre>switchJournalMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L61) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

```ts
export declare function switchJournalMode(session: SqliteWalSession, input: {
    mode: 'WAL';
}): AxisStep<SqliteWalState>;
```

#### <code v-pre>syncCascadedSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L160) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

```ts
export declare function syncCascadedSubscription(session: LogicalReplicationAdvancedSession, input: {
    upstreamId: string;
    subscriberId: string;
}): AxisStep<LogicalReplicationAdvancedState>;
```

#### <code v-pre>syncSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L110) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

Bootstrap a subscription — mark a subscriber as synced with the publisher. Requires a publication to exist; a subscription without a publication is rejected. Emits `logical.subscription-synced`.

```ts
export declare function syncSubscription(session: LogicalRepSession, input: {
    subscriberId: string;
}): AxisStep<LogicalRepState>;
```

#### <code v-pre>takeSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L73) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

Take a snapshot. Requires the txn to be 'active' or already 'snapshot-held' (re-taking a snapshot at a new LSN is legal). Emits `mvcc.snapshot-taken`. Rejects when the txn is blocked on a phantom read (`phantom-blocked`) — silently promoting a blocked txn to `snapshot-held` corrupts the predicate lock invariant and would masquerade as isolation.

```ts
export declare function takeSnapshot(session: MvccSession, input: {
    snapshotId: number;
}): AxisStep<MvccState>;
```

#### <code v-pre>tokenizeFts5Document</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L87) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export declare function tokenizeFts5Document(session: Fts5Session, input: {
    document: string;
}): AxisStep<Fts5State>;
```

#### <code v-pre>trackReplicationOrigin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L95) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

```ts
export declare function trackReplicationOrigin(session: LogicalReplicationAdvancedSession, input: {
    originId: string;
    remoteLsn: number;
}): AxisStep<LogicalReplicationAdvancedState>;
```

#### <code v-pre>triggerWalCheckpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L108) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

```ts
export declare function triggerWalCheckpoint(session: SqliteWalSession, input: {
    mode: 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE';
}): AxisStep<SqliteWalState>;
```

#### <code v-pre>updateGtidSet</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L89) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export declare function updateGtidSet(session: BinlogSession, input: {
    gtid: string;
}): AxisStep<BinlogState>;
```

#### <code v-pre>waitInQueue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L123) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

Enqueue a client that could not acquire (because the pool was saturated). Moves the session into 'saturated' and emits `pool.wait-queued`.

```ts
export declare function waitInQueue(session: PoolSession, input: {
    clientId: string;
}): AxisStep<PoolState>;
```

#### <code v-pre>warmPoolConnections</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L96) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

```ts
export declare function warmPoolConnections(session: PoolAdvancedSession, input: {
    connectionCount: number;
}): AxisStep<PoolAdvancedState>;
```

### 型

#### <code v-pre>AxisStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts#L380) <code v-pre>packages/orm/src/semantics/types.ts</code>

Axis result envelope returned by every state-machine step. ORM semantics are pure helpers (no adapters); the envelope surfaces the next state transition metadata so tests can drive the next call without re-reading runtime-specific telemetry.

```ts
export interface AxisStep<TState> {
    neutralEvent: NeutralEventName;
    backendEvent: string;
    state: TState;
    provider: OrmProvider;
    backend: OrmBackend;
    metadata: Record<string, string | number | boolean>;
}
```

#### <code v-pre>BinlogFormat</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L23) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export type BinlogFormat = 'ROW' | 'STATEMENT' | 'MIXED';
```

#### <code v-pre>BinlogSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L25) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

```ts
export interface BinlogSession {
    serverId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: BinlogState;
    file: string;
    position: number;
    format: BinlogFormat | null;
    gtidSet: Set<string>;
    history: AxisStep<BinlogState>[];
}
```

#### <code v-pre>BinlogState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/binlog.ts#L16) <code v-pre>packages/orm/src/semantics/binlog.ts</code>

Binlog — MySQL binary log position tracking, GTID set maintenance, binlog_format negotiation, and GTID gap detection. MySQL maps to real binlog / GTID telemetry; Postgres approximates with WAL LSN concepts; SQLite falls back to WAL / changeset names. State transitions: created → 'idle' advanceBinlogPosition → 'positioned' updateGtidSet → 'gtid-updated' negotiateBinlogFormat → 'format-negotiated' detectGtidGap → 'gap-detected'

```ts
export type BinlogState = 'idle' | 'positioned' | 'gtid-updated' | 'format-negotiated' | 'gap-detected';
```

#### <code v-pre>CdcEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L21) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

```ts
export interface CdcEvent {
    lsn: number;
    kind: CdcEventKind;
    table: string;
    payload: Record<string, string | number | boolean>;
}
```

#### <code v-pre>CdcEventKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L19) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

```ts
export type CdcEventKind = 'insert' | 'update' | 'delete';
```

#### <code v-pre>CdcSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L28) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

```ts
export interface CdcSession {
    slotName: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: CdcState;
    decoded: CdcEvent[];
    outbox: CdcEvent[];
    confirmedLsn: number;
    history: AxisStep<CdcState>[];
}
```

#### <code v-pre>CdcState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/cdc.ts#L17) <code v-pre>packages/orm/src/semantics/cdc.ts</code>

Change data capture (CDC) — decode a backend-specific change log into neutral events, append to a Debezium-style outbox table, keep events in strict LSN order, and confirm at-least-once delivery. Postgres uses logical decoding (wal2json), MySQL uses Debezium against the binlog, SQLite has no server-side CDC so the mock falls back to neutral names. State transitions: created → 'idle' decodeEvent → 'decoding' appendOutbox → 'buffered' markEventOrdered → 'ordered' confirmDelivery → 'delivered'

```ts
export type CdcState = 'idle' | 'decoding' | 'buffered' | 'ordered' | 'delivered';
```

#### <code v-pre>ConflictStrategy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L23) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

```ts
export type ConflictStrategy = 'last-write-wins' | 'primary-wins' | 'reject';
```

#### <code v-pre>ConnectionHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L20) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

```ts
export interface ConnectionHandle {
    id: string;
    acquiredAt: number;
    lastActivityAt: number;
}
```

#### <code v-pre>DrizzleMysqlDb</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L56) <code v-pre>packages/orm/src/types.ts</code>

Drizzle client returned by `drizzle(mysql2Pool, { schema, mode: 'default' })`.

```ts
export type DrizzleMysqlDb<TSchema extends DrizzleSchema = DrizzleSchema> = MySql2Database<TSchema>;
```

#### <code v-pre>DrizzlePostgresDb</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L52) <code v-pre>packages/orm/src/types.ts</code>

Drizzle client returned by `drizzle(postgres(uri), { schema })`.

```ts
export type DrizzlePostgresDb<TSchema extends DrizzleSchema = DrizzleSchema> = PostgresJsDatabase<TSchema>;
```

#### <code v-pre>DrizzleSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L45) <code v-pre>packages/orm/src/types.ts</code>

Drizzle schema = the object exported from `schema.ts` (table records).

```ts
export type DrizzleSchema = Record<string, unknown>;
```

#### <code v-pre>DrizzleSqliteDb</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L48) <code v-pre>packages/orm/src/types.ts</code>

Drizzle client returned by `drizzle(better-sqlite3 instance, { schema })`.

```ts
export type DrizzleSqliteDb<TSchema extends DrizzleSchema = DrizzleSchema> = BetterSQLite3Database<TSchema>;
```

#### <code v-pre>FidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fidelity.ts#L24) <code v-pre>packages/orm/src/semantics/fidelity.ts</code>

```ts
export interface FidelityCoverage {
    providers: OrmProvider[];
    backends: OrmBackend[];
    axes: OrmAxis[];
    rows: FidelityRow[];
}
```

#### <code v-pre>FidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fidelity.ts#L16) <code v-pre>packages/orm/src/semantics/fidelity.ts</code>

Fidelity harness — collects the provider × backend × axis coverage grid that downstream release-gate reports on. Not a runner (no side effect emit); pure inspection so tests / release-gate can assert "3 provider × 3 backend × 16 axis = 144 row" grid without walking every neutral event by hand.

```ts
export interface FidelityRow {
    provider: OrmProvider;
    backend: OrmBackend;
    axis: OrmAxis;
    neutralEvents: NeutralEventName[];
    backendEvents: string[];
}
```

#### <code v-pre>Fts5Session</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L25) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export interface Fts5Session {
    tableName: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: Fts5State;
    columns: string[];
    tokenizer: Fts5Tokenizer | null;
    tokenCount: number;
    lastRank: number;
    history: AxisStep<Fts5State>[];
}
```

#### <code v-pre>Fts5State</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L16) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

FTS5 — SQLite virtual-table creation, tokenizer configuration, MATCH ranking, and vocab-table inspection. SQLite maps to FTS5 / fts5vocab; Postgres approximates with tsvector / tsquery; MySQL approximates with FULLTEXT / MATCH AGAINST. State transitions: created → 'empty' createFts5VirtualTable → 'virtual-table-created' tokenizeFts5Document → 'tokenized' matchFts5Query → 'matched' inspectFts5Vocab → 'vocab-inspected'

```ts
export type Fts5State = 'empty' | 'virtual-table-created' | 'tokenized' | 'matched' | 'vocab-inspected';
```

#### <code v-pre>Fts5Tokenizer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L23) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export type Fts5Tokenizer = 'unicode61' | 'porter' | 'trigram';
```

#### <code v-pre>IsolationLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L26) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

```ts
export type IsolationLevel = 'read-committed' | 'repeatable-read' | 'serializable';
```

#### <code v-pre>KyselyDatabase</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L30) <code v-pre>packages/orm/src/types.ts</code>

Phantom-typed `Database` interface for Kysely (caller-supplied). Kysely's own `Database` is an interface with table names → row shape, so we accept any object type here without an index signature requirement.

```ts
export type KyselyDatabase = any;
```

#### <code v-pre>LiveKyselyMysqlOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L327) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface LiveKyselyMysqlOptions<TDatabase extends KyselyDatabase = KyselyDatabase> {
    readonly mode: 'live';
    readonly orm: 'kysely';
    readonly dialect: 'mysql';
    readonly schema: TDatabase;
    readonly migrations?: MigrationSource;
    readonly seed?: (db: import('kysely').Kysely<TDatabase>) => Promise<void> | void;
    readonly containerImage?: string;
}
```

#### <code v-pre>LiveKyselyPostgresOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L317) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface LiveKyselyPostgresOptions<TDatabase extends KyselyDatabase = KyselyDatabase> {
    readonly mode: 'live';
    readonly orm: 'kysely';
    readonly dialect: 'postgres';
    readonly schema: TDatabase;
    readonly migrations?: MigrationSource;
    readonly seed?: (db: import('kysely').Kysely<TDatabase>) => Promise<void> | void;
    readonly containerImage?: string;
}
```

#### <code v-pre>LiveMysqlOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L98) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface LiveMysqlOptions<TSchema extends DrizzleSchema = DrizzleSchema> {
    readonly mode: 'live';
    readonly orm: 'drizzle';
    readonly dialect: 'mysql';
    readonly schema: TSchema;
    readonly migrations?: MigrationSource;
    readonly seed?: (db: DrizzleMysqlDb<TSchema>) => Promise<void> | void;
    /** Optional Docker image override. Default `mysql:8.4`. */
    readonly containerImage?: string;
}
```

#### <code v-pre>LivePostgresOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L87) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface LivePostgresOptions<TSchema extends DrizzleSchema = DrizzleSchema> {
    readonly mode: 'live';
    readonly orm: 'drizzle';
    readonly dialect: 'postgres';
    readonly schema: TSchema;
    readonly migrations?: MigrationSource;
    readonly seed?: (db: DrizzlePostgresDb<TSchema>) => Promise<void> | void;
    /** Optional Docker image override. Default `postgres:16-alpine`. */
    readonly containerImage?: string;
}
```

#### <code v-pre>LivePrismaMysqlOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L148) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface LivePrismaMysqlOptions<TClient = unknown> {
    readonly mode: 'live';
    readonly orm: 'prisma';
    readonly dialect: 'mysql';
    /**
     * The generated `PrismaClient` constructor exported from the caller's
     * `@prisma/client`. Caller's schema.prisma must use `provider = "mysql"`.
     */
    readonly prismaClient: PrismaClientCtor<TClient>;
    /**
     * Path to the schema.prisma file (must have `provider = "mysql"` +
     * `url = env("DATABASE_URL")` style datasource).
     */
    readonly schemaPath: string;
    /**
     * Env var name the schema references. kiwa sets it to the testcontainers
     * MySQL connection URI before invoking `prisma db push`.
     */
    readonly datasourceUrlEnv?: string;
    /**
     * Optional seed callback that receives the live PrismaClient instance.
     */
    readonly seed?: (client: TClient) => Promise<void> | void;
    /**
     * Optional Docker image override. Default `mysql:8.4`.
     */
    readonly containerImage?: string;
}
```

#### <code v-pre>LivePrismaPostgresOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L119) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface LivePrismaPostgresOptions<TClient = unknown> {
    readonly mode: 'live';
    readonly orm: 'prisma';
    readonly dialect: 'postgres';
    /**
     * The generated `PrismaClient` constructor exported from the caller's
     * `@prisma/client`. Caller's schema.prisma must use `provider = "postgresql"`.
     */
    readonly prismaClient: PrismaClientCtor<TClient>;
    /**
     * Path to the schema.prisma file (must have `provider = "postgresql"` +
     * `url = env("DATABASE_URL")` style datasource).
     */
    readonly schemaPath: string;
    /**
     * Env var name the schema references. kiwa sets it to the testcontainers
     * Postgres connection URI before invoking `prisma db push`.
     */
    readonly datasourceUrlEnv?: string;
    /**
     * Optional seed callback that receives the live PrismaClient instance.
     */
    readonly seed?: (client: TClient) => Promise<void> | void;
    /**
     * Optional Docker image override. Default `postgres:16-alpine`.
     */
    readonly containerImage?: string;
}
```

#### <code v-pre>LogicalReplicationAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L24) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

```ts
export interface LogicalReplicationAdvancedSession {
    streamId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: LogicalReplicationAdvancedState;
    startLsn: number;
    originId: string | null;
    confirmedLsn: number;
    cascadedSubscribers: Set<string>;
    history: AxisStep<LogicalReplicationAdvancedState>[];
}
```

#### <code v-pre>LogicalReplicationAdvancedState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L17) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

Logical replication advanced — streaming replication protocol start, replication-origin progress, two-safe confirmation, and cascaded subscription sync. Postgres maps to pgoutput / replication origin / synchronous commit primitives; MySQL approximates with group replication; SQLite falls back to session-style telemetry. State transitions: created → 'idle' startLogicalStreaming → 'streaming' trackReplicationOrigin → 'origin-tracked' confirmTwoSafeCommit → 'two-safe-confirmed' syncCascadedSubscription → 'cascade-synced'

```ts
export type LogicalReplicationAdvancedState = 'idle' | 'streaming' | 'origin-tracked' | 'two-safe-confirmed' | 'cascade-synced';
```

#### <code v-pre>LogicalRepSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L25) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

```ts
export interface LogicalRepSession {
    publisherId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: LogicalRepState;
    publication: {
        name: string;
        tables: string[];
    } | null;
    subscribers: Set<string>;
    syncedSubscribers: Set<string>;
    lastHeartbeatAt: number;
    history: AxisStep<LogicalRepState>[];
}
```

#### <code v-pre>LogicalRepState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L17) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

Logical replication — publication + subscription topology where publisher ships row-level events to subscribers, with initial-sync bootstrap, conflict resolution on divergent writes, and periodic heartbeat. Postgres exposes `pg_publication` / `pg_subscription`; MySQL has group replication with similar semantics but different names; SQLite has no analogue. State transitions: created → 'unpublished' createPublication → 'published' syncSubscription → 'synced' resolveConflict → 'conflict-resolved' heartbeat → (state unchanged, heartbeat is passive)

```ts
export type LogicalRepState = 'unpublished' | 'published' | 'synced' | 'conflict-resolved';
```

#### <code v-pre>MigrationSource</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L73) <code v-pre>packages/orm/src/types.ts</code>

Migration source. - `string` — raw SQL applied as-is (statements split on `;` followed by newline). - `string[]` — explicit array of SQL statements applied sequentially. - `{ folder }` — folder-based migration. - Drizzle (v0.5+) — kiwa imports the dialect-appropriate `migrate` (drizzle-orm/better-sqlite3/migrator etc.) and invokes it with `{ migrationsFolder: folder }`. - Kysely (v0.7+) — kiwa drives `kysely.Migrator` + `FileMigrationProvider` against the supplied folder; each migration file must export `up(db)` (and optionally `down(db)`). - Prisma — N/A (`prisma db push --schema=&lt;schemaPath&gt;` is the migration path).

```ts
export type MigrationSource = string | ReadonlyArray<string> | {
    readonly folder: string;
};
```

#### <code v-pre>MinimalExpect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/expectations.ts#L12) <code v-pre>packages/orm/src/expectations.ts</code>

```ts
export interface MinimalExpect {
    (actual: unknown): {
        toEqual(expected: unknown): void;
        toBe(expected: unknown): void;
    };
}
```

#### <code v-pre>MockKyselySqliteOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L307) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface MockKyselySqliteOptions<TDatabase extends KyselyDatabase = KyselyDatabase> {
    readonly mode: 'mock';
    readonly orm: 'kysely';
    readonly dialect: 'sqlite';
    /** Phantom-typed `Database` interface — Kysely uses it for query type narrowing. */
    readonly schema: TDatabase;
    readonly migrations?: MigrationSource;
    readonly seed?: (db: import('kysely').Kysely<TDatabase>) => Promise<void> | void;
}
```

#### <code v-pre>MockPrismaSqliteOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L177) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface MockPrismaSqliteOptions<TClient = unknown> {
    readonly mode: 'mock';
    readonly orm: 'prisma';
    readonly dialect: 'sqlite';
    /**
     * The generated `PrismaClient` constructor exported from the caller's
     * `@prisma/client` (i.e. `import { PrismaClient } from '@prisma/client'`).
     * kiwa never invokes `prisma generate` itself; the caller manages codegen
     * as part of their normal Prisma workflow.
     */
    readonly prismaClient: PrismaClientCtor<TClient>;
    /**
     * Path to the schema.prisma file. The schema's `datasource db { url = env(...) }`
     * env var name is overridden via the `datasourceUrlEnv` field below.
     */
    readonly schemaPath: string;
    /**
     * Name of the env var the schema's `datasource db { url = env(...) }`
     * references. kiwa sets this env var to the temp SQLite file URL before
     * invoking `prisma db push --schema=<schemaPath>`. Default `DATABASE_URL`.
     */
    readonly datasourceUrlEnv?: string;
    /**
     * Optional seed callback. Receives the live PrismaClient instance.
     */
    readonly seed?: (client: TClient) => Promise<void> | void;
}
```

#### <code v-pre>MockSqliteOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L78) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface MockSqliteOptions<TSchema extends DrizzleSchema = DrizzleSchema> {
    readonly mode: 'mock';
    readonly orm: 'drizzle';
    readonly dialect: 'sqlite';
    readonly schema: TSchema;
    readonly migrations?: MigrationSource;
    readonly seed?: (db: DrizzleSqliteDb<TSchema>) => Promise<void> | void;
}
```

#### <code v-pre>MvccAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L23) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

```ts
export interface MvccAdvancedSession {
    tableName: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: MvccAdvancedState;
    visibleTuples: Set<string>;
    bloatRatio: number;
    hotChainLength: number;
    currentXid: number;
    history: AxisStep<MvccAdvancedState>[];
}
```

#### <code v-pre>MvccAdvancedState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc-advanced.ts#L16) <code v-pre>packages/orm/src/semantics/mvcc-advanced.ts</code>

MVCC advanced — tuple visibility, table bloat, HOT update chains, and XID wraparound pressure. Postgres maps to heap tuple metadata and pg_stat_user_tables; MySQL approximates with InnoDB transaction metadata; SQLite falls back to snapshot / freelist style counters. State transitions: created → 'idle' checkTupleVisibility → 'visibility-checked' measureBloat → 'bloat-measured' applyHotUpdate → 'hot-updated' detectXidWraparound → 'xid-wraparound-detected'

```ts
export type MvccAdvancedState = 'idle' | 'visibility-checked' | 'bloat-measured' | 'hot-updated' | 'xid-wraparound-detected';
```

#### <code v-pre>MvccSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L28) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

```ts
export interface MvccSession {
    txnId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    isolation: IsolationLevel;
    state: MvccState;
    snapshotId: number | null;
    history: AxisStep<MvccState>[];
}
```

#### <code v-pre>MvccState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L19) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

MVCC — multi-version concurrency control. Snapshot isolation vs serializable isolation, phantom reads, lost updates, and deadlock detection. Postgres has real MVCC with snapshot / serializable isolation, MySQL InnoDB has snapshot + gap locks, SQLite has a single writer + WAL that behaves like coarse-grained snapshot isolation. All 3 backends map to the same 4 neutral events with backend dialect via {@link backendEventName}. State transitions: created → 'active' takeSnapshot → 'snapshot-held' abortSerializable → 'aborted' blockPhantom → 'phantom-blocked' detectDeadlock → 'deadlocked'

```ts
export type MvccState = 'active' | 'snapshot-held' | 'aborted' | 'phantom-blocked' | 'deadlocked';
```

#### <code v-pre>MysqlClusterSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L24) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

```ts
export interface MysqlClusterSession {
    groupName: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: MysqlClusterState;
    members: Set<string>;
    primaryId: string | null;
    conflictCount: number;
    history: AxisStep<MysqlClusterState>[];
}
```

#### <code v-pre>MysqlClusterState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L17) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

MySQL cluster — group replication membership, single-primary election, write conflict detection, and member leave. MySQL maps to group_replication / performance_schema; Postgres approximates via Patroni-style leader telemetry; SQLite falls back to neutral cluster events. State transitions: created → 'empty' joinClusterMember → 'joined' electClusterPrimary → 'primary-elected' detectClusterConflict→ 'conflict-detected' leaveClusterMember → 'member-left'

```ts
export type MysqlClusterState = 'empty' | 'joined' | 'primary-elected' | 'conflict-detected' | 'member-left';
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts#L44) <code v-pre>packages/orm/src/semantics/types.ts</code>

Platform-neutral event names used inside the axis helpers. Real backends expose different string ids — Postgres `wal_sender.progress`, MySQL `binlog.dump_gtid`, SQLite `session.diff`. The {@link backendEventName} map handles the translation. Tests can assert on the neutral name via `step.neutralEvent` or on the backend-specific one via `step.backendEvent`.

```ts
export type NeutralEventName = 'replication.primary-write' | 'replication.replica-lagged' | 'replication.failover-started' | 'replication.promoted' | 'cdc.decoded' | 'cdc.outbox-appended' | 'cdc.event-ordered' | 'cdc.at-least-once-delivered' | 'logical.publication-created' | 'logical.subscription-synced' | 'logical.conflict-resolved' | 'logical.heartbeat' | 'mvcc.snapshot-taken' | 'mvcc.serializable-aborted' | 'mvcc.phantom-blocked' | 'mvcc.deadlock-detected' | 'rls.policy-installed' | 'rls.tenant-isolated' | 'rls.bypass-used' | 'rls.audit-logged' | 'pool.acquired' | 'pool.idle-timeout' | 'pool.statement-timeout' | 'pool.wait-queued' | 'partition.declared' | 'partition.pruned' | 'partition.wise-joined' | 'partition.route-selected' | 'vector.indexed' | 'vector.knn-searched' | 'vector.hybrid-searched' | 'vector.distance-computed' | 'logical-advanced.streaming-started' | 'logical-advanced.origin-tracked' | 'logical-advanced.two-safe-confirmed' | 'logical-advanced.cascade-synced' | 'mvcc-advanced.tuple-visibility-checked' | 'mvcc-advanced.bloat-measured' | 'mvcc-advanced.hot-updated' | 'mvcc-advanced.xid-wraparound-detected' | 'cluster.member-joined' | 'cluster.primary-elected' | 'cluster.conflict-detected' | 'cluster.member-left' | 'binlog.position-advanced' | 'binlog.gtid-set-updated' | 'binlog.format-negotiated' | 'binlog.gap-detected' | 'wal.checkpoint-triggered' | 'wal.size-threshold-crossed' | 'wal.shared-memory-mapped' | 'wal.journal-mode-switched' | 'fts5.virtual-table-created' | 'fts5.tokenized' | 'fts5.matched' | 'fts5.vocab-inspected' | 'txn.level-set' | 'txn.dirty-read-blocked' | 'txn.non-repeatable-read-blocked' | 'txn.phantom-read-blocked' | 'pool-advanced.health-checked' | 'pool-advanced.warmed-up' | 'pool-advanced.drained' | 'pool-advanced.metrics-exported' | 'pglr.publication-created' | 'pglr.slot-allocated' | 'pglr.subscription-synced' | 'pglr.streaming' | 'pglr.disconnected';
```

#### <code v-pre>OrmAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts#L18) <code v-pre>packages/orm/src/semantics/types.ts</code>

```ts
export type OrmAxis = 'replication' | 'cdc' | 'logical-replication' | 'mvcc' | 'rls' | 'connection-pool' | 'partitioning' | 'vector-store' | 'logical-replication-advanced' | 'mvcc-advanced' | 'mysql-cluster' | 'binlog' | 'sqlite-wal' | 'fts5' | 'txn-isolation' | 'pool-advanced';
```

#### <code v-pre>OrmBackend</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts#L16) <code v-pre>packages/orm/src/semantics/types.ts</code>

```ts
export type OrmBackend = 'postgres' | 'mysql' | 'sqlite';
```

#### <code v-pre>OrmBrand</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L12) <code v-pre>packages/orm/src/types.ts</code>

ORM brand discriminator. v0.4 adds 'kysely'.

```ts
export type OrmBrand = 'drizzle' | 'prisma' | 'kysely';
```

#### <code v-pre>OrmProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts#L14) <code v-pre>packages/orm/src/semantics/types.ts</code>

Advanced ORM / database semantics — provider × backend neutral axis SSOT. v0.8 orm mocks only carried `setupOrmEnv` (schema + migration + seed) for 3 provider (drizzle / prisma / kysely) × 3 backend (postgres / mysql / sqlite). v0.9 adds 8 production db semantics that real database engines expose differently — streaming replication, change data capture, logical replication, MVCC snapshot isolation, row-level security, connection pool, declarative partitioning, and vector search. Each axis is a small pure state-machine helper that returns a neutral envelope so downstream tests can drive the axis without knowing the provider / backend payload dialect.

```ts
export type OrmProvider = 'drizzle' | 'prisma' | 'kysely';
```

#### <code v-pre>OrmTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L367) <code v-pre>packages/orm/src/types.ts</code>

Discriminated union. Tests narrow with `env.mode` / `env.orm` / `env.dialect` to access the appropriate ORM client + raw driver shape.

```ts
export type OrmTestEnv<TSchema extends DrizzleSchema = DrizzleSchema, TPrismaClient = unknown, TKyselyDatabase extends KyselyDatabase = KyselyDatabase> = OrmTestEnvMock<TSchema> | OrmTestEnvLive<TSchema> | OrmTestEnvLiveMysql<TSchema> | OrmTestEnvMockPrisma<TPrismaClient> | OrmTestEnvLivePrismaPostgres<TPrismaClient> | OrmTestEnvLivePrismaMysql<TPrismaClient> | OrmTestEnvMockKysely<TKyselyDatabase> | OrmTestEnvLiveKyselyPostgres<TKyselyDatabase> | OrmTestEnvLiveKyselyMysql<TKyselyDatabase>;
```

#### <code v-pre>OrmTestEnvLive</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L253) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface OrmTestEnvLive<TSchema extends DrizzleSchema = DrizzleSchema> extends TestEnvBase<'live'> {
    readonly orm: 'drizzle';
    readonly dialect: 'postgres';
    readonly db: DrizzlePostgresDb<TSchema>;
    /** Raw `postgres` (postgres.js) connection — exposed for `expectQuery` raw-SQL paths. */
    readonly raw: import('postgres').Sql;
    /** Connection URI assigned by the testcontainers Postgres instance. */
    readonly connectionUri: string;
}
```

#### <code v-pre>OrmTestEnvLiveKyselyMysql</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L354) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface OrmTestEnvLiveKyselyMysql<TDatabase extends KyselyDatabase = KyselyDatabase> extends TestEnvBase<'live'> {
    readonly orm: 'kysely';
    readonly dialect: 'mysql';
    readonly db: import('kysely').Kysely<TDatabase>;
    readonly raw: import('mysql2/promise').Pool;
    readonly connectionUri: string;
}
```

#### <code v-pre>OrmTestEnvLiveKyselyPostgres</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L345) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface OrmTestEnvLiveKyselyPostgres<TDatabase extends KyselyDatabase = KyselyDatabase> extends TestEnvBase<'live'> {
    readonly orm: 'kysely';
    readonly dialect: 'postgres';
    readonly db: import('kysely').Kysely<TDatabase>;
    readonly raw: import('pg').Pool;
    readonly connectionUri: string;
}
```

#### <code v-pre>OrmTestEnvLiveMysql</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L264) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface OrmTestEnvLiveMysql<TSchema extends DrizzleSchema = DrizzleSchema> extends TestEnvBase<'live'> {
    readonly orm: 'drizzle';
    readonly dialect: 'mysql';
    readonly db: DrizzleMysqlDb<TSchema>;
    /** Raw `mysql2` Pool — exposed for `expectQuery` raw-SQL paths. */
    readonly raw: import('mysql2/promise').Pool;
    /** Connection URI assigned by the testcontainers MySQL instance. */
    readonly connectionUri: string;
}
```

#### <code v-pre>OrmTestEnvLivePrismaMysql</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L297) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface OrmTestEnvLivePrismaMysql<TClient = unknown> extends TestEnvBase<'live'> {
    readonly orm: 'prisma';
    readonly dialect: 'mysql';
    /** Live PrismaClient instance constructed against the testcontainers MySQL. */
    readonly client: TClient;
    /** Connection URI assigned by the testcontainers MySQL instance. */
    readonly connectionUri: string;
}
```

#### <code v-pre>OrmTestEnvLivePrismaPostgres</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L287) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface OrmTestEnvLivePrismaPostgres<TClient = unknown> extends TestEnvBase<'live'> {
    readonly orm: 'prisma';
    readonly dialect: 'postgres';
    /** Live PrismaClient instance constructed against the testcontainers Postgres. */
    readonly client: TClient;
    /** Connection URI assigned by the testcontainers Postgres instance. */
    readonly connectionUri: string;
}
```

#### <code v-pre>OrmTestEnvMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L244) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface OrmTestEnvMock<TSchema extends DrizzleSchema = DrizzleSchema> extends TestEnvBase<'mock'> {
    readonly orm: 'drizzle';
    readonly dialect: 'sqlite';
    readonly db: DrizzleSqliteDb<TSchema>;
    /** Raw better-sqlite3 connection — exposed for `expectQuery` raw-SQL paths. */
    readonly raw: import('better-sqlite3').Database;
}
```

#### <code v-pre>OrmTestEnvMockKysely</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L337) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface OrmTestEnvMockKysely<TDatabase extends KyselyDatabase = KyselyDatabase> extends TestEnvBase<'mock'> {
    readonly orm: 'kysely';
    readonly dialect: 'sqlite';
    readonly db: import('kysely').Kysely<TDatabase>;
    readonly raw: import('better-sqlite3').Database;
}
```

#### <code v-pre>OrmTestEnvMockPrisma</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L275) <code v-pre>packages/orm/src/types.ts</code>

```ts
export interface OrmTestEnvMockPrisma<TClient = unknown> extends TestEnvBase<'mock'> {
    readonly orm: 'prisma';
    readonly dialect: 'sqlite';
    /** Live PrismaClient instance constructed against the isolated tempdir DB. */
    readonly client: TClient;
    /** Absolute path to the tempdir-hosted SQLite file. */
    readonly dbPath: string;
    /** `file:` URL form of `dbPath` — same value injected into `datasourceUrlEnv`. */
    readonly datasourceUrl: string;
}
```

#### <code v-pre>PartitionBucket</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L22) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

```ts
export interface PartitionBucket {
    name: string;
    strategy: PartitionStrategy;
    bounds: {
        low?: number;
        high?: number;
        values?: (string | number)[];
        modulus?: number;
        remainder?: number;
    };
}
```

#### <code v-pre>PartitioningSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L28) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

```ts
export interface PartitioningSession {
    tableId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: PartitionState;
    buckets: PartitionBucket[];
    prunedCount: number;
    history: AxisStep<PartitionState>[];
}
```

#### <code v-pre>PartitionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L18) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

Declarative partitioning — RANGE / LIST / HASH partition strategies, partition pruning, partition-wise join planning, and per-row routing. Postgres has native declarative partitioning; MySQL has RANGE / LIST / HASH partition types; SQLite emulates via ATTACH DATABASE shards. All 3 backends map to the same 4 neutral events with backend dialect via {@link backendEventName}. State transitions: created → 'undeclared' declarePartition → 'declared' prunePartitions → 'pruned' partitionWiseJoin → 'joined' routeInsert → (state unchanged, routing is stateless)

```ts
export type PartitionState = 'undeclared' | 'declared' | 'pruned' | 'joined';
```

#### <code v-pre>PartitionStrategy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L20) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

```ts
export type PartitionStrategy = 'range' | 'list' | 'hash';
```

#### <code v-pre>PoolAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L22) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

```ts
export interface PoolAdvancedSession {
    poolId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: PoolAdvancedState;
    minWarmConnections: number;
    activeConnections: number;
    lastHealthLatencyMs: number;
    metrics: Record<string, number>;
    history: AxisStep<PoolAdvancedState>[];
}
```

#### <code v-pre>PoolAdvancedState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L15) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

Pool advanced — health checks, connection warmup, graceful drain, and pool metrics export. Postgres maps to PgBouncer, MySQL to ProxySQL, and SQLite to sqlite3_status / close-v2 style primitives. State transitions: created → 'cold' runPoolHealthCheck → 'healthy' warmPoolConnections → 'warmed-up' drainPoolGracefully → 'draining' exportPoolMetrics → 'metrics-exported'

```ts
export type PoolAdvancedState = 'cold' | 'healthy' | 'warmed-up' | 'draining' | 'metrics-exported';
```

#### <code v-pre>PoolSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L26) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

```ts
export interface PoolSession {
    poolId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: PoolState;
    maxConnections: number;
    idleTimeoutMs: number;
    statementTimeoutMs: number;
    active: Map<string, ConnectionHandle>;
    waitQueue: string[];
    history: AxisStep<PoolState>[];
}
```

#### <code v-pre>PoolState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L18) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

Connection pool — max_connections cap, idle_timeout eviction, statement_timeout cancellation, and a bounded wait queue when the pool is saturated. Postgres uses pgbouncer, MySQL uses ProxySQL, SQLite emulates with a WAL writer serialization queue. Same 4 neutral events across all backends, with backend / provider dialect via {@link backendEventName}. State transitions: created → 'idle' acquire → 'in-use' (or 'saturated' if maxConnections reached) waitInQueue → 'saturated' idleTimeout → 'evicted' statementTimeout → 'cancelled'

```ts
export type PoolState = 'idle' | 'in-use' | 'saturated' | 'evicted' | 'cancelled';
```

#### <code v-pre>PrismaClientCtor</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L114) <code v-pre>packages/orm/src/types.ts</code>

Constructor signature for `@prisma/client` `PrismaClient` (kept loose so callers can pass their generated client without importing the type here). The generic `TClient` is the caller's narrowed PrismaClient instance type.

```ts
export type PrismaClientCtor<TClient = unknown> = new (options?: {
    datasourceUrl?: string;
    datasources?: {
        db: {
            url: string;
        };
    };
}) => TClient;
```

#### <code v-pre>ReplicaHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L26) <code v-pre>packages/orm/src/semantics/replication.ts</code>

```ts
export interface ReplicaHandle {
    id: string;
    appliedLsn: number;
    lag: number;
}
```

#### <code v-pre>ReplicationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L32) <code v-pre>packages/orm/src/semantics/replication.ts</code>

```ts
export interface ReplicationSession {
    primaryId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: ReplicationState;
    primaryLsn: number;
    replicas: Map<string, ReplicaHandle>;
    history: AxisStep<ReplicationState>[];
}
```

#### <code v-pre>ReplicationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L20) <code v-pre>packages/orm/src/semantics/replication.ts</code>

Streaming replication — primary write flows into an ordered replica stream (WAL for Postgres, binlog for MySQL, session for SQLite). The mock tracks the primary LSN, per-replica applied LSN, and lag, plus a two-step failover flow (`replication.failover-started` → `replication.promoted`). SQLite has no server-side replication, but the mock still permits the neutral events so downstream tests can drive a "simulated" replica for SQLite in-memory fanout — the backend dialect falls back to the neutral name via {@link backendEventName}. State transitions: created → 'streaming' primaryWrite → 'streaming' (bumps primary LSN) markReplicaLagged → 'lagged' (replica applied LSN falls behind) startFailover → 'failover-in-progress' promoteReplica → 'promoted'

```ts
export type ReplicationState = 'streaming' | 'lagged' | 'failover-in-progress' | 'promoted';
```

#### <code v-pre>RlsAuditEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L26) <code v-pre>packages/orm/src/semantics/rls.ts</code>

```ts
export interface RlsAuditEntry {
    tenantId: string;
    operation: 'read' | 'write';
    allowed: boolean;
    reason: string;
}
```

#### <code v-pre>RlsPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L20) <code v-pre>packages/orm/src/semantics/rls.ts</code>

```ts
export interface RlsPolicy {
    name: string;
    table: string;
    tenantColumn: string;
}
```

#### <code v-pre>RlsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L33) <code v-pre>packages/orm/src/semantics/rls.ts</code>

```ts
export interface RlsSession {
    tableId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: RlsState;
    policy: RlsPolicy | null;
    auditLog: RlsAuditEntry[];
    history: AxisStep<RlsState>[];
}
```

#### <code v-pre>RlsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L18) <code v-pre>packages/orm/src/semantics/rls.ts</code>

Row-level security (RLS) — install a per-table policy, evaluate it on every read/write to isolate tenants, allow a superuser / `bypass_rls` role to skip it under audit, and record every access in an audit trail. Postgres has first-class `CREATE POLICY`; MySQL / SQLite emulate with filtered views. The mock exposes the same 4 neutral events for all 3 backends so tests can assert on tenant isolation regardless of backend. State transitions: created → 'no-policy' installPolicy → 'policy-installed' filterTenant → 'policy-installed' bypassRls → 'bypassed' logAudit → (state unchanged, audit is passive)

```ts
export type RlsState = 'no-policy' | 'policy-installed' | 'bypassed';
```

#### <code v-pre>SetupOrmEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L213) <code v-pre>packages/orm/src/types.ts</code>

Union of all currently-supported v0.2 configurations. Generic parameters (TMode / TOrm / TDialect) are retained so future adapters can extend the union without breaking type signatures. The generic form is intentionally less precise; prefer the discrete `MockSqliteOptions` / `LivePostgresOptions` types when authoring tests.

```ts
export type SetupOrmEnvOptions<TMode extends TestMode = TestMode, TOrm extends OrmBrand = 'drizzle', TDialect extends SqlDialect = SqlDialect, TSchema extends DrizzleSchema = DrizzleSchema> = TMode extends 'mock' ? TOrm extends 'drizzle' ? TDialect extends 'sqlite' ? MockSqliteOptions<TSchema> : never : TOrm extends 'prisma' ? TDialect extends 'sqlite' ? MockPrismaSqliteOptions : never : never : TMode extends 'live' ? TOrm extends 'drizzle' ? TDialect extends 'postgres' ? LivePostgresOptions<TSchema> : TDialect extends 'mysql' ? LiveMysqlOptions<TSchema> : never : TOrm extends 'prisma' ? TDialect extends 'postgres' ? LivePrismaPostgresOptions : TDialect extends 'mysql' ? LivePrismaMysqlOptions : never : never : never;
```

#### <code v-pre>SqlDialect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/types.ts#L33) <code v-pre>packages/orm/src/types.ts</code>

SQL dialect. v0.2.1 adds 'mysql'.

```ts
export type SqlDialect = 'sqlite' | 'postgres' | 'mysql';
```

#### <code v-pre>SqliteWalSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L23) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

```ts
export interface SqliteWalSession {
    databasePath: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: SqliteWalState;
    journalMode: 'DELETE' | 'WAL';
    walSizeBytes: number;
    checkpointCount: number;
    sharedMemoryMapped: boolean;
    history: AxisStep<SqliteWalState>[];
}
```

#### <code v-pre>SqliteWalState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L16) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

SQLite WAL — journal_mode=WAL switch, WAL checkpoint, size threshold, and shared-memory wal-index mapping. SQLite maps to PRAGMA journal_mode / wal_checkpoint and wal-index telemetry; Postgres / MySQL use write-ahead log fallback names. State transitions: created → 'rollback-journal' switchJournalMode → 'wal-enabled' crossWalSizeThreshold → 'threshold-crossed' triggerWalCheckpoint → 'checkpointed' mapSharedMemory → 'shared-memory-mapped'

```ts
export type SqliteWalState = 'rollback-journal' | 'wal-enabled' | 'threshold-crossed' | 'checkpointed' | 'shared-memory-mapped';
```

#### <code v-pre>TransactionEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts#L15) <code v-pre>packages/orm/src/semantics/transaction-orchestrator.ts</code>

```ts
export type TransactionEvent = 'begin-completed' | 'query-executed' | 'savepoint-created' | 'savepoint-released' | 'commit-requested' | 'commit-succeeded' | 'rollback-requested' | 'timeout';
```

#### <code v-pre>TransactionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts#L25) <code v-pre>packages/orm/src/semantics/transaction-orchestrator.ts</code>

```ts
export interface TransactionSession {
    state: TransactionState;
    queriesExecuted: number;
    savepointsCreated: number;
    savepointsReleased: number;
    commitsSucceeded: number;
    rollbacksExecuted: number;
    lastEventAt: string;
    events: string[];
}
```

#### <code v-pre>TransactionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts#L8) <code v-pre>packages/orm/src/semantics/transaction-orchestrator.ts</code>

v0.6 transaction-orchestrator = txn-isolation + mvcc + connection-pool + logical-replication + partitioning の 継続合成 layer。 depth-5 pattern 9 例目 = systematic law 継続強化 第 3 例、 systematic pattern 51 度目 (継続深化 pattern 9 例目 candidate、 backend systems layer への 初適用)。

```ts
export type TransactionState = 'beginning' | 'active' | 'savepoint-nested' | 'committing' | 'aborted';
```

#### <code v-pre>TransactionSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts#L139) <code v-pre>packages/orm/src/semantics/transaction-orchestrator.ts</code>

```ts
export interface TransactionSummary {
    currentState: TransactionState;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    terminalEvents: number;
    queriesExecuted: number;
    savepointsCreated: number;
    savepointsReleased: number;
    commitsSucceeded: number;
    rollbacksExecuted: number;
}
```

#### <code v-pre>TxnIsolationLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L23) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export type TxnIsolationLevel = 'read-uncommitted' | 'read-committed' | 'repeatable-read' | 'serializable';
```

#### <code v-pre>TxnIsolationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L29) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export interface TxnIsolationSession {
    txnId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: TxnIsolationState;
    level: TxnIsolationLevel | null;
    blockedPhenomena: Set<string>;
    history: AxisStep<TxnIsolationState>[];
}
```

#### <code v-pre>TxnIsolationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L16) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

Transaction isolation — level switching across read-uncommitted, read-committed, repeatable-read, and serializable plus blocking the classic ANSI phenomena. Postgres / MySQL map to SET TRANSACTION ISOLATION; SQLite maps to pragma locking / read-uncommitted controls. State transitions: created → 'idle' setTxnIsolationLevel → 'level-set' blockDirtyRead → 'dirty-read-blocked' blockNonRepeatableRead → 'non-repeatable-read-blocked' blockPhantomRead → 'phantom-read-blocked'

```ts
export type TxnIsolationState = 'idle' | 'level-set' | 'dirty-read-blocked' | 'non-repeatable-read-blocked' | 'phantom-read-blocked';
```

#### <code v-pre>VectorDistanceKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L22) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

```ts
export type VectorDistanceKind = 'cosine' | 'l2' | 'inner-product';
```

#### <code v-pre>VectorIndex</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L24) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

```ts
export interface VectorIndex {
    name: string;
    kind: VectorIndexKind;
    dimensions: number;
    lists?: number;
    m?: number;
    efConstruction?: number;
}
```

#### <code v-pre>VectorIndexKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L20) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

```ts
export type VectorIndexKind = 'ivfflat' | 'hnsw';
```

#### <code v-pre>VectorState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L18) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

Vector store — build an approximate nearest neighbour index (IVFFlat or HNSW), run k-NN queries with cosine / L2 distance, run hybrid searches combining vector + full-text scoring, and record the raw distance computation for telemetry. Postgres has pgvector; MySQL HeatWave has native vector types; SQLite has sqlite-vec / sqlite-vss extensions. The mock exposes the same 4 neutral events for all 3 backends. State transitions: created → 'unindexed' buildIndex → 'indexed' knnSearch → 'searched' hybridSearch → 'searched' computeDistance → (state unchanged, distance is passive)

```ts
export type VectorState = 'unindexed' | 'indexed' | 'searched';
```

#### <code v-pre>VectorStoreSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/vector-store.ts#L33) <code v-pre>packages/orm/src/semantics/vector-store.ts</code>

```ts
export interface VectorStoreSession {
    storeId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: VectorState;
    index: VectorIndex | null;
    distanceKind: VectorDistanceKind;
    searchCount: number;
    history: AxisStep<VectorState>[];
}
```
<!-- kiwa-public-api:end -->
