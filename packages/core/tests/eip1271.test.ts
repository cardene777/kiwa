import { describe, expect, it, vi } from 'vitest';
import {
  EIP1271_MAGIC_VALUE,
  verifyEip1271Signature,
  type VerifyEip1271SignatureParams,
} from '../src/eip1271.js';
import type { Hex } from '../src/types.js';

const CONTRACT_ADDRESS = '0x00000000000000000000000000000000000000AA' as Hex;
const MESSAGE_HASH =
  '0x1111111111111111111111111111111111111111111111111111111111111111' as Hex;
const SIGNATURE =
  '0x2222222222222222222222222222222222222222222222222222222222222222' as Hex;

function makeParams(
  callImpl: VerifyEip1271SignatureParams['publicClient']['call'],
): VerifyEip1271SignatureParams {
  return {
    publicClient: { call: callImpl },
    contractAddress: CONTRACT_ADDRESS,
    messageHash: MESSAGE_HASH,
    signature: SIGNATURE,
  };
}

describe('verifyEip1271Signature', () => {
  it('T-1271-001 magic value を返す contract は valid=true', async () => {
    const call = vi.fn().mockResolvedValue({
      data: `${EIP1271_MAGIC_VALUE}${'0'.repeat(56)}`,
    });

    const valid = await verifyEip1271Signature(makeParams(call));

    expect(valid).toBe(true);
    expect(call).toHaveBeenCalledWith(
      expect.objectContaining({
        to: CONTRACT_ADDRESS,
        data: expect.stringMatching(/^0x[0-9a-f]+$/i),
      }),
    );
  });

  it('T-1271-002 magic value 以外を返す contract は valid=false', async () => {
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockResolvedValue({ data: `0x${'0'.repeat(64)}` })),
    );

    expect(valid).toBe(false);
  });

  it('T-1271-003 contract 未 deploy / eth_call revert は valid=false', async () => {
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockRejectedValue(new Error('execution reverted'))),
    );

    expect(valid).toBe(false);
  });
});
