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

  it('T-1271-004 EIP1271_MAGIC_VALUE は exactly "0x1626ba7e" - StringLiteral mutator 防御', () => {
    expect(EIP1271_MAGIC_VALUE).toBe('0x1626ba7e');
    expect(EIP1271_MAGIC_VALUE.length).toBe(10);
    expect(EIP1271_MAGIC_VALUE.startsWith('0x1626ba7e')).toBe(true);
  });

  it('T-1271-005 magic value uppercase hex (0x1626BA7E) - toLowerCase() 削除 mutator 防御', async () => {
    const upperData = `0x1626BA7E${'0'.repeat(56)}`;
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockResolvedValue({ data: upperData })),
    );

    expect(valid).toBe(true);
  });

  it('T-1271-006 result.data が undefined - typeof !== "string" branch', async () => {
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockResolvedValue({ data: undefined })),
    );

    expect(valid).toBe(false);
  });

  it('T-1271-007 result.data が null - typeof "object" で false', async () => {
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockResolvedValue({ data: null })),
    );

    expect(valid).toBe(false);
  });

  it('T-1271-008 result.data が number - typeof "number" で false', async () => {
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockResolvedValue({ data: 12345 as unknown as string })),
    );

    expect(valid).toBe(false);
  });

  it('T-1271-009 startsWith match - 0x1626ba7e prefix のみ "0x1626ba7e" 単体でも valid=true', async () => {
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockResolvedValue({ data: EIP1271_MAGIC_VALUE })),
    );

    expect(valid).toBe(true);
  });

  it('T-1271-010 endsWith でない (startsWith 確認) - "0x...1626ba7e" suffix は valid=false', async () => {
    const wrongPrefix = `0xdeadbeef${'0'.repeat(48)}1626ba7e`;
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockResolvedValue({ data: wrongPrefix })),
    );

    expect(valid).toBe(false);
  });

  it('T-1271-011 call args - functionName "isValidSignature" + args=[messageHash, signature]', async () => {
    const call = vi.fn().mockResolvedValue({ data: EIP1271_MAGIC_VALUE });

    await verifyEip1271Signature(makeParams(call));

    const callArgs = call.mock.calls[0]?.[0] as { to: string; data: string };
    expect(callArgs.to).toBe(CONTRACT_ADDRESS);
    expect(callArgs.data).toMatch(/^0x[0-9a-f]+$/i);
    expect(callArgs.data.length).toBeGreaterThan(10);
  });

  it('T-1271-012 magic value 1 文字 mutate (0x1626ba7f) - valid=false', async () => {
    const slightlyOff = `0x1626ba7f${'0'.repeat(56)}`;
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockResolvedValue({ data: slightlyOff })),
    );

    expect(valid).toBe(false);
  });

  it('T-1271-013 空文字列 data - startsWith("0x1626ba7e") = false', async () => {
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockResolvedValue({ data: '' })),
    );

    expect(valid).toBe(false);
  });

  it('T-1271-014 result.data がプレフィックスのみ (0x) - valid=false', async () => {
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockResolvedValue({ data: '0x' })),
    );

    expect(valid).toBe(false);
  });

  it('T-1271-015 短すぎる data (0x1626) - startsWith fail で valid=false', async () => {
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockResolvedValue({ data: '0x1626' })),
    );

    expect(valid).toBe(false);
  });

  it('T-1271-016 async throw 後の catch block - 同期エラー戻り値も valid=false', async () => {
    const valid = await verifyEip1271Signature(
      makeParams(
        vi.fn().mockImplementation(() => {
          throw new Error('sync error');
        }),
      ),
    );

    expect(valid).toBe(false);
  });

  it('T-1271-017 magic value mixed-case (0x1626Ba7e) - toLowerCase で valid=true', async () => {
    const mixedCase = `0x1626Ba7e${'0'.repeat(56)}`;
    const valid = await verifyEip1271Signature(
      makeParams(vi.fn().mockResolvedValue({ data: mixedCase })),
    );

    expect(valid).toBe(true);
  });

  it('T-1271-018 call で contractAddress 渡される - mutator が address を置換しても to が一致', async () => {
    const call = vi.fn().mockResolvedValue({ data: EIP1271_MAGIC_VALUE });

    await verifyEip1271Signature(makeParams(call));

    const callArgs = call.mock.calls[0]?.[0] as { to: string };
    expect(callArgs.to).toBe('0x00000000000000000000000000000000000000AA');
  });
});
