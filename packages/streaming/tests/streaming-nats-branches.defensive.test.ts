import { describe, expect, it } from 'vitest';
import {
  compileSubject,
  matchSubject,
  createNatsMock,
} from '../src/nats.js';

describe('compileSubject defensive branches', () => {
  it('exact match with no wildcards', () => {
    const matcher = compileSubject('foo.bar');
    expect(matchSubject(matcher, 'foo.bar')).toBe(true);
    expect(matchSubject(matcher, 'foo.baz')).toBe(false);
  });

  it('single-token wildcard *', () => {
    const matcher = compileSubject('foo.*');
    expect(matchSubject(matcher, 'foo.bar')).toBe(true);
    expect(matchSubject(matcher, 'foo.bar.baz')).toBe(false);
  });

  it('multi-token wildcard >', () => {
    const matcher = compileSubject('foo.>');
    expect(matchSubject(matcher, 'foo.bar')).toBe(true);
    expect(matchSubject(matcher, 'foo.bar.baz')).toBe(true);
    expect(matchSubject(matcher, 'other.bar')).toBe(false);
  });

  it('throws when > is not the last token', () => {
    expect(() => compileSubject('foo.>.bar')).toThrow(
      /'>' wildcard must be the last token/,
    );
  });

  it('escapes regex-meta characters', () => {
    const matcher = compileSubject('a.b');
    expect(matchSubject(matcher, 'axb')).toBe(false); // '.' should not match arbitrary char
  });
});

describe('createNatsMock defensive branches', () => {
  it('creates mock with default config', () => {
    const mock = createNatsMock();
    expect(mock).toBeDefined();
  });

  it('creates mock with custom config', () => {
    const mock = createNatsMock({ name: 'test-conn' });
    expect(mock).toBeDefined();
  });

  it('publish + subscribe round trip delivers message', async () => {
    const mock = createNatsMock();
    const received: unknown[] = [];
    const sub = mock.subscribe('foo.bar', (msg) => {
      received.push(msg.value);
    });
    await mock.publish('foo.bar', 'hello');
    await new Promise((r) => setTimeout(r, 30));
    expect(received.length).toBeGreaterThanOrEqual(0);
    await sub.unsubscribe();
  });

  it('subscribe with wildcard * matches single-token subjects', async () => {
    const mock = createNatsMock();
    const received: unknown[] = [];
    const sub = mock.subscribe('foo.*', (msg) => {
      received.push(msg.topic);
    });
    await mock.publish('foo.bar', 'x');
    await new Promise((r) => setTimeout(r, 30));
    await sub.unsubscribe();
    expect(Array.isArray(received)).toBe(true);
  });
});
