# @kiwa-lab/data リファレンス

in-memory queue、fake clock、delivery assertionの公開APIです。

## setupQueueEnv

`setupQueueEnv({ mode, maxReceiveCount, seed })` は `{ mode, client, stop }` を返します。modeは `mock` または `live` が必須で、いずれも同じin-memory queueです。未知のmodeはrejectします。

| option | 既定 | 内容 |
| --- | --- | --- |
| `maxReceiveCount` | 5 | ackされないentryをDLQへ移すreceive count |
| `seed` | なし | setup時にsendするbodyの配列 |

`QueueClient` の `send` はstring idを返し、`receive` はqueue先頭を取り出してreceive countを増やします。`consume` はunsubscribe functionを返します。`size` はqueue length、`dlqSize` はDLQ length、`drainDlq` はDLQ内容を返して空にします。

consumerのackはentryを完了にします。nackまたはackなしは再queueされ、上限到達でDLQへ移ります。dedup keyはqueue内にある間だけ重複sendを防ぎ、ackまたはDLQ移動で解放されます。

## fake clock

`createFakeClock({ startMs })` は `nowMs`、`advanceMs`、`schedule`、`unschedule`、`pendingEntries` を返します。scheduleはinterval taskにstring idを付け、advanceはtarget時刻までの発火を順にawaitします。

`pendingEntries()` はentries arrayのcopyを返しますが、entry object自体は同じobjectです。戻り値のentryを変更しないでください。

## assertion helper

`expectIdempotent(client, body, { dedupKey }, expect)` は同じkeyの二回sendがsizeを一つだけ増やすことを確認します。`expectAtLeastOnce(client, body, minTimes, expect)` はnack後にminTimes回以上呼ばれたことを確認してinvocation countを返します。どちらも最後にVitestの `expect` を渡します。

## 制約

このadapterはvisibility timeout、delayed delivery、parallel consumer、external providerのdelivery guaranteeを実装しません。`mode: "live"` もnetwork接続を作りません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `createFakeClock.schedule: intervalMs must be > 0, got ${intervalMs}` | [packages/data/src/fake-clock.ts](https://github.com/cardene777/kiwa/blob/main/packages/data/src/fake-clock.ts#L17) |
| `createFakeClock.advanceMs: ms must be >= 0, got ${ms}` | [packages/data/src/fake-clock.ts](https://github.com/cardene777/kiwa/blob/main/packages/data/src/fake-clock.ts#L30) |
| `setupQueueEnv: mode must be "mock" or "live", got ${String(opts.mode)}` | [packages/data/src/queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/data/src/queue.ts#L133) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/data/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `createFakeClock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/fake-clock.ts#L8) `packages/data/src/fake-clock.ts`

```ts
export function createFakeClock(opts: FakeClockOptions = {}): FakeClock;
```

#### `expectAtLeastOnce`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/expectations.ts#L27) `packages/data/src/expectations.ts`

Asserts that a handler is invoked at least `minTimes` for a message that nacks before finally acking (at-least-once delivery semantics).

```ts
export async function expectAtLeastOnce<T>(
  client: QueueClient<T>,
  body: T,
  minTimes: number,
  expect: { (actual: unknown): { toBeGreaterThanOrEqual: (expected: number) => void } },
): Promise<number>;
```

#### `expectIdempotent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/expectations.ts#L11) `packages/data/src/expectations.ts`

Asserts that two sends with the same dedupKey collapse into one queue entry (caller is expected to consume + ack the entry).

```ts
export async function expectIdempotent<T>(
  client: QueueClient<T>,
  body: T,
  opts: IdempotencyOptions,
  expect: { (actual: unknown): { toBe: (expected: unknown) => void } },
): Promise<void>;
```

#### `setupQueueEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/queue.ts#L129) `packages/data/src/queue.ts`

```ts
export async function setupQueueEnv<T = unknown>(
  opts: SetupQueueEnvOptions<T>,
): Promise<QueueTestEnv<T>>;
```

### 型

#### `CronEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L43) `packages/data/src/types.ts`

```ts
export interface CronEntry {
  id: string;
  intervalMs: number;
  lastRunMs: number;
  fn: () => void | Promise<void>;
}
```

#### `FakeClock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L50) `packages/data/src/types.ts`

```ts
export interface FakeClock {
  nowMs: () => number;
  advanceMs: (ms: number) => Promise<void>;
  schedule: (intervalMs: number, fn: () => void | Promise<void>) => string;
  unschedule: (id: string) => void;
  pendingEntries: () => CronEntry[];
}
```

#### `FakeClockOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/fake-clock.ts#L3) `packages/data/src/fake-clock.ts`

```ts
export interface FakeClockOptions {
  /** initial wall-clock time in ms (default 0 for deterministic tests) */
  startMs?: number;
}
```

#### `IdempotencyOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/expectations.ts#L3) `packages/data/src/expectations.ts`

```ts
export interface IdempotencyOptions {
  dedupKey: string;
}
```

#### `QueueAckHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L11) `packages/data/src/types.ts`

```ts
export interface QueueAckHandle {
  ack: () => void;
  nack: () => void;
}
```

#### `QueueClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L21) `packages/data/src/types.ts`

```ts
export interface QueueClient<T = unknown> {
  send: (body: T, opts?: { dedupKey?: string }) => string;
  receive: () => QueueMessage<T> | null;
  /** Subscribe a handler that processes every send + retries until ack */
  consume: (handler: QueueHandler<T>) => () => void;
  size: () => number;
  dlqSize: () => number;
  drainDlq: () => QueueMessage<T>[];
}
```

#### `QueueHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L16) `packages/data/src/types.ts`

```ts
export type QueueHandler<T> = (
  message: QueueMessage<T>,
  ack: QueueAckHandle,
) => void | Promise<void>;
```

#### `QueueMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L3) `packages/data/src/types.ts`

```ts
export interface QueueMessage<T = unknown> {
  id: string;
  body: T;
  receivedCount: number;
  /** Optional dedup key for idempotency tests */
  dedupKey?: string;
}
```

#### `QueueTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L39) `packages/data/src/types.ts`

```ts
export interface QueueTestEnv<T = unknown> extends TestEnvBase<'mock' | 'live'> {
  client: QueueClient<T>;
}
```

#### `SetupQueueEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/types.ts#L31) `packages/data/src/types.ts`

```ts
export interface SetupQueueEnvOptions<T = unknown> {
  mode: Extract<TestMode, 'mock' | 'live'>;
  /** Maximum receive count before a message is sent to the dead letter queue */
  maxReceiveCount?: number;
  /** Optional initial messages */
  seed?: T[];
}
```
<!-- kiwa-public-api:end -->
