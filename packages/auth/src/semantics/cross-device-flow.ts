import { platformEventName, type AxisStep, type AuthPlatform } from './types.js';

/**
 * Cross-device flow axis — CTAP2 hybrid transport (caBLE) for authenticating
 * on a device that lacks the credential (e.g. desktop browser signing in
 * with phone-bound passkey). Flow: RP generates QR → user scans on phone
 * → BLE proximity check → tunnel opened → handshake completes.
 */
export type CrossDeviceState =
  | 'idle'
  | 'qr-generated'
  | 'ble-paired'
  | 'tunnel-opened'
  | 'handshake-completed';

export interface CrossDeviceSession {
  platform: AuthPlatform;
  requestId: string;
  qrPayload: string;
  bleAdvKey: string;
  state: CrossDeviceState;
  history: AxisStep<CrossDeviceState>[];
}

export function startCrossDevice(input: {
  platform: AuthPlatform;
  requestId: string;
}): CrossDeviceSession {
  return {
    platform: input.platform,
    requestId: input.requestId,
    qrPayload: '',
    bleAdvKey: '',
    state: 'idle',
    history: [],
  };
}

export function generateQr(
  session: CrossDeviceSession,
  input: { qrPayload: string },
): AxisStep<CrossDeviceState> {
  if (session.state !== 'idle') {
    throw new Error(`generateQr: session is ${session.state}, expected idle`);
  }
  session.qrPayload = input.qrPayload;
  session.state = 'qr-generated';
  const step: AxisStep<CrossDeviceState> = {
    neutralEvent: 'cross-device.qr-generated',
    platformEvent: platformEventName(session.platform, 'cross-device.qr-generated'),
    state: 'qr-generated',
    platform: session.platform,
    metadata: { requestId: session.requestId, qrPayload: input.qrPayload },
  };
  session.history.push(step);
  return step;
}

export function pairBle(
  session: CrossDeviceSession,
  input: { bleAdvKey: string; rssi: number },
): AxisStep<CrossDeviceState> {
  if (session.state !== 'qr-generated') {
    throw new Error(`pairBle: session is ${session.state}, expected qr-generated`);
  }
  session.bleAdvKey = input.bleAdvKey;
  session.state = 'ble-paired';
  const step: AxisStep<CrossDeviceState> = {
    neutralEvent: 'cross-device.ble-paired',
    platformEvent: platformEventName(session.platform, 'cross-device.ble-paired'),
    state: 'ble-paired',
    platform: session.platform,
    metadata: {
      requestId: session.requestId,
      bleAdvKey: input.bleAdvKey,
      rssi: input.rssi,
    },
  };
  session.history.push(step);
  return step;
}

export function openTunnel(
  session: CrossDeviceSession,
  input: { tunnelUrl: string },
): AxisStep<CrossDeviceState> {
  if (session.state !== 'ble-paired') {
    throw new Error(`openTunnel: session is ${session.state}, expected ble-paired`);
  }
  session.state = 'tunnel-opened';
  const step: AxisStep<CrossDeviceState> = {
    neutralEvent: 'cross-device.tunnel-opened',
    platformEvent: platformEventName(session.platform, 'cross-device.tunnel-opened'),
    state: 'tunnel-opened',
    platform: session.platform,
    metadata: {
      requestId: session.requestId,
      tunnelUrl: input.tunnelUrl,
    },
  };
  session.history.push(step);
  return step;
}

export function completeHandshake(
  session: CrossDeviceSession,
  input: { assertionSignature: string },
): AxisStep<CrossDeviceState> {
  if (session.state !== 'tunnel-opened') {
    throw new Error(`completeHandshake: session is ${session.state}, expected tunnel-opened`);
  }
  session.state = 'handshake-completed';
  const step: AxisStep<CrossDeviceState> = {
    neutralEvent: 'cross-device.handshake-completed',
    platformEvent: platformEventName(session.platform, 'cross-device.handshake-completed'),
    state: 'handshake-completed',
    platform: session.platform,
    metadata: {
      requestId: session.requestId,
      assertionSignature: input.assertionSignature,
    },
  };
  session.history.push(step);
  return step;
}
