import {
  createAblyMock,
  createPusherMock,
  createSocketioMock,
  createSupabaseRealtimeMock,
} from '@kiwa-lab/realtime';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.useRealTimers();
});

describe('library documentation realtime recipes', () => {
  it('delivers a Supabase broadcast scheduled by a scenario', async () => {
    vi.useFakeTimers();
    const supabase = createSupabaseRealtimeMock({
      artificialLatencyMs: 0,
      scenarios: {
        'room:1': [
          { kind: 'broadcast', event: 'chat', payload: { text: 'hello' }, delay: 0 },
        ],
      },
    });
    const received: unknown[] = [];
    const subscribing = supabase
      .channel('room:1')
      .on('broadcast', { event: 'chat' }, (event) => received.push(event))
      .subscribe();

    await vi.runAllTimersAsync();
    await subscribing;

    expect(received).toEqual([
      { type: 'broadcast', event: 'chat', payload: { text: 'hello' } },
    ]);
  });

  it('delivers a Socket.IO broadcast only to the joined room', async () => {
    vi.useFakeTimers();
    const io = createSocketioMock({ artificialLatencyMs: 0 });
    const socket = io.io('/chat');
    const received: unknown[] = [];
    socket.on('broadcast', (data) => received.push(data));

    await vi.runAllTimersAsync();
    await socket.join('room-1');
    io.of('/chat').to('room-1').emit('broadcast', { text: 'server push' });
    await vi.runAllTimersAsync();

    expect(received).toEqual([{ text: 'server push' }]);
  });

  it('delivers an Ably message with its event name', async () => {
    vi.useFakeTimers();
    const client = createAblyMock({ artificialLatencyMs: 0 });
    const channel = client.channels.get('room-1');
    const received: unknown[] = [];
    const subscribing = channel.subscribe('chat', (message) => received.push(message));

    await vi.runAllTimersAsync();
    await subscribing;
    const publishing = channel.publish('chat', { text: 'hello' });
    await vi.runAllTimersAsync();
    await publishing;

    expect(received).toMatchObject([{ name: 'chat', data: { text: 'hello' } }]);
  });

  it('delivers a Pusher event after a handler is bound', async () => {
    vi.useFakeTimers();
    const client = createPusherMock({ artificialLatencyMs: 0 });
    const channel = client.subscribeChannel('room-1');
    const received: unknown[] = [];
    channel.bind('chat', (data) => received.push(data));

    await vi.runAllTimersAsync();
    channel.trigger('chat', { text: 'hello' });
    await vi.runAllTimersAsync();

    expect(received).toEqual([{ text: 'hello' }]);
  });
});
