import { encodeFunctionData, type PublicClient } from 'viem';
import type { Hex } from './types.js';

const EIP1271_ABI = [
  {
    type: 'function',
    name: 'isValidSignature',
    stateMutability: 'view',
    inputs: [
      { name: 'hash', type: 'bytes32' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes4' }],
  },
] as const;

export const EIP1271_MAGIC_VALUE = '0x1626ba7e' as const;

export interface VerifyEip1271SignatureParams {
  publicClient: Pick<PublicClient, 'call'>;
  contractAddress: Hex;
  messageHash: Hex;
  signature: Hex;
}

export async function verifyEip1271Signature(
  params: VerifyEip1271SignatureParams,
): Promise<boolean> {
  const { publicClient, contractAddress, messageHash, signature } = params;

  try {
    const result = await publicClient.call({
      to: contractAddress,
      data: encodeFunctionData({
        abi: EIP1271_ABI,
        functionName: 'isValidSignature',
        args: [messageHash, signature],
      }),
    });

    return (
      typeof result.data === 'string' &&
      result.data.toLowerCase().startsWith(EIP1271_MAGIC_VALUE)
    );
  } catch {
    return false;
  }
}
