import { registerHooks } from 'node:module';

const target = new URL('./target.mjs', import.meta.url).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'repro-loader-target') {
      return {
        url: target,
        shortCircuit: true
      };
    }

    return nextResolve(specifier, context);
  }
});
