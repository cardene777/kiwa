import type { InjectorOptions } from './types.js';

const DEFAULT_WALLET_ICON =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="16" fill="%23f6851b"/%3E%3Cpath d="M32 14l12 18-12 7-12-7 12-18zm0 25l12-7-12 18-12-18 12 7z" fill="white"/%3E%3C/svg%3E';

export function createInjectorScript(opts: InjectorOptions): string {
  const wallets =
    opts.wallets && opts.wallets.length > 0
      ? opts.wallets.map(({ name, rdns, icon }) => ({
          name,
          rdns,
          icon,
          bridgeName: `__dappE2eRpc_${sanitizeRdns(rdns)}`,
        }))
      : [
          {
            name: 'MetaMask',
            rdns: 'io.metamask',
            icon: DEFAULT_WALLET_ICON,
            bridgeName: '__dappE2eRpc_io_metamask',
          },
        ];

  return `
(function () {
  if (typeof window === 'undefined') return;
  if (window.ethereum && window.ethereum.__dappE2eInjected) return;
  var wallets = ${JSON.stringify(wallets)};
  var sanitize = function (rdns) {
    return rdns.replace(/[^a-zA-Z0-9]/g, '_');
  };
  var createUuid = function (index) {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'dapp-e2e-' + Date.now() + '-' + index + '-' + Math.random().toString(16).slice(2);
  };
  var unwrapEnvelope = function (envelope) {
    if (envelope && envelope.ok === true) {
      return envelope.result;
    }
    if (envelope && envelope.ok === false && envelope.error) {
      var err = new Error(envelope.error.message);
      err.code = envelope.error.code;
      throw err;
    }
    return envelope;
  };
  if (!window.__dappE2eEmitters) {
    window.__dappE2eEmitters = Object.create(null);
  }
  wallets.forEach(function (wallet, index) {
    var eventHandlers = Object.create(null);
    var info = Object.freeze({
      uuid: createUuid(index),
      name: wallet.name,
      icon: wallet.icon,
      rdns: wallet.rdns,
    });
    var bridgeName = wallet.bridgeName || ('__dappE2eRpc_' + sanitize(wallet.rdns));
    var provider = {
      isMetaMask: true,
      __dappE2eInjected: true,
      request: function (args) {
        var fn = window[bridgeName];
        if (!fn) {
          return Promise.reject(new Error('dapp-e2e: ' + bridgeName + ' not exposed'));
        }
        return Promise.resolve(fn(args)).then(unwrapEnvelope);
      },
      on: function (event, handler) {
        if (!eventHandlers[event]) eventHandlers[event] = [];
        eventHandlers[event].push(handler);
        return provider;
      },
      removeListener: function (event, handler) {
        var list = eventHandlers[event];
        if (!list) return provider;
        var idx = list.indexOf(handler);
        if (idx >= 0) list.splice(idx, 1);
        return provider;
      },
      emit: function (event) {
        var list = eventHandlers[event];
        if (!list) return;
        var args = Array.prototype.slice.call(arguments, 1);
        for (var i = 0; i < list.length; i += 1) {
          try {
            list[i].apply(null, args);
          } catch (e) {
            /* swallow */
          }
        }
      },
    };
    var announce = function () {
      window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
        detail: Object.freeze({ info: info, provider: provider })
      }));
    };
    window.addEventListener('eip6963:requestProvider', announce);
    window.__dappE2eEmitters[bridgeName] = function (event) {
      var args = Array.prototype.slice.call(arguments, 1);
      provider.emit.apply(provider, [event].concat(args));
    };
    announce();
    if (index === 0) {
      window.ethereum = provider;
      window.__dappE2eEmit = window.__dappE2eEmitters[bridgeName];
    }
  });
})();
`;
}

function sanitizeRdns(rdns: string): string {
  return rdns.replace(/[^a-zA-Z0-9]/g, '_');
}
