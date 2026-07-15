/**
 * skill test — macos-app skill が主要 5 API (createMacAppEnv / simulateUserInteraction /
 * captureAccessibilityTree / mockScreencap / emitUserNotification) を全て公開している + 実
 * mode 別に動作分岐することを skill-test primitive で assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createMacAppEnv,
  simulateUserInteraction,
  captureAccessibilityTree,
  mockScreencap,
  emitUserNotification,
} from '../../src/index.js';

describe('macos-app skill assertions', () => {
  it('createMacAppEnv を 2 mode (swiftui/appkit) 全てで instantiate 可能', () => {
    for (const mode of ['swiftui', 'appkit'] as const) {
      const env = createMacAppEnv({ mode });
      expect(env.mode).toBe(mode);
      expect(env.bundle.bundleId).toBe('com.kiwa.macos-app.test');
      expect(env.window.visible).toBe(true);
    }
  });

  it('simulateUserInteraction が click / keypress / gesture / focus 4 type 全て dispatch', () => {
    const env = createMacAppEnv({ mode: 'swiftui' });
    const types = ['click', 'keypress', 'gesture', 'focus'] as const;
    for (const type of types) {
      const result = simulateUserInteraction(env, { type, target: 'action' });
      expect(result.dispatched).toBe(true);
    }
    expect(env.eventLog.length).toBe(4);
  });

  it('captureAccessibilityTree が root + children を正しく mapping', () => {
    const env = createMacAppEnv({ mode: 'swiftui' });
    const tree = captureAccessibilityTree(env);
    expect(tree.root.role).toBe('AXGroup');
    expect(tree.totalNodes).toBe(3);
    expect(tree.root.children.find((c) => c.role === 'AXButton')).toBeDefined();
  });

  it('mockScreencap が PNG + JPEG magic + region を保持', () => {
    const env = createMacAppEnv({ mode: 'appkit' });
    const png = mockScreencap(env, { format: 'png', region: { x: 0, y: 0, width: 50, height: 50 } });
    expect(png.bytes[0]).toBe(0x89);
    expect(png.bytes[1]).toBe(0x50);
    expect(png.region.width).toBe(50);
    const jpg = mockScreencap(env, { format: 'jpeg' });
    expect(jpg.bytes[0]).toBe(0xff);
    expect(jpg.bytes[1]).toBe(0xd8);
  });

  it('emitUserNotification が action 付き notification を schedule + event log 記録', () => {
    const env = createMacAppEnv({ mode: 'swiftui' });
    const result = emitUserNotification(env, {
      title: 'New message',
      body: 'You have 1 unread',
      actions: [{ id: 'reply', title: 'Reply' }, { id: 'archive', title: 'Archive', destructive: true }],
    });
    expect(result.scheduled).toBe(true);
    expect(result.bundleId).toBe('com.kiwa.macos-app.test');
    expect(env.eventLog[0]!.kind).toContain('notification:scheduled');
  });
});
