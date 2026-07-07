import { platformEventName, type AxisStep, type AuthPlatform } from './types.js';

/**
 * Device-bound passkey axis — device bind + credential migration + sync fabric
 * verification + credProps.rk confirmation. Passkey credentials can be
 * device-bound (single-device) or synced across the vendor's sync fabric
 * (iCloud Keychain / Chrome Sync / Firefox Sync). The axis tracks bind state
 * and reconciles vendor-specific migration outcomes.
 */
export type PasskeyBindState =
  | 'idle'
  | 'device-bound'
  | 'sync-verified'
  | 'migrated'
  | 'credprops-confirmed';

export interface DevicePasskeySession {
  platform: AuthPlatform;
  credentialId: string;
  boundDeviceId: string;
  syncFabric: 'icloud' | 'chrome' | 'firefox' | 'none';
  state: PasskeyBindState;
  history: AxisStep<PasskeyBindState>[];
}

export function startDevicePasskey(input: {
  platform: AuthPlatform;
  credentialId: string;
  boundDeviceId: string;
  syncFabric?: DevicePasskeySession['syncFabric'];
}): DevicePasskeySession {
  return {
    platform: input.platform,
    credentialId: input.credentialId,
    boundDeviceId: input.boundDeviceId,
    syncFabric: input.syncFabric ?? 'none',
    state: 'idle',
    history: [],
  };
}

export function bindToDevice(session: DevicePasskeySession): AxisStep<PasskeyBindState> {
  if (session.state !== 'idle') {
    throw new Error(`bindToDevice: session is ${session.state}, expected idle`);
  }
  session.state = 'device-bound';
  const step: AxisStep<PasskeyBindState> = {
    neutralEvent: 'passkey.device-bound',
    platformEvent: platformEventName(session.platform, 'passkey.device-bound'),
    state: 'device-bound',
    platform: session.platform,
    metadata: {
      credentialId: session.credentialId,
      boundDeviceId: session.boundDeviceId,
      syncFabric: session.syncFabric,
    },
  };
  session.history.push(step);
  return step;
}

export function verifySyncFabric(session: DevicePasskeySession): AxisStep<PasskeyBindState> {
  if (session.state !== 'device-bound') {
    throw new Error(`verifySyncFabric: session is ${session.state}, expected device-bound`);
  }
  if (session.syncFabric === 'none') {
    throw new Error('verifySyncFabric: no sync fabric configured');
  }
  session.state = 'sync-verified';
  const step: AxisStep<PasskeyBindState> = {
    neutralEvent: 'passkey.sync-fabric-verified',
    platformEvent: platformEventName(session.platform, 'passkey.sync-fabric-verified'),
    state: 'sync-verified',
    platform: session.platform,
    metadata: {
      credentialId: session.credentialId,
      syncFabric: session.syncFabric,
    },
  };
  session.history.push(step);
  return step;
}

export function migrateCredential(
  session: DevicePasskeySession,
  input: { toDeviceId: string },
): AxisStep<PasskeyBindState> {
  if (session.state !== 'sync-verified' && session.state !== 'device-bound') {
    throw new Error(`migrateCredential: session is ${session.state}, cannot migrate`);
  }
  const fromDeviceId = session.boundDeviceId;
  session.boundDeviceId = input.toDeviceId;
  session.state = 'migrated';
  const step: AxisStep<PasskeyBindState> = {
    neutralEvent: 'passkey.credential-migrated',
    platformEvent: platformEventName(session.platform, 'passkey.credential-migrated'),
    state: 'migrated',
    platform: session.platform,
    metadata: {
      credentialId: session.credentialId,
      fromDeviceId,
      toDeviceId: input.toDeviceId,
    },
  };
  session.history.push(step);
  return step;
}

export function confirmCredProps(session: DevicePasskeySession): AxisStep<PasskeyBindState> {
  if (session.state === 'idle') {
    throw new Error('confirmCredProps: session is idle, bind first');
  }
  session.state = 'credprops-confirmed';
  const step: AxisStep<PasskeyBindState> = {
    neutralEvent: 'passkey.credprops-confirmed',
    platformEvent: platformEventName(session.platform, 'passkey.credprops-confirmed'),
    state: 'credprops-confirmed',
    platform: session.platform,
    metadata: {
      credentialId: session.credentialId,
      isResidentKey: true,
    },
  };
  session.history.push(step);
  return step;
}
