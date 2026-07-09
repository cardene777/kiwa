# `@kiwa-lab/realtime`

Realtime test harness for kiwa — a unified mock across 4 realtime providers (Supabase Realtime + Ably + Pusher + Socket.io / SSE) covering the 5 shared semantics — presence, broadcast, postgres_changes, room, and reconnect policy — with a real-vs-mock fidelity harness and a `@kiwa-lab/quality-metrics` 11-axis adapter.

v0.1 lays the foundation for the v1.13 milestone dogfood apps (chat / collaboration / dashboards).

v0.2 adds 8 advanced-transport semantics across 3 protocols (WebRTC / WebTransport / HTTP/3-QUIC) and a real-driver env-gate that lifts the 4 provider mocks to real-vs-mock parity when `KIWA_MODE=real` and the provider secrets are set.

## Install

```sh
pnpm add -D @kiwa-lab/realtime @kiwa-lab/quality-metrics
```

## Quick start — 4 provider mocks

### Supabase Realtime

```ts
import { createSupabaseRealtimeMock } from '@kiwa-lab/realtime';

const supabase = createSupabaseRealtimeMock({
  scenarios: {
    'room:1': [
      { kind: 'broadcast', event: 'chat', payload: { text: 'hello' }, delay: 10 },
    ],
  },
});

const channel = supabase.channel('room:1');
await channel
  .on('broadcast', { event: 'chat' }, (payload) => {
    console.log(payload); // { type: 'broadcast', event: 'chat', payload: { text: 'hello' } }
  })
  .subscribe();
```

Supports the full `channel.on('presence' | 'broadcast' | 'postgres_changes', filter, handler)` shape, `channel.track / untrack` for presence, and `channel.send` for broadcasts.

### Ably

```ts
import { createAblyMock } from '@kiwa-lab/realtime';

const ably = createAblyMock({ clientId: 'alice' });
const channel = ably.channels.get('room-1');
await channel.subscribe('chat', (msg) => {
  console.log(msg.data);
});
await channel.publish('chat', { text: 'hi' });
const history = await channel.history({ limit: 10 }); // rewind support
```

`channel.presence.enter / leave / subscribe` mirror the real Ably surface, and `channel.history` returns the last N broadcasts in reverse-chronological order.

### Pusher

```ts
import { createPusherMock } from '@kiwa-lab/realtime';

const pusher = createPusherMock({ userId: 'me' });
const channel = pusher.subscribeChannel('presence-room-1');
channel.bind('pusher:subscription_succeeded', (members) => {
  console.log('now in room, count:', members.count);
});
channel.bind('pusher:member_added', (member) => {
  console.log('joined:', member.id, member.info);
});
```

Presence channels are identified by the `presence-` name prefix, and expose the `pusher:subscription_succeeded / member_added / member_removed` lifecycle events.

### Socket.io

```ts
import { createSocketioMock } from '@kiwa-lab/realtime';

const io = createSocketioMock();
const socket = io.io('/chat');
socket.on('connect', () => console.log('connected'));
socket.on('message', (data) => console.log('recv', data));
await socket.join('room-1');
socket.emit('message', { text: 'hi' });

// server-side namespace emit
io.of('/chat').to('room-1').emit('broadcast', { text: 'server push' });
```

Namespace + room are normalized into a single engine channel key so the mock can validate ordering, backpressure, and reconnect replay without spinning up a real socket server.

## Fidelity harness

```ts
import { runRealtimeFidelityCheck } from '@kiwa-lab/realtime';

const report = await runRealtimeFidelityCheck({
  realDriver, // your real provider adapter — collect real events
  mockDriver, // your mock adapter — collect mock events
  scenarios: [
    'chat-message-broadcast',
    'presence-join-leave',
    'postgres-row-change',
    'room-subscribe-race',
    'reconnect-with-pending',
  ],
});

console.log(report.summary.avgAccuracyScore); // 0.0-1.0
```

Each scenario runs both drivers in parallel and produces a `RealtimeFidelityRecord` with:

- `kindOrderMatch` — event-kind sequence similarity (0-1)
- `payloadMatch` — event payload / name similarity (0-1)
- `accuracyScore` — average of the two, used as the 11-axis release-gate input
- `eventCountDiff` / `totalDurationDiffMs` — quantitative drift metrics

## Quality-metrics adapter

```ts
import { buildRealtimeReport } from '@kiwa-lab/realtime';
import { evaluateReleaseGate } from '@kiwa-lab/quality-metrics';

const qr = buildRealtimeReport({
  provider: '@kiwa-lab/realtime',
  version: '0.1.0',
  fidelity: fidelityReport,
  mockMetrics: supabase.getMetrics(),
  testCount: { behavior: 48, integration: 0, e2e: 0 },
});

const verdict = evaluateReleaseGate(qr);
```

Maps the realtime harness onto the AI-LLM 4 axes (`cost / latency / token / accuracy`) so realtime-shaped harness packages reuse the same 11-axis release gate.

## 5 semantics

| Semantic          | Description                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Presence          | `sync / join / leave` events; per-channel `Map<userId, PresenceMember>` state             |
| Broadcast         | Arbitrary `event + payload` fan-out with per-channel FIFO ordering                        |
| PostgresChanges   | Supabase-style `INSERT / UPDATE / DELETE` CDC events; filter by schema + table            |
| Room              | Socket.io namespace + room 2-level pub/sub, normalized into a single engine channel key   |
| ReconnectPolicy   | Exponential backoff + jitter, pending-event queue with configurable `backpressureLimit`   |

## v0.2 advanced semantics — 3 protocol × 8 axis matrix

| Protocol      | Axis                    | Purpose                                                                                          |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| WebRTC        | `webrtc-signaling`      | Offer / answer + SDP negotiation + ICE candidate exchange + renegotiation                       |
| WebRTC        | `webrtc-data-channel`   | Ordered / unordered + reliable / unreliable + `maxRetransmits` + `binaryType`                    |
| WebRTC        | `webrtc-track`          | `getUserMedia` + `MediaStream` + track add / remove + simulcast layers                           |
| WebRTC        | `webrtc-ice`            | Candidate gathering + connectivity check + TURN relay + trickle ICE                              |
| WebTransport  | `webtransport-uni`      | Unidirectional stream + Datagram + reset stream                                                  |
| WebTransport  | `webtransport-bi`       | Bidirectional stream + flow control window + backpressure + close                                |
| HTTP/3-QUIC   | `http3-push`            | Server push + prioritization + `push_promise` + cancellation                                     |
| HTTP/3-QUIC   | `quic-multiplex`        | Stream multiplex + stream priority + HPACK dynamic table + 0-RTT resumption                      |

```ts
import {
  createWebRtcSignalingMock,
  createWebRtcDataChannelMock,
  createWebRtcTrackMock,
  createWebRtcIceMock,
  createWebTransportUniMock,
  createWebTransportBiMock,
  createHttp3PushMock,
  createQuicMultiplexMock,
  measureSemanticsGrid,
  SEMANTICS_GRID,
} from '@kiwa-lab/realtime';

const signaling = createWebRtcSignalingMock();
signaling.onEvent((event) => console.log(event.kind, event.payload));
const offer = await signaling.createOffer();
const answer = await signaling.createAnswer(offer);
await signaling.emitIceCandidates(3);

// 24 row visual matrix — applicable rows only 8 (each axis lives on its canonical protocol)
console.log(SEMANTICS_GRID.filter((row) => row.applicable).length); // 8
```

`measureSemanticsGrid` runs a caller-supplied `scenario` per axis and returns a 24-row `SemanticsFidelityRow[]` — `applicable=true` rows carry live event counts, and the remaining 16 rows stay as `applicable=false` placeholders so the visual matrix keeps its 3 × 8 shape.

## Real driver env-gate

```ts
import { resolveRealtimeDriverByProvider } from '@kiwa-lab/realtime';

const { driver, isReal, reason } = resolveRealtimeDriverByProvider(
  'supabase',
  (env) => createRealSupabaseDriver({ url: env.SUPABASE_URL, key: env.SUPABASE_ANON_KEY }),
  () => createMockSupabaseDriver(),
);

if (isReal) console.log('real driver active —', reason);
```

`KIWA_MODE=real` + the provider's default env keys (`REAL_DRIVER_REQUIRED_KEYS`) selects the real driver; anything else falls back to the mock driver so tests never accidentally hit an external service.

| Provider   | Required env keys                                                     |
| ---------- | --------------------------------------------------------------------- |
| supabase   | `SUPABASE_URL`, `SUPABASE_ANON_KEY`                                   |
| ably       | `ABLY_API_KEY`                                                        |
| pusher     | `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`      |
| socketio   | `SOCKETIO_URL`                                                        |

## Related packages

- [`@kiwa-lab/ai-llm`](../ai-llm) — 4 SDK LLM mock harness (Anthropic / OpenAI / Vercel AI / LangChain)
- [`@kiwa-lab/quality-metrics`](../quality-metrics) — 11-axis release gate SSOT

## License

MIT
