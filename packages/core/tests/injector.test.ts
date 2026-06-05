import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  encodeFunctionData,
  hashMessage,
  hashTypedData,
  http,
  parseAbi,
  verifyMessage,
  verifyTypedData,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI,
  deployContract,
  loadForgeArtifact,
  parseEip712TypedDataJson,
  startAnvil,
  type AnvilHandle,
  createInjectorScript,
  handleRpcRequest,
  type RpcContext,
  verifyEip1271Signature,
  verifyAnvilChainId,
} from '../src/index.js';

// anvil default key #0 - public test key, secret 扱いしない
const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const SECOND_PRIVATE_KEY =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;
const CHAIN_ID = 31337;
const repoRoot = resolve(process.cwd(), '..', '..');
const aaExampleRoot = resolve(repoRoot, 'examples/nextjs-aa-smart-account');

function ctx(): RpcContext {
  return {
    privateKey: PRIVATE_KEY,
    chainState: { current: CHAIN_ID },
    approvalMode: { current: 'approve' },
  };
}

function buildTypedData() {
  return {
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
}

function anvilChain(port: number) {
  return defineChain({
    id: CHAIN_ID,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
  });
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
    const typedData = buildTypedData();
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

describe('parseEip712TypedDataJson', () => {
  it('T-INJ-016 valid typed data を parse し EIP712Domain type を除外する', () => {
    // Given
    const typedData = buildTypedData();
    // When
    const parsed = parseEip712TypedDataJson(JSON.stringify(typedData));
    // Then
    expect(parsed.primaryType).toBe('Mail');
    expect(parsed.domain.name).toBe('Mail');
    expect(parsed.types.EIP712Domain).toBeUndefined();
    expect(parsed.types.Mail).toHaveLength(3);
  });

  it('T-INJ-017 malformed typedData shape (types invalid) は code -32602 で reject', () => {
    // Given
    const typedData = {
      ...buildTypedData(),
      types: {
        Mail: [{ name: 'from' }],
      },
    };
    // When / Then
    expect(() => parseEip712TypedDataJson(JSON.stringify(typedData))).toThrowError(
      expect.objectContaining({ code: -32602 }),
    );
  });

  it('T-INJ-018 primaryType missing は code -32602 で reject', () => {
    // Given
    const typedData = buildTypedData() as Record<string, unknown>;
    delete typedData.primaryType;
    // When / Then
    expect(() => parseEip712TypedDataJson(JSON.stringify(typedData))).toThrowError(
      expect.objectContaining({ code: -32602 }),
    );
  });

  it('T-INJ-019 domain missing は code -32602 で reject', () => {
    // Given
    const typedData = buildTypedData() as Record<string, unknown>;
    delete typedData.domain;
    // When / Then
    expect(() => parseEip712TypedDataJson(JSON.stringify(typedData))).toThrowError(
      expect.objectContaining({ code: -32602 }),
    );
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
  let publicClient: ReturnType<typeof createPublicClient> | null = null;
  let contractAccountAddress: Address | null = null;
  let counterAddress: Address | null = null;

  beforeAll(async () => {
    handle = await startAnvil();
    ctxWithPort = { ...ctx(), anvilPort: handle.port };
    const chain = anvilChain(handle.port);
    const owner = privateKeyToAccount(PRIVATE_KEY);
    const guardian = privateKeyToAccount(SECOND_PRIVATE_KEY);
    const walletClient = createWalletClient({
      account: owner,
      chain,
      transport: http(),
    });
    publicClient = createPublicClient({ chain, transport: http() });

    const smartAccountArtifact = loadForgeArtifact({
      exampleRoot: aaExampleRoot,
      contractSlug: 'SmartAccount.sol/SmartAccount',
    });
    const counterArtifact = loadForgeArtifact({
      exampleRoot: aaExampleRoot,
      contractSlug: 'Counter.sol/Counter',
    });

    const deployedSmartAccount = await deployContract({
      account: owner,
      wallet: walletClient,
      publicClient,
      abi: smartAccountArtifact.abi,
      bytecode: smartAccountArtifact.bytecode,
      args: [owner.address, '0x0000000000000000000000000000000000000000', [guardian.address], 1n],
    });
    contractAccountAddress = deployedSmartAccount.address;

    const deployedCounter = await deployContract({
      account: owner,
      wallet: walletClient,
      publicClient,
      abi: counterArtifact.abi,
      bytecode: counterArtifact.bytecode,
    });
    counterAddress = deployedCounter.address;
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

  it('T-INJ-020 verifyAnvilChainId は mismatch 時に warn を出す', async () => {
    // Given
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // When
    await verifyAnvilChainId(handle!.port, 5);
    // Then
    expect(warn).toHaveBeenCalledWith(
      `[dapp-e2e] wallet_switchEthereumChain to 5 but anvil reports ${CHAIN_ID}`,
    );
    warn.mockRestore();
  });

  it('T-INJ-021 contract account eth_accounts は smart account address を返す', async () => {
    const result = (await handleRpcRequest(
      {
        ...ctxWithPort!,
        contractAccount: {
          address: contractAccountAddress!,
          executeAbi: DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI,
        },
      },
      { method: 'eth_accounts' },
    )) as Address[];

    expect(result).toEqual([contractAccountAddress]);
  });

  it('T-INJ-022 contract account personal_sign は EIP-1271 で内部検証済の署名を返す', async () => {
    const signature = (await handleRpcRequest(
      {
        ...ctxWithPort!,
        contractAccount: {
          address: contractAccountAddress!,
          executeAbi: DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI,
        },
      },
      {
        method: 'personal_sign',
        params: ['hello contract account', contractAccountAddress],
      },
    )) as `0x${string}`;

    const valid = await verifyEip1271Signature({
      publicClient: publicClient!,
      contractAddress: contractAccountAddress!,
      messageHash: hashMessage('hello contract account'),
      signature,
    });

    expect(valid).toBe(true);
  });

  it('T-INJ-023 contract account eth_signTypedData_v4 は EIP-1271 で内部検証済の署名を返す', async () => {
    const typedData = buildTypedData();
    const signature = (await handleRpcRequest(
      {
        ...ctxWithPort!,
        contractAccount: {
          address: contractAccountAddress!,
          executeAbi: DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI,
        },
      },
      {
        method: 'eth_signTypedData_v4',
        params: [contractAccountAddress, JSON.stringify(typedData)],
      },
    )) as `0x${string}`;

    const valid = await verifyEip1271Signature({
      publicClient: publicClient!,
      contractAddress: contractAccountAddress!,
      messageHash: hashTypedData(typedData),
      signature,
    });

    expect(valid).toBe(true);
  });

  it('T-INJ-024 contract account eth_sendTransaction は execute 経由で target call を行う', async () => {
    const txHash = (await handleRpcRequest(
      {
        ...ctxWithPort!,
        contractAccount: {
          address: contractAccountAddress!,
          executeAbi: DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI,
        },
      },
      {
        method: 'eth_sendTransaction',
        params: [
          {
            from: contractAccountAddress,
            to: counterAddress,
            data: encodeFunctionData({
              abi: parseAbi(['function increment()']),
              functionName: 'increment',
            }),
          },
        ],
      },
    )) as `0x${string}`;

    await publicClient!.waitForTransactionReceipt({ hash: txHash });
    const count = (await publicClient!.readContract({
      address: counterAddress!,
      abi: parseAbi(['function countByCaller(address caller) view returns (uint256)']),
      functionName: 'countByCaller',
      args: [contractAccountAddress!],
    })) as bigint;

    expect(count).toBe(1n);
  });

  it('T-INJ-025 invalid contract account signature は -32000 で reject する', async () => {
    await expect(
      handleRpcRequest(
        {
          ...ctxWithPort!,
          contractAccount: {
            address: counterAddress!,
            executeAbi: DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI,
          },
        },
        {
          method: 'personal_sign',
          params: ['hello invalid contract account', counterAddress],
        },
      ),
    ).rejects.toMatchObject({
      code: -32000,
      message: 'EIP-1271 verification failed',
    });
  });
});
