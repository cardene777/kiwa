import type {
  PasskeyCredential,
  SyncFabric,
  SyncFabricVendor,
} from './types.js';

/**
 * Push a credential blob into a sync fabric. Bumps the credential's sync
 * epoch (real fabrics use this to detect concurrent updates across devices)
 * and appends the vendor to `syncedFabrics` if it is not already present.
 * Returns the updated credential — callers should replace their in-memory
 * copy with the return value so subsequent backup / restore see the new
 * epoch.
 *
 * Throws when the credential is not backup-eligible. Non-discoverable
 * credentials minted on a bare U2F-style security key cannot participate in
 * the fabric — the FIDO Alliance Passkey Provider spec requires the
 * credential live on a device that can round-trip the private key material
 * through the vendor's E2EE blob.
 */
export function backupCredential(
  credential: PasskeyCredential,
  fabric: SyncFabric,
): PasskeyCredential {
  if (!credential.backupEligible) {
    throw new Error(
      `backupCredential: credential "${credential.credentialId}" is not backup-eligible — non-discoverable credentials cannot enter a sync fabric`,
    );
  }
  const syncedFabrics = credential.syncedFabrics.includes(fabric.vendor)
    ? credential.syncedFabrics
    : [...credential.syncedFabrics, fabric.vendor];
  const updated: PasskeyCredential = {
    ...credential,
    syncedFabrics,
    syncEpoch: credential.syncEpoch + 1,
  };
  fabric.backup(updated);
  return updated;
}

/**
 * Pull a credential blob out of a sync fabric. Returns `null` when the
 * fabric does not hold the credential — the caller decides whether to treat
 * that as a hard error (no such passkey) or a soft one (fabric not yet
 * synced). The returned credential is a fresh copy — restoring twice will
 * produce two independent snapshots and the caller is responsible for
 * merging them on the device side.
 */
export function restoreCredential(
  credentialId: string,
  fabric: SyncFabric,
): PasskeyCredential | null {
  return fabric.restore(credentialId);
}

/**
 * Copy every backup-eligible credential owned by `userId` from `source` into
 * `target` via the shared fabric. Mirrors the "sign in on a new device"
 * ceremony — the new device is the target, the fabric is the shared vendor,
 * and every credential is backed up on the source side then restored on the
 * target side.
 *
 * Returns the list of credentials that landed on the target. Skips
 * credentials owned by other users (per-user isolation) and non-backup-
 * eligible credentials (bare security key credentials cannot ride the
 * fabric).
 */
export function syncCredentials(
  source: readonly PasskeyCredential[],
  userId: string,
  fabric: SyncFabric,
  register: (credential: PasskeyCredential) => PasskeyCredential,
): PasskeyCredential[] {
  const restored: PasskeyCredential[] = [];
  for (const credential of source) {
    if (credential.userId !== userId) continue;
    if (!credential.backupEligible) continue;
    const backed = backupCredential(credential, fabric);
    const pulled = restoreCredential(backed.credentialId, fabric);
    if (!pulled) continue;
    restored.push(register(pulled));
  }
  return restored;
}

/**
 * Locate every vendor that holds a given credential across a list of fabrics.
 * Convenience helper used by `restoreCredential` in the env when the caller
 * did not name a specific vendor.
 */
export function findFabricHolding(
  credentialId: string,
  fabrics: readonly SyncFabric[],
): SyncFabric | null {
  for (const fabric of fabrics) {
    if (fabric.restore(credentialId)) return fabric;
  }
  return null;
}

/**
 * Guarded lookup for a fabric by vendor. Throws when the vendor is not
 * registered — the alternative (silent `undefined`) would let a caller
 * silently drop backups on the floor.
 */
export function requireFabric(
  fabrics: readonly SyncFabric[],
  vendor: SyncFabricVendor,
): SyncFabric {
  const found = fabrics.find((fabric) => fabric.vendor === vendor);
  if (!found) {
    throw new Error(
      `requireFabric: sync fabric vendor "${vendor}" is not registered on this env`,
    );
  }
  return found;
}
