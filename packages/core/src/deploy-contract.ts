import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  Abi,
  ContractConstructorArgs,
  Hex,
  PublicClient,
  TransactionReceipt,
  WalletClient,
} from 'viem';
import { encodeDeployData } from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';

export interface DeployContractOptions<TAbi extends Abi | readonly unknown[] = Abi> {
  account: PrivateKeyAccount | { address: `0x${string}` };
  wallet: WalletClient;
  publicClient: PublicClient;
  abi: TAbi;
  bytecode: `0x${string}`;
  args?: ContractConstructorArgs<TAbi>;
}

export interface DeployContractResult {
  address: `0x${string}`;
  txHash: `0x${string}`;
  receipt: TransactionReceipt;
}

export interface LoadForgeArtifactOptions {
  exampleRoot: string;
  contractSlug: string;
}

interface ForgeArtifactJson {
  abi?: readonly unknown[];
  bytecode?: { object?: string } | string;
}

function normalizeDeployAccount(
  account: DeployContractOptions['account'],
): PrivateKeyAccount | `0x${string}` {
  return 'signMessage' in account ? account : account.address;
}

export async function deployContract<TAbi extends Abi | readonly unknown[] = Abi>(
  opts: DeployContractOptions<TAbi>,
): Promise<DeployContractResult> {
  const abi = opts.abi as readonly unknown[];
  const args = opts.args as readonly unknown[] | undefined;
  const data: Hex =
    args !== undefined
      ? encodeDeployData({
          abi,
          bytecode: opts.bytecode,
          args,
        })
      : encodeDeployData({
          abi,
          bytecode: opts.bytecode,
        });
  const txHash = await opts.wallet.sendTransaction({
    account: normalizeDeployAccount(opts.account),
    chain: opts.wallet.chain ?? null,
    data,
  });
  const receipt = await opts.publicClient.waitForTransactionReceipt({ hash: txHash });
  const address = receipt.contractAddress;
  if (!address) {
    throw new Error(`deployContract did not return contractAddress for tx ${txHash}`);
  }
  return {
    address,
    txHash,
    receipt,
  };
}

export function loadForgeArtifact(opts: LoadForgeArtifactOptions): {
  abi: readonly unknown[];
  bytecode: `0x${string}`;
} {
  const artifactPath = resolve(opts.exampleRoot, 'forge-out', `${opts.contractSlug}.json`);
  const parsed = JSON.parse(readFileSync(artifactPath, 'utf8')) as ForgeArtifactJson;

  if (!Array.isArray(parsed.abi)) {
    throw new Error(`forge artifact abi missing or invalid: ${artifactPath}`);
  }

  const bytecode =
    typeof parsed.bytecode === 'string' ? parsed.bytecode : parsed.bytecode?.object;
  if (typeof bytecode !== 'string' || !bytecode.startsWith('0x')) {
    throw new Error(`forge artifact bytecode missing or invalid: ${artifactPath}`);
  }

  return {
    abi: parsed.abi,
    bytecode: bytecode as `0x${string}`,
  };
}
