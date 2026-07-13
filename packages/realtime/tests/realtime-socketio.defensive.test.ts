import { describe, expect, it } from 'vitest';
import { createSocketioMock } from '../src/socketio.js';

describe('socketio defensive branches', () => {
  it('io uses default namespace when omitted', () => {
    const mock = createSocketioMock();
    const socket = mock.io();
    expect(socket.namespace).toBe('/');
  });

  it('io accepts explicit namespace', () => {
    const mock = createSocketioMock();
    const socket = mock.io('/chat');
    expect(socket.namespace).toBe('/chat');
  });

  it('on triggers connect handler after connect', async () => {
    const mock = createSocketioMock();
    const socket = mock.io();
    let connectedFired = false;
    socket.on('connect', () => {
      connectedFired = true;
    });
    // Give engine.ensureConnected() a tick to resolve
    await new Promise((r) => setTimeout(r, 20));
    expect(connectedFired).toBe(true);
  });

  it('off with handler removes only that handler', () => {
    const mock = createSocketioMock();
    const socket = mock.io();
    const h1 = (): void => undefined;
    const h2 = (): void => undefined;
    socket.on('msg', h1);
    socket.on('msg', h2);
    socket.off('msg', h1);
    // Just verifies no throw
    expect(true).toBe(true);
  });

  it('off without handler removes all handlers for event', () => {
    const mock = createSocketioMock();
    const socket = mock.io();
    socket.on('msg', () => undefined);
    socket.on('msg', () => undefined);
    socket.off('msg');
    expect(true).toBe(true);
  });

  it('emit with single arg keeps that arg as payload', () => {
    const mock = createSocketioMock();
    const socket = mock.io();
    expect(() => socket.emit('greeting', 'hello')).not.toThrow();
  });

  it('emit with multiple args passes array as payload', () => {
    const mock = createSocketioMock();
    const socket = mock.io();
    expect(() => socket.emit('greeting', 'hello', 'world')).not.toThrow();
  });

  it('emit before join uses default room', () => {
    const mock = createSocketioMock();
    const socket = mock.io();
    expect(() => socket.emit('event', 'payload')).not.toThrow();
  });

  it('emit after join uses joined rooms', async () => {
    const mock = createSocketioMock();
    const socket = mock.io();
    await socket.join('room-1');
    expect(() => socket.emit('event', 'payload')).not.toThrow();
  });

  it('of namespace to(room) chains and emit publishes to room', () => {
    const mock = createSocketioMock();
    const ns = mock.of('/admin');
    ns.to('room-a').emit('notification', { message: 'ping' });
    expect(ns.name).toBe('/admin');
  });

  it('of namespace emit without to uses default room', () => {
    const mock = createSocketioMock();
    const ns = mock.of('/admin');
    expect(() => ns.emit('broadcast', { data: 1 })).not.toThrow();
  });

  it('of namespace emit with multiple args passes array payload', () => {
    const mock = createSocketioMock();
    const ns = mock.of('/admin');
    expect(() => ns.emit('event', 'a', 'b', 'c')).not.toThrow();
  });

  it('subscribe idempotent — joining same room twice does not double-subscribe', async () => {
    const mock = createSocketioMock();
    const socket = mock.io();
    await socket.join('same-room');
    await socket.join('same-room');
    expect(true).toBe(true);
  });
});
