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

webship-js writes an HTML report to `tests/reports/cucumber_report.html` after every run (`npm run test:report` regenerates it from the JSON report).

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

## Steps

| Step | Type |
| --- | --- |
| `I should( not) see the (webflow )navigation( menu)` | Then |
| `I open the mobile( navigation) menu` / `I close the mobile( navigation) menu` | When |
| `the mobile( navigation) menu should( not) be open\|closed` | Then |
| `the "<label>" navigation link should( not) be the current page` | Then |
| `I should see <n> item(s) in the "<class>" collection list` | Then |
| `the "<class>" collection list should( not) be empty` | Then |
| `I submit the (webflow )form` | When |
| `I should( not) see the (webflow )form success\|error message\|state` | Then |
| `this( page) should( not) be a webflow page` | Then |

The product word is optional ("the webflow navigation" and "the navigation"
both match), so a feature written for another pack reads here too. Every
Then step takes `should` or `should not`, every pronoun step takes `I`, `we`
or no pronoun, and every failure is a friendly message with a hint (no
assertion or Playwright stack). Each assertion polls its condition for the
`minWaitTime.page` budget (at least 10 s) instead of reading the page once,
so the animated mobile menu and a collection list that is still rendering
are waited for. The reference features assert the demo site's own copy,
item counts and paths (`/about.html`, "Our team", ...); swap them for your
site's content when you copy a feature.

Every step's regex and five Gherkin examples are in the JSDoc block above it
in [`tests/step-definitions/webflow.steps.js`](tests/step-definitions/webflow.steps.js);
`npm run test:examples` checks that each example matches its own step (and no
webship-js core step) and that every feature step is defined exactly once.
CI runs it before the suite.

## CI

`.github/workflows/tests.yml` installs DDEV on the runner, starts the `demo-site` DDEV project as the default test target, waits for it to become reachable, then runs the suite in `tests/features` against it with `cucumber-js`.

## Publishing

The package is publish-ready: `name`, `main`, `files`, `peerDependencies` and `publishConfig.access` are all set in `package.json`. It is released to npmjs.com as [`@webship-js/webflow-steps`](https://www.npmjs.com/package/@webship-js/webflow-steps); development happens in this GitHub repository through pull requests against `2.0.x`.

## License

MIT

### Lanes, subsets and the settings webship-js reads

- `FEATURES=tests/features/a.feature,tests/features/b.feature npm test` runs a subset of the feature files; `CUCUMBER_TAGS=@critical npm test` runs a tag lane (the default run leaves `@wip` out).
- `cucumber.js` carries the `video` block (`WEBSHIP_VIDEO=on-failure` records the browser) and the `javascript` block (`WEBSHIP_JS_ERROR_MODE=fail` fails a scenario on a JavaScript error; `@js-off` silences one scenario) that webship-js reads.
- The step timeout is webship-js's own (45 seconds, set when it loads); `WEBSHIP_STEP_TIMEOUT=<milliseconds>` changes it, a `timeout` key in `cucumber.js` does not.
