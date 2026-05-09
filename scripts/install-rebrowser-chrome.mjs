// rebrowser-puppeteer's published `install.mjs` calls upstream puppeteer's
// `downloadBrowsers()`, which downloads upstream's pinned Chromium revision
// rather than rebrowser's. As a result `npm install` leaves rebrowser
// without its own Chromium and any `.launch()` call fails with
// "Could not find Chrome (ver. <rebrowser-revision>)".
//
// Re-run rebrowser's *own* `downloadBrowsers` from the package's internal
// install entry point. `@puppeteer/browsers` install is idempotent, so this
// is a no-op once the binary is cached.
const { downloadBrowsers } = await import(
  'rebrowser-puppeteer/internal/node/install.js'
);
await downloadBrowsers();
