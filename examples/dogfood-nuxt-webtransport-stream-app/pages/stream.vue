<script setup lang="ts">
/**
 * `/stream` — WebTransport stream UI for the dogfood app. Users open a
 * session, allocate uni + bi streams, send + receive payloads, and observe
 * datagram round-trips. All ops route through `/api/stream` and `/api/reset`
 * so the same adapter contract drives both the vitest suite and the browser
 * flows the Playwright suite exercises.
 */

import { ref } from 'vue';

interface StreamLogEntry {
  ts: number;
  kind: string;
  detail: string;
}

const sessionId = ref('sess-' + Math.random().toString(36).slice(2, 8));
const uniStreamId = ref<string | null>(null);
const biStreamId = ref<string | null>(null);
const log = ref<StreamLogEntry[]>([]);
const busy = ref(false);
const payload = ref('hello WebTransport');
const datagramPayload = ref('ping');
const backpressureCount = ref(0);
const windowRemaining = ref<number | null>(null);
const zeroRttUsed = ref<boolean | null>(null);

function appendLog(kind: string, detail: string): void {
  log.value = [
    ...log.value,
    { ts: Date.now(), kind, detail },
  ].slice(-40);
}

function encodePayload(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const parsed = (await res.json()) as T;
  if (!res.ok) {
    throw new Error(`fetch ${url} failed: ${res.status}`);
  }
  return parsed;
}

async function openSession(): Promise<void> {
  busy.value = true;
  try {
    const res = await post<{ ok: boolean; zeroRttUsed?: boolean }>('/api/stream', {
      kind: 'open-session',
      sessionId: sessionId.value,
      url: 'https://localhost:4433/wt',
      zeroRtt: true,
    });
    zeroRttUsed.value = res.zeroRttUsed ?? null;
    appendLog('open-session', `session ${sessionId.value} opened (0-RTT=${res.zeroRttUsed ?? false})`);
  } finally {
    busy.value = false;
  }
}

async function openUniStream(): Promise<void> {
  busy.value = true;
  try {
    const res = await post<{ ok: boolean; streamId: string }>('/api/stream', {
      kind: 'open-uni-stream',
      sessionId: sessionId.value,
    });
    uniStreamId.value = res.streamId;
    appendLog('open-uni-stream', `uni stream ${res.streamId}`);
  } finally {
    busy.value = false;
  }
}

async function openBiStream(): Promise<void> {
  busy.value = true;
  try {
    const res = await post<{ ok: boolean; streamId: string; windowRemaining?: number }>(
      '/api/stream',
      {
        kind: 'open-bi-stream',
        sessionId: sessionId.value,
      },
    );
    biStreamId.value = res.streamId;
    windowRemaining.value = res.windowRemaining ?? null;
    appendLog('open-bi-stream', `bi stream ${res.streamId} window=${res.windowRemaining ?? 'n/a'}`);
  } finally {
    busy.value = false;
  }
}

async function writeUni(): Promise<void> {
  if (!uniStreamId.value) return;
  busy.value = true;
  try {
    const res = await post<{ ok: boolean; byteLength?: number }>('/api/stream', {
      kind: 'write-stream',
      sessionId: sessionId.value,
      streamId: uniStreamId.value,
      dataBase64: encodePayload(payload.value),
    });
    appendLog('write-uni', `${res.byteLength ?? 0} B written`);
  } finally {
    busy.value = false;
  }
}

async function writeBi(): Promise<void> {
  if (!biStreamId.value) return;
  busy.value = true;
  try {
    const res = await post<{
      ok: boolean;
      byteLength?: number;
      backpressure?: boolean;
      windowRemaining?: number;
    }>('/api/stream', {
      kind: 'write-stream',
      sessionId: sessionId.value,
      streamId: biStreamId.value,
      dataBase64: encodePayload(payload.value),
    });
    if (res.backpressure) backpressureCount.value += 1;
    windowRemaining.value = res.windowRemaining ?? null;
    appendLog(
      'write-bi',
      `${res.byteLength ?? 0} B written (backpressure=${res.backpressure ? 'yes' : 'no'}, window=${res.windowRemaining ?? 'n/a'})`,
    );
  } finally {
    busy.value = false;
  }
}

async function readBi(): Promise<void> {
  if (!biStreamId.value) return;
  busy.value = true;
  try {
    const res = await post<{ ok: boolean; byteLength?: number }>('/api/stream', {
      kind: 'read-stream',
      sessionId: sessionId.value,
      streamId: biStreamId.value,
    });
    appendLog('read-bi', `${res.byteLength ?? 0} B read`);
  } finally {
    busy.value = false;
  }
}

async function sendDatagram(): Promise<void> {
  busy.value = true;
  try {
    const res = await post<{ ok: boolean; byteLength?: number }>('/api/stream', {
      kind: 'send-datagram',
      sessionId: sessionId.value,
      dataBase64: encodePayload(datagramPayload.value),
    });
    appendLog('datagram', `${res.byteLength ?? 0} B dispatched`);
  } finally {
    busy.value = false;
  }
}

async function resetStream(): Promise<void> {
  if (!biStreamId.value && !uniStreamId.value) return;
  const streamId = biStreamId.value ?? uniStreamId.value!;
  busy.value = true;
  try {
    await post('/api/reset', {
      kind: 'reset-stream',
      sessionId: sessionId.value,
      streamId,
      errorCode: 0,
    });
    appendLog('reset-stream', `stream ${streamId} reset`);
    if (biStreamId.value === streamId) biStreamId.value = null;
    if (uniStreamId.value === streamId) uniStreamId.value = null;
  } finally {
    busy.value = false;
  }
}

async function migrateConnection(): Promise<void> {
  busy.value = true;
  try {
    const res = await post<{ ok: boolean; validated?: boolean }>('/api/reset', {
      kind: 'migrate-connection',
      sessionId: sessionId.value,
      validate: true,
    });
    appendLog('migrate', `path validation ${res.validated ? 'passed' : 'skipped'}`);
  } finally {
    busy.value = false;
  }
}

async function closeSession(): Promise<void> {
  busy.value = true;
  try {
    await post('/api/stream', {
      kind: 'close-session',
      sessionId: sessionId.value,
    });
    appendLog('close-session', `session ${sessionId.value} closed`);
    uniStreamId.value = null;
    biStreamId.value = null;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="wt-app">
    <h1>WebTransport dogfood</h1>
    <p class="wt-hint">
      Session: <code>{{ sessionId }}</code>
      | 0-RTT: <code>{{ zeroRttUsed === null ? 'unknown' : zeroRttUsed ? 'used' : 'cold' }}</code>
      | backpressure events: <code>{{ backpressureCount }}</code>
      | window: <code>{{ windowRemaining ?? 'n/a' }}</code>
    </p>

    <section>
      <h2>Session</h2>
      <button data-testid="btn-open-session" :disabled="busy" @click="openSession">Open session</button>
      <button data-testid="btn-close-session" :disabled="busy" @click="closeSession">Close session</button>
      <button data-testid="btn-migrate" :disabled="busy" @click="migrateConnection">Migrate path</button>
    </section>

    <section>
      <h2>Uni stream</h2>
      <button data-testid="btn-open-uni" :disabled="busy" @click="openUniStream">Open uni stream</button>
      <button data-testid="btn-write-uni" :disabled="busy || !uniStreamId" @click="writeUni">Write payload</button>
      <span v-if="uniStreamId" class="wt-tag" data-testid="uni-stream-id">{{ uniStreamId }}</span>
    </section>

    <section>
      <h2>Bi stream</h2>
      <button data-testid="btn-open-bi" :disabled="busy" @click="openBiStream">Open bi stream</button>
      <button data-testid="btn-write-bi" :disabled="busy || !biStreamId" @click="writeBi">Write payload</button>
      <button data-testid="btn-read-bi" :disabled="busy || !biStreamId" @click="readBi">Read echo</button>
      <span v-if="biStreamId" class="wt-tag" data-testid="bi-stream-id">{{ biStreamId }}</span>
    </section>

    <section>
      <h2>Datagram</h2>
      <input v-model="datagramPayload" data-testid="datagram-payload" />
      <button data-testid="btn-send-datagram" :disabled="busy" @click="sendDatagram">Send datagram</button>
    </section>

    <section>
      <h2>Payload</h2>
      <textarea v-model="payload" data-testid="stream-payload" rows="3" cols="40" />
      <button data-testid="btn-reset-stream" :disabled="busy" @click="resetStream">Reset current stream</button>
    </section>

    <section>
      <h2>Log</h2>
      <ol data-testid="wt-log">
        <li v-for="(entry, i) in log" :key="`${entry.ts}-${i}`">
          <code>{{ entry.kind }}</code> · {{ entry.detail }}
        </li>
      </ol>
    </section>
  </main>
</template>

<style scoped>
.wt-app {
  font-family: system-ui, sans-serif;
  max-width: 720px;
  margin: 2rem auto;
  padding: 1rem;
}
.wt-hint {
  color: #555;
  font-size: 0.9rem;
}
section {
  margin: 1.2rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}
button {
  margin: 0 0.4rem 0.4rem 0;
  padding: 0.4rem 0.7rem;
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.wt-tag {
  display: inline-block;
  background: #eef;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  margin-left: 0.4rem;
}
ol {
  font-family: monospace;
  font-size: 0.85rem;
  background: #fafafa;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  max-height: 240px;
  overflow-y: auto;
}
</style>
