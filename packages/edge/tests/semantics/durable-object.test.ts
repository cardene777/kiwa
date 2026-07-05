import { describe, expect, it } from 'vitest';
import {
  createDurableObject,
  fireAlarm,
  platformEventName,
  requestDurableObject,
  writeStorage,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('durable-object axis — 3 platform', () => {
  it.each(platforms)('%s: create → request → alarm → storage happy path', (platform) => {
    const session = createDurableObject({ id: 'do_1', platform });
    expect(session.state).toBe('initialized');
    expect(session.history[0]?.neutralEvent).toBe('durable-object.created');

    const req = requestDurableObject(session, { url: 'https://edge/do_1' });
    expect(req.state).toBe('active');
    expect(session.requestCount).toBe(1);

    const alarm = fireAlarm(session);
    expect(alarm.state).toBe('active');
    expect(alarm.neutralEvent).toBe('durable-object.alarm-fired');

    const write = writeStorage(session, { key: 'counter', value: '42' });
    expect(write.state).toBe('active');
    expect(session.storageKeys.get('counter')).toBe('42');
  });

  it.each(platforms)('%s: emits platform dialect for each neutral event', (platform) => {
    const session = createDurableObject({ id: 'do_2', platform });
    const req = requestDurableObject(session, { url: '/x' });
    expect(req.platformEvent).toBe(platformEventName(platform, 'durable-object.requested'));
    expect(session.history[0]?.platformEvent).toBe(
      platformEventName(platform, 'durable-object.created'),
    );
    const write = writeStorage(session, { key: 'k', value: 'v' });
    expect(write.platformEvent).toBe(
      platformEventName(platform, 'durable-object.storage-written'),
    );
    expect(req.platform).toBe(platform);
  });

  it('request metadata carries url + running requestCount', () => {
    const session = createDurableObject({ id: 'do_3', platform: 'cloudflare' });
    requestDurableObject(session, { url: '/a' });
    const second = requestDurableObject(session, { url: '/b' });
    expect(second.metadata.url).toBe('/b');
    expect(second.metadata.requestCount).toBe(2);
  });

  it('writeStorage metadata reports value size + key count', () => {
    const session = createDurableObject({ id: 'do_4', platform: 'deno' });
    const first = writeStorage(session, { key: 'a', value: 'hello' });
    expect(first.metadata.size).toBe(5);
    expect(first.metadata.keyCount).toBe(1);
    const second = writeStorage(session, { key: 'b', value: 'hi' });
    expect(second.metadata.keyCount).toBe(2);
  });

  it('fireAlarm consumes a scheduled alarm timestamp', () => {
    const session = createDurableObject({ id: 'do_5', platform: 'vercel' });
    session.scheduledAlarmAt = 1_000;
    const alarm = fireAlarm(session);
    expect(alarm.metadata.firedAt).toBe(1_000);
    expect(alarm.metadata.scheduled).toBe(true);
    expect(session.scheduledAlarmAt).toBeNull();
  });

  it('history accumulates one step per operation', () => {
    const session = createDurableObject({ id: 'do_6', platform: 'cloudflare' });
    requestDurableObject(session, { url: '/1' });
    fireAlarm(session);
    writeStorage(session, { key: 'k', value: 'v' });
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'durable-object.created',
      'durable-object.requested',
      'durable-object.alarm-fired',
      'durable-object.storage-written',
    ]);
  });

  it('rejects operations on a terminated object', () => {
    const session = createDurableObject({ id: 'do_7', platform: 'deno' });
    session.state = 'terminated';
    expect(() => requestDurableObject(session, { url: '/x' })).toThrow(/terminated/);
    expect(() => fireAlarm(session)).toThrow(/terminated/);
    expect(() => writeStorage(session, { key: 'k', value: 'v' })).toThrow(/terminated/);
  });
});
