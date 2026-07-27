import { expect, it } from 'vitest';
import {
  captureAccessibilityTree,
  createMacAppEnv,
  emitUserNotification,
  mockScreencap,
  simulateUserInteraction,
} from '../src/index.js';

it('documents interaction success and an observable missing target', () => {
  const env = createMacAppEnv({ mode: 'swiftui', now: () => 1_000 });
  expect(simulateUserInteraction(env, { type: 'click', target: 'action' })).toMatchObject({
    targetFound: true, targetType: 'Button', dispatched: true, handled: true,
  });
  expect(simulateUserInteraction(env, { type: 'click', target: 'missing' })).toMatchObject({
    targetFound: false, dispatched: false, handled: false, reason: 'target not found: missing',
  });
});

it('documents accessibility, a deterministic capture, and notification outcomes', () => {
  const env = createMacAppEnv({ mode: 'swiftui', bundleId: 'com.example.inbox', now: () => 1_000 });
  simulateUserInteraction(env, { type: 'click', target: 'action' });
  expect(captureAccessibilityTree(env)).toMatchObject({
    totalNodes: 3, root: { children: [{ role: 'AXStaticText' }, { id: 'action', role: 'AXButton' }] },
  });
  const capture = mockScreencap(env, { format: 'png', region: { x: 0, y: 0, width: 100, height: 80 } });
  expect([...capture.bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(emitUserNotification(env, { title: 'New message', body: 'You have 1 unread' })).toMatchObject({
    scheduled: true, bundleId: 'com.example.inbox',
  });
  expect(emitUserNotification(env, { title: ' ', body: ' ' })).toMatchObject({
    scheduled: false, reason: 'title / body must be non-empty',
  });
});
