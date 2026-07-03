import { createCanvas, fireEvent } from './dom.js';
import type {
  CanvasElement,
  ComponentLocator,
  ComponentRender,
  MockEvent,
  MockNode,
  NodeLocator,
} from './types.js';

/**
 * Playwright Component Testing (CT) 互換の最小 mock。 real Playwright CT は
 * `mount(component)` → `Locator` を返し、 `page.getByText().click()` 等で
 * interact する。 mock は同じ API 表面 (mount / getByText / getByRole / click /
 * fill / textContent / count) を持ち、 real vs mock で同じ test を回せる。
 *
 * 実 Playwright CT との差分 = (1) browser process を起動しない (in-memory)、
 * (2) network request の intercept / route は非 support (別の kiwa mock で
 * 対応)、 (3) screenshot は Chromatic 経路に一本化する。
 *
 * 使い方 ...
 * ```ts
 * const ct = createPlaywrightCTMock();
 * const button = ct.mount((args) => createNode('button', { text: args.label, on: { click: args.onClick } }), { label: 'ok', onClick: () => hits++ });
 * await button.getByRole('button', { name: 'ok' }).click();
 * expect(hits).toBe(1);
 * ```
 */

export interface PlaywrightCTMock {
  mount<TArgs>(
    render: ComponentRender<TArgs>,
    args: TArgs,
  ): ComponentLocator;
  /** mount 済 locator 一覧 (test teardown で全 unmount する時使う)。 */
  activeMounts(): number;
  /** 全 mount を解放する — vitest afterEach 相当の cleanup。 */
  unmountAll(): void;
}

/**
 * PlaywrightCTMock を新規作成する。 mount 毎に in-memory canvas を組み、
 * ComponentLocator に wrap して返す。 activeMounts count は resource leak
 * 検出用 (test で unmount 忘れを assert できる)。
 */
export function createPlaywrightCTMock(): PlaywrightCTMock {
  const active = new Set<MountRecord>();

  return {
    mount<TArgs>(
      render: ComponentRender<TArgs>,
      args: TArgs,
    ): ComponentLocator {
      const root = render(args);
      const canvas = createCanvas(root);
      const record: MountRecord = { root, canvas };
      active.add(record);
      return buildLocator(record, () => active.delete(record));
    },
    activeMounts(): number {
      return active.size;
    },
    unmountAll(): void {
      active.clear();
    },
  };
}

interface MountRecord {
  root: MockNode;
  canvas: CanvasElement;
}

function buildLocator(record: MountRecord, dispose: () => void): ComponentLocator {
  return {
    canvas: record.canvas,
    root: record.root,
    getByText: (text: string) => createTextLocator(record.canvas, text),
    getByRole: (role: string, options?: { name?: string }) =>
      createRoleLocator(record.canvas, role, options?.name),
    unmount: () => {
      // event handler を全 clear して leak を防ぐ
      clearHandlers(record.root);
      dispose();
    },
  };
}

function createTextLocator(canvas: CanvasElement, text: string): NodeLocator {
  return {
    click: async () => {
      const node = canvas.getByText(text);
      fireEvent(node, buildEvent('click', node));
    },
    fill: async (value: string) => {
      const node = canvas.getByText(text);
      node.value = value;
      fireEvent(node, buildEvent('input', node, value));
    },
    textContent: async () => {
      const node = tryFind(() => canvas.getByText(text));
      return node ? nodeText(node) : null;
    },
    count: async () => {
      return tryFind(() => canvas.getByText(text)) ? 1 : 0;
    },
    node: () => tryFind(() => canvas.getByText(text)),
  };
}

function createRoleLocator(canvas: CanvasElement, role: string, name?: string): NodeLocator {
  return {
    click: async () => {
      const node = canvas.getByRole(role, name !== undefined ? { name } : undefined);
      fireEvent(node, buildEvent('click', node));
    },
    fill: async (value: string) => {
      const node = canvas.getByRole(role, name !== undefined ? { name } : undefined);
      node.value = value;
      fireEvent(node, buildEvent('input', node, value));
    },
    textContent: async () => {
      const node = tryFind(() => canvas.getByRole(role, name !== undefined ? { name } : undefined));
      return node ? nodeText(node) : null;
    },
    count: async () => {
      return tryFind(() => canvas.getByRole(role, name !== undefined ? { name } : undefined)) ? 1 : 0;
    },
    node: () => tryFind(() => canvas.getByRole(role, name !== undefined ? { name } : undefined)),
  };
}

function buildEvent(type: string, target: MockNode, value?: string): MockEvent {
  return {
    type,
    target,
    ...(value !== undefined ? { value } : {}),
  };
}

function tryFind(fn: () => MockNode): MockNode | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

function nodeText(node: MockNode): string {
  const parts: string[] = [];
  if (node.text) parts.push(node.text);
  for (const child of node.children) {
    parts.push(nodeText(child));
  }
  return parts.join('').trim();
}

function clearHandlers(node: MockNode): void {
  node.handlers = {};
  for (const child of node.children) {
    clearHandlers(child);
  }
}
