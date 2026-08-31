# SvelteKit `src/env.ts` loader reproduction

This is a minimal pnpm workspace showing that a workspace-linked dependency of
SvelteKit's `src/env.ts` is evaluated by Vite, while the same dependency is
externalized when installed from a package tarball.

The workspace package imports `repro-loader:runtime-config`. That is not a real
package: [node-loader.mjs](./node-loader.mjs) resolves it with Node's
`registerHooks` API. The import therefore works in native Node, but Vite cannot
resolve it when it evaluates the linked package. `src/env.ts` uses the imported
value as a description so the dependency is executed during sync.

## Reproduce

Requirements: Node.js `>=22.15.0` and pnpm `11`.

Install the workspace dependencies:

```sh
pnpm install
```

Native Node resolution works:

```sh
pnpm native
# native import passed: resolved by Node registerHooks
```

The workspace-linked package fails during `svelte-kit sync`:

```sh
pnpm sync
```

Expected result: exit code `1`, including:

```text
Cannot find module 'repro-loader:runtime-config' imported from .../packages/env-package/src/index.js
```

The root install links the package directly to `packages/env-package`. Vite's
SSR defaults inline linked workspace packages, so the custom import is handled
by Vite instead of native Node.

You can see the link with `readlink node_modules/@repro/env-package`.

## Installed-package comparison

Pack the same package and run an otherwise equivalent app outside the workspace
dependency graph:

```sh
pnpm --filter @repro/env-package pack --pack-destination .repro
pnpm --dir fixtures/installed-app --ignore-workspace install --force
pnpm --dir fixtures/installed-app --ignore-workspace run sync
```

The last command exits `0`. The fixture installs the tarball into
`node_modules` rather than linking `packages/env-package`, so Vite externalizes
it and Node's registered resolver handles `repro-loader:runtime-config`.

## Local SvelteKit patch

The checked-in [patch](./patches/@sveltejs__kit@2.70.3.patch) adds
`ssr: { external: true }` to the internal `vite.createServer({ ... })` used by
SvelteKit's explicit environment loader. Enable it temporarily with the
alternate workspace file:

```sh
cp pnpm-workspace.yaml /tmp/sveltekit-sync-repro-pnpm-workspace.yaml
cp pnpm-workspace.patched.yaml pnpm-workspace.yaml
pnpm install
pnpm sync
```

With the patch enabled, `pnpm sync` exits `0`: the linked package is treated as
an external SSR dependency and is loaded by native Node, where the
`registerHooks` resolver is active. Restore the unpatched state with:

```sh
cp /tmp/sveltekit-sync-repro-pnpm-workspace.yaml pnpm-workspace.yaml
pnpm install
```

The repro pins the published stable `@sveltejs/kit@2.70.3`. Its matching
upstream source is `packages/kit/src/core/env.js`, where `load_explicit_env`
creates the Vite server with `configFile: false` and no SSR externalization.
The current upstream `main` source inspected for this repro has the same call
shape; the patch is intentionally limited to that option.
