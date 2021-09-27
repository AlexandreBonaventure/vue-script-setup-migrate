const { pnpPlugin } = require('@yarnpkg/esbuild-plugin-pnp');
const { build } = require('esbuild');
build({
    plugins: [pnpPlugin()],
    entryPoints: ['src/cli.ts'],
    bundle: true,
    format: 'cjs',
    outfile: 'dist/cli.js',
})
