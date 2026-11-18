<p align="center"><img src="https://raw.githubusercontent.com/webship/webflow-steps/2.0.x/assets/logo.svg" alt="Webflow logo" width="96"></p>

# webflow-steps

Step definitions for [webship-js](https://www.npmjs.com/package/webship-js), a Playwright and Cucumber test framework, that understand the markup **Webflow itself publishes**: the Navbar and its mobile menu, the link of the current page, CMS collection lists, forms with their success and error states, Tabs, Sliders, Dropdowns, Lightboxes, the Ecommerce cart and checkout, the Background Video control, and the ids Webflow stamps on every page. They let a team write readable Gherkin scenarios for a Webflow site, a published one or a code export, without hand-writing CSS selectors.

The pack is a plugin for webship-js. It adds step files and a helpers module to an existing webship-js test project; it does not run on its own.

This repository is also a working test project. Its `demo-site/` is a small Webflow-style site (the markup, state classes and form behaviour of a published Webflow site) that the scenarios in `tests/features/` run against.

## What is covered

- **Navigation.** The Navbar is visible; the mobile menu opens, closes and reports its state; a Navbar link is the current page; the Navbar lists a link.
- **CMS collection lists.** The number of items a list renders, at least a number, an empty list, Webflow's "No items found." message, a text in an item. Items hidden by conditional visibility are not counted.
- **Forms.** Submit a form (the first, or one by its name); its success and error messages, and their text; a form is protected by a challenge; the submit button is disabled. Two test doubles let a scenario drive both states of any Webflow form without submitting anything: the form endpoint accepts or rejects submissions, and the Cloudflare Turnstile challenge passes.
- **Tabs.** Select a tab by its text, a tab is selected, its content is shown.
- **Slider.** Go to the next or previous slide, which slide is shown, how many slides there are.
- **Dropdown.** Open or close a dropdown by its toggle text, it is open, it lists a link.
- **Lightbox.** Open and close it, it is open.
- **Ecommerce.** The cart opens, closes, is empty or holds items, a product, a total; continue to the checkout; add the product of the page to the cart; the product is out of stock; the add to cart error; the checkout form and its sections.
- **Background video.** The video plays or is paused; a visitor can pause and play it with its control (WCAG 2.2.2 "Pause, Stop, Hide").
- **Site identity.** The page is published by Webflow; the page belongs to the Webflow site with a given id; the "Made in Webflow" badge is shown or not.

Every assertion takes `should` or `should not`, every action takes `I`, `we` or no pronoun, no step phrase names the platform, and every failure is a friendly message with a hint, not a stack trace. Each assertion waits for its condition for the `minWaitTime.page` budget (at least ten seconds), because Webflow animates its menus and answers its forms asynchronously.

The steps that add to a cart or take an order change a store's data: run them against a store in test mode. The steps that only look at the cart and the checkout page are safe on any store.

Steps that webship-js already covers (clicking, filling in a field, asserting a text, a URL or a status code) are not repeated here; the scenarios use webship-js's own.

## From nothing to a green run

What the machine needs: git, Node.js 20 or later with npm, and [DDEV](https://ddev.com)
for the demo site (or no container at all: `npx http-server` serves the same pages).

**1. The site.** The demo site of this repository: static pages with the markup,
state classes and form behaviour of a published Webflow site (the Navbar,
CMS collection lists, forms, tabs, a slider, dropdowns, a lightbox, the
Ecommerce cart and checkout, a background video). Start it with DDEV:

```bash
git clone https://github.com/webship/webflow-steps.git
cd webflow-steps/demo-site
ddev start
```

The site answers at `http://webflow-steps-demo.ddev.site`. Without DDEV, from
the `webflow-steps` folder, `npx http-server demo-site -p 8080 -s` serves it at
`http://localhost:8080`; leave it running in its own terminal.

**2. A test project**, in another folder:

```bash
mkdir webflow-tests && cd webflow-tests
npm init -y
npm install --save-dev webship-js @webship-js/webflow-steps
npx init-webship-js
```

`npx init-webship-js` writes `cucumber.js`, `playwright.config.ts`, the
`tests/` folders with a first feature and the `npm test` scripts, and installs
Chromium. npm usually runs it already when it installs webship-js; a second run
changes nothing.

**3. `cucumber.js`.** Replace the file with the wiring of the pack: the step
files of webship-js and of the pack, and the address of the site. The suite
needs no account (see [Test users](#test-users)).

```javascript
module.exports = {
  default: {
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',
      'node_modules/@webship-js/webflow-steps/tests/step-definitions/**/*.js',
      'tests/step-definitions/**/*.js',
    ],
    paths: ['tests/features/**/*.feature'],
    format: ['@cucumber/pretty-formatter', 'json:tests/reports/cucumber_report.json'],
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'http://webflow-steps-demo.ddev.site',
      // The waits webship-js adds around each page, scenario and step (milliseconds).
      minWaitTime: { page: 3000, before_scenario: 0, after_scenario: 0, before_step: 0, after_step: 0 },
    },
  },
};
```

With the site of `npx http-server`, run with `LAUNCH_URL=http://localhost:8080`.

**4. A first feature**, `tests/features/first-run.feature`:

```gherkin
Feature: First run
  Scenario: The home page is a published page with its Navbar
    Given I am on the homepage
    Then this should be a published page
    And I should see the navigation
    And the "Home" navigation link should be the current page
    And I should see 3 items in the "features" collection list

  Scenario: The newsletter form thanks the visitor
    Given the form endpoint accepts submissions
    When I am on the homepage
    And I fill in "email" with "visitor@example.com" by "name" attribute
    And I submit the "Newsletter" form
    Then I should see the form success message
```

**5. Run it.**

```bash
npm test
```

(The demo served without DDEV: `LAUNCH_URL=http://localhost:8080 npm test`.)
A green first run prints every step, then the summary (the starter feature of
`npx init-webship-js` and the two scenarios above, passed) and the HTML report
it wrote:

```
3 scenarios (3 passed)
12 steps (12 passed)
0m02.998s (executing steps: 0m02.963s)
[webship-js] HTML report → …/webflow-tests/tests/reports/cucumber_report.html
```

From there, copy the features of [`tests/features/`](tests/features/) (they
also ship in the package, under
`node_modules/@webship-js/webflow-steps/tests/features/`): together they use
every step of the pack, against the pages of the demo site.

### What the suite tests

The features of this repository run every step of the pack against the demo
site, and CI starts it with DDEV and runs them on every change: what a site
publishes on every page (its page and site ids, the hosting badge, and a plain
page beside it that is not published), the Navbar on desktop and its mobile
menu, the link of the current page (nav links, link blocks, the brand), CMS
collection lists (counts, the empty state, items hidden by conditional
visibility), forms (the success and the error state with the endpoint double,
the Turnstile challenge and its double, a form without a challenge, the submit
button), tabs, a slider, dropdowns (opened by a click and on hover), a lightbox,
the Ecommerce cart (open, close, count, items, total), the add to cart button
(a product out of stock, an option not chosen), the checkout form (its sections,
and the shipping sections an order of digital products leaves out), a
background video and its control, and the named selectors of the pack. Every
assertion runs in its positive and in its negative form.

Not tested: Webflow's own runtime (`webflow.js`). The demo's small script stands
in for it, so the suite proves that the steps read Webflow's markup and states,
not that a given Webflow release produces them; the read-only checks of
[`tests/live/`](tests/live/) run the steps on public template sites for that,
outside CI. Also not tested: a real form submission and a real Turnstile
challenge (both are test doubles), payments and orders (the checkout is a page;
no order is placed), Memberships, Logic, Localization, CMS pagination and
filters, and Interactions (animations). A run leaves nothing: the site is static
and the cart lives in the browser.

## Requirements

- Node.js 20 or later
- An existing webship-js 2.x test project, or this repository as a starting point
- [DDEV](https://ddev.com), only to run the demo site of this repository

## Installation

```bash
npm install --save-dev webship-js @webship-js/webflow-steps
```

Add the pack's step files to `cucumber.js`, after webship-js's own:

```javascript
module.exports = {
  default: {
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',               // webship-js core steps
      'node_modules/@webship-js/webflow-steps/tests/step-definitions/**/*.js', // this pack
      'tests/step-definitions/**/*.js',                                        // your own steps, if any
    ],
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'https://your-site.webflow.io',
    },
  },
};
```

Run `npx cucumber-js --dry-run` once: it reports any undefined or ambiguous step before a browser opens.

## Test users

None. The suite tests the demo site of this repository (`demo-site/`, static
pages with the markup of a published Webflow site), which has no sign-in:
`cucumber.js` lists no accounts (its `worldParameters` has no `users`) and no
scenario signs in. The form and cart steps need no account either: the form
endpoint and the Turnstile challenge are test doubles, and the cart of the demo
lives in the browser. The JSON of the accounts is empty:

```json
{}
```

## Quick start (this repository)

```bash
npm install
npx playwright install chromium

npm run demo:start        # the demo site, at http://webflow-steps-demo.ddev.site
LAUNCH_URL=http://webflow-steps-demo.ddev.site npm test
```

Without DDEV, `npx http-server demo-site -p 8080 -s` serves the same pages, and `LAUNCH_URL=http://localhost:8080 npm test` runs the suite against them.

webship-js writes an HTML report to `tests/reports/cucumber_report.html` after every run; `npm run test:report` regenerates it from the JSON report.

## Steps

| Step | Type |
| --- | --- |
| `I should( not) see the navigation( menu)` | Then |
| `the navigation( menu) should( not) list "<text>"` | Then |
| `I open\|close the mobile( navigation) menu` | When |
| `the mobile( navigation) menu should( not) be open\|closed` | Then |
| `the "<text>" navigation link should( not) be the current page` | Then |
| `I should see <n> item(s) in the "<name>" collection list` | Then |
| `I should see at least <n> item(s) in the "<name>" collection list` | Then |
| `the "<name>" collection list should( not) be empty` | Then |
| `the "<name>" collection list should( not) show the empty message\|state` | Then |
| `the "<name>" collection list should( not) contain "<text>"` | Then |
| `I submit the ("<name>" )form` | When |
| `I should( not) see the form success\|error message\|state` | Then |
| `the form success\|error message should( not) contain "<text>"` | Then |
| `the ("<name>" )form should( not) be protected by a challenge` | Then |
| `the form submit button should( not) be disabled` | Then |
| `the form endpoint accepts\|rejects submissions` | Given |
| `the (form )(Turnstile )challenge passes` | Given |
| `I select the "<text>" tab` | When |
| `the "<text>" tab should( not) be selected` | Then |
| `the "<text>" tab content should( not) be visible` | Then |
| `I go to the next\|previous slide( of the "<class>" slider)` | When |
| `the ("<class>" )slider should show slide <n> of <m>` | Then |
| `the ("<class>" )slider should have <n> slide(s)` | Then |
| `I open\|close the "<text>" dropdown` | When |
| `the "<text>" dropdown should( not) be open\|closed` | Then |
| `the "<text>" dropdown should( not) list "<text>"` | Then |
| `I open the ("<class>" )lightbox` / `I close the lightbox` | When |
| `the lightbox should( not) be open\|closed` | Then |
| `I open\|close the cart` | When |
| `the cart should( not) be open\|closed` | Then |
| `the cart should( not) be empty` | Then |
| `the cart should contain <n> item(s)` | Then |
| `the cart should( not) contain "<product>"` | Then |
| `the cart total should contain "<text>"` | Then |
| `I continue to checkout` | When |
| `I add the product to the cart` | When |
| `the product should( not) be out of stock` | Then |
| `I should( not) see the add to cart error` | Then |
| `I should( not) see the checkout form` | Then |
| `the checkout form should( not) have the "<section>" section` | Then |
| `the background video should( not) be playing` | Then |
| `the background video should( not) have a pause control` | Then |
| `I pause\|play the background video` | When |
| `I should( not) see the hosting badge` | Then |
| `this( page) should( not) be a published page` | Then |
| `this( page) should be the site "<id>"` | Then |

Every step's regex and five Gherkin examples are in the JSDoc block above it in `tests/step-definitions/`. `npm run test:examples` checks that each example matches its own step, and no webship-js step, and that every feature step is defined exactly once. CI runs it before the suite.

## What the steps read

The steps rely on what Webflow's published stylesheet and script do, not on the classes a designer chose.

| Area | Markup and states |
| --- | --- |
| Navbar | `.w-nav` (with `data-collapse`, `data-animation`, `data-duration`) holds `.w-nav-menu`, `.w-nav-button` and the links. A header made without the Navbar element has no `.w-nav`. |
| Mobile menu | Opening puts `w--open` on `.w-nav-button`, `data-nav-menu-open` on the menu (which moves into `.w-nav-overlay`) and `w--nav-link-open` on the links; `aria-expanded` on the button changes when the animation ends. |
| Current page | A link whose address is the page's has `aria-current="page"` and `w--current`. This holds for every link, whatever its class: most templates build the menu from link blocks (`.w-inline-block`), not `.w-nav-link`. |
| Collection list | `.w-dyn-list` > `.w-dyn-items` (`role="list"`) > `.w-dyn-item` (`role="listitem"`). An empty collection renders `.w-dyn-empty` ("No items found."). `.w-condition-invisible`, `.w-dyn-hide` and `.w-dyn-bind-empty` are `display: none !important`. |
| Forms | `.w-form` > `form` + `.w-form-done` + `.w-form-fail` (each `role="region"`). The runtime posts to `https://webflow.com/api/v1/form/<data-wf-site>`; the answer `{"code": 200}` hides the form and shows `.w-form-done`, anything else shows `.w-form-fail`. A form with `data-turnstile-sitekey` keeps its submit button disabled until the Turnstile challenge passes. |
| Tabs | `.w-tabs` > `.w-tab-menu` > `.w-tab-link` (`role="tab"`, `data-w-tab`, `aria-selected`, `w--current` when selected) and `.w-tab-content` > `.w-tab-pane` (`role="tabpanel"`, the same `data-w-tab`, `w--tab-active` when shown). |
| Slider | `.w-slider` (`role="region"`) > `.w-slider-mask` > `.w-slide`; the shown slide has no `aria-hidden="true"`. Arrows `.w-slider-arrow-left` and `-right`, dots `.w-slider-dot` (`w-active`), live region `.w-slider-aria-label` ("Slide 2 of 3."). A slider with `data-autoplay="true"` moves on by itself, so a slide can change between two steps. |
| Dropdown | `.w-dropdown` > `.w-dropdown-toggle` (`aria-expanded`, `w--open`) + `.w-dropdown-list` (`w--open`). `data-hover="true"` opens it on hover. |
| Lightbox | `a.w-lightbox` opens `.w-lightbox-backdrop` on the body (`w-lightbox-hide` when closed) with `.w-lightbox-close`. |
| Cart | `.w-commerce-commercecartwrapper` holds the open link (`.w-commerce-commercecartopenlink`, with the item count in `.w-commerce-commercecartopenlinkcount`) and the cart (`.w-commerce-commercecartcontainerwrapper`, `display: none` until it opens) with its items (`.w-commerce-commercecartitem`, named by `.w-commerce-commercecartproductname`), total (`.w-commerce-commercecartordervalue`) and checkout button. |
| Product | `form.w-commerce-commerceaddtocartform` with `.w-commerce-commerceaddtocartbutton`; `.w-commerce-commerceaddtocartoutofstock` and `.w-commerce-commerceaddtocarterror` are shown when needed. |
| Checkout | `.w-commerce-commercecheckoutformcontainer` with the sections `customerinfo`, `shippingaddress`, `shippingmethods`, `paymentinfo` and `ordersummary` (`.w-commerce-commercecheckout<name>wrapper`). |
| Background video | `.w-background-video` with a `video` and, when the designer shows it, the control `.w-background-video--control` (two labels, "Pause video" and "Play video", one of them `hidden`). |
| Badge | `a.w-webflow-badge`, added by Webflow's script when `<html data-wf-status>` is set (the free hosting plan). |
| Page | `<html data-wf-page data-wf-site data-wf-domain>` on every published page. |

A collection list is named by a class: of its wrapper, of its `.w-dyn-items` element, of its items, or of the section around it, in that order. The name in the scenario is the name the designer sees in the Style panel.

## Named selectors

webship-js's named-selector steps (`Then I see visible <name>`, `Then I don't see <name>`, `Then I see <name> above <name>`, `When I click on <name>`) read names from a registry. The pack adds its own preset, [`tests/selectors/webflow.json`](tests/selectors/webflow.json), to every scenario, so these names work on any Webflow site with nothing configured. A name you define in `worldParameters.selectors` or load from `files` wins over the preset.

| Name | Markup |
| --- | --- |
| `navbar`, `navbar menu`, `navbar button`, `navbar logo`, `navbar link`, `current page link` | the Navbar and its links |
| `form`, `form success message`, `form error message`, `form submit button` | forms |
| `collection list`, `collection item`, `collection empty message` | CMS collection lists |
| `tabs`, `tab link`, `selected tab`, `tab panel`, `shown tab panel` | Tabs |
| `slider`, `slide`, `slider arrow previous`, `slider arrow next`, `slider dots` | Slider |
| `dropdown`, `dropdown toggle`, `dropdown list`, `open dropdown list` | Dropdown |
| `lightbox`, `lightbox backdrop` | Lightbox (the backdrop only while open) |
| `cart`, `cart open link`, `cart close link`, `cart container`, `cart empty message`, `cart checkout button`, `add to cart button`, `out of stock message`, `add to cart error`, `checkout form` | Ecommerce |
| `background video`, `background video control`, `hosting badge`, `rich text` | media and page |

The names `form` and `hosting badge` were `webflow form` and `webflow badge` in 2.1; the old names still work.

```gherkin
When I am on the homepage
Then I see visible navbar, collection list, form
And I don't see form success message, hosting badge
```

## Forms: success and error states

The real form endpoint belongs to Webflow, and a Turnstile-protected form cannot be submitted by a scripted browser. Two Given steps replace both outside services, so a scenario can prove how a site behaves in each state, on a public site as well, without sending anything to it. Give them before opening the page:

```gherkin
Scenario: The contact form thanks the visitor
  Given the form endpoint accepts submissions
  And the Turnstile challenge passes
  When I am on "/contact"
  And I fill in "Name" with "Jane Doe"
  And I fill in "Email" with "jane@example.com"
  And I submit the "Contact Form" form
  Then I should see the form success message
  And the form success message should contain "Thank you"
```

Use them on a staging copy of the site or on a read-only check. They do not bypass the protection of a live form: nothing is submitted.

## Run the steps against a public Webflow site

`tests/live/` holds read-only checks against public Webflow template sites (`koorse`, `clientflow`, `deluix`), to prove the steps read what a real Webflow runtime produces, and not only what `demo-site/` serves. The file name is the site: `tests/live/koorse.feature` runs against `https://koorse.webflow.io`. The tabs and the mobile menu are proven on `demo-site/` only: the tabs of these sites are FAQs whose links hold the answer text too, and their mobile menus are the templates' own, not the Navbar's (Koorse keeps an empty `.w-nav-button` with no size).

```bash
npm run test:live              # every file in tests/live
npm run test:live -- koorse    # one site
```

They are outside the default run: they need the network, and the sites belong to their authors. Nothing is submitted to them; the form endpoint and the Turnstile challenge are test doubles.

## Project layout

```
demo-site/                      The demo site (a DDEV project) used as the test target
  index.html, about.html, services.html, contact.html, components.html, shop.html, checkout.html, media/background.webm
  css/webflow-base.css          The rules of Webflow's published stylesheet that the pages use
  css/demo.css                  The look of the pages
  js/webflow-demo.js            A small stand-in for Webflow's script: current link, Navbar, tabs, slider, dropdown, lightbox, cart, forms

tests/
  live/                         Read-only checks against public Webflow template sites
  step-definitions/
    webflow-helpers.js          Shared helpers (not a step file)
    webflow-defaults.js         Adds the named selectors to every scenario (a hook, no steps)
    webflow-navigation.steps.js
    webflow-cms.steps.js
    webflow-forms.steps.js
    webflow-components.steps.js
    webflow-commerce.steps.js
    webflow-media.steps.js
    webflow-site.steps.js
  features/                     The scenarios against demo-site/, one file per area or page
  selectors/webflow.json        The named selectors the pack adds (see Named selectors)
  reports/                      Generated test reports (not committed)

.github/workflows/tests.yml     CI: starts the demo site with DDEV, runs the checks and the suite
```

The features assert the demo site's own copy, item counts and paths (`/about.html`, "Our team"); replace them with your site's content when you copy a feature.

## Lanes, subsets and the settings webship-js reads

- `npx cucumber-js tests/features/home.feature` runs one feature and `npx cucumber-js tests/features/home.feature:<line>` one scenario (the line of its `Scenario:`; the paths of `cucumber.js` are left out when the command line names any, and `npm run test:paths` checks it); `FEATURES=tests/features/a.feature,tests/features/b.feature npm test` runs a subset of the feature files too; `CUCUMBER_TAGS=@mobile npm test` runs a tag lane (the default run leaves `@wip` out).
- `cucumber.js` carries the `video` block (`WEBSHIP_VIDEO=on-failure` records the browser) and the `javascript` block (`WEBSHIP_JS_ERROR_MODE=fail` fails a scenario on a JavaScript error; `@js-off` silences one scenario) that webship-js reads.
- The step timeout is webship-js's own (45 seconds, set when it loads); `WEBSHIP_STEP_TIMEOUT=<milliseconds>` changes it. A `timeout` key in `cucumber.js` is ignored.

## CI

`.github/workflows/tests.yml` installs DDEV on the runner, starts the `demo-site` project, waits until it answers, checks the examples, checks that a feature named on the command line runs alone (`npm run test:paths`), runs the dry run (no undefined or ambiguous step) and runs the suite in `tests/features` against it.

## Publishing

The package is published to npmjs.com as [`@webship-js/webflow-steps`](https://www.npmjs.com/package/@webship-js/webflow-steps). Development happens in this GitHub repository through pull requests against `2.0.x`.

## License

MIT

## Logo

The Webflow logo in this README comes from Simple Icons 16.37.0 (CC0-1.0), filled with the colour the set lists for the brand. The Webflow name and logo are trademarks of their owner; this pack is not affiliated with or endorsed by them.
