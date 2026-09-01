# SvelteKit `src/env.ts` workspace-link reproduction

This is a standalone pnpm workspace showing that a dependency imported by
SvelteKit's `src/env.ts` behaves differently when it is workspace-linked.
SvelteKit evaluates the file with an internal Vite server; Vite normally
externalizes installed server packages, but does not externalize linked
workspace packages by default. The linked package is therefore transformed by
Vite, whose isolated server cannot use the Node loader hook that resolves its
bare `repro-loader-target` import.

## Reproduction

Requires Node.js `>=22.15.0` and pnpm `11`.

```sh
pnpm install
pnpm test:node
pnpm repro
```

Expected results:

```text
pnpm test:node  -> PASS
pnpm repro      -> FAIL
```

The native control imports `@repro/env-dependency` with
`loader/register.mjs`, and verifies `marker === 'resolved by Node loader'`.
The unpatched `pnpm repro` fails while evaluating the linked package because
Vite cannot resolve `repro-loader-target`.

The app passes its SvelteKit options directly to `sveltekit(...)` in
`app/vite.config.js`; no `svelte.config.js` file is needed.

The relevant error is:

```text
Cannot find module 'repro-loader-target' imported from '.../packages/env-dependency/index.js'
```

## Expected

A dependency of `src/env.ts` should retain normal server-side Node package
execution semantics in this isolated env loader, or at least should not behave
differently solely because it is workspace-linked.

## Actual

Native Node import succeeds, while `svelte-kit sync` fails resolving
`repro-loader-target` from the linked `@repro/env-dependency` package.

## Workaround

SvelteKit 2.70.3's `load_explicit_env` in
`node_modules/@sveltejs/kit/src/core/env.js` creates an internal Vite server
with `configFile: false` and no `ssr.external` setting. The local reference
patch in [sveltekit-load-explicit-env.patch](./sveltekit-load-explicit-env.patch)
adds:

```js
ssr: {
  external: true;
}
```

Applying that change to the installed SvelteKit package makes the same linked
reproduction pass
