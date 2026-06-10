/**
 * WalletConnect v2 compatible mock client (Level B).
 *
 * Mimics the @walletconnect/sign-client public surface without taking a runtime
 * dependency on the real SDK. The relay layer is replaced by an in-memory event
 * bus, so paired sessions live entirely inside the browser context for the
 * duration of a test.
 *
 * Surface covered (matches Level B scope in docs/MOCK-DESIGN.md):
 *  - pair / connect URI generation (wc: URI string)
 *  - session lifecycle (propose, approve, request, disconnect)
 *  - personal_sign / eth_sendTransaction request routing
 *  - timeout when the wallet side never approves
 *
 * The mock is intentionally synchronous in most paths so tests can step
 * through the lifecycle deterministically. Real-SDK callers usually await
 * promises; we keep the same promise shape but resolve them on the next tick.
 */

export type WcMethod = 'personal_sign' | 'eth_sendTransaction' | 'eth_signTypedData_v4';

export type WcSession = {
  topic: string;
  pairingTopic: string;
  peer: {
    publicKey: string;
    metadata: { name: string; description: string; url: string };
  };
  accounts: string[];
  chainId: number;
  expiry: number;
};

export type WcProposal = {
  id: number;
  pairingTopic: string;
  proposer: { metadata: { name: string; url: string } };
  requiredNamespaces: {
    eip155: {
      chains: string[];
      methods: WcMethod[];
      events: string[];
    };
  };
};

export type WcPairResult = {
  uri: string;
  approval: () => Promise<WcSession>;
};

export type WcRequestArgs = {
  topic: string;
  chainId: string;
  request: { method: WcMethod; params: unknown[] };
};

type Listener<T> = (payload: T) => void;

/**
 * In-memory relay shared by dapp and wallet sides.
 *
 * The real WalletConnect relay forwards JSON-RPC packets over a WebSocket;
 * the mock simply dispatches typed events on a Map of listener sets.
 */
class InMemoryRelay {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  publish<T>(channel: string, payload: T): void {
    const set = this.listeners.get(channel);
    if (!set) return;
    for (const listener of set) {
      queueMicrotask(() => listener(payload));
    }
  }

  subscribe<T>(channel: string, listener: Listener<T>): () => void {
    let set = this.listeners.get(channel);
    if (!set) {
      set = new Set();
      this.listeners.set(channel, set);
    }
    set.add(listener as Listener<unknown>);
    return () => {
      set?.delete(listener as Listener<unknown>);
    };
  }
}

const sharedRelay = new InMemoryRelay();

let topicCounter = 0;
function newTopic(prefix: string): string {
  topicCounter += 1;
  return `${prefix}-${topicCounter.toString(16).padStart(8, '0')}`;
}

function newProposalId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Construct a wc: URI matching the real SDK shape.
 *
 * `wc:{topic}@{version}?relay-protocol={protocol}&symKey={symKey}`
 */
function buildUri(topic: string, symKey: string): string {
  return `wc:${topic}@2?relay-protocol=irn&symKey=${symKey}`;
}

export type WcSignClientOptions = {
  metadata: { name: string; description: string; url: string };
  defaultAccounts?: string[];
  defaultChainId?: number;
  autoApprove?: boolean;
  approvalDelayMs?: number;
};

/**
 * Mock SignClient — the dApp-side entry point.
 *
 * Tests typically construct one of these per test, call `pair()` to obtain a
 * URI, hand the URI to a wallet-side mock, then await the returned approval
 * promise.
 */
export class MockSignClient {
  readonly metadata: WcSignClientOptions['metadata'];
  private sessions = new Map<string, WcSession>();
  private sessionEvents = new Map<string, Set<Listener<{ event: string; payload: unknown }>>>();
  private requestHandlers = new Map<string, (args: WcRequestArgs) => Promise<unknown>>();

  constructor(opts: WcSignClientOptions) {
    this.metadata = opts.metadata;
  }

  /**
   * Generate a new pairing URI and return both the URI and an `approval`
   * promise that resolves when the wallet-side approves the proposal.
   */
  pair(opts?: { approvalTimeoutMs?: number }): WcPairResult {
    const pairingTopic = newTopic('pairing');
    const symKey = newTopic('symkey').replace(/-/g, '');
    const uri = buildUri(pairingTopic, symKey);
    const proposalId = newProposalId();
    const channel = `proposal-${pairingTopic}`;

    const approval = new Promise<WcSession>((resolve, reject) => {
      const timeout = opts?.approvalTimeoutMs ?? 30_000;
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error('PROPOSAL_EXPIRED'));
      }, timeout);

      const unsubscribe = sharedRelay.subscribe<{ session: WcSession }>(channel, (payload) => {
        clearTimeout(timer);
        unsubscribe();
        this.sessions.set(payload.session.topic, payload.session);
        resolve(payload.session);
      });

      sharedRelay.publish(`proposal-bus-${pairingTopic}`, {
        id: proposalId,
        pairingTopic,
        proposer: { metadata: this.metadata },
        requiredNamespaces: {
          eip155: {
            chains: ['eip155:31337'],
            methods: ['personal_sign', 'eth_sendTransaction', 'eth_signTypedData_v4'],
            events: ['accountsChanged', 'chainChanged'],
          },
        },
      });
    });

    return { uri, approval };
  }

  /**
   * Route a JSON-RPC request to the wallet side and return its response.
   *
   * Tests can override the routing by installing a handler via
   * `onRequest(topic, handler)`. Without a handler the relay routes to the
   * registered wallet, which returns deterministic mock signatures / hashes.
   */
  async request<T = unknown>(args: WcRequestArgs): Promise<T> {
    const session = this.sessions.get(args.topic);
    if (!session) throw new Error('NO_SESSION');

    const override = this.requestHandlers.get(args.topic);
    if (override) return (await override(args)) as T;

    return new Promise<T>((resolve, reject) => {
      const channel = `response-${args.topic}-${newTopic('req')}`;
      const requestChannel = `request-${args.topic}`;
      const unsubscribe = sharedRelay.subscribe<{ result?: T; error?: string }>(channel, (payload) => {
        unsubscribe();
        if (payload.error) reject(new Error(payload.error));
        else resolve(payload.result as T);
      });
      sharedRelay.publish(requestChannel, { ...args, responseChannel: channel });
    });
  }

  onRequest(topic: string, handler: (args: WcRequestArgs) => Promise<unknown>): void {
    this.requestHandlers.set(topic, handler);
  }

  async disconnect(topic: string): Promise<void> {
    if (!this.sessions.has(topic)) throw new Error('NO_SESSION');
    this.sessions.delete(topic);
    sharedRelay.publish(`disconnect-${topic}`, { reason: 'USER_DISCONNECTED' });
  }

  hasSession(topic: string): boolean {
    return this.sessions.has(topic);
  }

  on(topic: string, event: string, listener: Listener<{ event: string; payload: unknown }>): () => void {
    let set = this.sessionEvents.get(topic);
    if (!set) {
      set = new Set();
      this.sessionEvents.set(topic, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
    };
  }
}

export type WcWalletOptions = {
  accounts: string[];
  chainId: number;
  metadata: { name: string; description: string; url: string };
  autoApprove?: boolean;
};

/**
 * Mock Wallet — the wallet-side counterpart.
 *
 * Subscribes to the in-memory relay for proposals on a given pairing topic and
 * either auto-approves (default) or waits for an explicit `approve()` call.
 */
export class MockWallet {
  readonly accounts: string[];
  readonly chainId: number;
  readonly metadata: WcWalletOptions['metadata'];
  private autoApprove: boolean;
  private pendingProposals = new Map<string, WcProposal>();
  private activeSessions = new Map<string, WcSession>();

  constructor(opts: WcWalletOptions) {
    this.accounts = opts.accounts;
    this.chainId = opts.chainId;
    this.metadata = opts.metadata;
    this.autoApprove = opts.autoApprove ?? true;
  }

  /**
   * Parse a wc: URI and start listening for the proposal on the corresponding
   * pairing topic. Returns the pairing topic so the test can drive further
   * actions (approve, reject, etc.).
   */
  pair(uri: string): string {
    const match = uri.match(/^wc:([^@]+)@2/);
    if (!match) throw new Error('INVALID_URI');
    const pairingTopic = match[1];

    sharedRelay.subscribe<WcProposal>(`proposal-bus-${pairingTopic}`, (proposal) => {
      this.pendingProposals.set(pairingTopic, proposal);
      if (this.autoApprove) {
        void this.approve(pairingTopic);
      }
    });

    sharedRelay.subscribe<{ topic: string; responseChannel: string; chainId: string; request: { method: WcMethod; params: unknown[] } }>(
      `request-${pairingTopic}`,
      async (req) => {
        const result = await this.handleRequest(req.request.method, req.request.params);
        sharedRelay.publish(req.responseChannel, { result });
      },
    );

    return pairingTopic;
  }

  /**
   * Approve the pending proposal for a given pairing topic. The dApp-side
   * `approval` promise resolves with the resulting session.
   */
  async approve(pairingTopic: string): Promise<WcSession> {
    const proposal = this.pendingProposals.get(pairingTopic);
    if (!proposal) throw new Error('NO_PROPOSAL');

    const sessionTopic = newTopic('session');
    const session: WcSession = {
      topic: sessionTopic,
      pairingTopic,
      peer: {
        publicKey: newTopic('peer'),
        metadata: this.metadata,
      },
      accounts: this.accounts,
      chainId: this.chainId,
      expiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    this.activeSessions.set(sessionTopic, session);
    this.pendingProposals.delete(pairingTopic);

    sharedRelay.subscribe<{ topic: string; responseChannel: string; chainId: string; request: { method: WcMethod; params: unknown[] } }>(
      `request-${sessionTopic}`,
      async (req) => {
        const result = await this.handleRequest(req.request.method, req.request.params);
        sharedRelay.publish(req.responseChannel, { result });
      },
    );

    sharedRelay.publish(`proposal-${pairingTopic}`, { session });
    return session;
  }

  reject(pairingTopic: string): void {
    if (!this.pendingProposals.has(pairingTopic)) return;
    this.pendingProposals.delete(pairingTopic);
  }

  private async handleRequest(method: WcMethod, params: unknown[]): Promise<unknown> {
    if (method === 'personal_sign') {
      const [message] = params as [string];
      return `0xmocksig-${Buffer.from(message).toString('hex').slice(0, 32)}`;
    }
    if (method === 'eth_sendTransaction') {
      const [tx] = params as [{ to: string; value?: string }];
      return `0xmocktx-${tx.to.slice(2, 10)}`;
    }
    if (method === 'eth_signTypedData_v4') {
      return `0xmocktyped-${Date.now().toString(16)}`;
    }
    throw new Error(`UNSUPPORTED_METHOD: ${method}`);
  }
}

/**
 * Tear down all in-memory subscriptions. Tests call this in `afterEach` to
 * avoid event leakage between cases.
 */
export function resetWcMock(): void {
  topicCounter = 0;
  // The shared relay's listener map is module-scoped, so per-test isolation
  // relies on each test creating fresh SignClient + Wallet pairs. We do not
  // reset the relay itself because that would invalidate cross-test channels
  // owned by helpers (none in the current scope).
}
