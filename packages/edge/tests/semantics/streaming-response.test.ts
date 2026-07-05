import { describe, expect, it } from 'vitest';
import {
  closeStream,
  openStream,
  platformEventName,
  resumeStream,
  sendChunk,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('streaming-response axis — 3 platform', () => {
  it.each(platforms)('%s: open → chunk → close happy path', (platform) => {
    const session = openStream({ id: 'st_1', platform, highWaterMark: 100 });
    expect(session.state).toBe('open');
    expect(session.kind).toBe('chunked');
    const opened = session.history[0];
    expect(opened?.neutralEvent).toBe('stream.opened');
    expect(opened?.platformEvent).toBe(platformEventName(platform, 'stream.opened'));
    expect(opened?.metadata).toMatchObject({ id: 'st_1', kind: 'chunked', highWaterMark: 100 });

    const chunk = sendChunk(session, { data: 'hello' });
    expect(chunk.neutralEvent).toBe('stream.chunk-sent');
    expect(chunk.metadata).toMatchObject({ bytesSent: 5, chunksSent: 1, size: 5 });
    expect(session.state).toBe('open');

    const closed = closeStream(session, { reason: 'eof' });
    expect(closed.neutralEvent).toBe('stream.closed');
    expect(closed.state).toBe('closed');
    expect(closed.metadata).toMatchObject({ reason: 'eof', totalChunks: 1, totalBytes: 5 });
  });

  it.each(platforms)('%s: sse kind + custom highWaterMark propagate', (platform) => {
    const session = openStream({ id: 'st_sse', platform, kind: 'sse', highWaterMark: 8 });
    expect(session.kind).toBe('sse');
    expect(session.history[0]?.metadata).toMatchObject({ kind: 'sse', highWaterMark: 8 });
  });

  it('exceeding the high-water mark flips to backpressure', () => {
    const session = openStream({ id: 'st_bp', platform: 'cloudflare', highWaterMark: 4 });
    const bp = sendChunk(session, { data: 'toolong' });
    expect(bp.neutralEvent).toBe('stream.backpressure');
    expect(bp.platformEvent).toBe(platformEventName('cloudflare', 'stream.backpressure'));
    expect(bp.state).toBe('backpressure');
    expect(bp.metadata).toMatchObject({ bytesSent: 7, highWaterMark: 4, chunksSent: 1 });
  });

  it('resumeStream drains the buffer and reopens the stream', () => {
    const session = openStream({ id: 'st_resume', platform: 'vercel', highWaterMark: 4 });
    sendChunk(session, { data: 'toolong' });
    expect(session.state).toBe('backpressure');
    const resumed = resumeStream(session);
    expect(resumed.neutralEvent).toBe('stream.chunk-sent');
    expect(resumed.state).toBe('open');
    expect(resumed.metadata).toMatchObject({ resumed: true, bytesSent: 3 });
  });

  it('resumeStream rejects unless back-pressured', () => {
    const session = openStream({ id: 'st_r2', platform: 'deno', highWaterMark: 100 });
    expect(() => resumeStream(session)).toThrow(/expected backpressure/);
  });

  it('sendChunk / closeStream reject once closed', () => {
    const session = openStream({ id: 'st_closed', platform: 'deno' });
    closeStream(session, { reason: 'done' });
    expect(() => sendChunk(session, { data: 'x' })).toThrow(/closed/);
    expect(() => closeStream(session, { reason: 'again' })).toThrow(/already closed/);
  });

  it('accumulates every step into history', () => {
    const session = openStream({ id: 'st_hist', platform: 'cloudflare', highWaterMark: 4 });
    sendChunk(session, { data: 'toolong' });
    resumeStream(session);
    closeStream(session, { reason: 'eof' });
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'stream.opened',
      'stream.backpressure',
      'stream.chunk-sent',
      'stream.closed',
    ]);
  });
});
