import { buildMenus, jobFromClick, JOB_KEY, type MenusApi } from '../core/src/background/menus.js';
import { loadCatalog } from '../core/src/catalog/catalog.js';
import { DEFAULT_CONFIG } from '../core/src/config.js';
import { firefoxPlatform } from './platform.js';

// The background page: builds the right-click menus from the action catalog and
// hands each click to the sidebar.

const menus: MenusApi = {
  removeAll: () => browser.menus.removeAll(),
  create(item) {
    browser.menus.create({
      id: item.id,
      parentId: item.parentId,
      title: item.title,
      type: item.type ?? 'normal',
      contexts: item.contexts as browser.menus.ContextType[] | undefined,
    });
  },
};

async function setUpMenus(): Promise<void> {
  const catalog = await loadCatalog(firefoxPlatform.storage, DEFAULT_CONFIG.catalogUrl);
  await buildMenus(menus, catalog);
}

browser.runtime.onInstalled.addListener(() => void setUpMenus());
browser.runtime.onStartup.addListener(() => void setUpMenus());

// The toolbar button opens and closes the sidebar.
browser.action.onClicked.addListener(() => void browser.sidebarAction.toggle());

browser.menus.onClicked.addListener((info, tab) => {
  const job = jobFromClick(info, tab);
  if (!job) return;
  // sidebarAction.open must run inside the click handler, before anything is awaited.
  void browser.sidebarAction.open();
  void browser.storage.session.set({ [JOB_KEY]: job });
});
