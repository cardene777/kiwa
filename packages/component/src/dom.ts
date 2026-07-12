import { createHash } from 'node:crypto';
import type { CanvasElement, MockEvent, MockNode } from './types.js';

/**
 * MockNode + CanvasElement の生成 / traversal / event 発火 helper 群。
 *
 * 実 DOM (jsdom / happy-dom) を使わない理由 = (1) Storybook 8 / Playwright CT /
 * Chromatic の 3 統合 mock で共通の抽象を提供したい、 (2) framework agnostic
 * (React / Vue / Svelte / Solid) にする、 (3) test 速度と決定性を最優先する。
 *
 * MockNode tree は tag / attrs / text / children で表現、 実 DOM の subset を
 * 網羅する (querySelector 相当の tag / .class / #id / attr selector、 getByText、
 * getByRole)。 fill / click は event handler を synchronously 呼ぶ。
 */

/** node factory — attrs / children / text / value を任意で与える。 */
export function createNode(tag: string, options: NodeOptions = {}): MockNode {
  const node: MockNode = {
    tag,
    attrs: options.attrs ?? {},
    children: [],
    handlers: {},
    parent: null,
    ...(options.text !== undefined ? { text: options.text } : {}),
    ...(options.value !== undefined ? { value: options.value } : {}),
  };
  for (const child of options.children ?? []) {
    appendChild(node, child);
  }
  if (options.on) {
    for (const [event, handler] of Object.entries(options.on)) {
      addHandler(node, event, handler);
    }
  }
  return node;
}

export interface NodeOptions {
  attrs?: Record<string, string>;
  text?: string;
  value?: string;
  children?: MockNode[];
  on?: Record<string, (event: MockEvent) => void>;
}

/** node に child を追加、 parent back reference も更新する。 */
export function appendChild(parent: MockNode, child: MockNode): void {
  parent.children.push(child);
  child.parent = parent;
}

/** event handler を登録、 同一 event に複数 handler を許容する。 */
export function addHandler(node: MockNode, event: string, handler: (event: MockEvent) => void): void {
  if (!node.handlers[event]) {
    node.handlers[event] = [];
  }
  node.handlers[event].push(handler);
}

/**
 * event を発火する。 実 DOM のような bubble はせず target 単発、 mock harness
 * では component 側で bubble 相当を実装する。 fill 相当は input event を発火。
 */
export function fireEvent(node: MockNode, event: MockEvent): void {
  const handlers = node.handlers[event.type];
  if (!handlers) return;
  for (const handler of handlers) {
    handler(event);
  }
}

/**
 * CanvasElement 生成 — root node と lookup helpers を wrap する。 mount 完了後
 * story / component test / visual capture の全経路で使う。
 */
export function createCanvas(root: MockNode): CanvasElement {
  return {
    root,
    getByText: (text: string) => {
      const found = findByText(root, text);
      if (!found) {
        throw new Error(`Canvas.getByText — no node with text ${JSON.stringify(text)}`);
      }
      return found;
    },
    getByRole: (role: string, options?: { name?: string }) => {
      const found = findByRole(root, role, options?.name);
      if (!found) {
        const nameSuffix = options?.name ? ` name=${JSON.stringify(options.name)}` : '';
        throw new Error(`Canvas.getByRole — no node with role=${role}${nameSuffix}`);
      }
      return found;
    },
    querySelector: (selector: string) => query(root, selector, false)[0] ?? null,
    querySelectorAll: (selector: string) => query(root, selector, true),
    toMarkup: () => renderMarkup(root),
  };
}

/**
 * MockNode subtree を deterministic な pseudo-HTML 文字列に変換する。
 * event handler は含めず、 tag / attrs / text / children のみ。
 * Chromatic の hash / markup 保存に使う。
 */
export function renderMarkup(node: MockNode): string {
  const attrs = Object.entries(node.attrs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ` ${k}=${JSON.stringify(v)}`)
    .join('');
  const valueAttr =
    node.value !== undefined ? ` value=${JSON.stringify(node.value)}` : '';
  const openTag = `<${node.tag}${attrs}${valueAttr}>`;
  const inner = [
    node.text ?? '',
    ...node.children.map(renderMarkup),
  ].join('');
  return `${openTag}${inner}</${node.tag}>`;
}

/** markup 文字列を deterministic SHA-256 hex substring (先頭 16) に変換。 */
export function hashMarkup(markup: string): string {
  return createHash('sha256').update(markup).digest('hex').slice(0, 16);
}

/**
 * text 一致で最初に見つかった node を返す。 深い node を優先する — root 側の
 * aggregated text ではなく、 実際に text を持つ leaf 相当の node を先に返す
 * (Storybook / Testing Library の getByText 挙動と揃える)。
 */
export function findByText(node: MockNode, text: string): MockNode | null {
  for (const child of node.children) {
    const found = findByText(child, text);
    if (found) return found;
  }
  if (nodeText(node) === text) return node;
  return null;
}

/**
 * role 属性 (`role="button"`) or implicit role (button tag) と、 aria-label /
 * text で一致する node を返す。 mock は最小 subset (button / link / heading /
 * textbox / checkbox) のみ。
 */
export function findByRole(node: MockNode, role: string, accessibleName?: string): MockNode | null {
  const implicit = implicitRole(node);
  const nodeRole = node.attrs['role'] ?? implicit;
  if (nodeRole === role) {
    if (accessibleName === undefined) return node;
    const name = accessibleNameOf(node);
    if (name === accessibleName) return node;
  }
  for (const child of node.children) {
    const found = findByRole(child, role, accessibleName);
    if (found) return found;
  }
  return null;
}

/** node の direct text (子 element を含まず、 空白 trim 済)。 */
function nodeText(node: MockNode): string {
  if (node.text !== undefined) return node.text.trim();
  return node.children
    .map((c) => c.text ?? '')
    .join('')
    .trim();
}

/** button / a / h1-h6 / input タグから ARIA implicit role を返す。 */
function implicitRole(node: MockNode): string | null {
  switch (node.tag) {
    case 'button':
      return 'button';
    case 'a':
      return node.attrs['href'] ? 'link' : null;
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return 'heading';
    case 'input': {
      const type = node.attrs['type'] ?? 'text';
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'submit' || type === 'button') return 'button';
      return 'textbox';
    }
    case 'textarea':
      return 'textbox';
    case 'nav':
      return 'navigation';
    case 'main':
      return 'main';
    default:
      return null;
  }
}

/** aria-label > text content の順で accessible name を決める。 */
function accessibleNameOf(node: MockNode): string {
  const label = node.attrs['aria-label'];
  if (label) return label;
  return nodeText(node);
}

/**
 * querySelector の最小 subset。 tag / .class / #id / [attr=value] / 子孫 (space)
 * 結合子を support する。 実 CSS selector 全対応ではないが、 mock 用途では十分。
 *
 * MockNode tree では canvas.root が component 自体を指すため、 root も検査対象
 * に含める (実 DOM の `document.querySelector` は container を除くが、 mock は
 * component rendering root = 検索対象という semantics に揃える)。
 */
export function query(root: MockNode, selector: string, all: boolean): MockNode[] {
  const parts = selector.trim().split(/\s+/);
  let candidates: MockNode[] = collectTree(root);
  for (const part of parts) {
    candidates = candidates.filter((n) => matchesSimple(n, part));
    if (!all && candidates.length > 0) {
      return [candidates[0]!];
    }
  }
  return all ? candidates : [];
}

function collectTree(root: MockNode): MockNode[] {
  const out: MockNode[] = [root];
  for (const child of root.children) {
    out.push(...collectTree(child));
  }
  return out;
}

function matchesSimple(node: MockNode, selector: string): boolean {
  // selector = tag | .class | #id | [attr=value] | tag.class#id[attr] chain。
  // 先頭に tag が来る場合は先に消費し、 残りの primitive を順に検査する。
  let rest = selector;
  const tagMatch = rest.match(/^([a-zA-Z][a-zA-Z0-9_-]*)/);
  if (tagMatch) {
    if (node.tag !== tagMatch[1]) return false;
    rest = rest.slice(tagMatch[0].length);
  }
  // primitive を .class / #id / [attr=value] / [attr] の 4 種に分解して順次 AND
  while (rest.length > 0) {
    const attr = rest.match(/^\[([a-zA-Z0-9_-]+)(=(\"[^\"]*\"|'[^']*'|[^\]]+))?\]/);
    if (attr) {
      const name = attr[1]!;
      const raw = attr[3];
      if (raw === undefined) {
        if (node.attrs[name] === undefined) return false;
      } else {
        const unquoted = raw.replace(/^["']|["']$/g, '');
        if (node.attrs[name] !== unquoted) return false;
      }
      rest = rest.slice(attr[0].length);
      continue;
    }
    const cls = rest.match(/^\.([a-zA-Z0-9_-]+)/);
    if (cls) {
      const nodeClasses = (node.attrs['class'] ?? '').split(/\s+/).filter(Boolean);
      if (!nodeClasses.includes(cls[1]!)) return false;
      rest = rest.slice(cls[0].length);
      continue;
    }
    const id = rest.match(/^#([a-zA-Z0-9_-]+)/);
    if (id) {
      if (node.attrs['id'] !== id[1]) return false;
      rest = rest.slice(id[0].length);
      continue;
    }
    // 未知の syntax は不一致にする
    return false;
  }
  return true;
}
