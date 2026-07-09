# LLM voice streaming + Whisper ASR + Realtime AI inference in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/realtime` v0.3 that models the 3 pieces of a real realtime AI media stack — LLM voice streaming (OpenAI Realtime API + Anthropic voice pattern), Whisper streaming ASR with VAD, and realtime AI inference with latency budget enforcement.

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-voice-streaming && cd kiwa-voice-streaming
pnpm init
pnpm add -D @kiwa-lab/realtime@^0.3 vitest typescript @types/node
```

### 2. LLM voice streaming

`tests/voice.test.ts` — session open → audio chunk send → response chunk receive → turn complete.

```ts
import { describe, expect, it } from 'vitest';
import { createVoiceStreamingMock } from '@kiwa-lab/realtime';

describe('LLM voice streaming', () => {
  it('completes full session turn', async () => {
    const mock = createVoiceStreamingMock({ artificialLatencyMs: 0 });
    await mock.openSession({ sessionId: 's-1', model: 'gpt-4o-realtime', voice: 'alloy' });
    await mock.sendAudioChunk({ sessionId: 's-1', sequenceNumber: 1, byteLength: 8000, durationMs: 200 });
    await mock.receiveResponseChunk({ sessionId: 's-1', sequenceNumber: 1, byteLength: 4000, durationMs: 100 });
    await mock.completeTurn({ sessionId: 's-1', totalDurationMs: 300 });
    expect(mock.getMetrics().custom['turnsCompleted']).toBe(1);
  });
});
```

### 3. Whisper streaming ASR

`tests/whisper.test.ts` — VAD start → audio chunk → partial → final → VAD end.

```ts
import { describe, expect, it } from 'vitest';
import { createWhisperStreamingMock } from '@kiwa-lab/realtime';

describe('Whisper streaming', () => {
  it('handles VAD → transcript flow', async () => {
    const mock = createWhisperStreamingMock({ artificialLatencyMs: 0 });
    await mock.triggerVad({ streamId: 's-1', type: 'start', timestampMs: 0 });
    await mock.sendAudioChunk({ streamId: 's-1', byteLength: 3200, durationMs: 200 });
    await mock.emitPartialTranscript({
      streamId: 's-1',
      text: 'hello',
      startMs: 0,
      endMs: 200,
      confidence: 0.75,
    });
    await mock.emitFinalTranscript({
      streamId: 's-1',
      text: 'hello world',
      startMs: 0,
      endMs: 500,
      confidence: 0.95,
    });
    await mock.triggerVad({ streamId: 's-1', type: 'end', timestampMs: 500 });
    expect(mock.getMetrics().custom['finalsEmitted']).toBe(1);
  });
});
```

### 4. Realtime AI inference budget

`tests/inference.test.ts` — request → response → budget report.

```ts
import { describe, expect, it } from 'vitest';
import { createRealtimeAiInferenceMock } from '@kiwa-lab/realtime';

describe('Realtime AI inference', () => {
  it('flags budget exceeded', async () => {
    const mock = createRealtimeAiInferenceMock({ artificialLatencyMs: 0 });
    await mock.sendRequest({ requestId: 'r-1', frameNumber: 1, modelName: 'yolo-v8', budgetMs: 33 });
    await mock.receiveResponse({ requestId: 'r-1', latencyMs: 40, outputBytes: 512 });
    await mock.reportBudget({ requestId: 'r-1', budgetMs: 33, consumedMs: 40 });
    expect(mock.getMetrics().custom['budgetExceeded']).toBe(1);
  });
});
```

## Run it

```bash
pnpm test
```

All 3 test files pass. Ready to wire to real OpenAI Realtime API + Whisper API + on-device inference stack under `KIWA_MODE=real` + budget guard.
