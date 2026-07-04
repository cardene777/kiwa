import type { PasskeyCredential, SyncFabric, SyncFabricVendor } from './types.js';

/**
 * Build a sync fabric — the in-memory analogue of iCloud Keychain or Google
 * Password Manager. Real fabrics wrap end-to-end-encrypted blobs indexed by
 * credential id; the mock keeps a plain `Map<credentialId, PasskeyCredential>`
 * so tests can inspect the blob shape at will. Every backup produces a
 * shallow clone — mutating the returned credential must not race with a
 * concurrent backup of the same credential on a sibling device.
 */
export function createSyncFabric(vendor: SyncFabricVendor): SyncFabric {
  if (
    vendor !== 'icloud-keychain' &&
    vendor !== 'google-password-manager'
  ) {
    throw new Error(
      `createSyncFabric: unknown vendor "${vendor}" — expected icloud-keychain or google-password-manager`,
    );
  }
  const blobs = new Map<string, PasskeyCredential>();
  return {
    vendor,
    size(): number {
      return blobs.size;
    },
    backup(credential: PasskeyCredential): void {
      // Shallow clone — the fabric owns its copy so device-side mutations
      // (signCount increments, lastUsedAt bumps) do not leak into the
      // stored blob until the next explicit backup.
      blobs.set(credential.credentialId, {
        ...credential,
        syncedFabrics: [...credential.syncedFabrics],
      });
    },
    restore(credentialId: string): PasskeyCredential | null {
      const blob = blobs.get(credentialId);
      if (!blob) return null;
      // Return a clone so the caller can mutate its device-side view without
      // dirtying the fabric copy.
      return {
        ...blob,
        syncedFabrics: [...blob.syncedFabrics],
      };
    },
    evict(credentialId: string): boolean {
      return blobs.delete(credentialId);
    },
    list(): PasskeyCredential[] {
      return Array.from(blobs.values()).map((blob) => ({
        ...blob,
        syncedFabrics: [...blob.syncedFabrics],
      }));
    },
    clear(): void {
      blobs.clear();
    },
  };
}
