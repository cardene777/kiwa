import { semantics } from '@kiwa/auth';
const {
  bindToDevice,
  completeHandshake,
  confirmCredProps,
  generateQr,
  openTunnel,
  pairBle,
  selectAutofill,
  showHint,
  startConditionalUi,
  startCrossDevice,
  startDevicePasskey,
  verifySyncFabric,
} = semantics;
type ConditionalUiSession = semantics.ConditionalUiSession;
type CrossDeviceSession = semantics.CrossDeviceSession;
type DevicePasskeySession = semantics.DevicePasskeySession;
import type {
  AuthPasswordlessAdapter,
  AuthPlatform,
  UxSession,
  UxStep,
} from './interface.js';

interface MockContext {
  devicePasskeys: Map<string, DevicePasskeySession>;
  conditionalUis: Map<string, ConditionalUiSession>;
  crossDevices: Map<string, CrossDeviceSession>;
  ops: number;
}

export function makeMockAdapter(): AuthPasswordlessAdapter {
  const ctx: MockContext = {
    devicePasskeys: new Map(),
    conditionalUis: new Map(),
    crossDevices: new Map(),
    ops: 0,
  };
  const newSession = (prefix: string, platform: AuthPlatform, userId: string): UxSession => {
    ctx.ops++;
    return { sessionId: `${prefix}-${ctx.ops}`, platform, userId };
  };
  return {
    startDeviceBound: async ({ platform, userId, credentialId, deviceId }) => {
      const s = newSession('dev', platform, userId);
      ctx.devicePasskeys.set(
        s.sessionId,
        startDevicePasskey({
          platform,
          credentialId,
          boundDeviceId: deviceId,
          syncFabric:
            platform === 'chromium' ? 'chrome' : platform === 'webkit' ? 'icloud' : 'firefox',
        }),
      );
      return s;
    },
    bindDevice: async (session, { deviceId }) => {
      const machine = ctx.devicePasskeys.get(session.sessionId);
      if (!machine) throw new Error(`bindDevice: unknown sessionId ${session.sessionId}`);
      const step = bindToDevice(machine);
      return {
        op: 'bindDevice',
        outcome: 'success',
        metadata: { deviceId, neutralEvent: step.neutralEvent },
      } satisfies UxStep;
    },
    verifyBinding: async (session) => {
      const machine = ctx.devicePasskeys.get(session.sessionId);
      if (!machine) throw new Error(`verifyBinding: unknown sessionId ${session.sessionId}`);
      verifySyncFabric(machine);
      const step = confirmCredProps(machine);
      return {
        op: 'verifyBinding',
        outcome: 'success',
        metadata: { neutralEvent: step.neutralEvent, state: machine.state },
      };
    },
    closeDeviceBound: async (session) => {
      ctx.devicePasskeys.delete(session.sessionId);
    },
    startConditionalUiFlow: async ({ platform, userId, formId }) => {
      const s = newSession('ui', platform, userId);
      ctx.conditionalUis.set(s.sessionId, startConditionalUi({ platform, formId }));
      return s;
    },
    showAutofillHint: async (session) => {
      const machine = ctx.conditionalUis.get(session.sessionId);
      if (!machine) throw new Error(`showAutofillHint: unknown sessionId ${session.sessionId}`);
      const step = showHint(machine);
      return {
        op: 'showAutofillHint',
        outcome: 'success',
        metadata: { neutralEvent: step.neutralEvent },
      };
    },
    completeAutofill: async (session, { credentialId, elapsedMs }) => {
      const machine = ctx.conditionalUis.get(session.sessionId);
      if (!machine) throw new Error(`completeAutofill: unknown sessionId ${session.sessionId}`);
      const step = selectAutofill(machine, { credentialId, elapsedMs });
      return {
        op: 'completeAutofill',
        outcome: 'success',
        metadata: { credentialId, elapsedMs, neutralEvent: step.neutralEvent },
      };
    },
    closeConditionalUi: async (session) => {
      ctx.conditionalUis.delete(session.sessionId);
    },
    startCrossDeviceFlow: async ({ platform, userId, requestId }) => {
      const s = newSession('xdev', platform, userId);
      ctx.crossDevices.set(s.sessionId, startCrossDevice({ platform, requestId }));
      return s;
    },
    emitQrForCrossDevice: async (session, { qrPayload }) => {
      const machine = ctx.crossDevices.get(session.sessionId);
      if (!machine) throw new Error(`emitQrForCrossDevice: unknown sessionId ${session.sessionId}`);
      const step = generateQr(machine, { qrPayload });
      pairBle(machine, { bleAdvKey: 'k-1', rssi: -60 });
      openTunnel(machine, { tunnelUrl: 'wss://caBLE.example/tunnel' });
      return {
        op: 'emitQrForCrossDevice',
        outcome: 'success',
        metadata: { qrPayload, neutralEvent: step.neutralEvent },
      };
    },
    completeCrossDevice: async (session, { assertionSignature }) => {
      const machine = ctx.crossDevices.get(session.sessionId);
      if (!machine) throw new Error(`completeCrossDevice: unknown sessionId ${session.sessionId}`);
      const step = completeHandshake(machine, { assertionSignature });
      return {
        op: 'completeCrossDevice',
        outcome: 'success',
        metadata: { assertionSignature, neutralEvent: step.neutralEvent },
      };
    },
    closeCrossDevice: async (session) => {
      ctx.crossDevices.delete(session.sessionId);
    },
  };
}
