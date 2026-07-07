import { describe, expect, it } from 'vitest';
import {
  applyNetworkPolicy,
  decideAdmission,
  enforcePodSecurity,
  startK8sSession,
} from '../../src/semantics/index.js';

describe('startK8sSession', () => {
  it('creates idle session', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    expect(s.state).toBe('idle');
    expect(s.enforcedLevel).toBeNull();
  });

  it('throws when sessionId is empty', () => {
    expect(() => startK8sSession({ target: 'opa', sessionId: '' })).toThrow(
      'sessionId must not be empty',
    );
  });
});

describe('enforcePodSecurity', () => {
  const cleanPod = {
    namespace: 'prod',
    runAsRoot: false,
    privileged: false,
    allowPrivilegeEscalation: false,
    hostNetwork: false,
    hostPid: false,
  };

  it('passes restricted with clean pod', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    const step = enforcePodSecurity(s, 'restricted', cleanPod);
    expect(step.metadata['passed']).toBe(true);
    expect(s.enforcedLevel).toBe('restricted');
    expect(s.state).toBe('pod-security-enforced');
  });

  it('fails restricted with privileged pod', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    const step = enforcePodSecurity(s, 'restricted', {
      ...cleanPod,
      privileged: true,
    });
    expect(step.metadata['passed']).toBe(false);
    expect(step.metadata['violationCount']).toBe(1);
  });

  it('fails restricted with root user', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    const step = enforcePodSecurity(s, 'restricted', {
      ...cleanPod,
      runAsRoot: true,
    });
    expect(step.metadata['passed']).toBe(false);
  });

  it('baseline allows runAsRoot but not privileged', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    const step = enforcePodSecurity(s, 'baseline', {
      ...cleanPod,
      runAsRoot: true,
    });
    expect(step.metadata['passed']).toBe(true);
  });

  it('baseline rejects hostNetwork', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    const step = enforcePodSecurity(s, 'baseline', {
      ...cleanPod,
      hostNetwork: true,
    });
    expect(step.metadata['passed']).toBe(false);
  });

  it('privileged level always passes', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    const step = enforcePodSecurity(s, 'privileged', {
      ...cleanPod,
      privileged: true,
      hostNetwork: true,
    });
    expect(step.metadata['passed']).toBe(true);
  });
});

describe('applyNetworkPolicy', () => {
  const setup = (s: ReturnType<typeof startK8sSession>) =>
    enforcePodSecurity(s, 'restricted', {
      namespace: 'prod',
      runAsRoot: false,
      privileged: false,
      allowPrivilegeEscalation: false,
      hostNetwork: false,
      hostPid: false,
    });

  it('applies policy with selector and rules', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    setup(s);
    const step = applyNetworkPolicy(s, {
      namespace: 'prod',
      podSelector: { app: 'api' },
      ingressFromNamespaces: ['frontend'],
      egressToNamespaces: ['db'],
    });
    expect(step.metadata['ingressCount']).toBe(1);
    expect(step.metadata['egressCount']).toBe(1);
    expect(s.state).toBe('network-policy-applied');
  });

  it('rejects empty selector', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    setup(s);
    expect(() =>
      applyNetworkPolicy(s, {
        namespace: 'prod',
        podSelector: {},
        ingressFromNamespaces: [],
        egressToNamespaces: [],
      }),
    ).toThrow('podSelector must not be empty');
  });

  it('throws when pod security not enforced', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    expect(() =>
      applyNetworkPolicy(s, {
        namespace: 'prod',
        podSelector: { a: 'b' },
        ingressFromNamespaces: [],
        egressToNamespaces: [],
      }),
    ).toThrow('pod security must be enforced');
  });
});

describe('decideAdmission', () => {
  const setup = (s: ReturnType<typeof startK8sSession>) => {
    enforcePodSecurity(s, 'restricted', {
      namespace: 'prod',
      runAsRoot: false,
      privileged: false,
      allowPrivilegeEscalation: false,
      hostNetwork: false,
      hostPid: false,
    });
    applyNetworkPolicy(s, {
      namespace: 'prod',
      podSelector: { app: 'api' },
      ingressFromNamespaces: [],
      egressToNamespaces: [],
    });
  };

  it('allows when label present and namespace allowed', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    setup(s);
    const step = decideAdmission(
      s,
      {
        operation: 'CREATE',
        resource: 'Pod',
        namespace: 'prod',
        labels: { 'security.reviewed': 'true' },
      },
      { requireLabel: 'security.reviewed', allowedNamespaces: ['prod'] },
    );
    expect(step.neutralEvent).toBe('k8s.admission_allowed');
    expect(step.metadata['allowed']).toBe(true);
  });

  it('denies when required label missing', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    setup(s);
    const step = decideAdmission(
      s,
      {
        operation: 'CREATE',
        resource: 'Pod',
        namespace: 'prod',
        labels: {},
      },
      { requireLabel: 'security.reviewed', allowedNamespaces: ['prod'] },
    );
    expect(step.neutralEvent).toBe('k8s.admission_denied');
  });

  it('denies when namespace not allowed', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    setup(s);
    const step = decideAdmission(
      s,
      {
        operation: 'CREATE',
        resource: 'Pod',
        namespace: 'kube-system',
        labels: { 'security.reviewed': 'true' },
      },
      { requireLabel: 'security.reviewed', allowedNamespaces: ['prod'] },
    );
    expect(step.metadata['allowed']).toBe(false);
    expect(step.metadata['namespaceAllowed']).toBe(false);
  });

  it('supports all operations and resources', () => {
    const s = startK8sSession({ target: 'opa', sessionId: 's' });
    setup(s);
    const step = decideAdmission(
      s,
      {
        operation: 'DELETE',
        resource: 'Service',
        namespace: 'prod',
        labels: { 'security.reviewed': 'yes' },
      },
      { requireLabel: 'security.reviewed', allowedNamespaces: ['prod'] },
    );
    expect(step.metadata['operation']).toBe('DELETE');
    expect(step.metadata['resource']).toBe('Service');
  });
});
