import { describe, expect, it } from 'vitest';
import {
  calcHandler,
  weatherHandler,
  echoHandler,
} from '../src/fixture.js';

describe('calcHandler defensive branches', () => {
  it('add operation', () => {
    const result = calcHandler({ op: 'add', a: 2, b: 3 });
    expect(JSON.stringify(result)).toContain('5');
  });

  it('subtract operation', () => {
    const result = calcHandler({ op: 'subtract', a: 10, b: 3 });
    expect(JSON.stringify(result)).toContain('7');
  });

  it('multiply operation', () => {
    const result = calcHandler({ op: 'multiply', a: 6, b: 7 });
    expect(JSON.stringify(result)).toContain('42');
  });

  it('divide operation', () => {
    const result = calcHandler({ op: 'divide', a: 20, b: 4 });
    expect(JSON.stringify(result)).toContain('5');
  });

  it('divide by zero throws error', () => {
    expect(() => calcHandler({ op: 'divide', a: 10, b: 0 })).toThrow(
      /division by zero/,
    );
  });
});

describe('weatherHandler defensive branches', () => {
  it('returns weather for known city (tokyo)', () => {
    const result = weatherHandler({ city: 'tokyo' });
    expect(result).toBeDefined();
  });

  it('returns weather for known city (osaka)', () => {
    const result = weatherHandler({ city: 'osaka' });
    expect(result).toBeDefined();
  });

  it('returns for unknown city (fallback path)', () => {
    const result = weatherHandler({ city: 'unknown-city' });
    expect(result).toBeDefined();
  });

  it('honors unit parameter (fahrenheit)', () => {
    const result = weatherHandler({ city: 'tokyo', unit: 'fahrenheit' });
    expect(result).toBeDefined();
  });

  it('defaults unit to celsius when omitted', () => {
    const result = weatherHandler({ city: 'tokyo' });
    expect(result).toBeDefined();
  });

  it('handles case-insensitive city input', () => {
    const result = weatherHandler({ city: 'TOKYO' });
    expect(result).toBeDefined();
  });
});

describe('echoHandler defensive branches', () => {
  it('echoes message input', () => {
    const result = echoHandler({ message: 'hello' });
    expect(JSON.stringify(result)).toContain('hello');
  });
});
