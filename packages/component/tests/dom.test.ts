import { describe, expect, it } from 'vitest';
import {
  appendChild,
  createCanvas,
  createNode,
  fireEvent,
  hashMarkup,
  renderMarkup,
} from '../src/index.js';

describe('createNode + appendChild', () => {
  it('creates a node with tag / attrs / text / children', () => {
    const node = createNode('div', {
      attrs: { class: 'foo' },
      text: 'hello',
    });
    expect(node.tag).toBe('div');
    expect(node.attrs['class']).toBe('foo');
    expect(node.text).toBe('hello');
  });

  it('appendChild wires parent back reference', () => {
    const parent = createNode('div');
    const child = createNode('span');
    appendChild(parent, child);
    expect(parent.children).toHaveLength(1);
    expect(child.parent).toBe(parent);
  });
});

describe('fireEvent + handler registration', () => {
  it('fires a click event to registered handler', () => {
    let hits = 0;
    const btn = createNode('button', {
      on: { click: () => hits++ },
    });
    fireEvent(btn, { type: 'click', target: btn });
    expect(hits).toBe(1);
  });

  it('fires nothing when no handler registered', () => {
    const div = createNode('div');
    // Should not throw
    fireEvent(div, { type: 'click', target: div });
    expect(true).toBe(true);
  });
});

describe('canvas — getByText + getByRole', () => {
  it('getByText finds nested text node', () => {
    const root = createNode('div');
    appendChild(root, createNode('h1', { text: 'Title' }));
    const canvas = createCanvas(root);
    expect(canvas.getByText('Title').tag).toBe('h1');
  });

  it('getByText throws when text not found', () => {
    const root = createNode('div');
    const canvas = createCanvas(root);
    expect(() => canvas.getByText('Missing')).toThrow('no node with text');
  });

  it('getByRole finds implicit button role', () => {
    const root = createNode('div');
    appendChild(root, createNode('button', { text: 'ok' }));
    const canvas = createCanvas(root);
    expect(canvas.getByRole('button').text).toBe('ok');
  });

  it('getByRole with name filters by accessible name', () => {
    const root = createNode('div');
    appendChild(root, createNode('button', { text: 'a' }));
    appendChild(root, createNode('button', { text: 'b' }));
    const canvas = createCanvas(root);
    expect(canvas.getByRole('button', { name: 'b' }).text).toBe('b');
  });

  it('getByRole finds textbox for input', () => {
    const root = createNode('div');
    appendChild(root, createNode('input', { attrs: { type: 'text' } }));
    const canvas = createCanvas(root);
    expect(canvas.getByRole('textbox').tag).toBe('input');
  });

  it('getByRole uses aria-label as accessible name', () => {
    const root = createNode('div');
    appendChild(
      root,
      createNode('button', {
        attrs: { 'aria-label': 'Close dialog' },
        text: 'x',
      }),
    );
    const canvas = createCanvas(root);
    expect(canvas.getByRole('button', { name: 'Close dialog' }).text).toBe('x');
  });
});

describe('canvas — querySelector variants', () => {
  it('tag selector', () => {
    const root = createNode('div');
    appendChild(root, createNode('span', { text: 'inner' }));
    const canvas = createCanvas(root);
    expect(canvas.querySelector('span')?.text).toBe('inner');
  });

  it('.class selector', () => {
    const root = createNode('div');
    appendChild(root, createNode('span', { attrs: { class: 'foo bar' } }));
    const canvas = createCanvas(root);
    expect(canvas.querySelector('.bar')?.tag).toBe('span');
  });

  it('#id selector', () => {
    const root = createNode('div');
    appendChild(root, createNode('span', { attrs: { id: 'title' } }));
    const canvas = createCanvas(root);
    expect(canvas.querySelector('#title')?.tag).toBe('span');
  });

  it('[attr=value] selector', () => {
    const root = createNode('div');
    appendChild(root, createNode('input', { attrs: { type: 'email' } }));
    const canvas = createCanvas(root);
    expect(canvas.querySelector('input[type=email]')?.attrs['type']).toBe('email');
  });

  it('querySelectorAll returns multiple matches', () => {
    const root = createNode('ul');
    appendChild(root, createNode('li', { text: '1' }));
    appendChild(root, createNode('li', { text: '2' }));
    appendChild(root, createNode('li', { text: '3' }));
    const canvas = createCanvas(root);
    expect(canvas.querySelectorAll('li')).toHaveLength(3);
  });
});

describe('renderMarkup + hashMarkup', () => {
  it('renderMarkup produces deterministic pseudo-HTML with sorted attrs', () => {
    const a = createNode('button', { attrs: { class: 'x', id: 'a' }, text: 'ok' });
    const b = createNode('button', { attrs: { id: 'a', class: 'x' }, text: 'ok' });
    expect(renderMarkup(a)).toBe(renderMarkup(b));
    expect(renderMarkup(a)).toContain('<button');
    expect(renderMarkup(a)).toContain('ok');
  });

  it('hashMarkup returns 16-char hex from SHA-256', () => {
    const hash = hashMarkup('<button>ok</button>');
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it('different markup produces different hashes', () => {
    const h1 = hashMarkup('<button>a</button>');
    const h2 = hashMarkup('<button>b</button>');
    expect(h1).not.toBe(h2);
  });

  it('renderMarkup includes value attr for input', () => {
    const input = createNode('input', {
      attrs: { type: 'text' },
      value: 'hello',
    });
    expect(renderMarkup(input)).toContain('value="hello"');
  });
});
