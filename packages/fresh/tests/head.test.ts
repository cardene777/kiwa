import { describe, expect, it } from 'vitest';
import {
  defineHead,
  mergeHead,
  renderHead,
  extractHead,
  isHeadFragment,
  HEAD_SYMBOL,
} from '../src/head.js';
import { h } from '../src/route.js';

describe('defineHead', () => {
  it('T-FR-043 builds a fragment with brand + neutral defaults', () => {
    const head = defineHead({});
    expect(isHeadFragment(head)).toBe(true);
    expect(head[HEAD_SYMBOL]).toBe(true);
    expect(head.title).toBeUndefined();
    expect(head.meta).toEqual([]);
    expect(head.link).toEqual([]);
    expect(head.script).toEqual([]);
    expect(head.base).toBeUndefined();
  });

  it('T-FR-044 preserves supplied fields verbatim', () => {
    const head = defineHead({
      title: 'x',
      meta: [{ name: 'viewport', content: 'v' }],
      link: [{ rel: 'icon', href: '/f.ico' }],
      script: [{ src: '/s.js' }],
      base: { href: '/' },
    });
    expect(head.title).toBe('x');
    expect(head.meta).toHaveLength(1);
    expect(head.link).toHaveLength(1);
    expect(head.script).toHaveLength(1);
    expect(head.base?.href).toBe('/');
  });
});

describe('mergeHead', () => {
  it('T-FR-045 last non-empty title wins', () => {
    const merged = mergeHead([
      defineHead({ title: 'A' }),
      defineHead({ title: '' }),
      defineHead({ title: 'B' }),
    ]);
    expect(merged.title).toBe('B');
  });

  it('T-FR-046 dedups meta by name (later fragment overrides)', () => {
    const merged = mergeHead([
      defineHead({ meta: [{ name: 'description', content: 'first' }] }),
      defineHead({ meta: [{ name: 'description', content: 'second' }] }),
    ]);
    expect(merged.meta).toHaveLength(1);
    expect(merged.meta[0]?.content).toBe('second');
  });

  it('T-FR-047 dedups meta by property (og:title) separately from name', () => {
    const merged = mergeHead([
      defineHead({
        meta: [
          { name: 'description', content: 'a' },
          { property: 'og:title', content: 'b' },
        ],
      }),
      defineHead({ meta: [{ property: 'og:title', content: 'c' }] }),
    ]);
    expect(merged.meta).toHaveLength(2);
    const og = merged.meta.find((m) => m.property === 'og:title');
    expect(og?.content).toBe('c');
  });

  it('T-FR-048 charset is a singleton (last wins) + emitted first', () => {
    const merged = mergeHead([
      defineHead({ meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'v' }] }),
      defineHead({ meta: [{ charset: 'ascii' }] }),
    ]);
    expect(merged.meta[0]?.charset).toBe('ascii');
    expect(merged.meta[1]?.name).toBe('viewport');
  });

  it('T-FR-049 dedups link by rel + href', () => {
    const merged = mergeHead([
      defineHead({ link: [{ rel: 'stylesheet', href: '/a.css' }, { rel: 'icon', href: '/i.ico' }] }),
      defineHead({ link: [{ rel: 'stylesheet', href: '/a.css', media: 'print' }] }),
    ]);
    expect(merged.link).toHaveLength(2);
    const stylesheet = merged.link.find((l) => l.rel === 'stylesheet' && l.href === '/a.css');
    expect(stylesheet?.media).toBe('print');
  });

  it('T-FR-050 dedups external script by src + keeps every inline script', () => {
    const merged = mergeHead([
      defineHead({
        script: [
          { src: '/lib.js' },
          { children: 'console.log(1)' },
          { children: 'console.log(2)' },
        ],
      }),
      defineHead({ script: [{ src: '/lib.js', defer: true }] }),
    ]);
    expect(merged.script.filter((s) => s.src === '/lib.js')).toHaveLength(1);
    expect(merged.script.find((s) => s.src === '/lib.js')?.defer).toBe(true);
    expect(merged.script.filter((s) => s.children).length).toBe(2);
  });

  it('T-FR-051 last non-null base wins', () => {
    const merged = mergeHead([
      defineHead({ base: { href: '/a' } }),
      defineHead({}),
      defineHead({ base: { href: '/b', target: '_blank' } }),
    ]);
    expect(merged.base?.href).toBe('/b');
    expect(merged.base?.target).toBe('_blank');
  });
});

describe('renderHead', () => {
  it('T-FR-052 renders in canonical order: title → base → meta → link → script', () => {
    const head = defineHead({
      title: 'Page',
      base: { href: '/' },
      meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width' }],
      link: [{ rel: 'icon', href: '/f.ico' }],
      script: [{ src: '/app.js', defer: true }],
    });
    const html = renderHead(head);
    expect(html).toBe(
      '<title>Page</title>' +
        '<base href="/" />' +
        '<meta charset="utf-8" />' +
        '<meta name="viewport" content="width=device-width" />' +
        '<link rel="icon" href="/f.ico" />' +
        '<script src="/app.js" defer></script>',
    );
  });

  it('T-FR-053 renders inline script content between tags', () => {
    const head = defineHead({ script: [{ type: 'application/json', children: '{"ok":1}' }] });
    expect(renderHead(head)).toBe('<script type="application/json">{"ok":1}</script>');
  });

  it('T-FR-054 omits base + title + meta / link / script when empty', () => {
    expect(renderHead(defineHead({}))).toBe('');
  });
});

describe('extractHead — full tag coverage', () => {
  it('T-FR-055a harvests script (external + inline) + base from <head>', () => {
    const tree = h(
      'html',
      null,
      h(
        'head',
        null,
        h('script', { src: '/a.js', defer: true, type: 'module', integrity: 'sha384-x', crossorigin: 'anonymous' }),
        h('script', { async: true, nomodule: true }, 'console.log(1)'),
        h('base', { href: '/root', target: '_self' }),
      ),
    );
    const head = extractHead(tree);
    expect(head.script).toHaveLength(2);
    expect(head.script[0]?.src).toBe('/a.js');
    expect(head.script[0]?.defer).toBe(true);
    expect(head.script[0]?.type).toBe('module');
    expect(head.script[0]?.integrity).toBe('sha384-x');
    expect(head.script[0]?.crossorigin).toBe('anonymous');
    expect(head.script[1]?.children).toBe('console.log(1)');
    expect(head.script[1]?.async).toBe(true);
    expect(head.script[1]?.nomodule).toBe(true);
    expect(head.base?.href).toBe('/root');
    expect(head.base?.target).toBe('_self');
  });

  it('T-FR-055b harvests every meta attr variant (charset / property / http-equiv / httpEquiv fallback)', () => {
    const tree = h(
      'head',
      null,
      h('meta', { charset: 'utf-8' }),
      h('meta', { property: 'og:image', content: '/img.png' }),
      h('meta', { 'http-equiv': 'refresh', content: '30' }),
      h('meta', { httpEquiv: 'X-UA-Compatible', content: 'IE=edge' }),
    );
    const head = extractHead(tree);
    // charset is a singleton, others dedup by key → 4 meta total
    expect(head.meta).toHaveLength(4);
    expect(head.meta.find((m) => m.charset === 'utf-8')).toBeTruthy();
    expect(head.meta.find((m) => m.property === 'og:image')?.content).toBe('/img.png');
    expect(head.meta.find((m) => m.httpEquiv === 'refresh')?.content).toBe('30');
    expect(head.meta.find((m) => m.httpEquiv === 'X-UA-Compatible')?.content).toBe('IE=edge');
  });

  it('T-FR-055c walks arrays + nested elements in the head', () => {
    const tree = h('head', null, [h('title', null, 'wrap'), [h('meta', { name: 'a', content: 'b' })]]);
    const head = extractHead(tree);
    expect(head.title).toBe('wrap');
    expect(head.meta[0]?.name).toBe('a');
  });

  it('T-FR-055d harvests link with full attribute set (type / sizes / media / crossorigin / integrity)', () => {
    const tree = h(
      'head',
      null,
      h('link', {
        rel: 'preload',
        href: '/a.css',
        type: 'text/css',
        sizes: '32x32',
        media: 'print',
        crossorigin: 'anonymous',
        integrity: 'sha384-abc',
      }),
    );
    const head = extractHead(tree);
    expect(head.link[0]).toEqual({
      rel: 'preload',
      href: '/a.css',
      type: 'text/css',
      sizes: '32x32',
      media: 'print',
      crossorigin: 'anonymous',
      integrity: 'sha384-abc',
    });
  });

  it('T-FR-055e title accepts nested text spans + skips boolean / null children', () => {
    const tree = h('head', null, h('title', null, 'a', null, false, ['b', h('span', null, 'c')]));
    const head = extractHead(tree);
    expect(head.title).toBe('abc');
  });
});

describe('extractHead', () => {
  it('T-FR-055 harvests title + meta + link from a virtual tree with <head>', () => {
    const tree = h(
      'html',
      null,
      h(
        'head',
        null,
        h('title', null, 'x'),
        h('meta', { name: 'description', content: 'd' }),
        h('link', { rel: 'icon', href: '/f' }),
      ),
      h('body', null, h('p', null, 'body')),
    );
    const head = extractHead(tree);
    expect(head.title).toBe('x');
    expect(head.meta[0]?.content).toBe('d');
    expect(head.link[0]?.href).toBe('/f');
  });

  it('T-FR-056 harvests from multiple <Head> islands + merges + latest title wins', () => {
    const tree = h(
      'main',
      null,
      h('Head', null, h('title', null, 'first'), h('meta', { name: 'x', content: '1' })),
      h(
        'section',
        null,
        h('Head', null, h('title', null, 'second'), h('meta', { name: 'x', content: '2' })),
      ),
    );
    const head = extractHead(tree);
    expect(head.title).toBe('second');
    expect(head.meta).toHaveLength(1);
    expect(head.meta[0]?.content).toBe('2');
  });

  it('T-FR-057 extractHead returns neutral fragment when no head is present', () => {
    const tree = h('p', null, 'nothing');
    const head = extractHead(tree);
    expect(head.title).toBeUndefined();
    expect(head.meta).toEqual([]);
  });

  it('T-FR-058 renderHead round-trip preserves canonical serialization', () => {
    const tree = h(
      'html',
      null,
      h('Head', null, h('title', null, 'Round Trip'), h('meta', { name: 'description', content: 'y' })),
    );
    const merged = extractHead(tree);
    const html = renderHead(merged);
    expect(html).toBe('<title>Round Trip</title><meta name="description" content="y" />');
  });
});
