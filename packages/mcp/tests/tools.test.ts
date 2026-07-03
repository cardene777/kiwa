import { describe, expect, it } from 'vitest';
import { ToolRegistry, textContent, validateSchema } from '../src/index.js';
import type { McpTool, ToolInputSchema } from '../src/index.js';

const echoTool: McpTool = {
  name: 'echo',
  description: 'x',
  inputSchema: { type: 'object', properties: { m: { type: 'string' } }, required: ['m'] },
};

describe('ToolRegistry', () => {
  it('registers and lists tools in insertion order', () => {
    const r = new ToolRegistry();
    r.register(echoTool, () => [textContent('ok')]);
    r.register({ name: 'b', description: '', inputSchema: { type: 'object' } }, () => []);
    const list = r.list();
    expect(list.map((t) => t.name)).toEqual(['echo', 'b']);
    expect(r.size).toBe(2);
  });

  it('unregister removes the tool by name', () => {
    const r = new ToolRegistry();
    r.register(echoTool, () => []);
    expect(r.unregister('echo')).toBe(true);
    expect(r.unregister('echo')).toBe(false);
    expect(r.size).toBe(0);
  });

  it('re-register with same name overwrites the handler', async () => {
    const r = new ToolRegistry();
    r.register(echoTool, () => [textContent('v1')]);
    r.register(echoTool, () => [textContent('v2')]);
    const got = r.get('echo');
    expect(got).toBeDefined();
    const result = await got!.handler({});
    expect(result[0]).toEqual({ type: 'text', text: 'v2' });
  });

  it('register throws on empty name', () => {
    const r = new ToolRegistry();
    expect(() =>
      r.register({ name: '', description: '', inputSchema: { type: 'object' } }, () => []),
    ).toThrow(/non-empty/);
  });
});

describe('validateSchema — kiwa mock subset', () => {
  it('accepts a valid object', () => {
    const schema: ToolInputSchema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    };
    expect(validateSchema(schema, { name: 'x' })).toEqual([]);
  });

  it('flags missing required property', () => {
    const schema: ToolInputSchema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    };
    const errors = validateSchema(schema, {});
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/missing required property "name"/);
  });

  it('flags wrong type on nested property', () => {
    const schema: ToolInputSchema = {
      type: 'object',
      properties: { count: { type: 'number' } },
    };
    const errors = validateSchema(schema, { count: 'not-a-number' });
    expect(errors[0]).toMatch(/expected number, got string/);
  });

  it('integer type rejects non-integers', () => {
    const schema: ToolInputSchema = { type: 'integer' };
    expect(validateSchema(schema, 1)).toEqual([]);
    expect(validateSchema(schema, 1.5)[0]).toMatch(/expected integer/);
    expect(validateSchema(schema, 'x')[0]).toMatch(/expected integer, got string/);
  });

  it('enum check accepts values in the list', () => {
    const schema: ToolInputSchema = { type: 'string', enum: ['add', 'sub'] };
    expect(validateSchema(schema, 'add')).toEqual([]);
    expect(validateSchema(schema, 'mul')[0]).toMatch(/value not in enum/);
  });

  it('array items are validated recursively', () => {
    const schema: ToolInputSchema = { type: 'array', items: { type: 'string' } };
    expect(validateSchema(schema, ['a', 'b'])).toEqual([]);
    const errors = validateSchema(schema, ['a', 2]);
    expect(errors[0]).toMatch(/\[1\]: expected string, got number/);
  });
});
