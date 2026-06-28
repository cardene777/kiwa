import { describe, expect, it, vi } from 'vitest';
import type { Abi, TransactionReceipt } from 'viem';
import { expectEvent } from '../src/expect-event.js';

const ABI = [
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const satisfies Abi;

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem');
  return {
    ...actual,
    decodeEventLog: vi.fn(({ topics }) => {
      if (topics[0] === '0xtransfer') {
        return {
          eventName: 'Transfer',
          args: {
            from: '0xfrom',
            to: '0xto',
            amount: 100n,
          },
        };
      }
      if (topics[0] === '0xfail') {
        throw new Error('decode failed');
      }
      return { eventName: 'Other', args: {} };
    }),
  };
});

function receipt(topics: string[][]): TransactionReceipt {
  return {
    logs: topics.map((t) => ({ data: '0x', topics: t as never })),
  } as unknown as TransactionReceipt;
}

describe('expectEvent', () => {
  it('T-EE-001 PASS when event name matches', () => {
    const r = receipt([['0xtransfer']]);
    expect(() => expectEvent(r, ABI, 'Transfer')).not.toThrow();
  });

  it('T-EE-002 throws when event name does not match', () => {
    const r = receipt([['0xother']]);
    expect(() => expectEvent(r, ABI, 'Transfer')).toThrow();
  });

  it('T-EE-003 matches args when expectedArgs provided', () => {
    const r = receipt([['0xtransfer']]);
    expect(() => expectEvent(r, ABI, 'Transfer', { from: '0xfrom' })).not.toThrow();
  });

  it('T-EE-004 throws on args mismatch', () => {
    const r = receipt([['0xtransfer']]);
    expect(() => expectEvent(r, ABI, 'Transfer', { from: '0xwrong' })).toThrow();
  });

  it('T-EE-005 skips logs that fail to decode', () => {
    const r = receipt([['0xfail'], ['0xtransfer']]);
    expect(() => expectEvent(r, ABI, 'Transfer')).not.toThrow();
  });

  it('T-EE-006 throws when receipt has no logs', () => {
    const r = receipt([]);
    expect(() => expectEvent(r, ABI, 'Transfer')).toThrow();
  });

  it('T-EE-007 matches all keys in expectedArgs', () => {
    const r = receipt([['0xtransfer']]);
    expect(() =>
      expectEvent(r, ABI, 'Transfer', { from: '0xfrom', to: '0xto', amount: 100n }),
    ).not.toThrow();
  });

  it('T-EE-008 partial match - only specified keys checked', () => {
    const r = receipt([['0xtransfer']]);
    expect(() => expectEvent(r, ABI, 'Transfer', { amount: 100n })).not.toThrow();
  });
});
