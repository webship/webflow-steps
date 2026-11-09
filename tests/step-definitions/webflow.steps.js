'use strict';

// Custom step definitions for testing Webflow-exported sites: the responsive
// nav (.w-nav / .w-nav-menu / .w-nav-button), AJAX-style forms (.w-form /
// .w-form-done / .w-form-fail), and CMS collection lists (.w-dyn-list /
// .w-dyn-item). Composes with webship-js's built-in steps rather than
// duplicating generic click/fill/assert logic.

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { smartSettle, friendly } = require('webship-js/tests/step-definitions/webship');

// ---------------------------------------------------------------------------
// Navigation (.w-nav)
// ---------------------------------------------------------------------------

/**
 * Assert the Webflow navbar is present and visible.
 *
 * Example #1: Then I should see the webflow navigation menu
 * Example #2: Then I should see the webflow navigation
 * Example #3: And we should see the webflow navigation menu
 * Example #4: Then should see the webflow navigation
 * Example #5: And I should see the webflow navigation menu
 *
 */
Then(/^(I |we )*should see the webflow navigation( menu)?$/, async function (pronounCase, menuCase) {
  const nav = this.page.locator('.w-nav').first();
  await nav.waitFor({ state: 'visible', timeout: 10000 });
  assert.ok(await nav.isVisible(), 'Expected the Webflow navbar (.w-nav) to be visible.');
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
  await button.waitFor({ state: 'visible', timeout: 10000 });
  await button.click();
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
  await button.waitFor({ state: 'visible', timeout: 10000 });
  await button.click();
  await smartSettle(this.page, 1500);
});

/**
 * Assert whether the mobile nav menu is currently open or closed, based on
 * Webflow's `w--nav-menu-open` state class.
 *
 * Example #1: Then the mobile menu should be open
 * Example #2: Then the mobile menu should be closed
 * Example #3: And the mobile navigation menu should be open
 * Example #4: Then the mobile menu should not be open
 * Example #5: And the mobile navigation menu should not be closed
 *
 */
Then(/^the mobile( navigation)? menu should( not)* be (open|closed)$/, async function (navCase, notCase, state) {
  const menu = this.page.locator('.w-nav .w-nav-menu').first();
  const hasOpenClass = await menu.evaluate((el) => el.classList.contains('w--nav-menu-open'));
  const expectOpen = notCase ? state !== 'open' : state === 'open';
  assert.strictEqual(hasOpenClass, expectOpen,
    `Expected mobile menu open state to be "${expectOpen}" but found "${hasOpenClass}".`);
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
  await link.waitFor({ state: 'attached', timeout: 10000 });
  const isCurrent = await link.evaluate((el) => el.classList.contains('w--current'));
  if (notCase) {
    assert.ok(!isCurrent, `Expected "${label}" nav link to NOT be marked current, but it was.`);
  } else {
    assert.ok(isCurrent, `Expected "${label}" nav link to be marked current, but it was not.`);
  }
});

// ---------------------------------------------------------------------------
// CMS collection lists (.w-dyn-list / .w-dyn-item)
// ---------------------------------------------------------------------------

/**
 * Assert the number of items rendered inside a named CMS collection list.
 * The name matches a CSS class on the section wrapping the collection list
 * (e.g. `.features .w-dyn-item` for a section with class "features").
 *
 * Example #1: Then I should see 3 items in the "features" collection list
 * Example #2: Then I should see 2 items in the "team" collection list
 * Example #3: And we should see 2 items in the "pricing" collection list
 * Example #4: Then I should see 1 item in the "features" collection list
 * Example #5: And should see 3 items in the "team" collection list
 *
 */
Then(/^(I |we )*should see (\d+) items?( ?in)? the "([^"]*)" collection list$/, async function (pronounCase, countStr, inCase, name) {
  const items = this.page.locator(`.${name} .w-dyn-item`);
  const actual = await items.count();
  assert.strictEqual(actual, Number(countStr),
    `Expected ${countStr} item(s) in the "${name}" collection list but found ${actual}.`);
});

/**
 * Assert that a named CMS collection list rendered at least one item
 * (equivalent to Webflow's "not empty" collection state).
 *
 * Example #1: Then the "features" collection list should not be empty
 * Example #2: Then the "team" collection list should not be empty
 * Example #3: And the "pricing" collection list should not be empty
 * Example #4: Then the "features" collection list should not be empty
 * Example #5: And the "team" collection list should not be empty
 *
 */
Then(/^the "([^"]*)" collection list should not be empty$/, async function (name) {
  const items = this.page.locator(`.${name} .w-dyn-item`);
  const actual = await items.count();
  assert.ok(actual > 0, `Expected the "${name}" collection list to have at least one item, but it was empty.`);
});

// ---------------------------------------------------------------------------
// Forms (.w-form / .w-form-done / .w-form-fail)
// ---------------------------------------------------------------------------

/**
 * Assert the Webflow form's success state (`.w-form-done`) is visible,
 * shown after a successful AJAX-style submission.
 *
 * Example #1: Then I should see the webflow form success message
 * Example #2: Then I should see the webflow form success state
 * Example #3: And we should see the webflow form success message
 * Example #4: Then should see the webflow form success message
 * Example #5: And I should see the webflow form success state
 *
 */
Then(/^(I |we )*should see the webflow form success (message|state)$/, async function (pronounCase, wordCase) {
  const done = this.page.locator('.w-form .w-form-done').first();
  await done.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
    throw friendly('Expected the Webflow form success message (.w-form-done) to become visible, but it did not.');
  });
  assert.ok(await done.isVisible(), 'Expected the Webflow form success message (.w-form-done) to be visible.');
});

/**
 * Assert the Webflow form's error state (`.w-form-fail`) is visible, shown
 * after a failed AJAX-style submission.
 *
 * Example #1: Then I should see the webflow form error message
 * Example #2: Then I should see the webflow form error state
 * Example #3: And we should see the webflow form error message
 * Example #4: Then should see the webflow form error message
 * Example #5: And I should see the webflow form error state
 *
 */
Then(/^(I |we )*should see the webflow form error (message|state)$/, async function (pronounCase, wordCase) {
  const fail = this.page.locator('.w-form .w-form-fail').first();
  await fail.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
    throw friendly('Expected the Webflow form error message (.w-form-fail) to become visible, but it did not.');
  });
  assert.ok(await fail.isVisible(), 'Expected the Webflow form error message (.w-form-fail) to be visible.');
});

/**
 * Submit the (single) Webflow form on the page by clicking its submit
 * button. Use the built-in field-filling steps beforehand to populate it.
 *
 * Example #1: When I submit the webflow form
 * Example #2: When we submit the webflow form
 * Example #3: And I submit the webflow form
 * Example #4: When I submit the webflow form
 * Example #5: And we submit the webflow form
 *
 */
When(/^(I |we )*submit the webflow form$/, async function (pronounCase) {
  const submit = this.page.locator('.w-form input[type="submit"], .w-form button[type="submit"]').first();
  await submit.waitFor({ state: 'visible', timeout: 10000 });
  await submit.click();
  await smartSettle(this.page, 1500);
});

// ---------------------------------------------------------------------------
// Page-level Webflow metadata
// ---------------------------------------------------------------------------

/**
 * Assert that the current page is a Webflow export/page (has the
 * `data-wf-page` attribute Webflow stamps on every published `<html>` tag).
 *
 * Example #1: Then this should be a webflow page
 * Example #2: Then this page should be a webflow page
 * Example #3: And this should be a webflow page
 * Example #4: Then this should be a webflow page
 * Example #5: And this page should be a webflow page
 *
 */
Then(/^this( page)? should be a webflow page$/, async function (pageCase) {
  const hasAttr = await this.page.locator('html').evaluate((el) => el.hasAttribute('data-wf-page'));
  assert.ok(hasAttr, 'Expected the current page\'s <html> tag to have a "data-wf-page" attribute.');
});
