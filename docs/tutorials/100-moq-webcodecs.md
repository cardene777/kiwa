# MoQ + WebCodecs — Media over QUIC track delivery + hardware-accelerated encode + Simulcast/SVC in 15 min

## What you'll build

A vitest suite wired to `@kiwa/realtime` v0.3 that models the 3 pieces of a real MoQ + WebCodecs media stack — MoQT track announce + subscribe + object delivery, WebCodecs encoder direct API with hardware acceleration hints, and Simulcast/SVC layer selection + bitrate adaptation.

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-moq-webcodecs && cd kiwa-moq-webcodecs
pnpm init
pnpm add -D @kiwa/realtime@^0.3 vitest typescript @types/node
```

### 2. MoQT track delivery

`tests/moq.test.ts` — announce → subscribe → send object.

```ts
import { describe, expect, it } from 'vitest';
import { createMoqFetchMock } from '@kiwa/realtime';

describe('MoQT delivery', () => {
  it('announces and delivers object', async () => {
    const mock = createMoqFetchMock({ artificialLatencyMs: 0 });
    await mock.announceTrack({ trackName: 'video-1', namespace: 'live', authInfo: 'token' });
    await mock.subscribeTrack({ trackName: 'video-1', namespace: 'live' });
    await mock.sendObject({ trackName: 'video-1', groupId: 1, objectId: 1, payloadBytes: 1500 });
    expect(mock.getMetrics().custom['objectsSent']).toBe(1);
    expect(mock.getMetrics().custom['bytesSent']).toBe(1500);
  });
});
```

### 3. WebCodecs encoder

`tests/encoder.test.ts` — configure + encode + hardware report.

```ts
import { describe, expect, it } from 'vitest';
import { createWebCodecsEncoderMock } from '@kiwa/realtime';

describe('WebCodecs encoder', () => {
  it('configures with H264 + encodes with hardware path', async () => {
    const mock = createWebCodecsEncoderMock({ artificialLatencyMs: 0 });
    await mock.configure({
      encoderId: 'e-1',
      config: { codec: 'H264', width: 1280, height: 720, bitrate: 2_000_000, hardwareAcceleration: 'prefer-hardware' },
    });
    await mock.encodeFrame({ encoderId: 'e-1', frameNumber: 1, byteLength: 5000 });
    await mock.reportHardwareUsed({ encoderId: 'e-1', hardware: true });
    expect(mock.getMetrics().custom['framesEncoded']).toBe(1);
    expect(mock.getMetrics().custom['hardwarePath']).toBe(1);
  });
});
```

### 4. Simulcast + SVC

`tests/simulcast.test.ts` — layer add + select + adapt bitrate.

```ts
import { describe, expect, it } from 'vitest';
import { createSimulcastSvcMock } from '@kiwa/realtime';

describe('Simulcast + SVC', () => {
  it('adds L3T3 layer and adapts bitrate', async () => {
    const mock = createSimulcastSvcMock({ artificialLatencyMs: 0 });
    await mock.addSimulcastLayer({
      layerId: 'high',
      resolution: '1920x1080',
      bitrateKbps: 5000,
      scalabilityMode: 'L3T3',
    });
    await mock.selectSvcLayer({ layerId: 'high', temporalId: 2, spatialId: 2 });
    await mock.adaptBitrate({ layerId: 'high', targetKbps: 3000, reason: 'network' });
    expect(mock.getMetrics().custom['bitrateAdaptations']).toBe(1);
  });
});
```

## Run it

```bash
pnpm test
```

3 test files pass. Ready to wire into a real Cloudflare Stream / MoQ relay + native WebCodecs + WebRTC Simulcast stack under `KIWA_MODE=real`.
