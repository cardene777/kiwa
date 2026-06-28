import { EventEmitter } from 'node:events';
import type {
  DappE2eEventEmitter,
  Eip1193EventHandler,
  Eip1193EventName,
} from './types.js';

export function createEventEmitter(): DappE2eEventEmitter {
  const ee = new EventEmitter();
  ee.setMaxListeners(50);
  return {
    on(event: Eip1193EventName, handler: Eip1193EventHandler) {
      ee.on(event, handler);
    },
    off(event: Eip1193EventName, handler: Eip1193EventHandler) {
      ee.off(event, handler);
    },
    emit(event: Eip1193EventName, ...args: unknown[]) {
      ee.emit(event, ...args);
    },
    listenerCount(event: Eip1193EventName) {
      return ee.listenerCount(event);
    },
  };
}
