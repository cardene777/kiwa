import { describe, expect, it } from 'vitest';
import {
  defineIsland,
  hydrateIslands,
  islandPlaceholder,
} from '../src/islands.js';
import { extractHead } from '../src/head.js';

describe('fresh islands defensive branches', () => {
  it('placeholder with invalid JSON encoded props returns empty {} silently', () => {
    const island = defineIsland({
      name: 'Counter',
      component: (props: { count?: number }) => ({
        type: 'div',
        props: {},
        children: [`count: ${props.count ?? 0}`],
      }),
    });
    // SSR tree with malformed props JSON on placeholder
    const ssrTree = {
      type: 'div',
      props: {},
      children: [
        {
          type: 'div',
          props: {
            'data-island': 'Counter',
            'data-props': '{not-valid-json',
          },
          children: [],
        },
      ],
    };
    const result = hydrateIslands({ ssrTree, islands: [island] });
    expect(result.hydrated).toHaveLength(1);
  });

  it('placeholder with props as JSON array (not object) returns {} fallback', () => {
    const island = defineIsland({
      name: 'Counter2',
      component: () => ({ type: 'div', props: {}, children: [] }),
    });
    const ssrTree = {
      type: 'div',
      props: {},
      children: [
        {
          type: 'div',
          props: {
            'data-island': 'Counter2',
            'data-props': '[1,2,3]',
          },
          children: [],
        },
      ],
    };
    const result = hydrateIslands({ ssrTree, islands: [island] });
    expect(result.hydrated).toHaveLength(1);
  });

  it('placeholder with valid props JSON is parsed correctly', () => {
    const captured: unknown[] = [];
    const island = defineIsland({
      name: 'Counter3',
      component: (props: { count?: number }) => {
        captured.push(props);
        return { type: 'div', props: {}, children: [`count: ${props.count}`] };
      },
    });
    const ssrTree = {
      type: 'div',
      props: {},
      children: [
        {
          type: 'div',
          props: {
            'data-island': 'Counter3',
            'data-props': '{"count":42}',
          },
          children: [],
        },
      ],
    };
    hydrateIslands({ ssrTree, islands: [island] });
    expect(captured).toContainEqual({ count: 42 });
  });

  it('islandPlaceholder generates data-island element', () => {
    const island = defineIsland({
      name: 'MyIsland',
      component: () => ({ type: 'div', props: {}, children: [] }),
    });
    const placeholder = islandPlaceholder(island, { x: 1 });
    expect(placeholder.type).toBe('div');
    expect(placeholder.props['data-island']).toBe('MyIsland');
  });

  it('hydrateIslands with no matching island definitions returns empty hydrated', () => {
    const ssrTree = {
      type: 'div',
      props: {},
      children: [
        {
          type: 'div',
          props: { 'data-island': 'Unknown' },
          children: [],
        },
      ],
    };
    const result = hydrateIslands({ ssrTree, islands: [] });
    expect(result.unregistered.length).toBeGreaterThan(0);
  });
});

describe('fresh head extract defensive branches', () => {
  it('extractHead handles empty tree (no Head nodes)', () => {
    const tree = {
      type: 'div',
      props: {},
      children: ['hello'],
    };
    const head = extractHead(tree);
    expect(head.meta).toEqual([]);
    expect(head.link).toEqual([]);
    expect(head.title).toBeUndefined();
  });

  it('extractHead collects title + meta from Head element', () => {
    const tree = {
      type: 'html',
      props: {},
      children: [
        {
          type: 'Head',
          props: {},
          children: [
            { type: 'title', props: {}, children: ['My Page'] },
            {
              type: 'meta',
              props: { charset: 'utf-8' },
              children: [],
            },
          ],
        },
      ],
    };
    const head = extractHead(tree);
    expect(head.title).toBe('My Page');
    expect(head.meta.length).toBeGreaterThan(0);
  });

  it('extractHead handles link with all optional fields', () => {
    const tree = {
      type: 'Head',
      props: {},
      children: [
        {
          type: 'link',
          props: {
            rel: 'stylesheet',
            href: '/style.css',
            type: 'text/css',
            sizes: '16x16',
            media: 'screen',
            crossorigin: 'anonymous',
          },
          children: [],
        },
      ],
    };
    const head = extractHead(tree);
    expect(head.link.length).toBeGreaterThan(0);
    expect(head.link[0]?.rel).toBe('stylesheet');
  });
});
