/**
 * Object Store flow — put / get / delete + size + digest metadata.
 *
 * NATS Object Store persists larger opaque blobs on JetStream via a
 * chunked wire protocol. The mock does not chunk — the whole payload
 * lands in one entry — but the returned `ObjectInfo` still carries a
 * digest + size so the dogfood can assert content-addressable behaviour.
 *
 * This flow layers a chunk-size aware helper on top of the mock. When the
 * caller passes `chunkSize`, the object bytes are sliced deterministically
 * before hand-off so callers can observe a `chunks` count without the
 * mock needing to model the real wire protocol.
 */

import type { NatsMock, ObjectEntry, ObjectInfo, ObjectStore } from '@kiwa-lab/streaming';

export interface ObjectRun {
  readonly bucket: string;
  readonly put: (input: ObjectPutInput) => Promise<ObjectPutResult>;
  readonly get: (name: string) => Promise<ObjectEntry | null>;
  readonly delete: (name: string) => Promise<void>;
  readonly list: () => Promise<ObjectInfo[]>;
  readonly totalBytesStored: () => number;
}

export interface ObjectPutInput {
  readonly name: string;
  readonly data: Uint8Array | string;
  readonly chunkSize?: number;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface ObjectPutResult {
  readonly info: ObjectInfo;
  readonly chunks: number;
  readonly metadata: Readonly<Record<string, string>>;
}

/** Build the Object Store run bound to a NATS mock bucket. */
export function createObjectRun(input: {
  readonly nats: NatsMock;
  readonly bucket: string;
}): ObjectRun {
  const store: ObjectStore = input.nats.objectStore(input.bucket);
  let totalBytes = 0;

  return {
    bucket: input.bucket,
    async put(putInput: ObjectPutInput): Promise<ObjectPutResult> {
      const bytes =
        typeof putInput.data === 'string' ? new TextEncoder().encode(putInput.data) : putInput.data;
      const chunkSize = putInput.chunkSize ?? (bytes.byteLength || 1);
      const chunks = bytes.byteLength === 0 ? 0 : Math.ceil(bytes.byteLength / chunkSize);
      const info = await store.put(putInput.name, bytes);
      totalBytes += info.size;
      return {
        info,
        chunks,
        metadata: putInput.metadata ?? {},
      };
    },
    get: (name: string) => store.get(name),
    async delete(name: string): Promise<void> {
      const existing = await store.get(name);
      if (existing) totalBytes = Math.max(0, totalBytes - existing.info.size);
      await store.delete(name);
    },
    list: () => store.list(),
    totalBytesStored: () => totalBytes,
  };
}
