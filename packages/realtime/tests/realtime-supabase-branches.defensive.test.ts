import { describe, expect, it } from 'vitest';
import { createSupabaseRealtimeMock } from '../src/supabase.js';

describe('supabase realtime defensive branches', () => {
  it('channel() returns the same instance for a topic on repeat calls', () => {
    const client = createSupabaseRealtimeMock();
    const c1 = client.channel('room:1');
    const c2 = client.channel('room:1');
    expect(c1).toBe(c2);
  });

  it('removeAllChannels tears down every open channel', async () => {
    const client = createSupabaseRealtimeMock();
    const c1 = client.channel('room:1');
    const c2 = client.channel('room:2');
    await c1.subscribe();
    await c2.subscribe();
    await expect(client.removeAllChannels()).resolves.toBeUndefined();
  });

  it('channel presence + broadcast + postgres_changes registration returns self', () => {
    const client = createSupabaseRealtimeMock();
    const c = client.channel('room:x');
    const withPresence = c.on(
      'presence',
      { event: 'sync' },
      () => undefined,
    );
    expect(withPresence).toBe(c);
    const withBroadcast = c.on(
      'broadcast',
      { event: 'chat' },
      () => undefined,
    );
    expect(withBroadcast).toBe(c);
    const withPg = c.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      () => undefined,
    );
    expect(withPg).toBe(c);
  });

  it('subscribe callback fires with SUBSCRIBED status', async () => {
    const client = createSupabaseRealtimeMock();
    const c = client.channel('room:sub');
    let status: string | undefined;
    await c.subscribe((s) => {
      status = s;
    });
    expect(status).toBe('SUBSCRIBED');
  });

  it('track + untrack sequence resolves without throwing', async () => {
    const client = createSupabaseRealtimeMock();
    const c = client.channel('room:track');
    await c.subscribe();
    const trackResult = await c.track({ userId: 'user-1' });
    expect(trackResult).toBe('ok');
    const untrackResult = await c.untrack();
    expect(untrackResult).toBe('ok');
  });

  it('send broadcast event resolves with ok', async () => {
    const client = createSupabaseRealtimeMock();
    const c = client.channel('room:send');
    await c.subscribe();
    const result = await c.send({
      type: 'broadcast',
      event: 'chat',
      payload: { text: 'hello' },
    });
    expect(result).toBe('ok');
  });

  it('unsubscribe returns ok on happy path', async () => {
    const client = createSupabaseRealtimeMock();
    const c = client.channel('room:unsub');
    await c.subscribe();
    const result = await c.unsubscribe();
    expect(result).toBe('ok');
  });
});
