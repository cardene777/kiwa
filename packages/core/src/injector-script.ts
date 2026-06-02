import type { InjectorOptions } from './types.js';

export function createInjectorScript(_opts: InjectorOptions): string {
  return `
(function () {
  if (typeof window === 'undefined') return;
  if (window.ethereum && window.ethereum.__dappE2eInjected) return;
  const eventHandlers = Object.create(null);
  const provider = {
    isMetaMask: true,
    __dappE2eInjected: true,
    request: function (args) {
      if (!window.__dappE2eRpc) {
        return Promise.reject(new Error('dapp-e2e: __dappE2eRpc not exposed'));
      }
      return Promise.resolve(window.__dappE2eRpc(args)).then(function (envelope) {
        if (envelope && envelope.ok === true) {
          return envelope.result;
        }
        if (envelope && envelope.ok === false && envelope.error) {
          var err = new Error(envelope.error.message);
          err.code = envelope.error.code;
          throw err;
        }
        return envelope;
      });
    },
    on: function (event, handler) {
      if (!eventHandlers[event]) eventHandlers[event] = [];
      eventHandlers[event].push(handler);
      return provider;
    },
    removeListener: function (event, handler) {
      const list = eventHandlers[event];
      if (!list) return provider;
      const idx = list.indexOf(handler);
      if (idx >= 0) list.splice(idx, 1);
      return provider;
    },
    emit: function (event) {
      const list = eventHandlers[event];
      if (!list) return;
      const args = Array.prototype.slice.call(arguments, 1);
      for (const h of list.slice()) {
        try { h.apply(null, args); } catch (e) { /* swallow */ }
      }
    },
  };
  window.ethereum = provider;
  window.__dappE2eEmit = function (event) {
    const args = Array.prototype.slice.call(arguments, 1);
    provider.emit.apply(provider, [event].concat(args));
  };
})();
`;
}
