import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * R2 multipart upload axis — resumable object storage upload flow. Real
 * R2 / S3-compatible stores split large objects into ordered parts (5MB+
 * each), verify each part checksum, and commit on completion. The helper
 * tracks per-part state and aggregate integrity so failed uploads can be
 * resumed from the last verified part.
 */
export type R2State = 'initiated' | 'uploading' | 'checksum-failed' | 'completed' | 'aborted';

export interface R2Part {
  partNumber: number;
  sizeBytes: number;
  checksum: string;
  verified: boolean;
}

export interface R2MultipartSession {
  platform: EdgePlatform;
  uploadId: string;
  parts: Map<number, R2Part>;
  totalParts: number;
  state: R2State;
  history: AxisStep<R2State>[];
}

/**
 * Initiate a multipart upload with a known total part count. Emits
 * `r2.multipart-initiated` and enters `initiated`.
 */
export function initiateMultipart(input: {
  platform: EdgePlatform;
  uploadId: string;
  totalParts: number;
}): R2MultipartSession {
  const session: R2MultipartSession = {
    platform: input.platform,
    uploadId: input.uploadId,
    parts: new Map(),
    totalParts: input.totalParts,
    state: 'initiated',
    history: [],
  };
  const step: AxisStep<R2State> = {
    neutralEvent: 'r2.multipart-initiated',
    platformEvent: platformEventName(input.platform, 'r2.multipart-initiated'),
    state: 'initiated',
    platform: input.platform,
    metadata: {
      uploadId: input.uploadId,
      totalParts: input.totalParts,
    },
  };
  session.history.push(step);
  return session;
}

/**
 * Upload a single part with declared checksum. Transitions to `uploading`
 * (first part) and emits `r2.part-uploaded`. Rejects if the part number is
 * outside `[1, totalParts]`.
 */
export function uploadPart(
  session: R2MultipartSession,
  input: { partNumber: number; sizeBytes: number; checksum: string },
): AxisStep<R2State> {
  if (session.state === 'completed' || session.state === 'aborted') {
    throw new Error(`uploadPart: session is ${session.state}`);
  }
  if (input.partNumber < 1 || input.partNumber > session.totalParts) {
    throw new Error(
      `uploadPart: partNumber ${input.partNumber} out of range [1, ${session.totalParts}]`,
    );
  }
  session.parts.set(input.partNumber, {
    partNumber: input.partNumber,
    sizeBytes: input.sizeBytes,
    checksum: input.checksum,
    verified: false,
  });
  session.state = 'uploading';
  const step: AxisStep<R2State> = {
    neutralEvent: 'r2.part-uploaded',
    platformEvent: platformEventName(session.platform, 'r2.part-uploaded'),
    state: 'uploading',
    platform: session.platform,
    metadata: {
      uploadId: session.uploadId,
      partNumber: input.partNumber,
      sizeBytes: input.sizeBytes,
      uploadedCount: session.parts.size,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Verify part checksum by comparing against expected. If mismatch,
 * transitions to `checksum-failed` and requires the part to be re-uploaded.
 * On match, marks verified and emits `r2.checksum-verified`.
 */
export function verifyChecksum(
  session: R2MultipartSession,
  input: { partNumber: number; expected: string },
): AxisStep<R2State> {
  const part = session.parts.get(input.partNumber);
  if (!part) {
    throw new Error(`verifyChecksum: partNumber ${input.partNumber} not uploaded`);
  }
  if (part.checksum !== input.expected) {
    session.state = 'checksum-failed';
    const step: AxisStep<R2State> = {
      neutralEvent: 'r2.checksum-verified',
      platformEvent: platformEventName(session.platform, 'r2.checksum-verified'),
      state: 'checksum-failed',
      platform: session.platform,
      metadata: {
        uploadId: session.uploadId,
        partNumber: input.partNumber,
        expected: input.expected,
        actual: part.checksum,
        mismatch: true,
      },
    };
    session.history.push(step);
    return step;
  }
  part.verified = true;
  session.state = 'uploading';
  const step: AxisStep<R2State> = {
    neutralEvent: 'r2.checksum-verified',
    platformEvent: platformEventName(session.platform, 'r2.checksum-verified'),
    state: 'uploading',
    platform: session.platform,
    metadata: {
      uploadId: session.uploadId,
      partNumber: input.partNumber,
      verifiedCount: Array.from(session.parts.values()).filter((p) => p.verified).length,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Complete the multipart upload once all parts are uploaded and verified.
 * Emits `r2.multipart-completed`. Rejects if any part is missing or
 * unverified.
 */
export function completeMultipart(session: R2MultipartSession): AxisStep<R2State> {
  if (session.parts.size !== session.totalParts) {
    throw new Error(
      `completeMultipart: uploaded ${session.parts.size}/${session.totalParts}`,
    );
  }
  const unverified = Array.from(session.parts.values()).filter((p) => !p.verified);
  if (unverified.length > 0) {
    throw new Error(
      `completeMultipart: ${unverified.length} parts unverified`,
    );
  }
  session.state = 'completed';
  const totalBytes = Array.from(session.parts.values()).reduce(
    (acc, p) => acc + p.sizeBytes,
    0,
  );
  const step: AxisStep<R2State> = {
    neutralEvent: 'r2.multipart-completed',
    platformEvent: platformEventName(session.platform, 'r2.multipart-completed'),
    state: 'completed',
    platform: session.platform,
    metadata: {
      uploadId: session.uploadId,
      totalParts: session.totalParts,
      totalBytes,
    },
  };
  session.history.push(step);
  return step;
}
