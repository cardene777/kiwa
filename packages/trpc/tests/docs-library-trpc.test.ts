import { describe, expect, it } from 'vitest';
import {
  TRPCError,
  batchInvoke,
  createRouter,
  defineProcedure,
  invokeProcedure,
  middleware,
  withIdempotencyKey,
  withRetry,
} from '../src/index.js';

describe('library documentation tRPC recipes', () => {
  it('invokes a query and rejects an unknown path', async () => {
    const router = createRouter({
      procedures: { 'user.get': defineProcedure('query', async ({ input }) => ({ id: input })) },
    });

    await expect(invokeProcedure(router, 'user.get', 'u1')).resolves.toEqual({ id: 'u1' });
    await expect(invokeProcedure(router, 'missing', undefined)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('runs authorization middleware and a single idempotent mutation', async () => {
    const requireUser = middleware(async ({ ctx, next }) => {
      if (!ctx.userId) return { ok: false, error: new TRPCError({ code: 'UNAUTHORIZED' }) };
      return next({ ctx: { ...ctx, role: 'member' } });
    });
    const accountRouter = createRouter({
      procedures: { 'account.me': defineProcedure('query', async ({ ctx }) => ({ id: ctx.userId, role: ctx.role }), [requireUser]) },
    });
    let created = 0;
    const booking = withIdempotencyKey(async ({ input }) => {
      created += 1;
      const request = input as { idempotencyKey: string; roomId: string };
      return { bookingId: `booking-${created}`, roomId: request.roomId };
    });
    const bookingRouter = createRouter({ procedures: { 'booking.create': defineProcedure('mutation', booking) } });
    const request = { idempotencyKey: 'checkout-evt-100', roomId: 'room-3' };

    await expect(invokeProcedure(accountRouter, 'account.me', undefined, {})).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(invokeProcedure(accountRouter, 'account.me', undefined, { userId: 'user-42' })).resolves.toEqual({ id: 'user-42', role: 'member' });
    expect(await invokeProcedure(bookingRouter, 'booking.create', request)).toEqual({ bookingId: 'booking-1', roomId: 'room-3' });
    expect(await invokeProcedure(bookingRouter, 'booking.create', request)).toEqual({ bookingId: 'booking-1', roomId: 'room-3' });
    expect(created).toBe(1);
  });

  it('isolates a batch error and retries a temporary error', async () => {
    const dashboard = createRouter({
      procedures: {
        'dashboard.profile': defineProcedure('query', async () => ({ name: 'Kiwa' })),
        'dashboard.billing': defineProcedure('query', async () => { throw new TRPCError({ code: 'FORBIDDEN', message: 'billing role is required' }); }),
        'dashboard.activity': defineProcedure('query', async () => ['signed in']),
      },
    });
    const results = await batchInvoke(dashboard, [
      { procedureName: 'dashboard.profile', input: undefined },
      { procedureName: 'dashboard.billing', input: undefined },
      { procedureName: 'dashboard.activity', input: undefined },
    ]);
    let attempts = 0;
    const inventory = withRetry(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('inventory service unavailable');
      return { sku: 'sku-1', available: true };
    }, { maxAttempts: 3, backoffMs: 1 });
    const inventoryRouter = createRouter({ procedures: { 'inventory.get': defineProcedure('query', inventory) } });

    expect(results).toEqual([
      { ok: true, output: { name: 'Kiwa' } },
      { ok: false, error: { code: 'FORBIDDEN', message: 'billing role is required' } },
      { ok: true, output: ['signed in'] },
    ]);
    await expect(invokeProcedure(inventoryRouter, 'inventory.get', undefined)).resolves.toEqual({ sku: 'sku-1', available: true });
    expect(attempts).toBe(2);
  });
});
