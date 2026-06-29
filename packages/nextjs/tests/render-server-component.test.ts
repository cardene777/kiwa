import { describe, expect, it } from 'vitest';
import {
  renderServerComponent,
  findAll,
  textContent,
  NOT_FOUND_SYMBOL,
  FORBIDDEN_SYMBOL,
  RSC_REDIRECT_SYMBOL,
  type RscElement,
  type RscNode,
} from '../src/render-server-component.js';

// Lightweight JSX-like factory so the test doesn't need a real React import.
function h(type: string, props: Record<string, unknown> = {}, ...children: RscNode[]): RscElement {
  return {
    type,
    key: null,
    props: { ...props, children: children.length === 1 ? children[0] : children },
  };
}

describe('renderServerComponent', () => {
  it('T-RSC-001 正常系: returns the awaited tree', async () => {
    const Page = async (props: { name: string }) =>
      h('main', {}, h('h1', {}, `Hello ${props.name}`));
    const { tree, signal, error } = await renderServerComponent({
      component: Page,
      props: { name: 'kiwa' },
    });
    expect(error).toBeUndefined();
    expect(signal).toBeNull();
    expect(textContent(tree)).toBe('Hello kiwa');
  });

  it('T-RSC-002 props default to empty object', async () => {
    const Page = async () => h('div', {}, 'no props');
    const { tree } = await renderServerComponent({ component: Page });
    expect(textContent(tree)).toBe('no props');
  });

  it('T-RSC-003 sync component is also supported', async () => {
    const Sync = (props: { msg: string }) => h('span', {}, props.msg);
    const { tree } = await renderServerComponent({ component: Sync, props: { msg: 'sync' } });
    expect(textContent(tree)).toBe('sync');
  });

  it('T-RSC-004 findAll: locate every <li> in a list', async () => {
    const Page = async () =>
      h('ul', {}, h('li', {}, 'a'), h('li', {}, 'b'), h('li', {}, 'c'));
    const { tree } = await renderServerComponent({ component: Page });
    const items = findAll(tree, (node) => node.type === 'li');
    expect(items).toHaveLength(3);
    expect(items.map((i) => textContent(i))).toEqual(['a', 'b', 'c']);
  });

  it('T-RSC-005 textContent: joined leaves of mixed children', async () => {
    const Page = async () => h('div', {}, 'A ', h('b', {}, 'B'), ' ', 42);
    const { tree } = await renderServerComponent({ component: Page });
    expect(textContent(tree)).toBe('A  B   42');
  });

  it('T-RSC-006 notFound signal: throws { [NOT_FOUND_SYMBOL]: true }, signal captures it', async () => {
    const Page = async () => {
      throw { [NOT_FOUND_SYMBOL]: true };
    };
    const { tree, signal, error } = await renderServerComponent({ component: Page });
    expect(tree).toBeNull();
    expect(error).toBeUndefined();
    expect(signal).not.toBeNull();
    expect((signal as { [NOT_FOUND_SYMBOL]?: true })[NOT_FOUND_SYMBOL]).toBe(true);
  });

  it('T-RSC-007 forbidden signal: throws { [FORBIDDEN_SYMBOL]: true }', async () => {
    const Page = async () => {
      throw { [FORBIDDEN_SYMBOL]: true };
    };
    const { signal } = await renderServerComponent({ component: Page });
    expect(signal).not.toBeNull();
    expect((signal as { [FORBIDDEN_SYMBOL]?: true })[FORBIDDEN_SYMBOL]).toBe(true);
  });

  it('T-RSC-008 redirect signal: url + type captured', async () => {
    const Page = async () => {
      throw { [RSC_REDIRECT_SYMBOL]: true, url: '/login', type: 'replace' as const };
    };
    const { signal } = await renderServerComponent({ component: Page });
    expect((signal as { url?: string; type?: string }).url).toBe('/login');
    expect((signal as { type?: string }).type).toBe('replace');
  });

  it('T-RSC-009 異常系: non-signal throw surfaces via error', async () => {
    const Page = async () => {
      throw new Error('db down');
    };
    const { tree, signal, error } = await renderServerComponent({ component: Page });
    expect(tree).toBeNull();
    expect(signal).toBeNull();
    expect((error as Error).message).toBe('db down');
  });

  it('T-RSC-010 nested findAll with predicate on props (data-testid)', async () => {
    const Page = async () =>
      h('div', {},
        h('section', { 'data-testid': 'header' }, 'H'),
        h('section', { 'data-testid': 'body' }, 'B'),
      );
    const { tree } = await renderServerComponent({ component: Page });
    const body = findAll(tree, (node) => (node.props as { 'data-testid'?: string })['data-testid'] === 'body');
    expect(body).toHaveLength(1);
    expect(textContent(body[0] as RscElement)).toBe('B');
  });

  it('T-RSC-011 fetched data: async component awaits a fake fetch and renders result', async () => {
    async function fetchUser() {
      return { id: 1, name: 'Alice' };
    }
    const Page = async () => {
      const user = await fetchUser();
      return h('div', {}, h('h1', {}, user.name), h('p', {}, `id=${user.id}`));
    };
    const { tree } = await renderServerComponent({ component: Page });
    expect(textContent(tree)).toBe('Alice id=1');
  });

  it('T-RSC-012 string-only return is preserved', async () => {
    const Page = async () => 'plain text';
    const { tree } = await renderServerComponent({ component: Page });
    expect(textContent(tree)).toBe('plain text');
  });

  it('T-RSC-013 boolean / null children are ignored by textContent', async () => {
    const Page = async () =>
      h('div', {}, false, null, 'visible', true, undefined);
    const { tree } = await renderServerComponent({ component: Page });
    expect(textContent(tree)).toBe('visible');
  });
});
