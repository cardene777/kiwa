import type { Address, Hash, PublicClient, WalletClient } from 'viem';
import { ENTRY_POINT_ABI, type UserOperation } from './aa';

export async function sendUserOperation(
  walletClient: WalletClient,
  publicClient: PublicClient,
  entryPoint: Address,
  userOp: UserOperation,
): Promise<Hash> {
  if (!walletClient.account) {
    throw new Error('walletClient.account is required to submit a UserOperation');
  }

  const beneficiary = walletClient.account.address;
  const hash = await walletClient.writeContract({
    account: walletClient.account,
    address: entryPoint,
    abi: ENTRY_POINT_ABI,
    chain: walletClient.chain ?? undefined,
    functionName: 'handleOps',
    args: [[userOp], beneficiary],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
