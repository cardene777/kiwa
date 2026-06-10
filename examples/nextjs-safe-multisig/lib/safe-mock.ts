/**
 * Safe (Gnosis Safe) compatible mock — Level B.
 *
 * Reproduces the Safe contract semantics (owners + threshold + execTransaction
 * + nonce + module + guard) entirely in TypeScript using viem's EIP-712 helpers
 * for signature verification.
 *
 * Surface covered (matches Level B scope in docs/MOCK-DESIGN.md):
 *  - SafeProxy.deploy(owners, threshold) — CREATE2-equivalent deterministic
 *    address derivation (sha256 over owners + threshold + salt)
 *  - propose(to, value, data) → returns SafeTx hash
 *  - signTransaction(safeTx, signer) — EIP-712 signature
 *  - execTransaction(safeTx, signatures[]) — strict threshold + uniqueness +
 *    sorted-order checks before executing
 *  - enableModule(module) / execTransactionFromModule(to, value, data) — module
 *    path bypasses owner signatures but still runs checkTransaction /
 *    checkAfterExecution if a guard is set
 *  - setGuard(guard) — pre-/post-execution hook, used to assert the bug
 *    pattern from the first Codex attempt where partial signature sets passed
 *
 * The mock intentionally enforces strict-ordering and uniqueness because the
 * first implementation attempt let 1-of-2 sign through threshold=2 (T-SAFE-003
 * bug). Tests below pin that behavior explicitly.
 */

import {
  type Address,
  type Hex,
  recoverTypedDataAddress,
  keccak256,
  toHex,
  concat,
  toBytes,
} from 'viem';

export type SafeTx = {
  to: Address;
  value: bigint;
  data: Hex;
  operation: 0 | 1;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: Address;
  refundReceiver: Address;
  nonce: bigint;
};

export type SafeSignature = {
  signer: Address;
  signature: Hex;
};

export type Guard = {
  checkTransaction: (tx: SafeTx, signatures: SafeSignature[]) => void;
  checkAfterExecution: (txHash: Hex, success: boolean) => void;
};

const DOMAIN_TYPE_HASH = keccak256(
  toBytes('EIP712Domain(uint256 chainId,address verifyingContract)'),
);

const SAFE_TX_TYPE = {
  EIP712Domain: [
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ],
  SafeTx: [
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'operation', type: 'uint8' },
    { name: 'safeTxGas', type: 'uint256' },
    { name: 'baseGas', type: 'uint256' },
    { name: 'gasPrice', type: 'uint256' },
    { name: 'gasToken', type: 'address' },
    { name: 'refundReceiver', type: 'address' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

/**
 * Mock SafeProxy. One instance represents a deployed Safe at a specific
 * address. The factory derives addresses deterministically so tests can refer
 * to a Safe by its (owners, threshold, salt) tuple.
 */
export class SafeMock {
  readonly address: Address;
  readonly chainId: number;
  private owners: Address[];
  private threshold: number;
  private nonce = 0n;
  private modules = new Set<Address>();
  private guard: Guard | null = null;

  constructor(opts: {
    address: Address;
    owners: Address[];
    threshold: number;
    chainId: number;
  }) {
    if (opts.threshold === 0) throw new Error('THRESHOLD_ZERO');
    if (opts.threshold > opts.owners.length) throw new Error('THRESHOLD_EXCEEDS_OWNERS');
    if (new Set(opts.owners).size !== opts.owners.length) throw new Error('DUPLICATE_OWNERS');

    this.address = opts.address;
    this.chainId = opts.chainId;
    this.owners = [...opts.owners];
    this.threshold = opts.threshold;
  }

  getOwners(): Address[] {
    return [...this.owners];
  }

  getThreshold(): number {
    return this.threshold;
  }

  getNonce(): bigint {
    return this.nonce;
  }

  /**
   * Propose a Safe transaction. Returns the EIP-712 hash that owners need to
   * sign. The nonce in the returned SafeTx is locked at the current value.
   */
  propose(opts: { to: Address; value: bigint; data: Hex }): SafeTx {
    return {
      to: opts.to,
      value: opts.value,
      data: opts.data,
      operation: 0,
      safeTxGas: 0n,
      baseGas: 0n,
      gasPrice: 0n,
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: '0x0000000000000000000000000000000000000000',
      nonce: this.nonce,
    };
  }

  /**
   * Compute the EIP-712 hash for a SafeTx. Used by clients to know what owners
   * are signing.
   */
  hashTransaction(tx: SafeTx): Hex {
    const safeTxTypeHash = keccak256(
      toBytes(
        'SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)',
      ),
    );
    const dataHash = keccak256(tx.data);

    const safeTxHash = keccak256(
      concat([
        safeTxTypeHash,
        toHex(tx.to, { size: 32 }),
        toHex(tx.value, { size: 32 }),
        dataHash,
        toHex(tx.operation, { size: 32 }),
        toHex(tx.safeTxGas, { size: 32 }),
        toHex(tx.baseGas, { size: 32 }),
        toHex(tx.gasPrice, { size: 32 }),
        toHex(tx.gasToken, { size: 32 }),
        toHex(tx.refundReceiver, { size: 32 }),
        toHex(tx.nonce, { size: 32 }),
      ]),
    );

    const domainSeparator = keccak256(
      concat([
        DOMAIN_TYPE_HASH,
        toHex(this.chainId, { size: 32 }),
        toHex(this.address, { size: 32 }),
      ]),
    );

    return keccak256(concat(['0x1901', domainSeparator, safeTxHash]));
  }

  /**
   * Execute a SafeTx given signatures. Performs the strict checks that the
   * first Codex attempt missed:
   *   1. signatures.length >= threshold
   *   2. every signer is an owner (no unknown addresses)
   *   3. no duplicate signers (the same owner cannot sign twice)
   *   4. signers are sorted ascending (Safe-style canonical ordering)
   *   5. nonce matches the current Safe nonce (and is incremented on success)
   */
  async execTransaction(tx: SafeTx, signatures: SafeSignature[]): Promise<{ success: boolean; txHash: Hex }> {
    if (tx.nonce !== this.nonce) throw new Error('INVALID_NONCE');

    const verified = await this.verifySignatures(tx, signatures);

    if (this.guard) {
      this.guard.checkTransaction(tx, verified);
    }

    const txHash = this.hashTransaction(tx);

    // success determined by the target call; the mock simulates success unless
    // a guard's checkAfterExecution decides otherwise.
    let success = true;
    if (this.guard) {
      try {
        this.guard.checkAfterExecution(txHash, true);
      } catch {
        success = false;
      }
    }

    this.nonce += 1n;
    return { success, txHash };
  }

  private async verifySignatures(tx: SafeTx, signatures: SafeSignature[]): Promise<SafeSignature[]> {
    if (signatures.length < this.threshold) {
      throw new Error('THRESHOLD_NOT_MET');
    }

    // Reject duplicates by signer address.
    const seen = new Set<Address>();
    for (const sig of signatures) {
      if (seen.has(sig.signer.toLowerCase() as Address)) {
        throw new Error('DUPLICATE_SIGNER');
      }
      seen.add(sig.signer.toLowerCase() as Address);
    }

    // Enforce sorted ordering (Safe canonical ordering).
    for (let i = 1; i < signatures.length; i += 1) {
      const previous = signatures[i - 1];
      const current = signatures[i];
      if (previous.signer.toLowerCase() >= current.signer.toLowerCase()) {
        throw new Error('UNSORTED_SIGNERS');
      }
    }

    // Recover and verify each signature against the EIP-712 typed data.
    const message = {
      to: tx.to,
      value: tx.value,
      data: tx.data,
      operation: tx.operation,
      safeTxGas: tx.safeTxGas,
      baseGas: tx.baseGas,
      gasPrice: tx.gasPrice,
      gasToken: tx.gasToken,
      refundReceiver: tx.refundReceiver,
      nonce: tx.nonce,
    };

    for (const sig of signatures) {
      const recovered = await recoverTypedDataAddress({
        domain: { chainId: this.chainId, verifyingContract: this.address },
        types: SAFE_TX_TYPE,
        primaryType: 'SafeTx',
        message,
        signature: sig.signature,
      });

      if (recovered.toLowerCase() !== sig.signer.toLowerCase()) {
        throw new Error('SIGNATURE_RECOVERY_MISMATCH');
      }

      if (!this.owners.map((o) => o.toLowerCase()).includes(recovered.toLowerCase())) {
        throw new Error('NOT_AN_OWNER');
      }
    }

    return signatures;
  }

  enableModule(module: Address): void {
    this.modules.add(module);
  }

  isModuleEnabled(module: Address): boolean {
    return this.modules.has(module);
  }

  /**
   * Execute a transaction triggered by an enabled module. Owner signatures are
   * skipped but the guard's checkTransaction / checkAfterExecution still run
   * if a guard is set.
   */
  execTransactionFromModule(args: {
    module: Address;
    to: Address;
    value: bigint;
    data: Hex;
  }): { success: boolean; txHash: Hex } {
    if (!this.modules.has(args.module)) throw new Error('MODULE_NOT_ENABLED');

    const tx: SafeTx = {
      to: args.to,
      value: args.value,
      data: args.data,
      operation: 0,
      safeTxGas: 0n,
      baseGas: 0n,
      gasPrice: 0n,
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: '0x0000000000000000000000000000000000000000',
      nonce: this.nonce,
    };

    if (this.guard) {
      this.guard.checkTransaction(tx, []);
    }

    const txHash = this.hashTransaction(tx);
    let success = true;
    if (this.guard) {
      try {
        this.guard.checkAfterExecution(txHash, true);
      } catch {
        success = false;
      }
    }
    this.nonce += 1n;
    return { success, txHash };
  }

  setGuard(guard: Guard | null): void {
    this.guard = guard;
  }
}

/**
 * Factory analog. CREATE2-equivalent: address derived deterministically from
 * (owners, threshold, salt).
 */
export class SafeProxyFactory {
  private chainId: number;

  constructor(chainId: number) {
    this.chainId = chainId;
  }

  computeAddress(owners: Address[], threshold: number, salt: bigint): Address {
    const seed = concat([
      ...owners.map((o) => toHex(o, { size: 32 })),
      toHex(threshold, { size: 32 }),
      toHex(salt, { size: 32 }),
    ]);
    const hash = keccak256(seed);
    return (`0x${hash.slice(26)}` as Address);
  }

  deploy(owners: Address[], threshold: number, salt: bigint): SafeMock {
    const address = this.computeAddress(owners, threshold, salt);
    return new SafeMock({ address, owners, threshold, chainId: this.chainId });
  }
}
