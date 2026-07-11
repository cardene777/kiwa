import { describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import {
  handleRpcRequest,
  parseEip712TypedDataJson,
  resolveActiveAddress,
  resolveActivePrivateKey,
  type RpcContext,
} from '../src/index.js';
import type { Hex } from '../src/types.js';

const PK1: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const PK2: Hex =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const CHAIN_ID = 31337;

function ctx(overrides: Partial<RpcContext> = {}): RpcContext {
  return {
    privateKey: PK1,
    chainState: { current: CHAIN_ID },
    ...overrides,
  };
}

describe('resolveActivePrivateKey / resolveActiveAddress branches', () => {
  it('T-RH-B-001 accounts 未指定なら ctx.privateKey を返す', () => {
    expect(resolveActivePrivateKey(ctx())).toBe(PK1);
  });

  it('T-RH-B-002 accounts 空配列でも ctx.privateKey にフォールバックする', () => {
    expect(resolveActivePrivateKey(ctx({ accounts: [] }))).toBe(PK1);
  });

  it('T-RH-B-003 accounts + activeIndex 0 なら先頭 key を返す', () => {
    expect(
      resolveActivePrivateKey(ctx({ accounts: [PK2, PK1], activeIndex: { current: 0 } })),
    ).toBe(PK2);
  });

  it('T-RH-B-004 accounts + activeIndex 1 なら 2 番目 key を返す', () => {
    expect(
      resolveActivePrivateKey(ctx({ accounts: [PK2, PK1], activeIndex: { current: 1 } })),
    ).toBe(PK1);
  });

  it('T-RH-B-005 accounts + activeIndex out of range (負) は internal -32603 で throw', () => {
    expect(() =>
      resolveActivePrivateKey(ctx({ accounts: [PK1], activeIndex: { current: 5 } })),
    ).toThrow(/out of bounds/);
  });

  it('T-RH-B-006 contractAccount 指定時 resolveActiveAddress は contract address を返す', () => {
    const addr = '0x1111111111111111111111111111111111111111' as Hex;
    expect(
      resolveActiveAddress(
        ctx({
          contractAccount: { address: addr, executeAbi: ['function execute(address,uint256,bytes)'] },
        }),
      ),
    ).toBe(addr);
  });
});

describe('eth_requestAccounts / eth_accounts branches', () => {
  it('T-RH-B-101 accounts 配列指定 + activeIndex 1 は 2 番目を先頭に並べた addresses を返す', async () => {
    const result = (await handleRpcRequest(
      ctx({ accounts: [PK1, PK2], activeIndex: { current: 1 } }),
      { method: 'eth_accounts' },
    )) as Hex[];
    expect(result[0]).toBe(privateKeyToAccount(PK2).address);
    expect(result[1]).toBe(privateKeyToAccount(PK1).address);
  });

  it('T-RH-B-102 contractAccount 指定時 eth_accounts は [contractAccount.address] を返す', async () => {
    const addr = '0x2222222222222222222222222222222222222222' as Hex;
    const result = await handleRpcRequest(
      ctx({
        contractAccount: {
          address: addr,
          executeAbi: ['function execute(address,uint256,bytes)'],
        },
      }),
      { method: 'eth_accounts' },
    );
    expect(result).toEqual([addr]);
  });

  it('T-RH-B-103 rejectConnect=true + approval reject で eth_requestAccounts が 4001 で reject', async () => {
    await expect(
      handleRpcRequest(
        ctx({
          rejectConnect: { current: true },
          approvalPolicy: { current: { default: 'reject' } },
        }),
        { method: 'eth_requestAccounts' },
      ),
    ).rejects.toMatchObject({ code: 4001 });
  });

  it('T-RH-B-104 rejectConnect=true + approvalMode=reject でも eth_accounts は成功する (read-only 対象外)', async () => {
    const result = await handleRpcRequest(
      ctx({
        rejectConnect: { current: true },
        approvalMode: { current: 'reject' },
      }),
      { method: 'eth_accounts' },
    );
    expect(result).toEqual([privateKeyToAccount(PK1).address]);
  });

  it('T-RH-B-105 rejectConnect=true + approve モードなら eth_requestAccounts は成功する', async () => {
    const result = await handleRpcRequest(
      ctx({
        rejectConnect: { current: true },
        approvalPolicy: { current: { default: 'approve' } },
      }),
      { method: 'eth_requestAccounts' },
    );
    expect(result).toEqual([privateKeyToAccount(PK1).address]);
  });
});

describe('personal_sign branches', () => {
  it('T-RH-B-201 message が number など非 string は -32602 で reject', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'personal_sign',
        params: [123 as unknown as string, privateKeyToAccount(PK1).address],
      }),
    ).rejects.toMatchObject({ code: -32602, message: expect.stringMatching(/must be a string/) });
  });

  it('T-RH-B-202 address が非 string は 4100 (unauthorized) で reject', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'personal_sign',
        params: ['hello', 12345 as unknown as string],
      }),
    ).rejects.toMatchObject({ code: 4100 });
  });

  it('T-RH-B-203 address が他アカウントの場合 4100 で reject', async () => {
    const other = privateKeyToAccount(PK2).address;
    await expect(
      handleRpcRequest(ctx(), {
        method: 'personal_sign',
        params: ['hello', other],
      }),
    ).rejects.toMatchObject({ code: 4100 });
  });

  it('T-RH-B-204 message が奇数長 hex は -32602 で reject', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'personal_sign',
        params: ['0xabc', privateKeyToAccount(PK1).address],
      }),
    ).rejects.toMatchObject({ code: -32602, message: expect.stringMatching(/odd length/) });
  });

  it('T-RH-B-205 valid hex 偶数長 message は署名を返す', async () => {
    const result = await handleRpcRequest(ctx(), {
      method: 'personal_sign',
      params: ['0xdeadbeef', privateKeyToAccount(PK1).address],
    });
    expect(typeof result).toBe('string');
    expect((result as string).startsWith('0x')).toBe(true);
  });
});

describe('wallet_switchEthereumChain / addEthereumChain branches', () => {
  it('T-RH-B-301 chainRegistry 内に登録済 chainId なら switch 成功する', async () => {
    const c = ctx({
      chainRegistry: {
        current: [
          {
            chainId: '0x1' as Hex,
            rpcUrls: ['http://127.0.0.1:8545'],
          },
        ],
      },
    });
    const res = await handleRpcRequest(c, {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }],
    });
    expect(res).toBeNull();
    expect(c.chainState.current).toBe(1);
  });

  it('T-RH-B-302 chainRegistry 内に無い chainId は 4902 で reject する', async () => {
    const c = ctx({
      chainRegistry: {
        current: [{ chainId: '0x1' as Hex }],
      },
    });
    await expect(
      handleRpcRequest(c, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }],
      }),
    ).rejects.toMatchObject({ code: 4902 });
  });

  it('T-RH-B-303 wallet_addEthereumChain は registry へ push + chainState を更新する', async () => {
    const c = ctx({ chainRegistry: { current: [] } });
    await handleRpcRequest(c, {
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0xa86a',
          chainName: 'Avalanche',
          rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
          nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
        },
      ],
    });
    expect(c.chainRegistry!.current).toHaveLength(1);
    expect(c.chainRegistry!.current[0]!.chainId).toBe('0xa86a');
    expect(c.chainState.current).toBe(43114);
  });

  it('T-RH-B-304 wallet_addEthereumChain は既存 chainId を上書きする', async () => {
    const c = ctx({
      chainRegistry: {
        current: [
          {
            chainId: '0xa86a' as Hex,
            chainName: 'Old',
          },
        ],
      },
    });
    await handleRpcRequest(c, {
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0xa86a',
          chainName: 'New',
          rpcUrls: ['https://x.example'],
          nativeCurrency: { name: 'X', symbol: 'X', decimals: 18 },
        },
      ],
    });
    expect(c.chainRegistry!.current).toHaveLength(1);
    expect(c.chainRegistry!.current[0]!.chainName).toBe('New');
  });
});

describe('eth_sendTransaction — approvalPolicy per-token branches', () => {
  const anvilPort = 65123; // 到達しない port (呼び出しは approval check の前に throw 想定)
  const TOKEN: Hex = '0xdEADbeefdEadbeeFdEadBEEfDeAdbeefdeAdbEEf';

  it('T-RH-B-401 perToken.reject モードで approve tx は 4001 で reject', async () => {
    const c = ctx({
      anvilPort,
      approvalPolicy: {
        current: {
          default: 'approve',
          perToken: {
            [TOKEN.toLowerCase() as Hex]: { mode: 'reject' },
          },
        },
      },
    });
    // ERC20 approve(spender=PK2 addr, amount=1000)
    const data =
      '0x095ea7b3000000000000000000000000abababababababababababababababababababab00000000000000000000000000000000000000000000000000000000000003e8' as Hex;
    await expect(
      handleRpcRequest(c, {
        method: 'eth_sendTransaction',
        params: [
          {
            from: privateKeyToAccount(PK1).address,
            to: TOKEN,
            data,
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 4001, message: expect.stringMatching(/ERC20 approve/) });
  });

  it('T-RH-B-402 perToken.limit 超過で 4001 で reject', async () => {
    const c = ctx({
      anvilPort,
      approvalPolicy: {
        current: {
          default: 'approve',
          perToken: {
            [TOKEN.toLowerCase() as Hex]: { mode: 'approve', limit: 100n },
          },
        },
      },
    });
    // approve(spender=..., amount=1000) > limit 100
    const data =
      '0x095ea7b3000000000000000000000000abababababababababababababababababababab00000000000000000000000000000000000000000000000000000000000003e8' as Hex;
    await expect(
      handleRpcRequest(c, {
        method: 'eth_sendTransaction',
        params: [
          {
            from: privateKeyToAccount(PK1).address,
            to: TOKEN,
            data,
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 4001,
      message: expect.stringMatching(/exceeds limit/),
    });
  });

  it('T-RH-B-403 default reject でも approve tx でない (data 非 approve selector) は 4001 (approve 経路)', async () => {
    const c = ctx({
      anvilPort,
      approvalPolicy: { current: { default: 'reject' } },
    });
    // 不明 selector (transfer(address,uint256))
    const data =
      '0xa9059cbb000000000000000000000000abababababababababababababababababababab00000000000000000000000000000000000000000000000000000000000003e8' as Hex;
    await expect(
      handleRpcRequest(c, {
        method: 'eth_sendTransaction',
        params: [
          {
            from: privateKeyToAccount(PK1).address,
            to: TOKEN,
            data,
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 4001 });
  });

  it('T-RH-B-404 approvalMode legacy (approvalPolicy 未指定) でも reject 経路が動く', async () => {
    const c = ctx({
      anvilPort,
      approvalMode: { current: 'reject' },
    });
    await expect(
      handleRpcRequest(c, {
        method: 'eth_sendTransaction',
        params: [
          {
            from: privateKeyToAccount(PK1).address,
            to: '0x0000000000000000000000000000000000000000',
            value: '0x1',
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 4001 });
  });

  it('T-RH-B-405 eth_sendTransaction from が非 string でも from check を skip して先へ進む (anvilPort 未接続で throw)', async () => {
    const c = ctx({ anvilPort });
    await expect(
      handleRpcRequest(c, {
        method: 'eth_sendTransaction',
        params: [{ to: '0x0000000000000000000000000000000000000000', value: '0x0' }],
      }),
    ).rejects.toBeDefined();
  });
});

describe('wallet_switchEthereumChain input validation branches', () => {
  it('T-RH-B-501 params[0] が非 object は -32602 で reject', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'wallet_switchEthereumChain',
        params: ['not-an-object' as unknown as { chainId: string }],
      }),
    ).rejects.toMatchObject({ code: -32602, message: expect.stringMatching(/chainId is required/) });
  });

  it('T-RH-B-502 params[0].chainId が hex prefix なしは -32602 で reject', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '1234' }],
      }),
    ).rejects.toMatchObject({ code: -32602, message: expect.stringMatching(/invalid chainId/) });
  });
});

describe('wallet_addEthereumChain input validation branches', () => {
  it('T-RH-B-601 params[0] が非 object は -32602 で reject', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'wallet_addEthereumChain',
        params: ['not-an-object' as unknown as { chainId: string }],
      }),
    ).rejects.toMatchObject({ code: -32602, message: expect.stringMatching(/chain config object/) });
  });

  it('T-RH-B-602 params[0].chainId が invalid は -32602 で reject', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'wallet_addEthereumChain',
        params: [{ chainId: 'not-hex' }],
      }),
    ).rejects.toMatchObject({ code: -32602, message: expect.stringMatching(/chainId must be/) });
  });

  it('T-RH-B-603 blockExplorerUrls array + rpcUrls array を registry に反映する', async () => {
    const c = ctx({ chainRegistry: { current: [] } });
    await handleRpcRequest(c, {
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x89',
          chainName: 'Polygon',
          rpcUrls: ['https://polygon-rpc.com', 12345, 'https://backup.polygon-rpc.com'],
          blockExplorerUrls: ['https://polygonscan.com', null],
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        },
      ],
    });
    const entry = c.chainRegistry!.current[0]!;
    expect(entry.rpcUrls).toEqual([
      'https://polygon-rpc.com',
      'https://backup.polygon-rpc.com',
    ]);
    expect(entry.blockExplorerUrls).toEqual(['https://polygonscan.com']);
  });
});

describe('parseEip712TypedDataJson normalizeEip712 branches', () => {
  const baseTypedData = {
    types: {
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallet', type: 'address' },
      ],
    },
    primaryType: 'Person',
    message: { name: 'Alice', wallet: '0xabc' },
  };

  it('T-RH-B-701 domain.chainId が string (decimal) でも parse される', () => {
    const parsed = parseEip712TypedDataJson(
      JSON.stringify({
        ...baseTypedData,
        domain: { name: 'X', chainId: '31337' },
      }),
    );
    expect(parsed.domain.chainId).toBe(31337);
  });

  it('T-RH-B-702 domain.chainId が string (0x hex) でも parse される', () => {
    const parsed = parseEip712TypedDataJson(
      JSON.stringify({
        ...baseTypedData,
        domain: { name: 'X', chainId: '0x7a69' },
      }),
    );
    expect(parsed.domain.chainId).toBe(31337);
  });

  it('T-RH-B-703 domain.chainId が invalid string は -32602 で throw', () => {
    expect(() =>
      parseEip712TypedDataJson(
        JSON.stringify({
          ...baseTypedData,
          domain: { name: 'X', chainId: 'not-a-number' },
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: -32602 }));
  });

  it('T-RH-B-704 domain.verifyingContract が hex でない string は -32602 で throw', () => {
    expect(() =>
      parseEip712TypedDataJson(
        JSON.stringify({
          ...baseTypedData,
          domain: { name: 'X', verifyingContract: 'not-hex' },
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: -32602 }));
  });

  it('T-RH-B-705 domain.salt hex 正常系は normalize される', () => {
    const parsed = parseEip712TypedDataJson(
      JSON.stringify({
        ...baseTypedData,
        domain: { name: 'X', salt: '0xabcdef' },
      }),
    );
    expect(parsed.domain.salt).toBe('0xabcdef');
  });
});

describe('proxyToAnvil + anvilProxy transport / shape branches', () => {
  it('T-RH-B-801 default 経路 (未知 method) は anvilPort 必須、 未指定なら -32603', async () => {
    // 未知の RPC method は proxyToAnvil に流れる → anvilPort 無しで -32603
    await expect(
      handleRpcRequest(ctx(), { method: 'eth_getBlockByNumber', params: ['latest'] }),
    ).rejects.toMatchObject({ code: -32603, message: expect.stringMatching(/requires anvilPort/) });
  });

  it('T-RH-B-802 anvilPort 指定 + 到達不能 port は transport error -32603', async () => {
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
    const c = ctx({ anvilPort: unusedPort });
    await expect(
      handleRpcRequest(c, { method: 'eth_getBlockByNumber', params: ['latest'] }),
    ).rejects.toMatchObject({ code: -32603 });
  });
});

describe('chainRegistry resolveRegistryAnvilPort branches', () => {
  it('T-RH-B-901 chainRegistry rpcUrls が localhost + 有効 port なら proxyToAnvil で port 解決される', async () => {
    // 到達不能 localhost port を registry に登録 → resolveRegistryAnvilPort が port を返す →
    // eth_getBlockByNumber は proxyToAnvil に流れて transport error になる
    const c = ctx({
      chainState: { current: 31337 },
      chainRegistry: {
        current: [
          {
            chainId: '0x7a69' as Hex,
            rpcUrls: ['http://127.0.0.1:65432'],
          },
        ],
      },
    });
    await expect(
      handleRpcRequest(c, { method: 'eth_getBlockByNumber', params: ['latest'] }),
    ).rejects.toMatchObject({ code: -32603 });
  });

  it('T-RH-B-902 chainRegistry の rpcUrls が非 localhost なら port 解決不能', async () => {
    // 到達不能 remote host → proxyToAnvil には流れず、 fallback ctx.anvilPort 無しで throw
    const c = ctx({
      chainState: { current: 31337 },
      chainRegistry: {
        current: [
          {
            chainId: '0x7a69' as Hex,
            rpcUrls: ['https://mainnet.example.com'],
          },
        ],
      },
    });
    await expect(
      handleRpcRequest(c, { method: 'eth_getBlockByNumber', params: ['latest'] }),
    ).rejects.toMatchObject({ code: -32603, message: expect.stringMatching(/requires anvilPort/) });
  });

  it('T-RH-B-903 chainRegistry の rpcUrls が invalid URL でも throw せず fallback', async () => {
    const c = ctx({
      chainState: { current: 31337 },
      chainRegistry: {
        current: [
          {
            chainId: '0x7a69' as Hex,
            rpcUrls: ['not a url'],
          },
        ],
      },
    });
    await expect(
      handleRpcRequest(c, { method: 'eth_getBlockByNumber', params: ['latest'] }),
    ).rejects.toMatchObject({ code: -32603, message: expect.stringMatching(/requires anvilPort/) });
  });
});

describe('eth_signTypedData_v4 authorization branches', () => {
  it('T-RH-B-1001 signerAddress が active と異なる場合は 4100 で reject', async () => {
    const other = privateKeyToAccount(PK2).address;
    const typedData = {
      types: { Person: [{ name: 'name', type: 'string' }] },
      primaryType: 'Person',
      domain: { name: 'x' },
      message: { name: 'hi' },
    };
    await expect(
      handleRpcRequest(ctx(), {
        method: 'eth_signTypedData_v4',
        params: [other, JSON.stringify(typedData)],
      }),
    ).rejects.toMatchObject({ code: 4100 });
  });
});
