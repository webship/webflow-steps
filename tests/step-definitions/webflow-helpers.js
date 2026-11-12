'use strict';

// Shared helpers for the Webflow step files.
//
// Not a step file: it registers no step definitions and no hooks. It holds the
// plumbing the Webflow steps use: the wait budget, presence assertions, text
// normalising and the lookup of the form a scenario last submitted.
//
// Everything here builds on webship-js's own helpers (`smartSettle`,
// `friendly`) so the steps behave like webship-js's core steps.

const { friendly } = require('webship-js/tests/step-definitions/webship');

/**
 * The per-assertion wait budget: `minWaitTime.page` from cucumber.js, and at
 * least ten seconds, because Webflow animates its menus, tabs and carts and
 * loads its form handler after the page has settled.
 *
 * @param {object} world - The cucumber World (`this` inside a step).
 * @returns {number} Milliseconds.
 */
function budget(world) {
  return Math.max((world && world.minWaitTime && world.minWaitTime.page) || 0, 10000);
}

/**
 * Whether an optional step argument was supplied (a regex group that did not
 * take part in the match reaches the step as `undefined`).
 *
 * @param {*} value
 * @returns {boolean}
 */
function supplied(value) {
  return value !== undefined && value !== null;
}

/**
 * Escape a string for use in a RegExp.
 *
 * @param {string} s
 * @returns {string}
 */
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Run an action and rethrow a failure as a friendly error (the action, its
 * target, the cause and a hint) instead of Playwright's raw timeout stack.
 *
 * @param {string} action - What the step tried, e.g. "open".
 * @param {string} target - What it tried it on, e.g. "the mobile menu".
 * @param {Function} fn - The async work.
 * @param {string} hint - What the tester can check.
 * @returns {Promise<*>}
 */
async function actOrExplain(action, target, fn, hint) {
  try {
    return await fn();
  } catch (err) {
    throw friendly({ action, target, cause: err, hint });
  }
}

/**
 * Wait until `locator` has (or, with `negated`, has no) visible match, and
 * throw a friendly error otherwise: the wait and the assertion are one call.
 * A page can hold many matches (a hidden success message beside a shown one);
 * only a visible one counts.
 *
 * @param {import('playwright').Locator} locator
 * @param {string|null|undefined} negated - The captured " not" group, if any.
 * @param {{label: string, hint: string, timeout: number}} options
 * @returns {Promise<void>}
 */
async function assertPresence(locator, negated, { label, hint, timeout }) {
  try {
    await locator.filter({ visible: true }).first().waitFor({ state: negated ? 'hidden' : 'visible', timeout });
  } catch {
    throw friendly({
      message: negated
        ? `Expected not to see ${label}, but it is visible.`
        : `Expected ${label} to be visible, but it did not appear within ${timeout} ms.`,
      hint,
    });
  }
}

/**
 * Wait until a condition evaluated in the page holds, and throw the friendly
 * error built by `describe` when it does not within the budget.
 *
 * @param {object} world
 * @param {Function|string} predicate - Runs in the page; receives `arg`. A
 *   string is evaluated as an expression (use it to share a function between
 *   a wait and a failure message: `(${fn})(arg)`).
 * @param {*} arg - Serialisable argument for the predicate (ignored for a string).
 * @param {() => Promise<Error>} describe - Builds the error when the wait fails.
 * @returns {Promise<void>}
 */
async function waitForCondition(world, predicate, arg, describe) {
  try {
    await world.page.waitForFunction(predicate, arg, { timeout: budget(world) });
  } catch {
    throw await describe();
  }
}

/**
 * The `.w-form` wrapper the scenario last submitted, else every form wrapper
 * on the page. A page often carries two forms (a newsletter field in the
 * footer and a contact form), and the success or error message belongs to the
 * one that was submitted.
 *
 * @param {object} world
 * @returns {import('playwright').Locator}
 */
function formScope(world) {
  return world.webflowForm || world.page.locator('.w-form');
}

module.exports = {
  budget,
  supplied,
  escapeRe,
  actOrExplain,
  assertPresence,
  waitForCondition,
  formScope,
};
