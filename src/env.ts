import { defineEnvVars } from '@sveltejs/kit/env';
import { runtimeConfig } from '@repro/env-package';

export const variables = defineEnvVars({
  REPRO_LOADER: {
    static: true,
    description: runtimeConfig
  }
});
