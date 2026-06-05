import {
  concatHex,
  encodeFunctionData,
  parseAbi,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from 'viem';

export interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
}

export interface UserOperationJson {
  sender: Address;
  nonce: string;
  initCode: Hex;
  callData: Hex;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: Hex;
  signature: Hex;
}

export const ENTRY_POINT_ABI = parseAbi([
  'function handleOps((address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes paymasterAndData,bytes signature)[] ops, address beneficiary)',
  'function getUserOpHash((address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes paymasterAndData,bytes signature) userOp) view returns (bytes32)',
  'function depositTo(address account) payable',
  'function withdrawTo(address withdrawAddress, uint256 amount)',
  'function deposits(address account) view returns (uint256)',
]);

export const SIMPLE_ACCOUNT_ABI = parseAbi([
  'function execute(address target, uint256 value, bytes data) returns (bytes)',
  'function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)',
  'function nonce() view returns (uint256)',
  'function owner() view returns (address)',
]);

export const SIMPLE_ACCOUNT_FACTORY_ABI = parseAbi([
  'function createAccount(address owner, uint256 salt) returns (address)',
  'function getAddress(address owner, uint256 salt) view returns (address)',
]);

export const MOCK_TARGET_ABI = parseAbi([
  'function increment()',
  'function counter() view returns (uint256)',
]);

export const EIP1271_MAGIC_VALUE = '0x1626ba7e' as const;

export const USER_OP_DEFAULTS = {
  callGasLimit: 300_000n,
  verificationGasLimit: 300_000n,
  preVerificationGas: 21_000n,
  maxFeePerGas: 1n,
  maxPriorityFeePerGas: 1n,
} as const;

export const INCREMENT_CALLDATA = encodeFunctionData({
  abi: MOCK_TARGET_ABI,
  functionName: 'increment',
});

export function buildExecuteCallData(target: Address, data: Hex, value = 0n): Hex {
  return encodeFunctionData({
    abi: SIMPLE_ACCOUNT_ABI,
    functionName: 'execute',
    args: [target, value, data],
  });
}

export function buildFactoryInitCode(factory: Address, owner: Address, salt: bigint): Hex {
  return concatHex([
    factory,
    encodeFunctionData({
      abi: SIMPLE_ACCOUNT_FACTORY_ABI,
      functionName: 'createAccount',
      args: [owner, salt],
    }),
  ]);
}

export function buildUnsignedUserOperation(params: {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit?: bigint;
  verificationGasLimit?: bigint;
  preVerificationGas?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  paymasterAndData?: Hex;
}): UserOperation {
  return {
    sender: params.sender,
    nonce: params.nonce,
    initCode: params.initCode,
    callData: params.callData,
    callGasLimit: params.callGasLimit ?? USER_OP_DEFAULTS.callGasLimit,
    verificationGasLimit:
      params.verificationGasLimit ?? USER_OP_DEFAULTS.verificationGasLimit,
    preVerificationGas:
      params.preVerificationGas ?? USER_OP_DEFAULTS.preVerificationGas,
    maxFeePerGas: params.maxFeePerGas ?? USER_OP_DEFAULTS.maxFeePerGas,
    maxPriorityFeePerGas:
      params.maxPriorityFeePerGas ?? USER_OP_DEFAULTS.maxPriorityFeePerGas,
    paymasterAndData: params.paymasterAndData ?? '0x',
    signature: '0x',
  };
}

export async function getUserOperationHash(
  publicClient: PublicClient,
  entryPoint: Address,
  userOp: UserOperation,
): Promise<Hex> {
  return (await publicClient.readContract({
    address: entryPoint,
    abi: ENTRY_POINT_ABI,
    functionName: 'getUserOpHash',
    args: [userOp],
  })) as Hex;
}

export async function signUserOperation(
  walletClient: WalletClient,
  publicClient: PublicClient,
  entryPoint: Address,
  userOp: UserOperation,
): Promise<UserOperation> {
  const userOpHash = await getUserOperationHash(publicClient, entryPoint, userOp);
  if (!walletClient.account) {
    throw new Error('walletClient.account is required to sign a UserOperation');
  }
  const signature = (await walletClient.signMessage({
    account: walletClient.account,
    message: { raw: userOpHash },
  })) as Hex;
  return { ...userOp, signature };
}

export function userOperationToJson(userOp: UserOperation): UserOperationJson {
  return {
    sender: userOp.sender,
    nonce: userOp.nonce.toString(),
    initCode: userOp.initCode,
    callData: userOp.callData,
    callGasLimit: userOp.callGasLimit.toString(),
    verificationGasLimit: userOp.verificationGasLimit.toString(),
    preVerificationGas: userOp.preVerificationGas.toString(),
    maxFeePerGas: userOp.maxFeePerGas.toString(),
    maxPriorityFeePerGas: userOp.maxPriorityFeePerGas.toString(),
    paymasterAndData: userOp.paymasterAndData,
    signature: userOp.signature,
  };
}

export function userOperationFromJson(userOp: UserOperationJson): UserOperation {
  return {
    sender: userOp.sender,
    nonce: BigInt(userOp.nonce),
    initCode: userOp.initCode,
    callData: userOp.callData,
    callGasLimit: BigInt(userOp.callGasLimit),
    verificationGasLimit: BigInt(userOp.verificationGasLimit),
    preVerificationGas: BigInt(userOp.preVerificationGas),
    maxFeePerGas: BigInt(userOp.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(userOp.maxPriorityFeePerGas),
    paymasterAndData: userOp.paymasterAndData,
    signature: userOp.signature,
  };
}
