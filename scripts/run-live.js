'use strict';

// Runs the read-only checks of tests/live/ against public Webflow template
// sites. Each file is named after the site it runs against:
// `tests/live/auvra.feature` runs with LAUNCH_URL=https://auvra.webflow.io.
// `npm run test:live` runs them all; `npm run test:live -- auvra` runs one.
// They are outside the default run because they need the network and the
// sites belong to their authors. A page that is slow to answer is retried
// twice.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LIVE_DIR = path.join(ROOT, 'tests/live');
const only = process.argv.slice(2);

const files = fs.readdirSync(LIVE_DIR)
  .filter((f) => f.endsWith('.feature'))
  .filter((f) => !only.length || only.includes(path.basename(f, '.feature')));

if (!files.length) {
  console.error(`No live feature found${only.length ? ` for: ${only.join(', ')}` : ''}.`);
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  const site = path.basename(file, '.feature');
  const url = `https://${site}.webflow.io`;
  console.log(`\n== ${file} against ${url}`);
  const result = spawnSync('npx', ['cucumber-js', '--config', 'cucumber.js', '--retry', '2'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, LAUNCH_URL: url, FEATURES: path.join('tests/live', file), CUCUMBER_TAGS: '@live' },
  });
  if (result.status !== 0) failed++;
}
process.exit(failed ? 1 : 0);
