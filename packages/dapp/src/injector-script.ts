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
  var wallets = ${JSON.stringify(wallets)};
  var sanitize = function (rdns) {
    return rdns.replace(/[^a-zA-Z0-9]/g, '_');
  };
  var createUuid = function () {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    var bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    var hex = [];
    for (var j = 0; j < bytes.length; j += 1) {
      hex.push((bytes[j] + 256).toString(16).slice(1));
    }
    return (
      hex.slice(0, 4).join('') + '-' +
      hex.slice(4, 6).join('') + '-' +
      hex.slice(6, 8).join('') + '-' +
      hex.slice(8, 10).join('') + '-' +
      hex.slice(10, 16).join('')
    );
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
  if (!Array.isArray(window.__dappE2eProviders)) {
    window.__dappE2eInjected = true;
    window.__dappE2eProviders = wallets.map(function (wallet) {
      var eventHandlers = Object.create(null);
      var info = Object.freeze({
        uuid: createUuid(),
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
            return Promise.reject(new Error('kiwa: ' + bridgeName + ' not exposed'));
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
          var snapshot = list.slice();
          for (var i = 0; i < snapshot.length; i += 1) {
            try {
              snapshot[i].apply(null, args);
            } catch (e) {
              /* swallow */
            }
          }
        },
      };
      return {
        bridgeName: bridgeName,
        info: info,
        provider: provider,
      };
    });
  }
  if (!Array.isArray(window.__dappE2eEip6963Listeners)) {
    window.__dappE2eEip6963Listeners = [];
  }
  var dispatchAnnounce = function (entry) {
    window.__dappE2eOriginalDispatchEvent(new CustomEvent('eip6963:announceProvider', {
      detail: Object.freeze({ info: entry.info, provider: entry.provider })
    }));
  };
  var bindProvider = function (entry, index) {
    window.__dappE2eEmitters[entry.bridgeName] = function (event) {
      var args = Array.prototype.slice.call(arguments, 1);
      entry.provider.emit.apply(entry.provider, [event].concat(args));
    };
    if (index === 0) {
      window.ethereum = entry.provider;
      window.__dappE2eEmit = window.__dappE2eEmitters[entry.bridgeName];
    }
  };
  var announceAllProviders = function () {
    window.__dappE2eProviders.forEach(function (entry, index) {
      bindProvider(entry, index);
      dispatchAnnounce(entry);
    });
  };
  if (!window.__dappE2eOriginalDispatchEvent) {
    window.__dappE2eOriginalDispatchEvent = window.dispatchEvent.bind(window);
    window.dispatchEvent = function (event) {
      if (event && event.type === 'eip6963:requestProvider') {
        announceAllProviders();
        return true;
      }
      return window.__dappE2eOriginalDispatchEvent(event);
    };
  }
  window.__dappE2eProviders.forEach(function (entry, index) {
    var announce = function () {
      dispatchAnnounce(entry);
    };
    window.__dappE2eEip6963Listeners[index] = announce;
    bindProvider(entry, index);
    window.__dappE2eOriginalDispatchEvent(new CustomEvent('eip6963:announceProvider', {
        detail: Object.freeze({ info: entry.info, provider: entry.provider })
      }));
  });
})();
`;
}

function sanitizeRdns(rdns: string): string {
  return rdns.replace(/[^a-zA-Z0-9]/g, '_');
}
