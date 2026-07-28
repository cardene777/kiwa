#!/usr/bin/env node
import { createDefaultDeps, runCli } from './runCli.js';

void runCli(process.argv.slice(2), createDefaultDeps()).then((code) => {
  process.exit(code);
});
