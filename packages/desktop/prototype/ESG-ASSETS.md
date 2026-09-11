# Embedded OpenESG prototype assets

The desktop review app vendors the useful runtime subset of
[`charlieqf/openesg`](https://github.com/charlieqf/openesg) at source commit
`65cd6d5` into `packages/desktop/resources/esg`.

Included:

- P00–P14 HTML entry points;
- shared CSS, JavaScript, fictional state/data modules, and fictional demo files;
- `assets/desktop-bridge.js`, maintained by this desktop fork;
- the product/design review notes in `prototype/esg-docs`.
- the platform-independent state, project-isolation and support-view contract
  tests in `prototype/esg-tests`, with require paths adapted to the vendored
  runtime directory.

Excluded because they are not desktop runtime inputs:

- Cloudflare `_headers`, Wrangler config, deployment scripts and deployment notes;
- the standalone HTTP server;
- browser automation outputs and screenshot archives;
- browser/HTTP/deployment verification scripts and website package metadata.

The 15 HTML files match the source repository except for one versioned,
deferred `assets/desktop-bridge.js` script tag injected before `</head>`. All
other copied runtime files match the source bytes. This adapter is deliberately
local and does not change the reviewed business content.

These files are committed so a Windows or macOS checkout can build the desktop
review app without cloning a second repository. If the source prototype is
updated, run `bun scripts/esg-assets.ts <path-to-openesg/public>`, review the
result and provenance commit, then commit the synchronized files here.

Run `bun run test:esg-assets` from `packages/desktop` to verify the imported
business-state contracts, all 15 entry points and the desktop bridge injection.
