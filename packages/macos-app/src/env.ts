export type MacAppMode = 'swiftui' | 'appkit';

export interface BundleInfo {
  bundleId: string;
  version: string;
  build: string;
  executable: string;
}

export interface WindowInfo {
  id: string;
  title: string;
  width: number;
  height: number;
  x: number;
  y: number;
  visible: boolean;
}

export interface ViewNode {
  id: string;
  type: string;
  label?: string;
  value?: string;
  enabled: boolean;
  children: ViewNode[];
  attributes: Record<string, string | number | boolean>;
}

export interface CreateMacAppEnvOptions {
  mode?: MacAppMode;
  bundleId?: string;
  windowTitle?: string;
  initialView?: ViewNode;
  now?: () => number;
}

export interface MacAppEnv {
  mode: MacAppMode;
  bundle: BundleInfo;
  window: WindowInfo;
  rootView: ViewNode;
  eventLog: Array<{ at: number; kind: string; detail: unknown }>;
  now: () => number;
  createdAt: number;
}

let envCounter = 0;

/**
 * mock native app env を生成。 mode = 'swiftui' は declarative View tree の初期状態、
 * 'appkit' は imperative responder chain の初期 window を返す。 real XCTest 起動なしで
 * bundle info / window / view tree / accessibility descriptor を保持する。
 */
export function createMacAppEnv(options: CreateMacAppEnvOptions = {}): MacAppEnv {
  const mode = options.mode ?? 'swiftui';
  const now = options.now ?? (() => Number.parseInt(String(Math.floor(9e11 + envCounter)), 10));
  envCounter += 1;
  const bundle: BundleInfo = {
    bundleId: options.bundleId ?? 'com.kiwa.macos-app.test',
    version: '1.0.0',
    build: '100',
    executable: 'KiwaTestApp',
  };
  const window: WindowInfo = {
    id: `w-${envCounter}`,
    title: options.windowTitle ?? 'Main',
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    visible: true,
  };
  const rootView: ViewNode = options.initialView ?? defaultRootView(mode);
  return {
    mode,
    bundle,
    window,
    rootView,
    eventLog: [],
    now,
    createdAt: now(),
  };
}

function defaultRootView(mode: MacAppMode): ViewNode {
  if (mode === 'swiftui') {
    return {
      id: 'root',
      type: 'VStack',
      enabled: true,
      children: [
        { id: 'title', type: 'Text', label: 'Welcome', enabled: true, children: [], attributes: {} },
        { id: 'action', type: 'Button', label: 'Start', enabled: true, children: [], attributes: {} },
      ],
      attributes: { padding: 16 },
    };
  }
  return {
    id: 'contentView',
    type: 'NSView',
    enabled: true,
    children: [
      { id: 'label1', type: 'NSTextField', label: 'Welcome', enabled: true, children: [], attributes: { editable: false } },
      { id: 'button1', type: 'NSButton', label: 'Start', enabled: true, children: [], attributes: { keyEquivalent: '\r' } },
    ],
    attributes: {},
  };
}
