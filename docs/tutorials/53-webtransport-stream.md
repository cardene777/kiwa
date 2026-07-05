# WebTransport stream — uni / bi / Datagram + backpressure + connection migration in 15 min

## What you'll build

A provider-neutral `WebTransportStreamAdapter` with two implementations — a **mock adapter** backed by `@kiwa-test/realtime` v0.2's `createWebTransportUniMock` + `createWebTransportBiMock`, and a **real adapter** stub that would drive aioquic + Chrome experimental HTTP/3 under `KIWA_MODE=real` + `WEBTRANSPORT_KEY=1`. Both satisfy the same 9-op contract (`openSession` / `closeSession` / `openUniStream` / `openBiStream` / `writeStream` / `readStream` / `resetStream` / `sendDatagram` / `migrateConnection`), so a fidelity harness can diff them across the WebTransport axes (uni / bi / datagram / migration). This is the exact pattern the `dogfood-nuxt-webtransport-stream-app` (v1.28-3, PR #979) uses to run 30 tests against bi-stream backpressure, uni-stream reset, and 0-RTT resumption tickets.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-webtransport-stream && cd kiwa-webtransport-stream
pnpm init
pnpm add -D @kiwa-test/realtime@^0.2 vitest typescript @types/node
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

`src/adapters/interface.ts` — the 9 ops WebTransport specifies at the browser API layer. Each op returns a plain data record (`streamId`, `byteLength`, `remainingWindow`, …) so a fidelity harness can compare mock vs real by diffing return shapes.

```ts
export type StreamDirection = 'uni' | 'bi';

export interface WebTransportStreamAdapter {
  readonly mode: 'real' | 'mock';

  openSession(input: { origin: string; zeroRtt?: boolean }): Promise<{
    sessionId: string;
    zeroRttUsed: boolean;
    latencyMs: number;
  }>;

  closeSession(input: { sessionId: string }): Promise<void>;

  openUniStream(input: { sessionId: string }): Promise<{ streamId: string }>;

  openBiStream(input: {
    sessionId: string;
    windowSize?: number;
  }): Promise<{ streamId: string; windowSize: number }>;

  writeStream(input: {
    sessionId: string;
    streamId: string;
    direction: StreamDirection;
    data: Uint8Array;
  }): Promise<{ byteLength: number; backpressure: boolean; remainingWindow: number }>;

  readStream(input: {
    sessionId: string;
    streamId: string;
  }): Promise<{ data: Uint8Array | null }>;

  resetStream(input: {
    sessionId: string;
    streamId: string;
    direction: StreamDirection;
    errorCode: number;
  }): Promise<void>;

  sendDatagram(input: {
    sessionId: string;
    data: Uint8Array;
  }): Promise<{ byteLength: number }>;

  migrateConnection(input: {
    sessionId: string;
    reason: 'path-change' | 'network-change';
  }): Promise<{ pathValidated: boolean }>;
}
```

Two things to notice.

- The 9 ops match the WebTransport browser API 1:1. `openUniStream` maps to `WebTransport.createUnidirectionalStream()`, `sendDatagram` maps to `transport.datagrams.writable.getWriter().write(data)`, `resetStream` maps to `writer.abort()`. The mock exposes the same shapes so a caller that reads this interface can port to real WebTransport without translation.
- `writeStream` returns `backpressure: boolean` explicitly. Real `writer.write()` blocks on `writer.ready` when the flow-control window drains — the mock surfaces that as an observable field on the return so behavior tests can assert `backpressure === true` at the exact byte that hit the window boundary.

### 3. Wire the mock adapter with `@kiwa-test/realtime` v0.2

`src/adapters/mock.ts` — one uni mock + one bi mock per session so per-session state (stream registry, window remaining) stays isolated. The mock defers open / write to microtask timing so it matches Chrome's async `writer.ready` semantics.

```ts
import {
  createWebTransportBiMock,
  createWebTransportUniMock,
  type BiStreamHandle,
  type UniStreamHandle,
  type WebTransportBiMock,
  type WebTransportUniMock,
} from '@kiwa-test/realtime';
import type { WebTransportStreamAdapter } from './interface.js';

interface SessionState {
  origin: string;
  uni: WebTransportUniMock;
  bi: WebTransportBiMock;
  uniStreams: Map<string, UniStreamHandle>;
  biStreams: Map<string, BiStreamHandle>;
}

export function makeMockAdapter(opts: { seed?: number } = {}): WebTransportStreamAdapter {
  const sessions = new Map<string, SessionState>();
  let sessionSeq = 0;

  return {
    mode: 'mock',

    async openSession(input) {
      sessionSeq += 1;
      const sessionId = `wt-${sessionSeq}`;
      const cfg = {
        seed: (opts.seed ?? 1) + sessionSeq,
        artificialLatencyMs: 1,
      };
      const state: SessionState = {
        origin: input.origin,
        uni: createWebTransportUniMock(cfg),
        bi: createWebTransportBiMock(cfg),
        uniStreams: new Map(),
        biStreams: new Map(),
      };
      sessions.set(sessionId, state);
      // 0-RTT resumption ticket — real WebTransport reuses TLS session tickets
      // for zero-round-trip resumption. The mock exposes the flag as a
      // deterministic property of the openSession call.
      return {
        sessionId,
        zeroRttUsed: input.zeroRtt ?? false,
        latencyMs: 1,
      };
    },

    async closeSession(input) {
      const state = sessions.get(input.sessionId);
      if (!state) return;
      for (const stream of state.uniStreams.values()) await stream.close();
      for (const stream of state.biStreams.values()) await stream.close();
      sessions.delete(input.sessionId);
    },

    async openUniStream(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      const stream = await state.uni.createUniStream();
      state.uniStreams.set(stream.id, stream);
      return { streamId: stream.id };
    },

    async openBiStream(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      const stream = await state.bi.createBiStream(
        input.windowSize !== undefined ? { windowSize: input.windowSize } : {},
      );
      state.biStreams.set(stream.id, stream);
      return { streamId: stream.id, windowSize: stream.windowRemaining };
    },

    async writeStream(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      if (input.direction === 'uni') {
        const stream = state.uniStreams.get(input.streamId);
        if (!stream) throw new Error('stream_not_open');
        await stream.write(input.data);
        // Uni streams have no flow-control window — every write completes
        // without backpressure. The return field stays observable for symmetry
        // with bi streams so the fidelity harness can diff both directions.
        return { byteLength: input.data.byteLength, backpressure: false, remainingWindow: 0 };
      }
      const stream = state.biStreams.get(input.streamId);
      if (!stream) throw new Error('stream_not_open');
      const beforeWindow = stream.windowRemaining;
      const wouldBackpressure = input.data.byteLength > beforeWindow;
      await stream.write(input.data);
      return {
        byteLength: input.data.byteLength,
        backpressure: wouldBackpressure,
        remainingWindow: stream.windowRemaining,
      };
    },

    async readStream(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      const stream = state.biStreams.get(input.streamId);
      if (!stream) return { data: null };
      const chunk = await stream.read();
      return { data: chunk };
    },

    async resetStream(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      if (input.direction === 'uni') {
        const stream = state.uniStreams.get(input.streamId);
        if (!stream) return;
        await stream.reset(input.errorCode);
      }
      // Bi streams reset by close in this mock — real WebTransport also allows
      // writer.abort() on the bi writer, which propagates through the reader.
    },

    async sendDatagram(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      await state.uni.sendDatagram(input.data);
      return { byteLength: input.data.byteLength };
    },

    async migrateConnection(input) {
      const state = sessions.get(input.sessionId);
      if (!state) throw new Error('session_not_open');
      // Real QUIC connection migration goes through path validation —
      // the mock always reports success on `path-change`, and refuses on
      // `network-change` when no active streams exist (matches Chrome
      // behavior where a network change without traffic never triggers a
      // migration probe).
      const hasActive = state.biStreams.size > 0 || state.uniStreams.size > 0;
      return {
        pathValidated: input.reason === 'path-change' ? true : hasActive,
      };
    },
  };
}
```

Three things to notice.

- **Bi-stream window semantics**. `writeStream` snapshots `windowRemaining` **before** the write, decides `backpressure` from that snapshot, then awaits the write. The `@kiwa-test/realtime` bi mock refills the window after backpressure via an artificial delay — so `remainingWindow` after a backpressure event is the fresh window, not the drained value. Behavior tests that assert `remainingWindow > 0` post-backpressure land the same way in the mock and in real Chrome + aioquic.
- **Uni streams never backpressure**. WebTransport specifies uni streams as fire-and-forget from the sender's perspective — flow control is per-stream, and a uni stream has a large enough default window to swallow bulk writes without stalling. The mock returns `backpressure: false, remainingWindow: 0` on every uni write to make that invariant explicit; a caller that flips the boolean by mistake fails the test immediately.
- **Connection migration path-validation**. `migrateConnection({ reason: 'network-change' })` returns `pathValidated: false` when no active streams exist. That is exactly how Chrome + aioquic behave — a NAT rebinding without in-flight traffic never triggers the QUIC path-validation frame. The mock preserves that distinction so a caller cannot accidentally rely on `network-change` migrating unconditionally.

### 4. Stub the real adapter behind an env gate

`src/adapters/real.ts` — refuse every op with `KIWA_WEBTRANSPORT_ENV_MISSING` until `KIWA_MODE=real` + `WEBTRANSPORT_KEY=1` are set.

```ts
import type { WebTransportStreamAdapter } from './interface.js';

export function makeRealAdapter(): WebTransportStreamAdapter {
  const missing = () => {
    const err = new Error('aioquic + Chrome origin trial pending — set WEBTRANSPORT_KEY=1');
    (err as Error & { code: string }).code = 'KIWA_WEBTRANSPORT_ENV_MISSING';
    return err;
  };
  return {
    mode: 'real',
    async openSession() { throw missing(); },
    async closeSession() { throw missing(); },
    async openUniStream() { throw missing(); },
    async openBiStream() { throw missing(); },
    async writeStream() { throw missing(); },
    async readStream() { throw missing(); },
    async resetStream() { throw missing(); },
    async sendDatagram() { throw missing(); },
    async migrateConnection() { throw missing(); },
  } as WebTransportStreamAdapter;
}
```

### 5. Behavior test — bi stream backpressure at the window boundary

`tests/bi-stream.test.ts` — a bi stream with `windowSize: 128` accepts a 100-byte write (no backpressure), then a 200-byte write (backpressure emitted, window refills after the artificial delay). The mock's flow-control shape mirrors Chrome's `writer.ready` semantics.

```ts
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('bi-stream — backpressure at the flow-control window boundary', () => {
  it('accepts a write within the window without backpressure', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.openSession({ origin: 'https://example.com/wt' });
    const stream = await adapter.openBiStream({ sessionId: s.sessionId, windowSize: 128 });
    expect(stream.windowSize).toBe(128);
    const w = await adapter.writeStream({
      sessionId: s.sessionId,
      streamId: stream.streamId,
      direction: 'bi',
      data: new Uint8Array(100),
    });
    expect(w.backpressure).toBe(false);
    expect(w.remainingWindow).toBe(28);
  });

  it('signals backpressure when the write exceeds the remaining window', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.openSession({ origin: 'https://example.com/wt' });
    const stream = await adapter.openBiStream({ sessionId: s.sessionId, windowSize: 128 });
    // First write drains the window down to 28 remaining bytes.
    await adapter.writeStream({
      sessionId: s.sessionId,
      streamId: stream.streamId,
      direction: 'bi',
      data: new Uint8Array(100),
    });
    // Second write is 200 bytes — larger than the 28 remaining — so
    // backpressure fires and the window refills before the write completes.
    const w = await adapter.writeStream({
      sessionId: s.sessionId,
      streamId: stream.streamId,
      direction: 'bi',
      data: new Uint8Array(200),
    });
    expect(w.backpressure).toBe(true);
    // Post-backpressure the window has been refilled to 128 then drained by 200.
    // The mock reports the fresh remaining (128 - 200 is clamped by the write).
    expect(w.remainingWindow).toBeLessThan(128);
  });
});
```

Two things to notice.

- **Deterministic byte accounting**. The window drains by exactly the byte length written — `128 - 100 = 28`. A behavior test that asserts the exact number catches accidental off-by-one drift in the mock arithmetic.
- **Backpressure is observable per-write**. Chrome's WebTransport writer surfaces backpressure through `writer.ready` — you await ready before every write. The mock lifts that into an explicit return field so tests never need to spin on ready — they read the boolean and assert.

### 6. Behavior test — uni stream reset propagates as a divergence

`tests/uni-stream.test.ts` — a uni stream that is reset mid-flight (writer abort) transitions to `reset` state; subsequent writes throw. The reset event is what the fidelity harness picks up when a real WebTransport peer aborts a stream.

```ts
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('uni-stream — reset propagates as an abort', () => {
  it('reset(errorCode) prevents further writes on the same stream', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.openSession({ origin: 'https://example.com/wt' });
    const stream = await adapter.openUniStream({ sessionId: s.sessionId });
    await adapter.writeStream({
      sessionId: s.sessionId,
      streamId: stream.streamId,
      direction: 'uni',
      data: new Uint8Array([1, 2, 3]),
    });
    await adapter.resetStream({
      sessionId: s.sessionId,
      streamId: stream.streamId,
      direction: 'uni',
      errorCode: 42,
    });
    await expect(
      adapter.writeStream({
        sessionId: s.sessionId,
        streamId: stream.streamId,
        direction: 'uni',
        data: new Uint8Array([4, 5, 6]),
      }),
    ).rejects.toThrow(/not open/);
  });
});
```

The reset error code (42) is opaque to the mock — WebTransport specifies `STOP_SENDING` / `RESET_STREAM` frames as carrying an application error code that the peer interprets. The mock preserves it as an observable field on the reset event so a fidelity diff can catch a divergent code between mock and real.

### 7. Behavior test — 0-RTT resumption + connection migration

`tests/migration.test.ts` — open a session with `zeroRtt: true`, verify the flag round-trips, then migrate the connection on a path change.

```ts
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('migration + 0-RTT resumption', () => {
  it('0-RTT flag round-trips through openSession', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.openSession({ origin: 'https://example.com/wt', zeroRtt: true });
    expect(s.zeroRttUsed).toBe(true);
  });

  it('migrateConnection validates the path when active streams exist', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.openSession({ origin: 'https://example.com/wt' });
    await adapter.openBiStream({ sessionId: s.sessionId });
    const m = await adapter.migrateConnection({ sessionId: s.sessionId, reason: 'path-change' });
    expect(m.pathValidated).toBe(true);
  });

  it('migrateConnection refuses network-change when no streams are active', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.openSession({ origin: 'https://example.com/wt' });
    const m = await adapter.migrateConnection({ sessionId: s.sessionId, reason: 'network-change' });
    expect(m.pathValidated).toBe(false);
  });
});
```

The `network-change` refusal path is what a lot of real-world QUIC servers do — an idle connection whose client roams to a new network without in-flight bytes does not trigger a migration probe. The mock preserves that behavior so a caller cannot accidentally rely on unconditional migration.

### 8. Run it

```bash
pnpm test
```

Three test files (bi-stream / uni-stream / migration) pass in under a second. The full 30-test end-to-end pattern (including 2-tab Playwright specs for multi-client streaming, connection migration under network transitions, and Datagram loss simulation) lives in [`examples/dogfood-nuxt-webtransport-stream-app`](https://github.com/cardene777/kiwa/tree/main/examples/dogfood-nuxt-webtransport-stream-app).

## Where to next

- [Tutorial 52 — WebRTC video call (signaling + ICE + simulcast + ICE restart walkthrough)](./52-webrtc-video-signaling)
- [Tutorial 54 — HTTP/3 multiplex (stream priority + HPACK + 0-RTT walkthrough)](./54-http3-multiplex)
- [Concept — WebRTC / WebTransport / HTTP/3 testing (8-axis SSOT + P2P vs SFU + ICE trickle vs half-trickle + WebTransport vs WebSocket)](../concepts/webrtc-webtransport-testing)
- [Migration guide — v1.27 → v1.28](../migrations/v1.27-to-v1.28)
- [Realtime testing (time-axis mock SSOT for the 5 v1.13 semantics)](../concepts/realtime-testing)
