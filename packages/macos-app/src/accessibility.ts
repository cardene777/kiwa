import type { MacAppEnv, ViewNode } from './env.js';

export type AccessibilityRole =
  | 'AXWindow'
  | 'AXGroup'
  | 'AXStaticText'
  | 'AXButton'
  | 'AXTextField'
  | 'AXCheckBox'
  | 'AXImage'
  | 'AXUnknown';

export interface AccessibilityNode {
  id: string;
  role: AccessibilityRole;
  label: string | undefined;
  value: string | undefined;
  enabled: boolean;
  children: AccessibilityNode[];
}

export interface AccessibilityTree {
  root: AccessibilityNode;
  totalNodes: number;
  capturedAt: number;
}

/**
 * SwiftUI / AppKit view tree を macOS accessibility API (AXUIElement) が返す tree に
 * mapping。 tree walk 済み snapshot を返し、 user assert (label 存在 / role 一致 /
 * total node 数) を可能にする。 実 AX API は起動せず view attributes から機械的に role を
 * 推定する。
 */
export function captureAccessibilityTree(env: MacAppEnv): AccessibilityTree {
  let count = 0;
  const walk = (node: ViewNode): AccessibilityNode => {
    count += 1;
    const children = node.children.map(walk);
    const result: AccessibilityNode = {
      id: node.id,
      role: mapRole(node.type),
      label: node.label,
      value: node.value,
      enabled: node.enabled,
      children,
    };
    return result;
  };
  const root = walk(env.rootView);
  return { root, totalNodes: count, capturedAt: env.now() };
}

function mapRole(type: string): AccessibilityRole {
  if (/Button/i.test(type)) return 'AXButton';
  if (/TextField|TextInput/i.test(type)) return 'AXTextField';
  if (/Text|Label/i.test(type)) return 'AXStaticText';
  if (/Image/i.test(type)) return 'AXImage';
  if (/Checkbox|CheckBox|Toggle/i.test(type)) return 'AXCheckBox';
  if (/Window/i.test(type)) return 'AXWindow';
  if (/Stack|VStack|HStack|Group|NSView/i.test(type)) return 'AXGroup';
  return 'AXUnknown';
}
