'use strict';

// Custom step definitions for testing Webflow-exported sites: the responsive
// nav (.w-nav / .w-nav-menu / .w-nav-button), AJAX-style forms (.w-form /
// .w-form-done / .w-form-fail), and CMS collection lists (.w-dyn-list /
// .w-dyn-item). Composes with webship-js's built-in steps rather than
// duplicating generic click/fill/assert logic.
//
// The product word is optional in every sentence ("the webflow navigation"
// and "the navigation" both match), so a feature written for another pack
// reads here too. Every assertion waits for its condition (the assertion is
// the wait) for the `minWaitTime.page` budget, and every failure is a
// friendly error with a hint instead of a raw assertion or Playwright stack.

const { When, Then } = require('@cucumber/cucumber');
const { smartSettle, friendly } = require('webship-js/tests/step-definitions/webship');

/** The per-assertion wait budget: `minWaitTime.page` from cucumber.js, else 10 s. */
function budget(world) {
  return Math.max((world.minWaitTime && world.minWaitTime.page) || 0, 10000);
}

/**
 * Run a locator action and rethrow as a friendly error (action, target,
 * cause and a hint) instead of Playwright's raw timeout stack.
 */
async function actOrExplain(label, target, fn, hint) {
  try {
    return await fn();
  } catch (err) {
    throw friendly({ action: label, target, cause: err, hint });
  }
}

/**
 * Wait until `locator` has (or, with `notCase`, has no) visible match, then
 * throw a friendly error otherwise: the wait and the assertion are one call.
 */
async function assertPresence(locator, notCase, { label, hint, timeout }) {
  try {
    await locator.first().waitFor({ state: notCase ? 'hidden' : 'visible', timeout });
  } catch {
    throw friendly({
      message: notCase ? `Expected not to see ${label}, but it is visible.` : `Expected ${label} to be visible, but it did not appear within ${timeout} ms.`,
      hint,
    });
  }
}

// ---------------------------------------------------------------------------
// Navigation (.w-nav)
// ---------------------------------------------------------------------------

/**
 * Assert the Webflow navbar (`.w-nav`) is (or is not) visible.
 *
 * Example #1: Then I should see the webflow navigation menu
 * Example #2: Then I should see the webflow navigation
 * Example #3: And we should see the navigation menu
 * Example #4: Then should not see the webflow navigation
 * Example #5: And I should see the navigation
 *
 */
Then(/^(I |we )*should( not)* see the (?:webflow )?navigation( menu)?$/, async function (pronounCase, notCase, menuCase) {
  await assertPresence(this.page.locator('.w-nav'), notCase, {
    label: 'the Webflow navbar (.w-nav)',
    hint: 'A Webflow export wraps its navbar in `.w-nav`; check the page has a Navbar element and that it is not hidden on this viewport.',
    timeout: budget(this),
  });
});

/**
 * Open the collapsed mobile nav menu by clicking its hamburger button.
 *
 * Example #1: When I open the mobile menu
 * Example #2: When I open the mobile navigation menu
 * Example #3: When we open the mobile menu
 * Example #4: When we open the mobile navigation menu
 * Example #5: And open the mobile menu
 *
 */
When(/^(I |we )*open the mobile( navigation)? menu$/, async function (pronounCase, navCase) {
  const button = this.page.locator('.w-nav .w-nav-button').first();
  await actOrExplain('open', 'the mobile menu', async () => {
    await button.waitFor({ state: 'visible', timeout: budget(this) });
    await button.click();
  }, 'The hamburger button (`.w-nav-button`) only shows below the navbar\'s collapse breakpoint; set the viewport to a mobile breakpoint first.');
  await smartSettle(this.page, 1500);
});

/**
 * Close the expanded mobile nav menu by clicking its hamburger button again.
 *
 * Example #1: When I close the mobile menu
 * Example #2: When I close the mobile navigation menu
 * Example #3: When we close the mobile menu
 * Example #4: When we close the mobile navigation menu
 * Example #5: And close the mobile menu
 *
 */
When(/^(I |we )*close the mobile( navigation)? menu$/, async function (pronounCase, navCase) {
  const button = this.page.locator('.w-nav .w-nav-button').first();
  await actOrExplain('close', 'the mobile menu', async () => {
    await button.waitFor({ state: 'visible', timeout: budget(this) });
    await button.click();
  }, 'The hamburger button (`.w-nav-button`) only shows below the navbar\'s collapse breakpoint; set the viewport to a mobile breakpoint first.');
  await smartSettle(this.page, 1500);
});

/**
 * Assert whether the mobile nav menu is currently open or closed, based on
 * Webflow's `w--nav-menu-open` state class. The class is polled for the
 * wait budget, since the menu animates open and closed.
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
  const timeout = budget(this);
  const menu = this.page.locator('.w-nav .w-nav-menu').first();
  try {
    await menu.waitFor({ state: 'attached', timeout });
    await this.page.waitForFunction(
      (want) => {
        const el = document.querySelector('.w-nav .w-nav-menu');
        return Boolean(el) && el.classList.contains('w--nav-menu-open') === want;
      },
      expectOpen,
      { timeout }
    );
  } catch {
    const hasOpenClass = await menu.evaluate((el) => el.classList.contains('w--nav-menu-open')).catch(() => null);
    throw friendly({
      message: `Expected the mobile menu to be ${expectOpen ? 'open' : 'closed'}, but ${hasOpenClass === null ? 'no `.w-nav-menu` element was found' : `it is ${hasOpenClass ? 'open' : 'closed'}`}.`,
      hint: 'Webflow toggles `w--nav-menu-open` on `.w-nav-menu` when the hamburger is clicked; on a desktop viewport the menu is never "open".',
    });
  }
});

/**
 * Assert that a nav link is (or is not) marked as the current page, based on
 * Webflow's `w--current` class applied by the page's own nav link.
 *
 * Example #1: Then the "Home" navigation link should be the current page
 * Example #2: Then the "About" navigation link should not be the current page
 * Example #3: And the "Services" navigation link should be the current page
 * Example #4: Then the "Contact" navigation link should not be the current page
 * Example #5: And the "Home" navigation link should be the current page
 *
 */
Then(/^the "([^"]*)" navigation link should( not)* be the current page$/, async function (label, notCase) {
  const link = this.page.locator('.w-nav-link', { hasText: label }).first();
  const timeout = budget(this);
  await actOrExplain('find the navigation link', label, () => link.waitFor({ state: 'attached', timeout }),
    'Nav links are `.w-nav-link` elements matched by their visible text; check the wording in the navbar.');
  try {
    await this.page.waitForFunction(
      ({ text, want }) => {
        const el = Array.from(document.querySelectorAll('.w-nav-link')).find((a) => (a.textContent || '').includes(text));
        return Boolean(el) && el.classList.contains('w--current') === want;
      },
      { text: label, want: !notCase },
      { timeout }
    );
  } catch {
    throw friendly({
      message: notCase
        ? `Expected the "${label}" nav link not to be marked current (w--current), but it is.`
        : `Expected the "${label}" nav link to be marked current (w--current), but it is not.`,
      hint: 'Webflow adds `w--current` to the nav link whose href matches the current page; check the link href and the page URL (e.g. "/about.html" vs "/about").',
    });
  }
});

// ---------------------------------------------------------------------------
// CMS collection lists (.w-dyn-list / .w-dyn-item)
// ---------------------------------------------------------------------------

const COLLECTION_HINT = 'The name is a CSS class on the section that wraps the collection list (`.<name> .w-dyn-item`); check the class in the exported markup and that the CMS items are published.';

/**
 * Assert the number of items rendered inside a named CMS collection list.
 * The name matches a CSS class on the section wrapping the collection list
 * (e.g. `.features .w-dyn-item` for a section with class "features"). The
 * count is polled for the wait budget, so a list that is still rendering is
 * waited for.
 *
 * Example #1: Then I should see 3 items in the "features" collection list
 * Example #2: Then I should see 2 items in the "team" collection list
 * Example #3: And we should see 2 items in the "pricing" collection list
 * Example #4: Then I should see 1 item in the "features" collection list
 * Example #5: And should see 3 items in the "team" collection list
 *
 */
Then(/^(I |we )*should see (\d+) items? in the "([^"]*)" collection list$/, async function (pronounCase, countStr, name) {
  const expected = Number(countStr);
  const selector = `.${name} .w-dyn-item`;
  const timeout = budget(this);
  try {
    await this.page.waitForFunction(
      ({ sel, n }) => document.querySelectorAll(sel).length === n,
      { sel: selector, n: expected },
      { timeout }
    );
  } catch {
    const actual = await this.page.locator(selector).count();
    throw friendly({
      message: `Expected ${expected} item(s) in the "${name}" collection list but found ${actual}.`,
      hint: COLLECTION_HINT,
    });
  }
});

/**
 * Assert that a named CMS collection list rendered at least one item (or,
 * with "should be empty", none: Webflow's "empty" collection state).
 *
 * Example #1: Then the "features" collection list should not be empty
 * Example #2: Then the "team" collection list should not be empty
 * Example #3: And the "pricing" collection list should not be empty
 * Example #4: Then the "archive" collection list should be empty
 * Example #5: And the "team" collection list should not be empty
 *
 */
Then(/^the "([^"]*)" collection list should( not)* be empty$/, async function (name, notCase) {
  const items = this.page.locator(`.${name} .w-dyn-item`);
  const timeout = budget(this);
  try {
    // "should not be empty" waits for the first item to attach; "should be
    // empty" waits for the last item to detach.
    await items.first().waitFor({ state: notCase ? 'attached' : 'detached', timeout });
  } catch {
    const actual = await items.count();
    throw friendly({
      message: notCase
        ? `Expected the "${name}" collection list to have at least one item, but it was empty.`
        : `Expected the "${name}" collection list to be empty, but it has ${actual} item(s).`,
      hint: COLLECTION_HINT,
    });
  }
});

// ---------------------------------------------------------------------------
// Forms (.w-form / .w-form-done / .w-form-fail)
// ---------------------------------------------------------------------------

/**
 * Assert the Webflow form's success state (`.w-form-done`) is (or is not)
 * visible, shown after a successful AJAX-style submission.
 *
 * Example #1: Then I should see the webflow form success message
 * Example #2: Then I should see the webflow form success state
 * Example #3: And we should see the form success message
 * Example #4: Then should not see the webflow form success message
 * Example #5: And I should see the form success state
 *
 */
Then(/^(I |we )*should( not)* see the (?:webflow )?form success (?:message|state)$/, async function (pronounCase, notCase) {
  await assertPresence(this.page.locator('.w-form .w-form-done'), notCase, {
    label: 'the Webflow form success message (.w-form-done)',
    hint: 'Webflow shows `.w-form-done` after the AJAX submit succeeds; submit the form first and check the form action answers 200.',
    timeout: budget(this),
  });
});

/**
 * Assert the Webflow form's error state (`.w-form-fail`) is (or is not)
 * visible, shown after a failed AJAX-style submission.
 *
 * Example #1: Then I should see the webflow form error message
 * Example #2: Then I should see the webflow form error state
 * Example #3: And we should see the form error message
 * Example #4: Then should not see the webflow form error message
 * Example #5: And I should see the form error state
 *
 */
Then(/^(I |we )*should( not)* see the (?:webflow )?form error (?:message|state)$/, async function (pronounCase, notCase) {
  await assertPresence(this.page.locator('.w-form .w-form-fail'), notCase, {
    label: 'the Webflow form error message (.w-form-fail)',
    hint: 'Webflow shows `.w-form-fail` when the AJAX submit is rejected; submit the form first and check the form action returns an error for this input.',
    timeout: budget(this),
  });
});

/**
 * Submit the (single) Webflow form on the page by clicking its submit
 * button. Use the built-in field-filling steps beforehand to populate it.
 *
 * Example #1: When I submit the webflow form
 * Example #2: When we submit the webflow form
 * Example #3: And I submit the form
 * Example #4: When submit the webflow form
 * Example #5: And we submit the form
 *
 */
When(/^(I |we )*submit the (?:webflow )?form$/, async function (pronounCase) {
  const submit = this.page.locator('.w-form input[type="submit"], .w-form button[type="submit"]').first();
  await actOrExplain('submit', 'the Webflow form', async () => {
    await submit.waitFor({ state: 'visible', timeout: budget(this) });
    await submit.click();
  }, 'The form must be a Webflow form (`.w-form`) with a visible submit button; fill its fields with the built-in "fill in" steps first.');
  await smartSettle(this.page, 1500);
});

// ---------------------------------------------------------------------------
// Page-level Webflow metadata
// ---------------------------------------------------------------------------

/**
 * Assert that the current page is (or is not) a Webflow export/page (has
 * the `data-wf-page` attribute Webflow stamps on every published `<html>`
 * tag).
 *
 * Example #1: Then this should be a webflow page
 * Example #2: Then this page should be a webflow page
 * Example #3: And this should not be a webflow page
 * Example #4: Then this should be a webflow page
 * Example #5: And this page should be a webflow page
 *
 */
Then(/^this( page)? should( not)* be a webflow page$/, async function (pageCase, notCase) {
  const timeout = budget(this);
  try {
    await this.page.waitForFunction((want) => document.documentElement.hasAttribute('data-wf-page') === want, !notCase, { timeout });
  } catch {
    throw friendly({
      message: notCase
        ? 'Expected the current page not to be a Webflow page, but its <html> tag has a "data-wf-page" attribute.'
        : 'Expected the current page\'s <html> tag to have a "data-wf-page" attribute, but it does not.',
      hint: 'Webflow stamps `data-wf-page` and `data-wf-site` on the `<html>` tag of every published or exported page; a page served by another tool will not carry them.',
    });
  }
});
