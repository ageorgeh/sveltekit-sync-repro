import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'repro-loader:runtime-config') {
      return {
        shortCircuit: true,
        url: 'data:text/javascript,export default "resolved by Node registerHooks"'
      };
    }

    return nextResolve(specifier, context);
  }
});
