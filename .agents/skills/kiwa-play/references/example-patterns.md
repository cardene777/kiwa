# example-patterns.md

kiwa リポジトリ (`cardene777/kiwa`) の `examples/` 22 件の用途別 index と典型パターン抜粋。

ユーザー要件に近い example を 1 つ選び、 spec.ts と prepare-env.ts を Read してから類似構造で書く。

## 用途別 index

| 用途カテゴリ | example | spec.ts 件数 | 学べるパターン |
|---|---|---|---|
| **基本** | `basic-connect` | 14 | window.ethereum inject、 connect button、 chainId 表示 |
| **token transfer** | `defi-swap` | 6 | approve / transferFrom、 token balance check、 slippage / 流動性不足 |
| **NFT 系** | `mint-nft` | 8 | tokenId 抽出、 ownerOf assertion、 batch mint、 EIP-2981 royalty、 supply cap |
| **NFT marketplace** | `nft-marketplace` | 12 | listing / offer / double-listing prevention、 royalty split、 cancellation |
| **AA (ERC-4337 簡略)** | `nextjs-aa-smart-account` | 10 | factory + counterfactual address、 executeBatch、 guardian recovery、 EIP-1271 |
| **Bridge (cross-chain)** | `nextjs-bridge` | 9 | L1 lock / L2 mint、 burn / L1 unlock 往復、 operator 認証、 replay 防御 |
| **DAO governance** | `nextjs-dao-vote` | 10 | propose / vote / quorum 切り上げ / deadline / timelock execute / access control |
| **ENS resolver** | `nextjs-ens-resolver` | 7 | name register、 collision detection、 owner 不変 |
| **ERC-1155 game** | `nextjs-erc1155-game` | 8 | batch ops、 burn (item consumption) |
| **event filter** | `nextjs-event-history` | 7 | getLogs、 multi-param indexed filter (topics 配列) |
| **lending** | `nextjs-lending` | 10 | borrow / collateral / liquidation、 max LTV |
| **multi-chain** | `nextjs-multi-chain` | 6 | startAnvilCluster (2 anvil) 、 chain switch、 独立 balance、 resolveAnvilPort |
| **permit (EIP-2612)** | `nextjs-permit-swap` | 6 | signTypedData (v4)、 permit deadline expiration |
| **staking** | `nextjs-staking` | 12 | stake / reward 計算、 reward overflow、 unstake penalty |
| **token-gating** | `nextjs-token-gating` | 8 | NFT ownership 検証、 grantTimedAccess、 transfer 即時 revoke、 TTL |
| **vesting** | `nextjs-vesting` | 9 | schedule immutability、 cliff、 immutable enforcement |
| **wagmi + RainbowKit** | `nextjs-wagmi-rainbow` | 4 | RPC reconnect、 error recovery |
| **zk verifier (mock)** | `nextjs-zk-verifier` | 7 | commit-reveal、 range proof variant |
| **Vite 系** | `vite-react-wagmi` | 3 | Vite + wagmi 最小構成 |

## 典型 example 抜粋

### A. 単純 ERC-20 (defi-swap 系)

```ts
const tokenA = readEnv().NEXT_PUBLIC_TOKEN_A as Address;
const balance = await pub.readContract({
  address: tokenA,
  abi: ERC20_ABI,
  functionName: 'balanceOf',
  args: [user],
});
expect(balance).toBe(expectedAmount);
```

### B. NFT mint + ownerOf (mint-nft 系)

```ts
const mintHash = await wallet.writeContract({
  address: nft,
  abi: NFT_ABI,
  functionName: 'mint',
  args: [],
});
const receipt = await pub.waitForTransactionReceipt({ hash: mintHash });
const tokenId = receipt.logs[0].topics[3]; // Transfer event の tokenId
const owner = await pub.readContract({
  address: nft,
  abi: NFT_ABI,
  functionName: 'ownerOf',
  args: [BigInt(tokenId)],
});
expect(owner.toLowerCase()).toBe(user.toLowerCase());
```

### C. multi-chain 独立 (nextjs-multi-chain)

```ts
const cluster = await startAnvilCluster({
  chains: [
    { id: 31337, port: 8554, name: 'chain-a' },
    { id: 31338, port: 8555, name: 'chain-b' },
  ],
});

// chain A で mint
const pubA = createPublicClient({ chain: anvilChain(8554), transport: http() });
await walletA.writeContract({ address: token, abi: ABI, functionName: 'mint', args: [user, 100n] });

// chain B から読むと 0 (独立性)
const balB = await pubB.readContract({ address: token, abi: ABI, functionName: 'balanceOf', args: [user] });
expect(balB).toBe(0n);
```

### D. EIP-1271 isValidSignature (nextjs-aa-smart-account)

```ts
const hash = keccak256(toBytes('hello'));
const signature = await ownerSign(hash);
const magicValue = await pub.readContract({
  address: smartAccount,
  abi: SMART_ACCOUNT_ABI,
  functionName: 'isValidSignature',
  args: [hash, signature],
});
expect(magicValue).toBe('0x1626ba7e' as Hex); // EIP1271_MAGIC_VALUE
```

### E. custom error revert (DAO / Bridge / Token-gating)

```ts
try {
  await pub.simulateContract({
    account: nonOperator,
    address: bridge,
    abi: BRIDGE_ABI,
    functionName: 'unlock',
    args: [nonce, recipient, amount],
  });
  throw new Error('expected revert');
} catch (error) {
  expectCustomError(error, 'NotOperator');
}
```

### F. time-warp + TTL (nextjs-token-gating)

```ts
const tx = await wallet.writeContract({
  address: gatedContent,
  abi: GATED_ABI,
  functionName: 'grantTimedAccess',
  args: [grantee, 60n], // 60 秒
});

await rpc(port, 'evm_increaseTime', [120]); // TTL 超過
await rpc(port, 'evm_mine', []);

const hasAccess = await pub.readContract({
  address: gatedContent,
  abi: GATED_ABI,
  functionName: 'hasAccess',
  args: [grantee],
});
expect(hasAccess).toBe(false);
```

## test 名 prefix 規約

| prefix | 用途 |
|---|---|
| `T-XX-NNN` | 通常 test (XX は example 略称、 NNN は連番。 例 `T-BR-006`) |
| `T-XX-NNNA` `T-XX-NNNB` | 同一機能の派生 variant |

kiwa リポでは慣例として 1 example あたり 4-12 test 名で網羅する。
