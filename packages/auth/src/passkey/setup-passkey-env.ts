import {
  __resetAuthenticatorCounter,
} from '../webauthn/authenticator.js';
import {
  __resetCredentialCounter,
  credentialCreation,
} from '../webauthn/creation.js';
import { credentialAssertion } from '../webauthn/assertion.js';
import type {
  AuthenticatorAssertionResponse,
  AuthenticatorAttestationResponse,
  PublicKeyCredentialCreationOptionsInit,
  PublicKeyCredentialRequestOptionsInit,
  VirtualAuthenticator,
  WebAuthnCredential,
} from '../webauthn/types.js';
import {
  backupCredential as backupPure,
  requireFabric,
  syncCredentials as syncPure,
} from './credential-sync.js';
import { __resetCaBLESessionCounter } from './caBLE/qr-code.js';
import { createPlatformAuthenticator } from './platform.js';
import { createRoamingAuthenticator } from './roaming.js';
import { createSyncFabric } from './sync-fabric.js';
import type {
  PasskeyCredential,
  PasskeyTestEnv,
  PlatformAuthenticator,
  PlatformAuthenticatorOptions,
  RoamingAuthenticator,
  RoamingAuthenticatorOptions,
  SetupPasskeyEnvOptions,
  SyncFabric,
  SyncFabricVendor,
} from './types.js';

/**
 * Reset the module-scoped counters imported from the WebAuthn base module so
 * consecutive `setupPasskeyEnv` calls hand out stable, deterministic ids.
 */
export function __resetPasskeyCounters(): void {
  __resetAuthenticatorCounter();
  __resetCredentialCounter();
  __resetCaBLESessionCounter();
}

/**
 * Sentinel for `syncedFabrics` on a fresh credential. Kept as a module-scope
 * constant so every default reads from the same immutable literal — cheaper
 * to share than to allocate a fresh empty array on every credentialCreation.
 */
const EMPTY_SYNCED_FABRICS: readonly SyncFabricVendor[] = Object.freeze([]);

interface DeviceState {
  deviceId: string;
  // authenticatorId -> handle. Ordered to preserve add-order for default
  // pick semantics ("first authenticator added is the default").
  authenticators: (PlatformAuthenticator | RoamingAuthenticator)[];
  // authenticatorId -> credential store the WebAuthn base module writes into.
  credentialStores: Map<string, Map<string, WebAuthnCredential>>;
}

/**
 * Set up the passkey test environment. Composes WebAuthn primitives with
 * per-device grouping and sync fabric wiring — every device has its own set
 * of authenticators and credential stores, and every credential lives on
 * exactly one device unless it has been synced through a fabric.
 *
 * The env owns the WebAuthn base-module state (global registry, ownership
 * map) so a single `stop()` disposes the whole graph and consecutive
 * `setupPasskeyEnv` calls are hermetic when preceded by
 * `__resetPasskeyCounters()`.
 */
export async function setupPasskeyEnv(
  opts: SetupPasskeyEnvOptions = {},
): Promise<PasskeyTestEnv> {
  const devices = new Map<string, DeviceState>();
  // Shared across every device — mirrors the base WebAuthn env's registry so
  // credentialAssertion can locate a credential regardless of which device
  // holds it. Per-user isolation is enforced by `restoreCredential` at the
  // passkey layer.
  const globalRegistry = new Map<string, WebAuthnCredential>();
  // credentialId -> authenticatorId. Assertion routes through the owning
  // authenticator so a credential does not float between siblings.
  const credentialOwnership = new Map<string, string>();
  // Passkey-level metadata (sync fabrics, origin device, user id) keyed
  // by credentialId. Kept separate from the base WebAuthn record so the
  // shape a real RP round-trips (`WebAuthnCredential`) stays lean.
  const passkeyMetadata = new Map<
    string,
    {
      originDeviceId: string;
      userId: string;
      syncedFabrics: SyncFabricVendor[];
      syncEpoch: number;
      backupEligible: boolean;
    }
  >();

  const fabricVendors = opts.fabrics ?? [
    'icloud-keychain',
    'google-password-manager',
  ];
  const fabrics: SyncFabric[] = fabricVendors.map((vendor) =>
    createSyncFabric(vendor),
  );

  function ensureDevice(deviceId: string): DeviceState {
    const device = devices.get(deviceId);
    if (!device) {
      throw new Error(
        `setupPasskeyEnv: unknown deviceId "${deviceId}" — call addDevice first or preseed via options.devices`,
      );
    }
    return device;
  }

  function collectAuthenticators(): VirtualAuthenticator[] {
    const all: VirtualAuthenticator[] = [];
    for (const device of devices.values()) {
      for (const auth of device.authenticators) {
        all.push(auth);
      }
    }
    return all;
  }

  function toPasskeyCredential(
    credentialId: string,
  ): PasskeyCredential {
    const base = globalRegistry.get(credentialId);
    if (!base) {
      throw new Error(
        `setupPasskeyEnv: credential "${credentialId}" is not registered on any device`,
      );
    }
    const meta = passkeyMetadata.get(credentialId);
    if (!meta) {
      throw new Error(
        `setupPasskeyEnv: passkey metadata missing for credential "${credentialId}" — was it minted through createPasskey?`,
      );
    }
    return {
      ...base,
      originDeviceId: meta.originDeviceId,
      userId: meta.userId,
      syncedFabrics: [...meta.syncedFabrics],
      syncEpoch: meta.syncEpoch,
      backupEligible: meta.backupEligible,
    };
  }

  function addDevice(deviceId: string): void {
    if (devices.has(deviceId)) {
      throw new Error(
        `setupPasskeyEnv: device "${deviceId}" is already registered`,
      );
    }
    devices.set(deviceId, {
      deviceId,
      authenticators: [],
      credentialStores: new Map(),
    });
  }

  function addPlatformAuthenticator(
    deviceId: string,
    options: PlatformAuthenticatorOptions,
  ): PlatformAuthenticator {
    const device = ensureDevice(deviceId);
    const { handle, credentials } = createPlatformAuthenticator(options);
    device.authenticators.push(handle);
    device.credentialStores.set(handle.id, credentials);
    return handle;
  }

  function addRoamingAuthenticator(
    deviceId: string,
    options: RoamingAuthenticatorOptions,
  ): RoamingAuthenticator {
    const device = ensureDevice(deviceId);
    const { handle, credentials } = createRoamingAuthenticator(options);
    device.authenticators.push(handle);
    device.credentialStores.set(handle.id, credentials);
    return handle;
  }

  function pickAuthenticator(
    device: DeviceState,
    authenticatorId: string | undefined,
  ): PlatformAuthenticator | RoamingAuthenticator {
    if (device.authenticators.length === 0) {
      throw new Error(
        `setupPasskeyEnv: device "${device.deviceId}" has no authenticator — call addPlatformAuthenticator or addRoamingAuthenticator first`,
      );
    }
    if (authenticatorId) {
      const found = device.authenticators.find(
        (auth) => auth.id === authenticatorId,
      );
      if (!found) {
        throw new Error(
          `setupPasskeyEnv: authenticator "${authenticatorId}" is not registered on device "${device.deviceId}"`,
        );
      }
      return found;
    }
    // Default = first authenticator added on the device. Mirrors the "one
    // platform authenticator per device" common case.
    return device.authenticators[0]!;
  }

  function removeDevice(deviceId: string): void {
    const device = devices.get(deviceId);
    if (!device) return;
    for (const store of device.credentialStores.values()) {
      for (const credentialId of store.keys()) {
        globalRegistry.delete(credentialId);
        credentialOwnership.delete(credentialId);
        passkeyMetadata.delete(credentialId);
      }
    }
    devices.delete(deviceId);
  }

  async function createPasskey(
    deviceId: string,
    userId: string,
    options: PublicKeyCredentialCreationOptionsInit,
    authenticatorId?: string,
  ): Promise<AuthenticatorAttestationResponse> {
    const device = ensureDevice(deviceId);
    const authenticator = pickAuthenticator(device, authenticatorId);
    const store = device.credentialStores.get(authenticator.id)!;
    // Passkeys require discoverable credentials — force residentKey=required
    // if the caller did not already set it. A caller that explicitly asks for
    // residentKey=discouraged gets an error from the base WebAuthn layer via
    // the residentKey vs hasResidentKey check.
    const selection = options.authenticatorSelection ?? {};
    const enriched: PublicKeyCredentialCreationOptionsInit = {
      ...options,
      authenticatorSelection: {
        residentKey: selection.residentKey ?? 'required',
        userVerification: selection.userVerification ?? 'required',
        ...(selection.authenticatorAttachment === undefined
          ? {}
          : { authenticatorAttachment: selection.authenticatorAttachment }),
        ...(selection.requireResidentKey === undefined
          ? {}
          : { requireResidentKey: selection.requireResidentKey }),
      },
    };
    const response = credentialCreation(
      enriched,
      authenticator,
      store,
      globalRegistry,
      credentialOwnership,
    );
    // Backup-eligibility mirrors the FIDO Alliance CTAP 2.2 Passkey Provider
    // spec — a credential is backup-eligible when it lives on a device that
    // can round-trip the private-key material through a sync fabric. Platform
    // authenticators are always backup-eligible; roaming authenticators are
    // backup-eligible only when the caller explicitly asked for a resident
    // key on a phone-kind roaming authenticator (bare security keys stay
    // device-bound).
    const backupEligible =
      authenticator.kind === 'platform'
        ? true
        : authenticator.roamingKind === 'phone' && authenticator.hasResidentKey;
    passkeyMetadata.set(response.credentialId, {
      originDeviceId: deviceId,
      userId,
      syncedFabrics: [...EMPTY_SYNCED_FABRICS],
      syncEpoch: 0,
      backupEligible,
    });
    return response;
  }

  async function authenticate(
    deviceId: string,
    options: PublicKeyCredentialRequestOptionsInit,
  ): Promise<AuthenticatorAssertionResponse> {
    const device = ensureDevice(deviceId);
    // Only route through authenticators actually registered on this device
    // so a passkey held elsewhere cannot sign an assertion here. Mirrors
    // the "credential must live where the assertion is issued" property.
    return credentialAssertion(
      options,
      globalRegistry,
      device.authenticators,
      credentialOwnership,
    );
  }

  function backupCredential(
    credentialId: string,
    vendor: SyncFabricVendor,
  ): PasskeyCredential {
    const passkey = toPasskeyCredential(credentialId);
    const fabric = requireFabric(fabrics, vendor);
    const updated = backupPure(passkey, fabric);
    // Persist the epoch bump + syncedFabrics addition into the env-side
    // metadata so subsequent restore / list calls see the new state.
    passkeyMetadata.set(credentialId, {
      originDeviceId: updated.originDeviceId,
      userId: updated.userId,
      syncedFabrics: [...updated.syncedFabrics],
      syncEpoch: updated.syncEpoch,
      backupEligible: updated.backupEligible,
    });
    return updated;
  }

  function restoreCredential(
    targetDeviceId: string,
    userId: string,
    credentialId: string,
    vendor: SyncFabricVendor,
  ): PasskeyCredential {
    const targetDevice = ensureDevice(targetDeviceId);
    const fabric = requireFabric(fabrics, vendor);
    const blob = fabric.restore(credentialId);
    if (!blob) {
      throw new Error(
        `restoreCredential: fabric "${vendor}" does not hold credential "${credentialId}" — call backupCredential first`,
      );
    }
    if (blob.userId !== userId) {
      throw new Error(
        `restoreCredential: credential "${credentialId}" belongs to user "${blob.userId}" — user "${userId}" cannot restore it`,
      );
    }
    if (targetDevice.authenticators.length === 0) {
      throw new Error(
        `restoreCredential: device "${targetDeviceId}" has no authenticator to host the restored credential`,
      );
    }
    // Register the restored credential on the target device's default
    // authenticator. Real fabrics let the user pick the destination —
    // matching that here would require an extra parameter but the mock's
    // "first authenticator wins" default keeps the common case ergonomic.
    const hostAuthenticator = targetDevice.authenticators[0]!;
    const hostStore = targetDevice.credentialStores.get(hostAuthenticator.id)!;
    const restored: WebAuthnCredential = {
      credentialId: blob.credentialId,
      userHandle: blob.userHandle,
      publicKey: blob.publicKey,
      // Reset signCount to the fabric-known value so a subsequent
      // assertion on the target device produces a monotonic increment
      // from where the source device left off.
      signCount: blob.signCount,
      transports: [hostAuthenticator.transport],
      attachment: hostAuthenticator.attachment,
      discoverable: blob.discoverable,
      createdAt: blob.createdAt,
      ...(blob.lastUsedAt === undefined ? {} : { lastUsedAt: blob.lastUsedAt }),
    };
    hostStore.set(blob.credentialId, restored);
    globalRegistry.set(blob.credentialId, restored);
    credentialOwnership.set(blob.credentialId, hostAuthenticator.id);
    passkeyMetadata.set(blob.credentialId, {
      originDeviceId: blob.originDeviceId,
      userId: blob.userId,
      syncedFabrics: [...blob.syncedFabrics],
      syncEpoch: blob.syncEpoch,
      backupEligible: blob.backupEligible,
    });
    return toPasskeyCredential(blob.credentialId);
  }

  function syncCredentials(
    sourceDeviceId: string,
    targetDeviceId: string,
    userId: string,
    vendor: SyncFabricVendor,
  ): PasskeyCredential[] {
    const sourceDevice = ensureDevice(sourceDeviceId);
    ensureDevice(targetDeviceId);
    const fabric = requireFabric(fabrics, vendor);
    const sourcePasskeys: PasskeyCredential[] = [];
    for (const store of sourceDevice.credentialStores.values()) {
      for (const credentialId of store.keys()) {
        try {
          sourcePasskeys.push(toPasskeyCredential(credentialId));
        } catch {
          // Skip non-passkey WebAuthn credentials (should not happen through
          // the passkey env, but stays defensive if the caller mutated the
          // base map).
        }
      }
    }
    return syncPure(sourcePasskeys, userId, fabric, (pulled) =>
      restoreCredential(targetDeviceId, userId, pulled.credentialId, vendor),
    );
  }

  for (const deviceOpts of opts.devices ?? []) {
    addDevice(deviceOpts.deviceId);
    if (deviceOpts.platform) {
      addPlatformAuthenticator(deviceOpts.deviceId, deviceOpts.platform);
    }
    if (deviceOpts.roaming) {
      addRoamingAuthenticator(deviceOpts.deviceId, deviceOpts.roaming);
    }
  }

  const env: PasskeyTestEnv = {
    mode: 'mock',
    get devices(): readonly string[] {
      return Array.from(devices.keys());
    },
    get fabrics(): readonly SyncFabric[] {
      return fabrics;
    },
    addDevice,
    removeDevice,
    addPlatformAuthenticator,
    addRoamingAuthenticator,
    listAuthenticators(deviceId: string) {
      const device = ensureDevice(deviceId);
      return device.authenticators.slice();
    },
    createPasskey,
    authenticate,
    getPasskey(credentialId: string): PasskeyCredential | null {
      if (!globalRegistry.has(credentialId)) return null;
      try {
        return toPasskeyCredential(credentialId);
      } catch {
        return null;
      }
    },
    listPasskeys(): PasskeyCredential[] {
      const out: PasskeyCredential[] = [];
      for (const credentialId of globalRegistry.keys()) {
        try {
          out.push(toPasskeyCredential(credentialId));
        } catch {
          // Base WebAuthn credential without passkey metadata — skip.
        }
      }
      return out;
    },
    fabric(vendor: SyncFabricVendor): SyncFabric {
      return requireFabric(fabrics, vendor);
    },
    backupCredential,
    restoreCredential,
    syncCredentials,
    reset(): void {
      globalRegistry.clear();
      credentialOwnership.clear();
      passkeyMetadata.clear();
      for (const device of devices.values()) {
        for (const store of device.credentialStores.values()) {
          store.clear();
        }
      }
      for (const fabric of fabrics) {
        fabric.clear();
      }
    },
    async stop(): Promise<void> {
      globalRegistry.clear();
      credentialOwnership.clear();
      passkeyMetadata.clear();
      devices.clear();
      for (const fabric of fabrics) {
        fabric.clear();
      }
    },
  };

  return env;
}
