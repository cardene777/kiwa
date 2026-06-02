import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { verifyMessage, verifyTypedData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  startAnvil,
  type AnvilHandle,
  createInjectorScript,
  handleRpcRequest,
  type RpcContext,
} from '../src/index.js';

// anvil default key #0 - public test key, secret 扱いしない
const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const CHAIN_ID = 31337;

function ctx(): RpcContext {
  return { privateKey: PRIVATE_KEY, chainState: { current: CHAIN_ID } };
}

describe('handleRpcRequest', () => {
  it('T-INJ-001 eth_requestAccounts は LocalAccount のアドレス配列を返す', async () => {
    // Given
    const account = privateKeyToAccount(PRIVATE_KEY);
    // When
    const result = await handleRpcRequest(ctx(), { method: 'eth_requestAccounts' });
    // Then
    expect(result).toEqual([account.address]);
  });

  it('T-INJ-002 eth_accounts は eth_requestAccounts と同じアドレス配列を返す', async () => {
    // Given
    const account = privateKeyToAccount(PRIVATE_KEY);
    // When
    const result = await handleRpcRequest(ctx(), { method: 'eth_accounts' });
    // Then
    expect(result).toEqual([account.address]);
  });

  it('T-INJ-003 personal_sign は viem verifyMessage が true になる署名を返す', async () => {
    // Given
    const account = privateKeyToAccount(PRIVATE_KEY);
    const message = 'hello dapp-e2e';
    // When
    const signature = (await handleRpcRequest(ctx(), {
      method: 'personal_sign',
      params: [message, account.address],
    })) as `0x${string}`;
    const valid = await verifyMessage({
      address: account.address,
      message,
      signature,
    });
    // Then
    expect(valid).toBe(true);
  });

  it('T-INJ-004 wallet_switchEthereumChain は null を返し chainId が反映される', async () => {
    // Given
    const c = ctx();
    // When
    const result = await handleRpcRequest(c, {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x5' }], // 5 = Goerli, switch だけ確認
    });
    // Then - EIP-3326 仕様で switch 成功時は null
    expect(result).toBeNull();
    expect(c.chainState.current).toBe(5);
  });

  it('T-INJ-005 anvilPort 未設定で eth_sendTransaction は internal error -32603 で reject する', async () => {
    // Given
    const c = ctx();
    // When / Then
    await expect(
      handleRpcRequest(c, { method: 'eth_sendTransaction', params: [{}] }),
    ).rejects.toMatchObject({
      code: -32603,
      message: expect.stringMatching(/requires anvilPort/i),
    });
  });

  it('T-INJ-007 eth_chainId は ctx.chainId の hex (0x7a69 = 31337) を返す', async () => {
    // Given
    const c = ctx();
    // When
    const result = await handleRpcRequest(c, { method: 'eth_chainId' });
    // Then
    expect(result).toBe('0x7a69');
  });

  it('T-INJ-009 net_version は chainId の decimal 文字列を返す', async () => {
    // Given
    const c = ctx();
    // When
    const result = await handleRpcRequest(c, { method: 'net_version' });
    // Then
    expect(result).toBe('31337');
  });

  it('T-INJ-010 eth_signTypedData_v4 は EIP-712 typed data を署名し verifyTypedData が true', async () => {
    // Given
    const account = privateKeyToAccount(PRIVATE_KEY);
    const typedData = {
      domain: {
        name: 'Mail',
        version: '1',
        chainId: CHAIN_ID,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' as const,
      },
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
      } as const,
      primaryType: 'Mail' as const,
      message: {
        from: { name: 'Alice', wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826' },
        to: { name: 'Bob', wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB' },
        contents: 'hello',
      },
    };
    // When
    const signature = (await handleRpcRequest(ctx(), {
      method: 'eth_signTypedData_v4',
      params: [account.address, JSON.stringify(typedData)],
    })) as `0x${string}`;
    const valid = await verifyTypedData({
      address: account.address,
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
      signature,
    });
    // Then
    expect(valid).toBe(true);
  });

  it('T-INJ-011 wallet_addEthereumChain は受領後 null を返す', async () => {
    // Given
    const c = ctx();
    const newChain = {
      chainId: '0xa86a',
      chainName: 'Avalanche',
      rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
      nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    };
    // When
    const result = await handleRpcRequest(c, {
      method: 'wallet_addEthereumChain',
      params: [newChain],
    });
    // Then
    expect(result).toBeNull();
    expect(c.chainState.current).toBe(43114);
  });

  it('T-INJ-012 反例 — eth_subscribe は EIP-1193 code 4200 で reject (HTTP RPC 縛り)', async () => {
    // Given
    const c = ctx();
    // When / Then
    await expect(
      handleRpcRequest(c, { method: 'eth_subscribe', params: ['newHeads'] }),
    ).rejects.toMatchObject({
      code: 4200,
      message: expect.stringMatching(/method not supported/i),
    });
  });

  it('T-INJ-013 eth_signTypedData_v4 で malformed JSON params は EIP-1193 code -32700 で reject', async () => {
    // Given - JSON として壊れた typed data 文字列
    const c = ctx();
    const account = privateKeyToAccount(PRIVATE_KEY);
    // When / Then
    await expect(
      handleRpcRequest(c, {
        method: 'eth_signTypedData_v4',
        params: [account.address, '{ this is not valid json }'],
      }),
    ).rejects.toMatchObject({
      code: -32700,
      message: expect.stringMatching(/parse error/i),
    });
  });

  it('T-INJ-014 eth_blockNumber で anvilProxy 接続失敗時は EIP-1193 code -32603 で reject', async () => {
    // Given - 空き port を取得してすぐ close、その port に anvilPort を指定して必ず ECONNREFUSED
    const { createServer } = await import('node:net');
    const unusedPort = await new Promise<number>((resolve, reject) => {
      const server = createServer();
      server.unref();
      server.on('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 0;
        server.close(() => resolve(port));
      });
    });
    const brokenCtx: RpcContext = { ...ctx(), anvilPort: unusedPort };
    // When / Then
    await expect(
      handleRpcRequest(brokenCtx, { method: 'eth_blockNumber' }),
    ).rejects.toMatchObject({
      code: -32603,
    });
  });

  it('T-INJ-015 personal_sign で invalid hex (0xZZ) params は EIP-1193 code -32602 で reject', async () => {
    // Given - 0x prefix だが hex 文字でない
    const c = ctx();
    const account = privateKeyToAccount(PRIVATE_KEY);
    // When / Then
    await expect(
      handleRpcRequest(c, {
        method: 'personal_sign',
        params: ['0xZZ', account.address],
      }),
    ).rejects.toMatchObject({
      code: -32602,
      message: expect.stringMatching(/invalid params/i),
    });
  });
});

describe('createInjectorScript', () => {
  it('T-INJ-006 戻り値の文字列に window.ethereum セットアップが含まれる', () => {
    // Given
    const opts = { privateKey: PRIVATE_KEY, chainId: CHAIN_ID };
    // When
    const script = createInjectorScript(opts);
    // Then - contract: 注入 script は window.ethereum を定義する
    expect(script).toContain('window.ethereum');
  });
});

describe.skipIf(process.env.SKIP_ANVIL_TESTS === '1')('handleRpcRequest with live anvil', () => {
  let handle: AnvilHandle | null = null;
  let ctxWithPort: (RpcContext & { anvilPort: number }) | null = null;

  beforeAll(async () => {
    handle = await startAnvil();
    ctxWithPort = { ...ctx(), anvilPort: handle.port };
  });

  afterAll(async () => {
    if (handle) await handle.stop();
  });

  it('T-INJ-008 eth_blockNumber は anvil の現在ブロック番号 hex を返す', async () => {
    // Given (anvil started in beforeAll)
    // When
    const result = (await handleRpcRequest(ctxWithPort!, {
      method: 'eth_blockNumber',
    })) as string;
    // Then
    expect(result).toMatch(/^0x[0-9a-fA-F]+$/);
  });
});
