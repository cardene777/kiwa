---
title: "kiwa v1.24 released — Edge / Serverless 深化 (advanced edge semantics 8 axis + 3 dogfood edge app)"
emoji: "🌐"
type: "tech"
topics: ["oss", "typescript", "cloudflare", "vercel", "kiwa"]
published: true
---

# kiwa v1.24 released

v1.24 は kiwa の 14 milestone 目です。 v1.14 (横軸拡張、 `@kiwa-lab/edge` v0.1 で fetch handler + KV / R2 / D1 / DurableObject minimal mock + ExecutionContext を land) の後、 v1.24 は edge / serverless mock の上に **8 axis advanced edge semantics 層** を追加、 Durable Object hibernation + WebSocket edge + edge KV eventual consistency + geo-replicated + Cron trigger + subrequest limit + CPU time limit + streaming Response の 8 axis を platform-neutral state machine + strict transition guard として `packages/edge/src/semantics/*` に実装しました。 v1.14 fetch handler mock は first-line contract のまま維持 (v0.1 signature 完全維持)、 8 axis semantics は second-line envelope として並走、 test は adapter 経由 `KIWA_MODE=real` で real platform sandbox に切替可能 (v1.22 で確立した 3 execution mode SSOT を継承)。 v1.11 以降の連続完遂 13 milestone (release gate → 非決定性 → 時間軸 → 横軸拡張 → AI-LLM 深化 → component 縦軸 → Observability v2 → Blockchain 深化 → Framework 深化 → Streaming 深化 → Auth 深化 → Auth 深化 II → Payment 深化) を受けて、 v1.24 は Edge / Serverless 深化 milestone、 kiwa runtime fixture 34 packages はそのまま維持 (edge 既存 package の minor 拡張)。

## 主な追加

### `@kiwa-lab/edge` v1.1.0 (8 axis advanced edge semantics)

v1.14 で land した fetch handler + KV / R2 / D1 / DurableObject minimal mock (`invokeEdgeHandler` / `createKvNamespace` + `EdgeFetchHandler` / `EdgeEnvBindings` / `InvokeEdgeHandlerOptions` / `InvokeEdgeHandlerResult` / `SimulatedExecutionContext`) の signature を完全維持したまま、 v1.24 は `packages/edge/src/semantics/*` に 1 axis = 1 file の pure state machine helper を追加。 各 axis は shared `EdgePlatform` union (`'cloudflare' | 'vercel' | 'deno'`) を受け取り強型 `AxisStep` sequence を emit するため、 test は platform-specific event 名ではなく **transition** に対して assert 可能。

#### 1. `durable-object.ts` — Cloudflare Hibernation API envelope

state machine ... `initialized` → `active` (loops on `requestDurableObject` / `fireAlarm` / `writeStorage`) → `hibernated` / `terminated` (out of scope for v1.1)。 default で Cloudflare Durable Object の transactional storage guarantee + Hibernation-driven wake-up semantics を再現。

```ts
import { createDurableObject, requestDurableObject, fireAlarm, writeStorage } from '@kiwa-lab/edge';

const session = createDurableObject({ id: 'chat-room-1', platform: 'cloudflare' });
// session.state === 'initialized'

await requestDurableObject(session, { url: 'https://chat.example.com/send' });
// session.state === 'active'、 session.requestCount === 1

await writeStorage(session, { key: 'messages', value: ['hello'] });
// session.storageKeys.messages === ['hello']

await fireAlarm(session);
// alarm 経由の re-activation、 session.history に alarm-fired step を append
```

失敗 mode ... merchant app が DO storage の write を transaction 境界外で発火して broadcast 失敗時 rollback せず、 client 側は message 見えているが DO 側 storage に消えている状態が production 発生。 test は ordered `history` sequence が rollback state を finalisation 前に含む assertion で catch。

#### 2. `websocket-edge.ts` — edge WebSocket lifecycle

state machine ... `pending` → `open` → `closed`。 全 3 platform (Cloudflare `WebSocketPair` / Vercel edge websockets / Deno `Deno.upgradeWebSocket`) が 101 Switching Protocols を upgrade で受けるが、 telemetry string は各 platform 別 — 統一 mock でそれを吸収。

```ts
import { requestWebSocketUpgrade, acceptWebSocket, sendMessage, closeWebSocket } from '@kiwa-lab/edge';

const socket = requestWebSocketUpgrade({ id: 'ws-1', platform: 'vercel' });
// socket.state === 'pending'

await acceptWebSocket(socket);
// socket.state === 'open'

await sendMessage(socket, { data: 'hello' });
// socket.messages.length === 1

await closeWebSocket(socket, { code: 1000 });
// socket.state === 'closed'
```

失敗 mode ... merchant app が Hibernation wake-up 後の closed socket に `sendMessage` を試みる、 exception silent swallow で client-side は timeout。 test は throw + expected state の assertion で catch。

#### 3. `edge-kv.ts` — read-through cache with consistency envelope

consistency states ... `consistent` (Deno KV primary) / `eventually-consistent` (Cloudflare KV, Vercel Edge Config, Deno KV replicas)。 全 3 platform edge KV は strong consistency を trade して低遅延 edge read を取る。

```ts
import { createEdgeKvSession, kvRead, kvWrite, kvRangeQuery } from '@kiwa-lab/edge';

const session = createEdgeKvSession({ platform: 'cloudflare', state: 'eventually-consistent' });

await kvWrite(session, { key: 'user:1', value: { name: 'Alice' } });
const { value } = await kvRead(session, { key: 'user:1' });
// cold read → cache 反映 → subsequent read は cache-hit step を emit

const { matches } = await kvRangeQuery(session, { prefix: 'user:', limit: 10 });
// lexicographically sorted match array
```

失敗 mode ... merchant app が replica read で read-your-writes を仮定、 primary に write して lagging replica を読むと stale data。 test は `state === 'eventually-consistent'` の replica read 後の assertion で catch。

#### 4. `geo-replicated.ts` — primary/replica topology with strict sync semantics

state machine ... `in-sync` → `lagging` (on `geoPrimaryWrite` or `markReplicaLagged`) → `in-sync` (only when every replica lag returns to 0) / `conflict-detected` → `in-sync` (on `resolveConflict`)。 Cloudflare Smart Placement + KV replication、 Vercel Edge Config replication、 Deno KV primary/replica topology の共通 envelope を吸収。

```ts
import { createGeoReplicatedSession, geoPrimaryWrite, markReplicaLagged, syncReplica, resolveConflict } from '@kiwa-lab/edge';

const session = createGeoReplicatedSession({
  platform: 'deno',
  primaryRegion: 'us-east',
  replicaRegions: ['eu-west', 'ap-south'],
});

await geoPrimaryWrite(session, { data: { count: 1 } });
// state === 'lagging'、 全 replica に lag 発生

await syncReplica(session, { region: 'eu-west' });
// state === 'lagging' (ap-south 未 sync)

await syncReplica(session, { region: 'ap-south' });
// state === 'in-sync'
```

失敗 mode ... merchant app が partial sync を `in-sync` と誤解釈、 実際は every replica が 0 lag に到達するまで `lagging` のまま。 test は `state === 'lagging'` を全 replica sync まで assert で catch。

### dogfood app 3 種の新規追加

#### `dogfood-cloudflare-workers-durable-object-app` — realtime chat + Hibernation API + storage

- Cloudflare Workers Durable Object + Hibernation API + storage transactional + WebSocket edge broadcast
- realtime chat room + room 別 state + alarm 経由 message purge
- Playwright e2e (chat 2 user join + message broadcast + hibernation → wake up)
- 40 vitest、 全て `createDurableObject` + `requestWebSocketUpgrade` 経由、 `KIWA_MODE=real` で real Miniflare に切替可能

#### `dogfood-vercel-edge-function-app` — Next.js 15 middleware + edge runtime + Vercel KV + SSE

- Next.js 15 middleware + edge runtime + Vercel KV (Redis) + streaming Response (SSE)
- geo-based routing (accept-language + geo IP → region) + edge cache invalidation
- Playwright e2e (region routing + SSE stream + cache invalidation)
- 45 vitest

#### `dogfood-deno-deploy-geo-app` — Fresh + Deno KV geo-replicated + edge cron

- Deno Fresh + Deno KV geo-replicated with strong consistency + Deno Deploy Cron
- multi-region KV write + eventual consistency observation + cron trigger + queue trigger
- Playwright e2e (multi-region write + read-your-writes + cron trigger fire)
- 50 vitest

### tutorial 3 本 + concept doc + migration guide + snippet validation

#### tutorial 42 — Cloudflare Durable Object

15 分完了、 realtime chat room + Hibernation API + storage transactional + WebSocket edge broadcast を Cloudflare Workers から実装。

#### tutorial 43 — Vercel Edge streaming

15 分完了、 Next.js 15 middleware + edge runtime + Vercel KV + streaming Response SSE + geo-based routing を Next.js 15 から実装。

#### tutorial 44 — Deno Deploy geo

15 分完了、 Fresh + Deno KV geo-replicated + Deno Deploy Cron + queue trigger + read-your-writes を Deno Deploy から実装。

#### concept doc `edge-runtime-testing.md`

8 axis SSOT + platform (Cloudflare Workers / Vercel Edge / Deno Deploy) 別 fidelity surface reference。 各 axis の state machine + key function + failure mode + neutralised event 名 mapping を SSOT 化。

#### snippet validation `docs-tutorial-v1.24.test.ts`

tutorial 42-44 の全 code snippet を実 `@kiwa-lab/edge` API import + execute + assertion で走査、 16 test で drift を検知 (`docs-tutorial-v1.21.test.ts` / `docs-tutorial-v1.22.test.ts` / `docs-tutorial-v1.23.test.ts` と同じ pattern)。

## Numbers

- **6 sub-Issue 解決** (#914-#919)
- **6 PR merge** (v1.24-1 + v1.24-2 + v1.24-3 + v1.24-4 + v1.24-5 + 本 publish PR)
- **1 npm minor bump** (`@kiwa-lab/edge` v1.0.2 → v1.1.0) — kiwa runtime fixture 34 packages 維持
- **3 dogfood edge app 新規** with fidelity report → 7 軸 release gate 供給
- **~271 new test** 8 axis semantics (120) + Cloudflare (40) + Vercel (45) + Deno (50) + snippet validation (16)

## なぜ 8 axis (fetch handler 単純ではなく)

edge testing には fetch handler 単純 mock で捕捉不能な 3 失敗 mode がある、 KV / R2 stub を幾ら追加しても。

- **stateful drift** — Durable Object の real lifecycle は `create → serve` の 2 event ではない、 4-event trace (`created` / `requested` / `alarm-fired` / `storage-written`) + transactional storage + Hibernation wake-up。 `Response.status === 200` だけを assert する test は state-machine drift を素通し、 production bug は「storage write が消える」 or 「broadcast が duplicate」 として顕在化。
- **consistency envelope** — real edge KV は strong consistency を trade して edge read の低遅延を取る (Cloudflare KV / Vercel Edge Config / Deno KV replica)。 primary vs replica の distinction を skip する test は read-your-writes bug を素通し、 merchant app が stale-read race で ship される。
- **cross-platform fidelity** — Cloudflare は cron を 3 source (scheduled + queue + email) から発火、 Vercel + Deno は 2 source (scheduled + queue)。 streaming Response backpressure は Vercel が byte、 Cloudflare が chunk。 neutral test surface が上記の違いを **明示 assertion** に変え、 silent regression を防ぐ。

8 axis は 3 target platform の edge envelope を再現する最小 set。 各 axis は `@kiwa-lab/edge/semantics/*` 下の独立 module、 shared `EdgePlatform` union + 強型 `AxisStep` sequence emit で「platform-specific event 名」 ではなく「transition」 に対する assertion を可能にする。

## 14 milestone 連続完遂

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → **v1.24 (Edge / Serverless 深化)**。 v1.11 以降の全 milestone で 6 sub-Issue を完遂。

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100% milestone
- Cache / Data 深化 (Dragonfly / Materialize / Neon)
- L2 深化 (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK 深化 (Noir / Circom / RISC Zero test harness)
- IoT 深化 (MQTT / CoAP / LWM2M)
- DB 深化 (SurrealDB / EdgeDB / Turso)
- Edge / Serverless 深化 II — real driver layer (real Miniflare + wrangler dev + Vercel Edge sandbox + Deno Deploy sandbox testcontainers + `KIWA_MODE=real-required` nightly)

Feedback welcome on which of these should land next. どれから land するかの投票は GitHub Discussions で募集中。
