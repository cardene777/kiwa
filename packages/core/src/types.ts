export type Hex = `0x${string}`;

export interface Eip1193Request {
  method: string;
  params?: readonly unknown[];
}

export interface Eip1193Provider {
  request(args: Eip1193Request): Promise<unknown>;
  isMetaMask?: boolean;
}

export class Eip1193Error extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'Eip1193Error';
  }
}

export interface Eip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface WalletConfig {
  name: string;
  rdns: string;
  icon: string;
  privateKey: Hex;
  chainId?: number;
}

export interface InjectorOptions {
  privateKey: Hex;
  chainId: number;
  wallets?: WalletConfig[];
}

/**
 * EIP-3085 (wallet_addEthereumChain) parameters の subset。
 * chain registry に登録されるエントリの最小形式。
 */
export interface ChainConfig {
  chainId: Hex;
  chainName?: string;
  rpcUrls?: readonly string[];
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls?: readonly string[];
}

export type Eip1193EventName =
  | 'accountsChanged'
  | 'chainChanged'
  | 'connect'
  | 'disconnect';

export interface Eip712Domain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: Hex;
  salt?: Hex;
}

export interface Eip712TypedData {
  domain: Eip712Domain;
  types: Record<
    string,
    ReadonlyArray<{ readonly name: string; readonly type: string }>
  >;
  primaryType: string;
  message: Record<string, unknown>;
}

export interface SendTxParams {
  to?: Hex;
  value?: Hex | bigint;
  data?: Hex;
  from?: Hex;
  gas?: Hex | bigint;
}

export interface TxBroadcastCtx {
  privateKey: Hex;
  chainId: number;
  anvilPort: number;
}

export type Eip1193EventHandler = (...args: unknown[]) => void;

export type ApprovalMode = 'approve' | 'reject';

export interface WalletApi {
  triggerEvent(event: Eip1193EventName, ...args: unknown[]): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  switchChain(chainIdHex: Hex): Promise<void>;
  setApprovalMode(mode: ApprovalMode): Promise<void>;
  /**
   * 複数 account を持つ wallet で active account を切替える。
   * 範囲外 index で throw、内部で `accountsChanged` event を自動発火する。
   */
  setActiveAccount?(index: number): Promise<void>;
  /**
   * chain registry を test 内から書き換える。
   * 以後の `wallet_switchEthereumChain` は本 registry を参照し、未登録 chainId は 4902 で reject する。
   */
  setChainRegistry?(chains: readonly ChainConfig[]): Promise<void>;
}

export interface DappE2eEventEmitter {
  on(event: Eip1193EventName, handler: Eip1193EventHandler): void;
  off(event: Eip1193EventName, handler: Eip1193EventHandler): void;
  emit(event: Eip1193EventName, ...args: unknown[]): void;
  listenerCount(event: Eip1193EventName): number;
}

export interface DappE2eApi {
  triggerEvent(event: Eip1193EventName, ...args: unknown[]): Promise<void>;
  getAnvilPort(): number;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  switchChain(chainIdHex: Hex): Promise<void>;
  setApprovalMode(mode: ApprovalMode): Promise<void>;
  /**
   * 複数 account を持つ wallet で active account を切替える (primary wallet 経由)。
   * 内部で `accountsChanged` event を自動発火する。
   */
  setActiveAccount?(index: number): Promise<void>;
  /**
   * chain registry を test 内から書き換える (primary wallet 経由)。
   * 以後の `wallet_switchEthereumChain` で未登録 chainId は EIP-1193 code 4902 で reject。
   */
  setChainRegistry?(chains: readonly ChainConfig[]): Promise<void>;
  waitForRpcIdle?(timeoutMs?: number): Promise<void>;
  wallets?: Record<string, WalletApi>;
}
