import { describe, expect, it } from 'vitest';
import { createHonoApp } from '../src/app.js';

describe('hono createHonoApp defensive branches', () => {
  it('joinPatterns returns "/" when both prefix and sub join to empty', async () => {
    const app = createHonoApp();
    const inner = createHonoApp();
    inner.get('/', (c) => c.text('root'));
    app.route('/', inner);
    const res = await app.request('/');
    expect(res.status).toBe(200);
  });

  it('joinPatterns handles empty prefix + sub without slash', async () => {
    const app = createHonoApp();
    const inner = createHonoApp();
    inner.get('/foo', (c) => c.text('foo'));
    app.route('', inner);
    const res = await app.request('/foo');
    expect(res.status).toBe(200);
  });

  it('middleware pipeline handles trailing next call with no more middleware', async () => {
    const app = createHonoApp();
    let called = 0;
    app.use('*', async (_c, next) => {
      called += 1;
      await next();
    });
    app.get('/x', (c) => c.text('x'));
    const res = await app.request('/x');
    expect(res.status).toBe(200);
    expect(called).toBe(1);
  });

  it('multiple middlewares call next in sequence', async () => {
    const app = createHonoApp();
    const order: number[] = [];
    app.use('*', async (_c, next) => {
      order.push(1);
      await next();
      order.push(4);
    });
    app.use('*', async (_c, next) => {
      order.push(2);
      await next();
      order.push(3);
    });
    app.get('/y', (c) => c.text('y'));
    await app.request('/y');
    expect(order).toEqual([1, 2, 3, 4]);
  });
});
