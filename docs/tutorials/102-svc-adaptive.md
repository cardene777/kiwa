# SVC layer selection + WebCodecs decoder + MoQ datagram FEC in 15 min

## What you'll build

A vitest suite wired to `@kiwa/realtime` v0.3 that models the 3 pieces of a real adaptive media consumer stack — SVC layer selection with scalability mode (L1T1 → L3T3), WebCodecs decoder with key/delta frame handling + reorder buffer, and MoQ datagram delivery with FEC recovery.

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-svc-adaptive && cd kiwa-svc-adaptive
pnpm init
pnpm add -D @kiwa/realtime@^0.3 vitest typescript @types/node
```

### 2. SVC layer selection

`tests/svc.test.ts` — add layer + select spatial/temporal.

```ts
import { describe, expect, it } from 'vitest';
import { createSimulcastSvcMock } from '@kiwa/realtime';

describe('SVC layer selection', () => {
  it('adds L3T3 layer + selects spatial 2 / temporal 2', async () => {
    const mock = createSimulcastSvcMock({ artificialLatencyMs: 0 });
    await mock.addSimulcastLayer({
      layerId: 'high',
      resolution: '1920x1080',
      bitrateKbps: 5000,
      scalabilityMode: 'L3T3',
    });
    await mock.selectSvcLayer({ layerId: 'high', temporalId: 2, spatialId: 2 });
    expect(mock.getMetrics().custom['layersSelected']).toBe(1);
  });
});
```

### 3. WebCodecs decoder

`tests/decoder.test.ts` — configure + decode key/delta + reorder.

```ts
import { describe, expect, it } from 'vitest';
import { createWebCodecsDecoderMock } from '@kiwa/realtime';

describe('WebCodecs decoder', () => {
  it('decodes key + reorders + drops late frame', async () => {
    const mock = createWebCodecsDecoderMock({ artificialLatencyMs: 0 });
    await mock.configure({ decoderId: 'd-1', config: { codec: 'AV1' } });
    await mock.decodeFrame({ decoderId: 'd-1', frameNumber: 1, type: 'key' });
    await mock.reorderFrame({ decoderId: 'd-1', frameNumber: 2, delayMs: 30 });
    await mock.decodeFrame({ decoderId: 'd-1', frameNumber: 3, type: 'delta' });
    await mock.dropFrame({ decoderId: 'd-1', frameNumber: 4, reason: 'budget-exceeded' });
    const m = mock.getMetrics();
    expect(m.custom['framesDecoded']).toBe(2);
    expect(m.custom['framesReordered']).toBe(1);
    expect(m.custom['framesDropped']).toBe(1);
  });
});
```

### 4. MoQ datagram + FEC

`tests/datagram.test.ts` — send datagram + priority + FEC recovery.

```ts
import { describe, expect, it } from 'vitest';
import { createMoqDatagramMediaMock } from '@kiwa/realtime';

describe('MoQ datagram + FEC', () => {
  it('sends datagram, sets priority, recovers via FEC', async () => {
    const mock = createMoqDatagramMediaMock({ artificialLatencyMs: 0 });
    await mock.sendDatagram({ trackName: 'v-1', sequenceNumber: 1, payloadBytes: 300, priority: 5 });
    await mock.setPriority({ trackName: 'v-1', priority: 10 });
    await mock.recoverFec({ trackName: 'v-1', recoveredCount: 3 });
    expect(mock.getMetrics().custom['fecRecovered']).toBe(3);
  });
});
```

## Run it

```bash
pnpm test
```

All 3 test files pass. Combine with tutorial 100 (MoQ + WebCodecs) and tutorial 101 (voice + Whisper + inference) for full realtime III stack coverage.
