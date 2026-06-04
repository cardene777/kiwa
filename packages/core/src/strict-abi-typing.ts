import type { PublicClient } from 'viem';
import { waitForChainState } from './wait-for-chain-state.js';

const balanceOfAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const;

type Equal<Left, Right> = (
  <T>() => T extends Left ? 1 : 2
) extends <T>() => T extends Right ? 1 : 2
  ? true
  : false;
type Expect<T extends true> = T;

if (false) {
  const publicClient = null as unknown as PublicClient;
  const promise = waitForChainState({
    publicClient,
    address: '0x0000000000000000000000000000000000000000',
    abi: balanceOfAbi,
    functionName: 'balanceOf',
    args: ['0x0000000000000000000000000000000000000000'],
    predicate: (value: bigint) => value > 0n,
  });
  type _ReturnTypeMatchesAbi = Expect<Equal<Awaited<typeof promise>, bigint>>;

  waitForChainState({
    publicClient,
    address: '0x0000000000000000000000000000000000000000',
    abi: balanceOfAbi,
    // @ts-expect-error invalid function name should be rejected by ABI typing
    functionName: 'totalSupply',
    args: ['0x0000000000000000000000000000000000000000'],
    predicate: (value: bigint) => value > 0n,
  });

  void publicClient;
}

export {};
