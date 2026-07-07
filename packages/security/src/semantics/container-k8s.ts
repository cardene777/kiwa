import {
  providerAdvEventName,
  type AxisAdvStep,
  type NeutralAdvEventName,
  type SecurityAdvTarget,
} from './types.js';

/**
 * Container / Kubernetes security axis — Pod Security Standard enforcement +
 * NetworkPolicy application + Admission Controller (Gatekeeper / Kyverno) decision
 * state machine。
 *
 * Deterministic mock で 3 signal 系統 + 2 admission verdict を提供。 real driver
 * 経路では OPA Gatekeeper に対して webhook を発火する。
 */

export type PodSecurityLevel = 'privileged' | 'baseline' | 'restricted';

export type K8sState =
  | 'idle'
  | 'pod-security-enforced'
  | 'network-policy-applied'
  | 'admission-decided';

export interface K8sSession {
  target: SecurityAdvTarget;
  sessionId: string;
  state: K8sState;
  history: AxisAdvStep<K8sState>[];
  enforcedLevel: PodSecurityLevel | null;
}

export interface PodSpec {
  namespace: string;
  runAsRoot: boolean;
  privileged: boolean;
  allowPrivilegeEscalation: boolean;
  hostNetwork: boolean;
  hostPid: boolean;
}

export interface NetworkPolicySpec {
  namespace: string;
  podSelector: Record<string, string>;
  ingressFromNamespaces: string[];
  egressToNamespaces: string[];
}

export interface AdmissionRequest {
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: 'Pod' | 'Deployment' | 'Service' | 'ConfigMap';
  namespace: string;
  labels: Record<string, string>;
}

export function startK8sSession(input: {
  target: SecurityAdvTarget;
  sessionId: string;
}): K8sSession {
  if (input.sessionId.length === 0) {
    throw new Error('startK8sSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    enforcedLevel: null,
  };
}

export function enforcePodSecurity(
  session: K8sSession,
  level: PodSecurityLevel,
  pod: PodSpec,
): AxisAdvStep<K8sState> {
  if (session.state !== 'idle' && session.state !== 'pod-security-enforced') {
    throw new Error(`enforcePodSecurity: session is ${session.state}`);
  }
  const violations: string[] = [];
  if (level === 'restricted') {
    if (pod.runAsRoot) violations.push('runAsRoot');
    if (pod.privileged) violations.push('privileged');
    if (pod.allowPrivilegeEscalation) violations.push('allowPrivilegeEscalation');
    if (pod.hostNetwork) violations.push('hostNetwork');
    if (pod.hostPid) violations.push('hostPid');
  } else if (level === 'baseline') {
    if (pod.privileged) violations.push('privileged');
    if (pod.hostNetwork) violations.push('hostNetwork');
    if (pod.hostPid) violations.push('hostPid');
  }
  session.enforcedLevel = level;
  session.state = 'pod-security-enforced';
  return emit(session, 'k8s.pod_security_enforced', {
    namespace: pod.namespace,
    level,
    violationCount: violations.length,
    passed: violations.length === 0,
  });
}

export function applyNetworkPolicy(
  session: K8sSession,
  policy: NetworkPolicySpec,
): AxisAdvStep<K8sState> {
  if (session.state !== 'pod-security-enforced') {
    throw new Error('applyNetworkPolicy: pod security must be enforced first');
  }
  if (Object.keys(policy.podSelector).length === 0) {
    throw new Error('applyNetworkPolicy: podSelector must not be empty');
  }
  session.state = 'network-policy-applied';
  return emit(session, 'k8s.network_policy_applied', {
    namespace: policy.namespace,
    selectorLen: Object.keys(policy.podSelector).length,
    ingressCount: policy.ingressFromNamespaces.length,
    egressCount: policy.egressToNamespaces.length,
  });
}

export function decideAdmission(
  session: K8sSession,
  request: AdmissionRequest,
  input: { requireLabel: string; allowedNamespaces: string[] },
): AxisAdvStep<K8sState> {
  if (session.state !== 'network-policy-applied') {
    throw new Error('decideAdmission: network policy must be applied first');
  }
  const hasLabel = Object.keys(request.labels).includes(input.requireLabel);
  const nsAllowed = input.allowedNamespaces.includes(request.namespace);
  const allowed = hasLabel && nsAllowed;
  session.state = 'admission-decided';
  const neutral: NeutralAdvEventName = allowed ? 'k8s.admission_allowed' : 'k8s.admission_denied';
  return emit(session, neutral, {
    operation: request.operation,
    resource: request.resource,
    namespace: request.namespace,
    hasRequiredLabel: hasLabel,
    namespaceAllowed: nsAllowed,
    allowed,
  });
}

function emit(
  session: K8sSession,
  neutral: NeutralAdvEventName,
  metadata: Record<string, string | number | boolean>,
): AxisAdvStep<K8sState> {
  const step: AxisAdvStep<K8sState> = {
    neutralEvent: neutral,
    providerEvent: providerAdvEventName(session.target, neutral),
    state: session.state,
    timestampMs: session.history.length + 1,
    metadata,
  };
  session.history.push(step);
  return step;
}
