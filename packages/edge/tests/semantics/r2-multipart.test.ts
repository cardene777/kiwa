import { describe, expect, it } from 'vitest';
import {
  completeMultipart,
  initiateMultipart,
  platformEventName,
  uploadPart,
  verifyChecksum,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('r2-multipart axis — 3 platform', () => {
  it.each(platforms)('%s: initiate → upload 3 parts → verify all → complete', (platform) => {
    const session = initiateMultipart({ platform, uploadId: 'up-1', totalParts: 3 });
    expect(session.state).toBe('initiated');
    expect(session.history[0]!.neutralEvent).toBe('r2.multipart-initiated');
    expect(session.history[0]!.platformEvent).toBe(
      platformEventName(platform, 'r2.multipart-initiated'),
    );
    for (let i = 1; i <= 3; i++) {
      uploadPart(session, {
        partNumber: i,
        sizeBytes: 5_000_000,
        checksum: `sha-${i}`,
      });
      verifyChecksum(session, { partNumber: i, expected: `sha-${i}` });
    }
    const done = completeMultipart(session);
    expect(done.state).toBe('completed');
    expect(done.neutralEvent).toBe('r2.multipart-completed');
    expect(done.metadata).toMatchObject({
      uploadId: 'up-1',
      totalParts: 3,
      totalBytes: 15_000_000,
    });
  });

  it('checksum mismatch transitions to checksum-failed', () => {
    const session = initiateMultipart({
      platform: 'cloudflare',
      uploadId: 'up-x',
      totalParts: 1,
    });
    uploadPart(session, { partNumber: 1, sizeBytes: 1000, checksum: 'sha-actual' });
    const step = verifyChecksum(session, { partNumber: 1, expected: 'sha-different' });
    expect(step.state).toBe('checksum-failed');
    expect(step.metadata).toMatchObject({ mismatch: true, expected: 'sha-different' });
  });

  it('rejects part number out of range', () => {
    const session = initiateMultipart({
      platform: 'vercel',
      uploadId: 'up-y',
      totalParts: 3,
    });
    expect(() =>
      uploadPart(session, { partNumber: 5, sizeBytes: 1000, checksum: 'x' }),
    ).toThrow(/out of range/);
    expect(() =>
      uploadPart(session, { partNumber: 0, sizeBytes: 1000, checksum: 'x' }),
    ).toThrow(/out of range/);
  });

  it('rejects verifyChecksum for un-uploaded part', () => {
    const session = initiateMultipart({
      platform: 'deno',
      uploadId: 'up-z',
      totalParts: 1,
    });
    expect(() => verifyChecksum(session, { partNumber: 1, expected: 'x' })).toThrow(
      /not uploaded/,
    );
  });

  it('rejects completeMultipart if any part is unverified', () => {
    const session = initiateMultipart({
      platform: 'cloudflare',
      uploadId: 'up-q',
      totalParts: 2,
    });
    uploadPart(session, { partNumber: 1, sizeBytes: 1, checksum: 'a' });
    uploadPart(session, { partNumber: 2, sizeBytes: 1, checksum: 'b' });
    verifyChecksum(session, { partNumber: 1, expected: 'a' });
    expect(() => completeMultipart(session)).toThrow(/unverified/);
  });

  it('rejects completeMultipart if part missing', () => {
    const session = initiateMultipart({
      platform: 'vercel',
      uploadId: 'up-r',
      totalParts: 3,
    });
    uploadPart(session, { partNumber: 1, sizeBytes: 1, checksum: 'a' });
    verifyChecksum(session, { partNumber: 1, expected: 'a' });
    expect(() => completeMultipart(session)).toThrow(/1\/3/);
  });

  it('rejects uploadPart after completion', () => {
    const session = initiateMultipart({
      platform: 'deno',
      uploadId: 'up-c',
      totalParts: 1,
    });
    uploadPart(session, { partNumber: 1, sizeBytes: 1, checksum: 'a' });
    verifyChecksum(session, { partNumber: 1, expected: 'a' });
    completeMultipart(session);
    expect(() =>
      uploadPart(session, { partNumber: 1, sizeBytes: 1, checksum: 'a' }),
    ).toThrow(/completed/);
  });

  it('history accumulates every step in order', () => {
    const session = initiateMultipart({
      platform: 'cloudflare',
      uploadId: 'up-h',
      totalParts: 2,
    });
    uploadPart(session, { partNumber: 1, sizeBytes: 1, checksum: 'a' });
    verifyChecksum(session, { partNumber: 1, expected: 'a' });
    uploadPart(session, { partNumber: 2, sizeBytes: 1, checksum: 'b' });
    verifyChecksum(session, { partNumber: 2, expected: 'b' });
    completeMultipart(session);
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'r2.multipart-initiated',
      'r2.part-uploaded',
      'r2.checksum-verified',
      'r2.part-uploaded',
      'r2.checksum-verified',
      'r2.multipart-completed',
    ]);
  });
});
