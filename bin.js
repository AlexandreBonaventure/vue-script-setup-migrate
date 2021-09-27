#!/usr/bin/env node
require('./.pnp.cjs').setup()
require('ts-node').register();
require('./src/cli.ts');