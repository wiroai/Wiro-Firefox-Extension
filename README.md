# Wiro for Firefox

Right-click an image, video, audio clip, selected text or a page to run Wiro AI models and tools in Firefox's sidebar: animate, edit, upscale, restore, read aloud, transcribe, translate and more. The models come live from Wiro's categories, so new models show up without an add-on update.

The shared code (sign-in, MCP client, actions, gateway, pricing, panel) lives in [Wiro-Extension-Core](https://github.com/wiroai/Wiro-Extension-Core), included here as the `core/` submodule. This repo adds the Firefox parts:

- `src/platform.ts`: storage, the sign-in window (`browser.identity.launchWebAuthFlow`) and tabs.
- `src/background.ts`: the background page. It builds the right-click menus and opens the sidebar on a click; the toolbar button toggles the sidebar.
- `src/panel.ts`, `public/panel.html`: the sidebar page.
- `manifest.json`: Manifest V3 with `sidebar_action`, desktop Firefox 140 and later.

## Build

```bash
git clone --recurse-submodules https://github.com/wiroai/Wiro-Firefox-Extension.git
cd Wiro-Firefox-Extension
npm install
(cd core && npm install)
npm run typecheck
npm run build
npm run lint
```

To try it, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on** and pick `dist/manifest.json`.

After a core change: `git -C core pull origin main`, rebuild, and commit the new `core` pointer.

## Sign-in

Sign-in uses the Wiro OAuth server at `mcp.wiro.ai` (PKCE, no API key in the browser). Firefox catches the loopback redirect `http://127.0.0.1/mozoauth2/<id>`, where `<id>` comes from `identity.getRedirectURL()`. The server accepts loopback redirects, so Firefox needs no entry on its list of known redirect addresses.

## Submitting to addons.mozilla.org

```bash
npm run package
```

This writes the zip to `web-ext-artifacts/`. The bundle is made with esbuild, so AMO also needs the source: a zip of this repo with the `core/` submodule checked out, `package-lock.json` included, and the build steps above.

Notes for the review:

- `browser_specific_settings.gecko.id` is `extension@wiro.ai`; it keeps the add-on ID the same across builds.
- `data_collection_permissions` declares `websiteContent`: when the user starts a run, the clicked item's address or the selected text goes to Wiro.
- The linter warns about `innerHTML` in the bundle. It is Preact's support for `dangerouslySetInnerHTML`, which this add-on never uses.
- The linter also notes that Firefox for Android reads `data_collection_permissions` from version 142. The add-on is for desktop Firefox only, since Android has no sidebar.

## Permissions

| Permission | Why |
| --- | --- |
| `menus` | the Wiro entries in the right-click menu |
| `storage` | the sign-in tokens, the tray, run history and the last model picked per action |
| `identity` | the Wiro sign-in window |

No host permissions and no content scripts: the add-on reads only what a right-click hands it (the item's address, the selected text, the page address) and sends it to Wiro when the user starts a run.
