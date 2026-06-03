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

export interface InjectorOptions {
  privateKey: Hex;
  chainId: number;
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
  waitForRpcIdle?(timeoutMs?: number): Promise<void>;
}
