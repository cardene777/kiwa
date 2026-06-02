import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  sendTransaction,
  startAnvil,
  type AnvilHandle,
  type TxBroadcastCtx,
} from '../src/index.js';

const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const CHAIN_ID = 31337;
const TO_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const;

describe.skipIf(process.env.SKIP_ANVIL_TESTS === '1')('sendTransaction with live anvil', () => {
  let handle: AnvilHandle | null = null;
  let txCtx: TxBroadcastCtx | null = null;

  beforeAll(async () => {
    handle = await startAnvil();
    txCtx = { privateKey: PRIVATE_KEY, chainId: CHAIN_ID, anvilPort: handle.port };
  });

  afterAll(async () => {
    if (handle) await handle.stop();
  });

  it('T-TX-001 sendTransaction で anvil に broadcast し tx hash (0x..., 66 chars) が返る', async () => {
    // Given
    const params = { to: TO_ADDRESS, value: 1000000000000000000n };
    // When
    const hash = await sendTransaction(txCtx!, params);
    // Then
    expect(hash).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it('T-TX-002 sendTransaction 後 receipt.status === "success" が取れる', async () => {
    // Given
    const params = { to: TO_ADDRESS, value: 500000000000000000n };
    // When
    const hash = await sendTransaction(txCtx!, params);
    // Then
    const { createPublicClient, http } = await import('viem');
    const { anvil } = await import('viem/chains');
    const client = createPublicClient({
      chain: anvil,
      transport: http(`http://127.0.0.1:${txCtx!.anvilPort}`),
    });
    const receipt = await client.waitForTransactionReceipt({ hash });
    expect(receipt.status).toBe('success');
  });

  it('T-TX-003 残高超過 value の TX は EIP-1193 code 3 で reject', async () => {
    // Given
    const params = {
      to: TO_ADDRESS,
      value: 100_000n * 10n ** 18n,
    };
    // When / Then
    await expect(sendTransaction(txCtx!, params)).rejects.toMatchObject({
      code: 3,
    });
  });
});
