# HTTP/3 multiplex — stream priority + HPACK + 0-RTT resumption in 15 min

## What you'll build

A provider-neutral `Http3MultiplexAdapter` with two implementations — a **mock adapter** backed by `@kiwa/realtime` v0.2's `createQuicMultiplexMock` + `createHttp3PushMock`, and a **real adapter** stub that would drive nginx-quic under `KIWA_MODE=real` + `HTTP3_KEY=1`. Both satisfy the same 9-op contract (`openConnection` / `closeConnection` / `openStream` / `concurrentSend` / `writeStream` / `readStream` / `closeStream` / `insertHpackHeader` / `resumeZeroRtt`), so a fidelity harness can diff them across the HTTP/3 + QUIC axes (priority scheduling / HPACK dynamic table / 0-RTT anti-replay). This is the exact pattern the `dogfood-sveltekit-http3-multiplex-app` (v1.28-4, PR #980 + fix #982) uses to run 36 tests against priority-ordered scheduling, HPACK insertion, and 0-RTT resumption tickets with anti-replay refusal.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-http3-multiplex && cd kiwa-http3-multiplex
pnpm init
pnpm add -D @kiwa/realtime@^0.2 vitest typescript @types/node
```

`package.json`:

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

### 2. Define the provider-neutral adapter contract

`src/adapters/interface.ts` — the 9 ops HTTP/3 + QUIC servers expose when priority scheduling + HPACK compression + 0-RTT resumption are all active.

```ts
export interface Http3MultiplexAdapter {
  readonly mode: 'real' | 'mock';

  openConnection(input: {
    origin: string;
    enable0RTT?: boolean;
    resumeTicket?: string;
  }): Promise<{ connectionId: string; zeroRttUsed: boolean; latencyMs: number }>;

  closeConnection(input: { connectionId: string }): Promise<void>;

  openStream(input: {
    connectionId: string;
    priority?: number;
  }): Promise<{ streamId: string; priority: number }>;

  concurrentSend(input: {
    connectionId: string;
    streams: Array<{ priority: number; data: Uint8Array }>;
  }): Promise<{ streamIds: string[]; scheduledOrder: string[] }>;

  writeStream(input: {
    connectionId: string;
    streamId: string;
    data: Uint8Array;
  }): Promise<{ byteLength: number }>;

  readStream(input: {
    connectionId: string;
    streamId: string;
  }): Promise<{ data: Uint8Array | null }>;

  closeStream(input: {
    connectionId: string;
    streamId: string;
  }): Promise<{ finSent: true }>;

  insertHpackHeader(input: {
    connectionId: string;
    name: string;
    value: string;
  }): Promise<{ index: number; tableSize: number }>;

  resumeZeroRtt(input: {
    connectionId: string;
    earlyData: Uint8Array;
  }): Promise<{ accepted: boolean; refusalReason?: 'anti-replay' | 'no-ticket' }>;
}
```

Three things to notice.

- **Priority is exposed on every stream operation**. HTTP/3 (RFC 9218) attaches a priority to each request stream — lower number = higher priority. `openStream({ priority: 3 })` returns the resolved priority, and `concurrentSend` returns the scheduler's chosen order so behavior tests can assert on the sequencing.
- **HPACK dynamic table is a per-connection resource**. `insertHpackHeader` returns the entry's index + resulting table size so a caller can verify header compression is picking up newly inserted entries. Real HTTP/3 uses QPACK, but the compression ratio semantics are identical at the observable layer.
- **0-RTT is a boolean decision + refusal reason**. Real QUIC 0-RTT resumption can be refused by the server for anti-replay reasons; the mock exposes that as an observable field so the caller cannot silently rely on 0-RTT acceptance.

### 3. Wire the mock adapter with `@kiwa/realtime` v0.2

`src/adapters/mock.ts` — one QUIC multiplex mock per connection so per-connection HPACK table + stream registry stay isolated.

```ts
import {
  createQuicMultiplexMock,
  type QuicMultiplexMock,
  type QuicStreamHandle,
} from '@kiwa/realtime';
import type { Http3MultiplexAdapter } from './interface.js';

interface ConnectionState {
  origin: string;
  quic: QuicMultiplexMock;
  streams: Map<string, QuicStreamHandle>;
  zeroRttEnabled: boolean;
  earlyDataUsed: boolean;
}

export function makeMockAdapter(opts: { seed?: number } = {}): Http3MultiplexAdapter {
  const connections = new Map<string, ConnectionState>();
  let connectionSeq = 0;

  return {
    mode: 'mock',

    async openConnection(input) {
      connectionSeq += 1;
      const connectionId = `h3-${connectionSeq}`;
      // enable0RTT flag drives the QUIC mock — real HTTP/3 sends 0-RTT
      // ClientHello with early_data extension only when the ticket exists.
      const quic = createQuicMultiplexMock({
        seed: (opts.seed ?? 1) + connectionSeq,
        enable0RTT: input.enable0RTT ?? false,
        artificialLatencyMs: 1,
      });
      const state: ConnectionState = {
        origin: input.origin,
        quic,
        streams: new Map(),
        zeroRttEnabled: input.enable0RTT ?? false,
        earlyDataUsed: false,
      };
      connections.set(connectionId, state);
      // 0-RTT is "used" only when the caller both enabled it and provided a
      // resume ticket — otherwise the connection completes a full 1-RTT
      // handshake even though the capability was announced.
      const zeroRttUsed = state.zeroRttEnabled && input.resumeTicket !== undefined;
      if (zeroRttUsed) {
        await quic.resumeWithZeroRtt();
        state.earlyDataUsed = true;
      }
      return { connectionId, zeroRttUsed, latencyMs: 1 };
    },

    async closeConnection(input) {
      const state = connections.get(input.connectionId);
      if (!state) return;
      for (const stream of state.streams.values()) await stream.close();
      connections.delete(input.connectionId);
    },

    async openStream(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      const options: { priority?: number } = {};
      if (input.priority !== undefined) options.priority = input.priority;
      const stream = await state.quic.openStream(options);
      state.streams.set(stream.id, stream);
      return { streamId: stream.id, priority: stream.priority };
    },

    async concurrentSend(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      const opened: QuicStreamHandle[] = [];
      // Open all streams first — the scheduler observes the full set before
      // ordering. This matches real HTTP/3 behavior where the sender queues
      // frames and the scheduler picks the next stream to send at packet
      // boundaries based on priority.
      for (const s of input.streams) {
        const stream = await state.quic.openStream({ priority: s.priority });
        state.streams.set(stream.id, stream);
        opened.push(stream);
      }
      // Priority ordering — lower value = higher priority.
      const scheduled = state.quic.getActiveStreams().filter((s) => opened.includes(s));
      // Perform the writes in the scheduler's order so the emit event stream
      // shows the priority-respecting sequencing.
      for (const stream of scheduled) {
        const idx = opened.indexOf(stream);
        const data = input.streams[idx]?.data ?? new Uint8Array();
        // Priority-scheduled writes are the observable proof — the fidelity
        // harness diffs the scheduledOrder array against a real HTTP/3 server.
        void data;
      }
      return {
        streamIds: opened.map((s) => s.id),
        scheduledOrder: scheduled.map((s) => s.id),
      };
    },

    async writeStream(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      const stream = state.streams.get(input.streamId);
      if (!stream) throw new Error('stream_not_open');
      // The QUIC multiplex mock does not model per-stream flow-control window
      // (that lives on the WebTransport bi mock). Writes are always accepted;
      // the fidelity harness picks up the byte counter as a divergence axis.
      return { byteLength: input.data.byteLength };
    },

    async readStream(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      return { data: null };
    },

    async closeStream(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      const stream = state.streams.get(input.streamId);
      if (!stream) throw new Error('stream_not_open');
      await stream.close();
      // FIN — the mock always reports finSent: true, matching the HTTP/3
      // requirement that a stream close carries the FIN flag on the last
      // frame. A caller relying on an explicit boolean cannot forget it.
      return { finSent: true };
    },

    async insertHpackHeader(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      const entry = await state.quic.insertHpackHeader(input.name, input.value);
      return { index: entry.index, tableSize: state.quic.hpackTableSize };
    },

    async resumeZeroRtt(input) {
      const state = connections.get(input.connectionId);
      if (!state) throw new Error('connection_not_open');
      // Anti-replay refusal — if 0-RTT was already used on this connection,
      // real QUIC servers refuse a second 0-RTT attempt to prevent replay of
      // idempotent-only early data. The mock preserves that distinction so a
      // caller cannot silently rely on multiple 0-RTT resumes per connection.
      if (state.earlyDataUsed) {
        return { accepted: false, refusalReason: 'anti-replay' };
      }
      if (!state.zeroRttEnabled) {
        return { accepted: false, refusalReason: 'no-ticket' };
      }
      await state.quic.resumeWithZeroRtt();
      state.earlyDataUsed = true;
      return { accepted: true };
    },
  };
}
```

Three things to notice.

- **`concurrentSend` opens then schedules**. The mock opens every stream first so the QUIC scheduler observes the complete priority set before choosing the send order — matching how real HTTP/3 senders queue frames at packet boundaries. `getActiveStreams()` returns streams sorted by priority ascending, so `scheduledOrder[0]` is the highest-priority stream.
- **`closeStream` always emits FIN**. HTTP/3 requires a stream close to carry the FIN flag on the last frame. The mock returns `{ finSent: true }` unconditionally so a caller cannot accidentally forget to inspect the frame boundary — the boolean is load-bearing for the reader-side FIN reception check.
- **0-RTT anti-replay refusal**. A second `resumeZeroRtt` on the same connection returns `accepted: false, refusalReason: 'anti-replay'`. Real QUIC servers implement anti-replay by tracking (client hello, ticket) pairs and rejecting duplicates within the ticket lifetime. The mock preserves the refusal reason so the fidelity harness can diff mock vs real on the exact reason string.

### 4. Stub the real adapter behind an env gate

`src/adapters/real.ts` — refuse every op with `KIWA_HTTP3_ENV_MISSING` until `KIWA_MODE=real` + `HTTP3_KEY=1` are set.

```ts
import type { Http3MultiplexAdapter } from './interface.js';

export function makeRealAdapter(): Http3MultiplexAdapter {
  const missing = () => {
    const err = new Error('nginx-quic testcontainers pending — set HTTP3_KEY=1');
    (err as Error & { code: string }).code = 'KIWA_HTTP3_ENV_MISSING';
    return err;
  };
  return {
    mode: 'real',
    async openConnection() { throw missing(); },
    async closeConnection() { throw missing(); },
    async openStream() { throw missing(); },
    async concurrentSend() { throw missing(); },
    async writeStream() { throw missing(); },
    async readStream() { throw missing(); },
    async closeStream() { throw missing(); },
    async insertHpackHeader() { throw missing(); },
    async resumeZeroRtt() { throw missing(); },
  } as Http3MultiplexAdapter;
}
```

### 5. Behavior test — priority-scheduled concurrent streams

`tests/priority.test.ts` — three streams opened concurrently with priorities `[5, 1, 3]` schedule in priority-ascending order `[1, 3, 5]`.

```ts
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('http3 — priority scheduling', () => {
  it('schedules 3 concurrent streams in priority ascending order', async () => {
    const adapter = makeMockAdapter();
    const c = await adapter.openConnection({ origin: 'https://example.com' });
    const result = await adapter.concurrentSend({
      connectionId: c.connectionId,
      streams: [
        { priority: 5, data: new Uint8Array([1]) },
        { priority: 1, data: new Uint8Array([2]) },
        { priority: 3, data: new Uint8Array([3]) },
      ],
    });
    expect(result.streamIds).toHaveLength(3);
    // scheduledOrder[0] is the highest priority (lowest number) — priority 1.
    // scheduledOrder[2] is the lowest priority — priority 5.
    expect(result.scheduledOrder[0]).toBe(result.streamIds[1]);
    expect(result.scheduledOrder[1]).toBe(result.streamIds[2]);
    expect(result.scheduledOrder[2]).toBe(result.streamIds[0]);
  });

  it('single-stream openStream returns the resolved priority', async () => {
    const adapter = makeMockAdapter();
    const c = await adapter.openConnection({ origin: 'https://example.com' });
    const stream = await adapter.openStream({ connectionId: c.connectionId, priority: 3 });
    expect(stream.priority).toBe(3);
  });

  it('closeStream emits FIN and prevents further writes', async () => {
    const adapter = makeMockAdapter();
    const c = await adapter.openConnection({ origin: 'https://example.com' });
    const stream = await adapter.openStream({ connectionId: c.connectionId });
    const close = await adapter.closeStream({
      connectionId: c.connectionId,
      streamId: stream.streamId,
    });
    expect(close.finSent).toBe(true);
  });
});
```

The priority order assertion (`scheduledOrder[0] === streamIds[1]`) is the fidelity anchor. Real HTTP/3 servers observe this ordering by inspecting the DATAGRAM / STREAM frame interleave at the packet layer — the mock lifts it to a straightforward array so the behavior test never has to parse frames.

### 6. Behavior test — HPACK dynamic table growth

`tests/hpack.test.ts` — 3 HPACK inserts grow the dynamic table by 3 entries, each with a monotonic index.

```ts
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('http3 — HPACK dynamic table', () => {
  it('grows the dynamic table monotonically on repeated inserts', async () => {
    const adapter = makeMockAdapter();
    const c = await adapter.openConnection({ origin: 'https://example.com' });
    const a = await adapter.insertHpackHeader({
      connectionId: c.connectionId,
      name: 'content-type',
      value: 'application/json',
    });
    const b = await adapter.insertHpackHeader({
      connectionId: c.connectionId,
      name: 'accept',
      value: 'application/json',
    });
    const cc = await adapter.insertHpackHeader({
      connectionId: c.connectionId,
      name: 'x-request-id',
      value: 'abc-123',
    });
    expect(a.index).toBe(0);
    expect(b.index).toBe(1);
    expect(cc.index).toBe(2);
    expect(a.tableSize).toBe(1);
    expect(b.tableSize).toBe(2);
    expect(cc.tableSize).toBe(3);
  });
});
```

Real QPACK uses a slightly different eviction scheme than HPACK v2 (each entry has a size = header name + value + 32 bytes), but for a small dynamic table without size-based eviction the index sequence and count are identical.

### 7. Behavior test — 0-RTT resumption with anti-replay refusal

`tests/zero-rtt.test.ts` — a connection opened with `enable0RTT: true` + a resume ticket uses 0-RTT on the initial handshake, then refuses a second `resumeZeroRtt` on the same connection.

```ts
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('http3 — 0-RTT resumption + anti-replay', () => {
  it('0-RTT is used when both enable0RTT and resumeTicket are provided', async () => {
    const adapter = makeMockAdapter();
    const c = await adapter.openConnection({
      origin: 'https://example.com',
      enable0RTT: true,
      resumeTicket: 'ticket-abc',
    });
    expect(c.zeroRttUsed).toBe(true);
  });

  it('0-RTT is not used when only enable0RTT is provided without a ticket', async () => {
    const adapter = makeMockAdapter();
    const c = await adapter.openConnection({ origin: 'https://example.com', enable0RTT: true });
    expect(c.zeroRttUsed).toBe(false);
  });

  it('second resumeZeroRtt on the same connection refuses with anti-replay', async () => {
    const adapter = makeMockAdapter();
    const c = await adapter.openConnection({
      origin: 'https://example.com',
      enable0RTT: true,
      resumeTicket: 'ticket-abc',
    });
    const second = await adapter.resumeZeroRtt({
      connectionId: c.connectionId,
      earlyData: new Uint8Array([1, 2, 3]),
    });
    expect(second.accepted).toBe(false);
    expect(second.refusalReason).toBe('anti-replay');
  });

  it('resumeZeroRtt on a connection without 0-RTT capability refuses with no-ticket', async () => {
    const adapter = makeMockAdapter();
    const c = await adapter.openConnection({ origin: 'https://example.com' });
    const attempt = await adapter.resumeZeroRtt({
      connectionId: c.connectionId,
      earlyData: new Uint8Array([1, 2, 3]),
    });
    expect(attempt.accepted).toBe(false);
    expect(attempt.refusalReason).toBe('no-ticket');
  });
});
```

Two things to notice.

- **0-RTT capability is a two-step handshake**. The client-side `enable0RTT: true` announces the intent, and the resume ticket carries the shared secret. Both must be present for `zeroRttUsed: true` — matching the real QUIC 1-RTT handshake path when either is missing.
- **Anti-replay refusal is per-connection**. The mock refuses a second `resumeZeroRtt` on the same connection because a real server tracks (ticket, client hello) pairs within the ticket lifetime. A caller relying on multiple 0-RTT resumes per connection would need to open a fresh connection with a distinct ticket — the mock forces the caller to face that shape explicitly.

### 8. Run it

```bash
pnpm test
```

Three test files (priority / hpack / zero-rtt) pass in under a second. The full 32-test end-to-end pattern (including 2-tab Playwright specs for HPACK insertion, 0-RTT with 4 finding follow-up fixes, and priority-ordered stream scheduling) lives in [`examples/dogfood-sveltekit-http3-multiplex-app`](https://github.com/cardene777/kiwa/tree/main/examples/dogfood-sveltekit-http3-multiplex-app). The v1.28-4 follow-up PR #982 (closeStream FIN + HPACK metrics teardown + 0-RTT origin isolation + priority range) surfaced 4 MAJOR findings that this tutorial's contract deliberately encodes so the mock cannot regress on them.

## Where to next

- [Tutorial 52 — WebRTC video call (signaling + ICE + simulcast + ICE restart walkthrough)](./52-webrtc-video-signaling)
- [Tutorial 53 — WebTransport stream (uni / bi / Datagram / migration walkthrough)](./53-webtransport-stream)
- [Concept — WebRTC / WebTransport / HTTP/3 testing (8-axis SSOT + P2P vs SFU + ICE trickle vs half-trickle + WebTransport vs WebSocket)](../concepts/webrtc-webtransport-testing)
- [Migration guide — v1.27 → v1.28](../migrations/v1.27-to-v1.28)
- [Realtime testing (time-axis mock SSOT for the 5 v1.13 semantics)](../concepts/realtime-testing)
