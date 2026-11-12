'use strict';

// Steps for the Webflow Navbar element: the `.w-nav` wrapper, its menu
// (`.w-nav-menu`), the hamburger button (`.w-nav-button`) and the links that
// Webflow's runtime marks as the current page.
//
// What Webflow's runtime really does, read from its published script and
// observed on public Webflow sites:
// - Below the Navbar's collapse breakpoint (`data-collapse` is `all`,
//   `medium`, `small` or `tiny`) the button is shown and the menu is hidden.
// - Opening the menu puts `w--open` on the button, the `data-nav-menu-open`
//   attribute on the menu (the menu moves into a `.w-nav-overlay` inside the
//   Navbar), `w--nav-link-open` on the links, and sets `aria-expanded="true"`
//   on the button when the animation ends. Closing undoes all of it.
// - A link whose address is the current page gets `w--current`, and the
//   published HTML carries `aria-current="page"` on it. This holds for every
//   link of the page, not only for `.w-nav-link`: most templates build their
//   menu from link blocks (`.w-inline-block`) or plain classes.
// - A header built without the Navbar element has no `.w-nav` at all.

const { When, Then } = require('@cucumber/cucumber');
const { friendly } = require('webship-js/tests/step-definitions/webship');
const {
  budget,
  escapeRe,
  actOrExplain,
  assertPresence,
  waitForCondition,
} = require('./webflow-helpers');

const SELECTORS = {
  navbar: '.w-nav',
  button: '.w-nav .w-nav-button',
  links: '.w-nav a[href]',
};

const BREAKPOINT_HINT = 'The hamburger button (`.w-nav-button`) only shows below the Navbar\'s collapse breakpoint (its `data-collapse` setting: `medium` is 991 px and below, `small` 767 px, `tiny` 478 px); set the viewport to a mobile breakpoint first.';

// Runs in the page. `true` when the first Navbar menu is open, `false` when it
// is closed, `null` when the page has no hamburger button. `aria-expanded` is
// set by the runtime when an animation ends, so it is the settled answer; the
// `w--open` class is the fallback for an export that predates it.
function readMenuState() {
  const button = document.querySelector('.w-nav .w-nav-button');
  if (!button) return null;
  const expanded = button.getAttribute('aria-expanded');
  const open = expanded !== null ? expanded === 'true' : button.classList.contains('w--open');
  const attribute = Boolean(document.querySelector('.w-nav [data-nav-menu-open]'));
  return open ? true : (attribute ? 'closing' : false);
}

// Runs in the page. The Navbar links whose exact text, or `aria-label`, is
// `text`: how many there are, whether one of them is the current page, and the
// names of all the Navbar links (for the error message).
function navLinkState(text) {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const links = [...document.querySelectorAll('.w-nav a[href]')];
  const named = (a) => norm(a.textContent) || norm(a.getAttribute('aria-label'));
  const matches = links.filter((a) => norm(a.textContent) === text || norm(a.getAttribute('aria-label')) === text);
  return {
    found: matches.length,
    current: matches.some((a) => a.getAttribute('aria-current') === 'page' || a.classList.contains('w--current')),
    names: [...new Set(links.map(named).filter(Boolean))],
  };
}

/**
 * Assert the Webflow Navbar (`.w-nav`) is, or is not, visible. A header that
 * was built from plain elements instead of the Navbar element has no `.w-nav`.
 *
 * Example #1: Then I should see the webflow navigation menu
 * Example #2: Then I should see the webflow navigation
 * Example #3: And we should see the navigation menu
 * Example #4: Then I should not see the webflow navigation
 * Example #5: And I should see the navigation
 *
 */
Then(/^(I |we )*should( not)* see the (?:webflow )?navigation( menu)?$/, async function (pronounCase, notCase, menuCase) {
  await assertPresence(this.page.locator(SELECTORS.navbar), notCase, {
    label: 'the Webflow Navbar (.w-nav)',
    hint: 'A page built with the Navbar element wraps its menu in `.w-nav`; a header made from plain elements has none, and the Navbar is hidden when its section is.',
    timeout: budget(this),
  });
});

/**
 * Open or close the collapsed mobile menu with its hamburger button. The step
 * is idempotent: opening a menu that is open, or closing one that is closed,
 * does nothing. It waits until the runtime reports the new state
 * (`aria-expanded`), which is after the menu animation ends.
 *
 * Example #1: When I open the mobile menu
 * Example #2: When I open the mobile navigation menu
 * Example #3: When we close the mobile menu
 * Example #4: And I close the mobile navigation menu
 * Example #5: When we open the mobile navigation menu
 *
 */
When(/^(I |we )*(open|close) the mobile( navigation)? menu$/, async function (pronounCase, action, navCase) {
  const wantOpen = action === 'open';
  const button = this.page.locator(SELECTORS.button).first();
  await actOrExplain(action, 'the mobile menu', async () => {
    await button.waitFor({ state: 'visible', timeout: budget(this) });
    const state = await this.page.evaluate(readMenuState);
    if ((state === true) !== wantOpen) await button.click();
  }, BREAKPOINT_HINT);
  await waitForCondition(this, `(${readMenuState})() === ${wantOpen}`, undefined, async () => friendly({
    message: `Expected the mobile menu to be ${wantOpen ? 'open' : 'closed'} after the click, but it is not.`,
    hint: 'The menu animates for the Navbar\'s `data-duration`, and Webflow\'s script sets `aria-expanded` on `.w-nav-button` when it ends; check that webflow.js is loaded, and that nothing covers the button.',
  }));
});

/**
 * Assert the mobile menu is open or closed, from the state Webflow's runtime
 * keeps (`aria-expanded` on the button, and `w--open`), polled for the wait
 * budget because the menu animates. On a desktop viewport the menu is never
 * open.
 *
 * Example #1: Then the mobile menu should be open
 * Example #2: Then the mobile menu should be closed
 * Example #3: And the mobile navigation menu should be open
 * Example #4: Then the mobile menu should not be open
 * Example #5: And the mobile navigation menu should not be closed
 *
 */
Then(/^the mobile( navigation)? menu should( not)* be (open|closed)$/, async function (navCase, notCase, state) {
  const expectOpen = notCase ? state !== 'open' : state === 'open';
  await waitForCondition(this, `(${readMenuState})() === ${expectOpen}`, undefined, async () => {
    const current = await this.page.evaluate(readMenuState);
    return friendly({
      message: `Expected the mobile menu to be ${expectOpen ? 'open' : 'closed'}, but ${current === null ? 'the page has no hamburger button (`.w-nav .w-nav-button`)' : `it is ${current === true ? 'open' : 'closed'}`}.`,
      hint: 'Webflow sets `aria-expanded` on `.w-nav-button` and `data-nav-menu-open` on the menu when the hamburger is clicked; on a viewport above the Navbar\'s collapse breakpoint the button is hidden and the menu is never open.',
    });
  });
});

/**
 * Assert a link of the Navbar is, or is not, marked as the current page:
 * `aria-current="page"` in the published HTML, or the `w--current` class that
 * Webflow's runtime adds to a link whose address is the page's. The link is
 * found by its exact text (or its `aria-label`, for a logo link) among all the
 * links of the Navbar, whatever class they carry, and the menu need not be
 * open.
 *
 * Example #1: Then the "Home" navigation link should be the current page
 * Example #2: Then the "About" navigation link should not be the current page
 * Example #3: And the "Services" navigation link should be the current page
 * Example #4: Then the "Contact" navigation link should not be the current page
 * Example #5: And the "Home" navigation link should be the current page
 *
 */
Then(/^the "([^"]*)" navigation link should( not)* be the current page$/, async function (label, notCase) {
  const lookup = `(${navLinkState})(${JSON.stringify(label)})`;
  await waitForCondition(this, `${lookup}.found > 0`, undefined, async () => {
    const { names } = await this.page.evaluate(navLinkState, label);
    return friendly({
      message: `No "${label}" link was found in the Webflow Navbar.`,
      hint: names.length ? `The Navbar links are: ${names.map((n) => `"${n}"`).join(', ')}.` : 'The page has no `.w-nav` Navbar with links in it.',
    });
  });
  await waitForCondition(this, `${lookup}.current === ${!notCase}`, undefined, async () => friendly({
    message: notCase
      ? `Expected the "${label}" Navbar link not to be the current page, but it is marked current.`
      : `Expected the "${label}" Navbar link to be the current page, but it is not marked current.`,
    hint: 'Webflow adds `w--current` (and publishes `aria-current="page"`) on a link whose address is the page\'s; compare the link\'s href with the page address (`/about` against `/about.html`).',
  }));
});

/**
 * Assert the Navbar lists, or does not list, a link by its exact text. The
 * links of a collapsed menu are in the markup whether or not the menu is
 * open, so the step does not open it.
 *
 * Example #1: Then the navigation should list "Home"
 * Example #2: And the navigation menu should list "Services"
 * Example #3: Then the navigation should not list "Admin"
 * Example #4: And the webflow navigation should list "Contact"
 * Example #5: Then the navigation menu should not list "Login"
 *
 */
Then(/^the (?:webflow )?navigation( menu)? should( not)* list "([^"]*)"$/, async function (menuCase, notCase, text) {
  const link = this.page.locator(SELECTORS.links).filter({ hasText: new RegExp(`^\\s*${escapeRe(text)}\\s*$`) }).first();
  try {
    await link.waitFor({ state: notCase ? 'detached' : 'attached', timeout: budget(this) });
  } catch {
    throw friendly({
      message: notCase
        ? `Expected the Webflow Navbar not to list "${text}", but it does.`
        : `Expected the Webflow Navbar to list "${text}", but it does not.`,
      hint: 'The link is matched by its exact visible text among the links inside `.w-nav`; a link in a separate header outside the Navbar is not counted.',
    });
  }
});

module.exports = { SELECTORS };
