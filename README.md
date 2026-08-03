# webflow-steps

Custom [webship-js](https://webship.co) step definitions (`webflow.steps.js`) for testing the main pages of a **Webflow-exported site**: the responsive nav (`.w-nav`), AJAX-style forms (`.w-form` / `.w-form-done` / `.w-form-fail`), and CMS collection lists (`.w-dyn-list` / `.w-dyn-item`).

This repository is both:

1. A **standalone webship-js test project** — it ships a local DDEV demo site (`demo-site/`) that mimics a real Webflow export, plus `.feature` files that exercise it end to end.
2. An **npm-ready plugin** — `webflow.steps.js` and its helpers can be installed into any other webship-js project to reuse the same Webflow-aware steps.

## Requirements

- Node.js >= 20
- [DDEV](https://ddev.com)

## Quick start (this repo)

```bash
npm install
npx playwright install chromium

# Start the local demo Webflow-style site
npm run demo:start        # -> http://webflow-steps-demo.ddev.site

# Run the test suite against it
LAUNCH_URL=http://webflow-steps-demo.ddev.site npm test
```

An HTML report is generated at `tests/reports/cucumber_report.html` after every run.

## Project layout

```
demo-site/                    Local demo "Webflow" site (DDEV project) used as the test target
  .ddev/config.yaml
  index.html, about.html, services.html, contact.html
  css/demo.css
  js/webflow-demo.js          Minimal nav-toggle + AJAX-form behavior, mirrors Webflow's runtime

tests/
  step-definitions/
    webflow.steps.js          The plugin: all custom Webflow-aware step definitions
  features/                   .feature files for the demo site's main pages
    home.feature
    about.feature
    services.feature
    contact.feature
  selectors/                  Named selector registry (webship-js built-in)
  reports/                    Generated test reports (gitignored)

.github/workflows/tests.yml   CI: builds the demo site with DDEV and runs tests/features against it on every push/PR
```

## CI

`.github/workflows/tests.yml` installs DDEV on the runner, starts the `demo-site` DDEV project as the default test target, waits for it to become reachable, then runs the suite in `tests/features` against it with `cucumber-js`.

## Publishing

The package is publish-ready: `name`, `main`, `files`, `peerDependencies` and `publishConfig.access` are all set in `package.json`. It is released to npmjs.com as [`@webship-js/webflow-steps`](https://www.npmjs.com/package/@webship-js/webflow-steps); development happens in this private GitHub repository.

## License

MIT
