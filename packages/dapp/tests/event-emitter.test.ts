import { describe, expect, it, vi } from 'vitest';
import { createEventEmitter } from '../src/index.js';

describe('createEventEmitter', () => {
  it('T-EVT-001 on("accountsChanged") の handler が emit で発火する', () => {
    // Given
    const emitter = createEventEmitter();
    const handler = vi.fn();
    emitter.on('accountsChanged', handler);
    // When
    emitter.emit('accountsChanged', ['0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826']);
    // Then
    expect(handler).toHaveBeenCalledWith(['0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826']);
  });

  it('T-EVT-002 on("chainChanged") の handler が emit で発火する', () => {
    // Given
    const emitter = createEventEmitter();
    const handler = vi.fn();
    emitter.on('chainChanged', handler);
    // When
    emitter.emit('chainChanged', '0x5');
    // Then
    expect(handler).toHaveBeenCalledWith('0x5');
  });

  it('T-EVT-003 on("connect") の handler が emit で発火する', () => {
    // Given
    const emitter = createEventEmitter();
    const handler = vi.fn();
    emitter.on('connect', handler);
    // When
    emitter.emit('connect', { chainId: '0x7a69' });
    // Then
    expect(handler).toHaveBeenCalledWith({ chainId: '0x7a69' });
  });

  it('T-EVT-004 on("disconnect") の handler が emit で発火する', () => {
    // Given
    const emitter = createEventEmitter();
    const handler = vi.fn();
    emitter.on('disconnect', handler);
    // When
    emitter.emit('disconnect', { code: 4900, message: 'Disconnected' });
    // Then
    expect(handler).toHaveBeenCalledWith({ code: 4900, message: 'Disconnected' });
  });

  it('T-EVT-005 off(event, handler) で登録解除後 emit しても handler は呼ばれない', () => {
    const emitter = createEventEmitter();
    const handler = vi.fn();
    emitter.on('accountsChanged', handler);
    emitter.off('accountsChanged', handler);

    emitter.emit('accountsChanged', ['0xabc']);
    expect(handler).not.toHaveBeenCalled();
  });

  it('T-EVT-006 listenerCount は登録数を返し、 off 後は減る', () => {
    const emitter = createEventEmitter();
    const h1 = vi.fn();
    const h2 = vi.fn();

    expect(emitter.listenerCount('chainChanged')).toBe(0);
    emitter.on('chainChanged', h1);
    emitter.on('chainChanged', h2);
    expect(emitter.listenerCount('chainChanged')).toBe(2);
    emitter.off('chainChanged', h1);
    expect(emitter.listenerCount('chainChanged')).toBe(1);
  });
});
