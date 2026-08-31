import { runtimeConfig } from '@repro/env-package';

if (runtimeConfig !== 'resolved by Node registerHooks') {
  throw new Error(`Unexpected runtime config: ${runtimeConfig}`);
}

console.log('native import passed:', runtimeConfig);
