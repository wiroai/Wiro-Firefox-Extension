import type { KeyValueStore, Platform } from '../core/src/platform.js';

// Firefox's side of the core: browser.storage, browser.identity and browser.tabs.

function store(area: browser.storage.StorageArea, areaName: string): KeyValueStore {
  return {
    async get<T>(key: string) {
      const values = await area.get(key);
      return values[key] as T | undefined;
    },
    set: (key, value) => area.set({ [key]: value }),
    remove: key => area.remove(key),
    onChanged(listener) {
      const handler = (changes: Record<string, browser.storage.StorageChange>, name: string) => {
        if (name !== areaName) return;
        listener(Object.fromEntries(Object.entries(changes).map(([key, change]) => [key, change.newValue])));
      };
      browser.storage.onChanged.addListener(handler);
      return () => browser.storage.onChanged.removeListener(handler);
    },
  };
}

// Firefox catches a loopback redirect of the form
// http://127.0.0.1/mozoauth2/<id>, where <id> is the first label of
// identity.getRedirectURL(). Wiro's sign-in server accepts loopback redirects,
// so this needs no entry on its list of known redirect addresses.
function redirectUri(): string {
  const host = new URL(browser.identity.getRedirectURL()).hostname;
  return `http://127.0.0.1/mozoauth2/${host.split('.')[0]}`;
}

export const firefoxPlatform: Platform = {
  name: 'firefox',
  version: browser.runtime.getManifest().version,
  storage: store(browser.storage.local, 'local'),
  session: store(browser.storage.session, 'session'),
  clientName: 'Wiro for Firefox',
  redirectUri,
  launchAuth: url => browser.identity.launchWebAuthFlow({ url, interactive: true }),
  openTab: url => void browser.tabs.create({ url }),
};
