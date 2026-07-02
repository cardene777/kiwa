import { describe, expect, it } from 'vitest';
import { createSocketioMock } from '../src/index.js';

describe('createSocketioMock — socket + emit / on', () => {
  it('T-RT-SIO-001 emit / on round-trip on same socket', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const socket = client.io('/');
    const received: unknown[] = [];
    socket.on('message', (data) => received.push(data));
    // allow connection init
    await new Promise((r) => setTimeout(r, 30));
    socket.emit('message', { text: 'hi' });
    await new Promise((r) => setTimeout(r, 30));
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ text: 'hi' });
  });

  it('T-RT-SIO-002 join(room) enables room-scoped emit', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const socket = client.io('/');
    socket.on('message', () => {});
    await new Promise((r) => setTimeout(r, 30));
    await socket.join('room-1');
    expect(socket.rooms().has('room-1')).toBe(true);
    await socket.leave('room-1');
    expect(socket.rooms().has('room-1')).toBe(false);
  });

  it('T-RT-SIO-003 namespace io.of() + to().emit() delivers to socket', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const socket = client.io('/chat');
    const received: unknown[] = [];
    socket.on('broadcast', (data) => received.push(data));
    await new Promise((r) => setTimeout(r, 30));
    await socket.join('room-1');
    const ns = client.of('/chat');
    ns.to('room-1').emit('broadcast', { text: 'ns emit' });
    await new Promise((r) => setTimeout(r, 30));
    expect(received.length).toBeGreaterThanOrEqual(1);
    expect(received[0]).toEqual({ text: 'ns emit' });
  });

  it('T-RT-SIO-004 connect fires connect event', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const socket = client.io('/');
    let connected = false;
    socket.on('connect', () => {
      connected = true;
    });
    await new Promise((r) => setTimeout(r, 40));
    expect(connected).toBe(true);
  });

  it('T-RT-SIO-005 disconnect fires disconnect event', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const socket = client.io('/');
    let disconnected = false;
    socket.on('connect', () => {});
    socket.on('disconnect', () => {
      disconnected = true;
    });
    await new Promise((r) => setTimeout(r, 30));
    socket.disconnect();
    await new Promise((r) => setTimeout(r, 30));
    expect(disconnected).toBe(true);
  });

  it('T-RT-SIO-006 off removes event handler', async () => {
    const client = createSocketioMock({ artificialLatencyMs: 0 });
    const socket = client.io('/');
    const received: unknown[] = [];
    const handler = (data: unknown): void => {
      received.push(data);
    };
    socket.on('e', handler);
    await new Promise((r) => setTimeout(r, 30));
    socket.off('e', handler);
    socket.emit('e', { n: 1 });
    await new Promise((r) => setTimeout(r, 30));
    expect(received).toHaveLength(0);
  });
});
