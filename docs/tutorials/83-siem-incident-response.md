# SIEM audit + Incident response — structured logging + tamper-evident seal + retention policy + correlation rule + playbook + severity + escalation + forensics + post-mortem in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/security` v0.2 that models the 9 signals of a real SIEM + incident-response chain that every non-trivial production stack eventually needs — a structured event emitter that walks a raw `SiemEvent` (actor + action + target + timestamp + result) into a Splunk-CIM-shaped `StructuredEvent` with an auto-assigned `eventId` and `cimSchemaVersion`, a tamper-evident seal that chains a SHA-hash of the batch onto a previous seal so an insertion or deletion invalidates the chain, a retention-policy applier that pins hot / warm / cold day counts and a `legalHold` toggle so long-lived incident artifacts are not accidentally purged, a correlation rule that fires when a set of `requiredEventIds` are all present in a given window, a playbook trigger that names the runbook the incident kicks off, a 5-tier severity classifier (`sev1` .. `sev5`) that walks affected users + data classification + service-down 3 signals, an escalation sender that requires at least one channel + a primary on-call, a forensics capture that records memory-dump / network-pcap / disk-image artifact sizes, and a post-mortem recorder that requires a root-cause of 10+ characters and at least one action item. `startSiemAuditSession()` + `structureEvent()` + `sealEvents()` + `applyRetention()` + `correlate()` + `startIncidentSession()` + `triggerPlaybook()` + `classifySeverity()` + `escalate()` + `captureForensics()` + `recordPostMortem()` give you every one of those signals without booting a real Splunk HEC endpoint or a Vault audit backend. This is the pattern kiwa's `examples/dogfood-security-siem-incident-app` exercises against real Splunk + Vault under `KIWA_MODE=real` + `KIWA_SPLUNK_HEC_URL` + `KIWA_VAULT_URL`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the SIEM ingested the raw event but the correlation rule never fired because the retention step was skipped and the event id was missing from the correlation set" gap a reviewer sees in the SIEM rollout post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-siem-incident && cd kiwa-siem-incident
pnpm init
pnpm add -D @kiwa-lab/security@^0.2 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.2 surface exports the SIEM audit axis (`startSiemAuditSession` / `structureEvent` / `sealEvents` / `applyRetention` / `correlate`) and the incident response axis (`startIncidentSession` / `triggerPlaybook` / `classifySeverity` / `escalate` / `captureForensics` / `recordPostMortem`) directly from the package root. This tutorial focuses on the SIEM + IR end-to-end chain; tutorial 84 covers the supply chain SLSA chain.

### 2. `startSiemAuditSession` + `structureEvent` — the Splunk CIM shape

`tests/siem/structure.test.ts` — a `SiemAuditSession` pins a `target` (`istio` / `opa` / `siem-splunk` / `vault`) + `sessionId` + a `state` that starts at `idle` and walks `structured` → `sealed` → `retention-tagged` → `correlated`. `structureEvent()` accepts a raw `SiemEvent` (actor + action + target + timestamp + result) and returns a `StructuredEvent` with an auto-assigned `eventId` (`evt-1` / `evt-2` / ...) plus a `cimSchemaVersion: '1.0'`. Multiple calls append to `structuredEvents` on the same session before the seal step.

```ts
import { describe, expect, it } from 'vitest';
import { startSiemAuditSession, structureEvent } from '@kiwa-lab/security';

describe('siem — structureEvent', () => {
  it('normalizes a raw event into a Splunk-CIM-shaped structured event', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-1' });
    const { event, step } = structureEvent(s, {
      actor: 'user@example.com',
      action: 'login',
      target: 'auth-service',
      timestamp: 1_700_000_000,
      result: 'success',
    });
    expect(event.eventId).toBe('evt-1');
    expect(event.cimSchemaVersion).toBe('1.0');
    expect(step.neutralEvent).toBe('siem.event_structured');
    expect(s.state).toBe('structured');
  });

  it('appends event ids monotonically inside the same session', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-2' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    const { event } = structureEvent(s, {
      actor: 'b@x',
      action: 'login',
      target: 'svc',
      timestamp: 2,
      result: 'failure',
    });
    expect(event.eventId).toBe('evt-2');
    expect(s.structuredEvents).toHaveLength(2);
  });

  it('rejects an empty actor / action / target (guards against silent null events)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-3' });
    expect(() =>
      structureEvent(s, {
        actor: '',
        action: 'login',
        target: 'svc',
        timestamp: 1,
        result: 'success',
      }),
    ).toThrow(/actor \/ action \/ target must not be empty/);
  });
});
```

The Splunk CIM (Common Information Model) shape is the same one every enterprise SIEM (Splunk / Elastic / Sumo Logic) uses at the ingest layer — the harness pins the `eventId` + `cimSchemaVersion` fields so the mock output feeds straight into the real fidelity assertion.

### 3. `sealEvents` — the tamper-evident hash chain

`tests/siem/seal.test.ts` — `sealEvents()` runs after `structureEvent()` and computes a SHA-shaped hash of the batch chained onto a `previousHash`. The resulting seal is pushed onto `sealHashChain` so a later verifier can walk the chain and detect any inserted or deleted event. Attempting to seal an empty batch or an unstructured session raises — the chain has no meaningful seal for zero events.

```ts
import { describe, expect, it } from 'vitest';
import {
  sealEvents,
  startSiemAuditSession,
  structureEvent,
} from '@kiwa-lab/security';

describe('siem — sealEvents', () => {
  it('emits a hash chained onto the previous seal', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-1' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    const step = sealEvents(s, { previousHash: 'root-hash' });
    expect(step.metadata.previousHash).toBe('root-hash');
    expect(step.metadata.eventCount).toBe(1);
    expect(String(step.metadata.sealHash)).toMatch(/^sha-/);
    expect(s.sealHashChain).toHaveLength(1);
    expect(s.state).toBe('sealed');
  });

  it('refuses to seal an idle session (no structured events)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-2' });
    expect(() => sealEvents(s, { previousHash: 'root' })).toThrow(
      /no structured events to seal/,
    );
  });

  it('produces a stable hash for the same input (determinism check)', () => {
    const s1 = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-1' });
    structureEvent(s1, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    const step1 = sealEvents(s1, { previousHash: 'root' });

    const s2 = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-2' });
    structureEvent(s2, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    const step2 = sealEvents(s2, { previousHash: 'root' });

    expect(step1.metadata.sealHash).toBe(step2.metadata.sealHash);
  });
});
```

The determinism check is what makes the fidelity harness work — the mock and real driver must produce the same seal for the same input batch + previous hash, which lets a later `verifyChain()` walk the chain end-to-end without knowing which side produced each link.

### 4. `applyRetention` — hot / warm / cold / legal-hold policy

`tests/siem/retention.test.ts` — `applyRetention()` accepts a `RetentionPolicy` with `hotDays` (fast-searchable), `warmDays` (slower search, cheaper storage), `coldDays` (archive, restore-on-demand) day counts + a `legalHold` boolean that suspends purge for legal-discovery scenarios. Negative day counts raise so a config typo cannot silently truncate the retention window. The step emits the total window so a downstream monitoring dashboard can watch the effective retention.

```ts
import { describe, expect, it } from 'vitest';
import {
  applyRetention,
  sealEvents,
  startSiemAuditSession,
  structureEvent,
} from '@kiwa-lab/security';

describe('siem — applyRetention', () => {
  it('records hot + warm + cold days plus legal-hold toggle', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-1' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    sealEvents(s, { previousHash: 'root' });
    const step = applyRetention(s, {
      hotDays: 7,
      warmDays: 30,
      coldDays: 365,
      legalHold: false,
    });
    expect(step.metadata.hotDays).toBe(7);
    expect(step.metadata.totalDays).toBe(402);
    expect(step.metadata.legalHold).toBe(false);
    expect(s.state).toBe('retention-tagged');
  });

  it('rejects negative retention days (guards against config typo)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-2' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    sealEvents(s, { previousHash: 'root' });
    expect(() =>
      applyRetention(s, {
        hotDays: 7,
        warmDays: -1,
        coldDays: 365,
        legalHold: false,
      }),
    ).toThrow(/must be non-negative/);
  });
});
```

The `legalHold: true` toggle is what makes the audit stream defensible in a court-of-record context — a downstream purge job must respect the flag or the retention log becomes evidence of spoliation.

### 5. `correlate` — the "all required events in the window" rule

`tests/siem/correlate.test.ts` — `correlate()` accepts a `CorrelationRule` with a `ruleId` + a `requiredEventIds` list + a `windowMs` and returns `matched: true` in the metadata only when every required event id is present in the current structured-events set. A rule with zero required ids raises — a rule that fires on nothing is a config bug, not a valid detection.

```ts
import { describe, expect, it } from 'vitest';
import {
  applyRetention,
  correlate,
  sealEvents,
  startSiemAuditSession,
  structureEvent,
} from '@kiwa-lab/security';

describe('siem — correlate', () => {
  it('emits matched=true when every required event id is present', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-1' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'failure',
    });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 2,
      result: 'failure',
    });
    sealEvents(s, { previousHash: 'root' });
    applyRetention(s, { hotDays: 7, warmDays: 30, coldDays: 365, legalHold: false });
    const step = correlate(s, {
      ruleId: 'brute-force-detector',
      requiredEventIds: ['evt-1', 'evt-2'],
      windowMs: 60_000,
    });
    expect(step.metadata.matched).toBe(true);
    expect(s.state).toBe('correlated');
  });

  it('emits matched=false when any required event id is missing', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-2' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'failure',
    });
    sealEvents(s, { previousHash: 'root' });
    applyRetention(s, { hotDays: 7, warmDays: 30, coldDays: 365, legalHold: false });
    const step = correlate(s, {
      ruleId: 'brute-force-detector',
      requiredEventIds: ['evt-1', 'evt-2'],
      windowMs: 60_000,
    });
    expect(step.metadata.matched).toBe(false);
  });

  it('refuses a rule with 0 required event ids (guards against always-fire rule)', () => {
    const s = startSiemAuditSession({ target: 'siem-splunk', sessionId: 's-3' });
    structureEvent(s, {
      actor: 'a@x',
      action: 'login',
      target: 'svc',
      timestamp: 1,
      result: 'success',
    });
    sealEvents(s, { previousHash: 'root' });
    applyRetention(s, { hotDays: 7, warmDays: 30, coldDays: 365, legalHold: false });
    expect(() =>
      correlate(s, { ruleId: 'noop', requiredEventIds: [], windowMs: 60_000 }),
    ).toThrow(/must require >= 1 event id/);
  });
});
```

The "all required" semantics is what separates a correlation rule from a filter — a filter fires on one match, a correlation fires only when a specific set is complete. That distinction is where most SIEM misconfigurations live.

### 6. `startIncidentSession` + `triggerPlaybook` — the incident playbook

`tests/incident/playbook.test.ts` — an `IncidentSession` pins a `target` + `sessionId` + a `state` that starts at `idle` and walks `playbook-triggered` → `severity-classified` → `escalated` → `forensics-captured` → `post-mortem-recorded`. `triggerPlaybook()` accepts a `playbookId` + `detectionSource` + `initialAlert` triple and pins the session to a named runbook. An empty `playbookId` raises — an unnamed playbook is a missing SSOT.

```ts
import { describe, expect, it } from 'vitest';
import { startIncidentSession, triggerPlaybook } from '@kiwa-lab/security';

describe('incident — triggerPlaybook', () => {
  it('records playbook id + detection source + initial alert', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-1' });
    const step = triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'brute-force-detector',
      initialAlert: '20 failed logins from IP 1.2.3.4 in 60s',
    });
    expect(step.metadata.playbookId).toBe('IR-BF-001');
    expect(s.state).toBe('playbook-triggered');
    expect(s.playbookId).toBe('IR-BF-001');
  });

  it('refuses an empty playbook id (guards against unnamed runbook)', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-2' });
    expect(() =>
      triggerPlaybook(s, {
        playbookId: '',
        detectionSource: 'x',
        initialAlert: 'y',
      }),
    ).toThrow(/playbookId must not be empty/);
  });
});
```

The `playbookId` is the SSOT connection between the SIEM detection stream and the human runbook — the exact same id shows up in the SIEM correlation output and in the on-call runbook wiki.

### 7. `classifySeverity` + `escalate` — the 5-tier severity + on-call routing

`tests/incident/severity.test.ts` — `classifySeverity()` walks the 3 signals (affected users + data classification + service-down boolean) into 5 buckets — `sev1` (restricted + service down), `sev2` (restricted only), `sev3` (confidential), `sev4` (many users affected), `sev5` (baseline). `escalate()` requires at least one channel + a primary on-call, and records whether a secondary is assigned.

```ts
import { describe, expect, it } from 'vitest';
import {
  classifySeverity,
  escalate,
  startIncidentSession,
  triggerPlaybook,
} from '@kiwa-lab/security';

describe('incident — classifySeverity + escalate', () => {
  it('classifies restricted + service-down as sev1', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-1' });
    triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    const step = classifySeverity(s, {
      affectedUsers: 5000,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    expect(step.metadata.severity).toBe('sev1');
    expect(s.severity).toBe('sev1');
  });

  it('classifies confidential data + no service down as sev3', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-2' });
    triggerPlaybook(s, {
      playbookId: 'IR-DF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    const step = classifySeverity(s, {
      affectedUsers: 5,
      dataClassification: 'confidential',
      serviceDown: false,
    });
    expect(step.metadata.severity).toBe('sev3');
  });

  it('escalates to at least one channel with primary + optional secondary on-call', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-3' });
    triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    classifySeverity(s, {
      affectedUsers: 1000,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    const step = escalate(s, {
      channels: ['pagerduty', 'slack'],
      onCallPrimary: 'alice@example.com',
      onCallSecondary: 'bob@example.com',
    });
    expect(step.metadata.channelCount).toBe(2);
    expect(step.metadata.hasSecondary).toBe(true);
    expect(s.state).toBe('escalated');
  });

  it('refuses to escalate with no channels (guards against silent escalation drop)', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-4' });
    triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    classifySeverity(s, {
      affectedUsers: 1,
      dataClassification: 'public',
      serviceDown: false,
    });
    expect(() =>
      escalate(s, {
        channels: [],
        onCallPrimary: 'a@x',
        onCallSecondary: null,
      }),
    ).toThrow(/at least one channel required/);
  });
});
```

The 5-tier classification pins the same shape most incident-response frameworks use (Google SRE / Atlassian / PagerDuty) so a rego policy or a decision tree can drive severity without renaming.

### 8. `captureForensics` + `recordPostMortem` — the closing arc

`tests/incident/forensics.test.ts` — `captureForensics()` records memory-dump / network-pcap / disk-image artifact sizes and appends artifact names when the sizes are non-zero. `recordPostMortem()` requires a `rootCause` of 10+ characters and at least one action item — a post-mortem without a root cause or action items is not a post-mortem, it is a status update.

```ts
import { describe, expect, it } from 'vitest';
import {
  captureForensics,
  classifySeverity,
  escalate,
  recordPostMortem,
  startIncidentSession,
  triggerPlaybook,
} from '@kiwa-lab/security';

describe('incident — forensics + post-mortem', () => {
  it('records artifact sizes and appends non-empty artifact names', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-1' });
    triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    classifySeverity(s, {
      affectedUsers: 1000,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    escalate(s, {
      channels: ['pagerduty'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    const step = captureForensics(s, {
      memoryDumpMb: 512,
      networkPcapMb: 128,
      diskImageGb: 40,
    });
    expect(step.metadata.artifactCount).toBe(3);
    expect(s.forensicsArtifacts).toEqual([
      'memory-dump',
      'network-pcap',
      'disk-image',
    ]);
    expect(s.state).toBe('forensics-captured');
  });

  it('records a post-mortem with root cause + action items', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-2' });
    triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    classifySeverity(s, {
      affectedUsers: 1000,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    escalate(s, {
      channels: ['pagerduty'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    captureForensics(s, {
      memoryDumpMb: 512,
      networkPcapMb: 128,
      diskImageGb: 40,
    });
    const step = recordPostMortem(s, {
      rootCause: 'brute-force rate limiter mis-tuned (window too wide)',
      contributingFactors: ['no distributed rate limit', 'no alert on 500-response spike'],
      actionItems: [
        'tighten rate limit window to 60s',
        'add 500-response spike alert',
      ],
    });
    expect(step.metadata.actionItemCount).toBe(2);
    expect(s.state).toBe('post-mortem-recorded');
  });

  it('refuses a short root cause (guards against "just restarted" post-mortems)', () => {
    const s = startIncidentSession({ target: 'siem-splunk', sessionId: 's-3' });
    triggerPlaybook(s, {
      playbookId: 'IR-BF-001',
      detectionSource: 'x',
      initialAlert: 'y',
    });
    classifySeverity(s, {
      affectedUsers: 1000,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    escalate(s, {
      channels: ['pagerduty'],
      onCallPrimary: 'alice',
      onCallSecondary: null,
    });
    captureForensics(s, {
      memoryDumpMb: 512,
      networkPcapMb: 128,
      diskImageGb: 40,
    });
    expect(() =>
      recordPostMortem(s, {
        rootCause: 'oops',
        contributingFactors: [],
        actionItems: ['fix it'],
      }),
    ).toThrow(/rootCause must be >= 10 chars/);
  });
});
```

The 10-character root-cause floor is the "no shallow post-mortems" invariant — a one-word root cause is a config bug, not a valid explanation, so the harness raises on it at build time.

## Run the test suite

```bash
pnpm test
```

Vitest reports every describe block above. The v0.2 SIEM audit + incident response axis surface — `startSiemAuditSession` + `structureEvent` + `sealEvents` + `applyRetention` + `correlate` + `startIncidentSession` + `triggerPlaybook` + `classifySeverity` + `escalate` + `captureForensics` + `recordPostMortem` — has 55+ tests in `packages/security/tests/siem-audit.test.ts` + `incident-response.test.ts`; this tutorial covers the everyday chain that lands in a real Splunk + Vault deployment.

## What's next

- Tutorial 84 covers the supply chain SLSA chain (SLSA level verification + reproducible build + signed provenance + attestation).
- The `security-advanced-II-testing.md` concept doc is the SSOT for the v0.2 8-axis / 4-provider / 32-cell grid.
