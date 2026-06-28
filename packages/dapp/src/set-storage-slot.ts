import type { Address, Hex } from './types.js';

export interface SetStorageSlotParams {
  rpcUrl: string;
  address: Address;
  slot: number | bigint | Hex;
  value: Hex;
}

const HEX_VALUE_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const HEX_SLOT_PATTERN = /^0x[0-9a-fA-F]+$/;

export async function setStorageSlot(params: SetStorageSlotParams): Promise<void> {
  const { rpcUrl, address, slot, value } = params;

  if (!HEX_VALUE_PATTERN.test(value)) {
    throw new Error(
      `kiwa: setStorageSlot value must be a 32-byte hex (0x + 64 hex chars), got "${value}"`,
    );
  }

  const slotHex = normalizeSlot(slot);

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'anvil_setStorageAt',
      params: [address, slotHex, value],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `kiwa: setStorageSlot RPC failed with HTTP ${response.status} (${response.statusText})`,
    );
  }

  const payload = (await response.json()) as {
    error?: { code: number; message: string };
    result?: unknown;
  };

  if (payload.error) {
    throw new Error(
      `kiwa: setStorageSlot RPC error ${payload.error.code}: ${payload.error.message}`,
    );
  }
}

function normalizeSlot(slot: number | bigint | Hex): Hex {
  if (typeof slot === 'number') {
    if (!Number.isInteger(slot) || slot < 0) {
      throw new Error(`kiwa: setStorageSlot slot number must be a non-negative integer, got ${slot}`);
    }
    return `0x${slot.toString(16)}` as Hex;
  }
  if (typeof slot === 'bigint') {
    if (slot < 0n) {
      throw new Error(`kiwa: setStorageSlot slot bigint must be non-negative, got ${slot}`);
    }
    return `0x${slot.toString(16)}` as Hex;
  }
  if (!HEX_SLOT_PATTERN.test(slot)) {
    throw new Error(`kiwa: setStorageSlot slot hex must match /^0x[0-9a-fA-F]+$/, got "${slot}"`);
  }
  return slot;
}
