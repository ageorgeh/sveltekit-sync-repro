import { defineEnvVars } from '@sveltejs/kit/env';
import { marker } from '@repro/env-dependency';

export const variables = defineEnvVars({
  PUBLIC_REPRO: {
    public: true,
    description: marker
  }
});
