# @kiwa/realtime v2.1 session-orchestrator in 15 min

## What you'll build

`@kiwa/realtime` v2.1 session-orchestrator = presence + broadcast + subscription + heartbeat + reconnect の 継続合成 layer。 5 state SSOT + 8 event SSOT + 40 セル 遷移表 + heartbeat 3 回連続失敗 で degraded 降格 の 動的 QoS。 **depth-5 pattern 5 例目発生** = Mobile + Desktop + quality-metrics + Payment + Realtime = 5 pair 到達 = **systematic law 昇格 candidate**、 50 milestone streak、 systematic pattern 47 度目適用。

## Prerequisites

- Node.js ≥ 20 + pnpm
- `@kiwa/realtime` v2.1 (`pnpm add -D @kiwa/realtime@^2.1`)

## Step-by-step build

### 1. session 開始

```ts
import { startSession } from '@kiwa/realtime';
const s = startSession({ timestamp: new Date().toISOString() });
// s.state = 'connecting'
```

### 2. connect + subscribe

```ts
import { dispatchEvent } from '@kiwa/realtime';
let next = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: t1 });
// next.state = 'subscribed'
next = dispatchEvent({ session: next, event: 'subscribe-succeeded', timestamp: t2 });
// next.broadcastsReceived = 1
```

### 3. heartbeat 監視 + degraded 降格

```ts
// heartbeat 3 回失敗 で degraded 降格 (動的 QoS)
next = dispatchEvent({ session: next, event: 'heartbeat-lost', timestamp: t3 });
next = dispatchEvent({ session: next, event: 'heartbeat-lost', timestamp: t4 });
next = dispatchEvent({ session: next, event: 'heartbeat-lost', timestamp: t5 });
// next.state = 'degraded'、 heartbeatFailures = 3

// heartbeat 復活で subscribed 復帰 (counter リセット)
next = dispatchEvent({ session: next, event: 'heartbeat-recovered', timestamp: t6 });
// next.state = 'subscribed'、 heartbeatFailures = 0
```

### 4. reconnect + terminate

```ts
// connect-failed で reconnecting
next = dispatchEvent({ session: next, event: 'connect-failed', timestamp: t7 });
// reconnect 成功 or exhausted で 決着
const recovered = dispatchEvent({ session: next, event: 'reconnect-succeeded', timestamp: t8 });
// recovered.state = 'subscribed'、 heartbeatFailures = 0
```

## 5 state SSOT

| state | 意味 |
|---|---|
| connecting | 初期接続中 |
| subscribed | subscribe active、 broadcast 受信中 |
| reconnecting | reconnect 中、 backoff 待ち |
| degraded | heartbeat 失敗多発、 lower QoS mode |
| closed | terminal |

## 8 event × 40 セル 遷移表

connect-succeeded / connect-failed / subscribe-succeeded / heartbeat-lost / heartbeat-recovered / reconnect-succeeded / reconnect-exhausted / user-disconnect × 5 state = 40 セル。

## depth-5 pattern 5 例目発生 = systematic law 昇格 candidate

- 1 例目 = Mobile
- 2 例目 = Desktop
- 3 例目 = quality-metrics
- 4 例目 = Payment (dominant pattern 昇格)
- **5 例目 = Realtime** ← **systematic law 昇格 candidate**

「pattern → 確定 pattern → 絶対的 rule → dominant pattern → systematic law」 の 5 段昇格 candidate 到達。

## Reference: dogfood-realtime-session-app

4 pattern workflow (`openWebSocketSession` + `pumpEventStream` + `renderSessionDashboard` + `extractReconnectStats`) の実装は `examples/dogfood-realtime-session-app/` を参照。

## What's next

- v2.5+ = 5 例目 → 6 例目 発生で systematic law confirmed、 or 別 pair の depth-5 拡張継続
