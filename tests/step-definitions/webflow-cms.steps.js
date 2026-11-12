'use strict';

// Steps for Webflow CMS collection lists.
//
// What Webflow renders for a Collection List element:
//
//   <div class="<wrapper class> w-dyn-list">
//     <div role="list" class="<list class> w-dyn-items">
//       <div role="listitem" class="<item class> w-dyn-item">...</div>
//     </div>
//   </div>
//
// A collection that has no items renders `<div class="w-dyn-empty">` (the
// "No items found." message) instead of the `w-dyn-items` element. An item or
// a field a designer hides with conditional visibility carries
// `w-condition-invisible`, `w-dyn-hide` or `w-dyn-bind-empty`, and Webflow's
// stylesheet sets `display: none !important` on all three, so a visitor does
// not see it: these steps count only what is rendered.
//
// The designer names a list by the class of its wrapper, of its `w-dyn-items`
// element, of its items, or by the section around it. A step finds the list
// by any of them, in that order, so the name a feature uses is the name the
// designer sees in the Style panel.

const { Then } = require('@cucumber/cucumber');
const { friendly } = require('webship-js/tests/step-definitions/webship');
const { waitForCondition } = require('./webflow-helpers');

// Runs in the page. The rendered items of the collection list called `name`,
// the empty message state and how the list was found.
function collectionState(name) {
  const rendered = (el) => getComputedStyle(el).display !== 'none';
  const lists = [...document.querySelectorAll('.w-dyn-list')];
  const direct = lists.filter((list) => {
    const items = list.querySelector(':scope > .w-dyn-items');
    return list.classList.contains(name)
      || Boolean(items && items.classList.contains(name))
      || Boolean(list.querySelector(`:scope > .w-dyn-items > .w-dyn-item.${CSS.escape(name)}`));
  });
  const wrapped = direct.length ? direct : lists.filter((list) => Boolean(list.parentElement && list.parentElement.closest(`.${CSS.escape(name)}`)));
  const items = [];
  const texts = [];
  let empty = false;
  for (const list of wrapped) {
    for (const item of list.querySelectorAll(':scope > .w-dyn-items > .w-dyn-item')) {
      if (rendered(item)) {
        items.push(item);
        texts.push((item.textContent || '').replace(/\s+/g, ' ').trim());
      }
    }
    const message = list.querySelector(':scope > .w-dyn-empty');
    if (message && rendered(message)) empty = true;
  }
  return { lists: wrapped.length, count: items.length, empty, texts };
}

const NAME_HINT = 'The name is a class of the collection list: of its wrapper (`w-dyn-list`), of its list (`w-dyn-items`), of its items, or of the section around it. Check the class in the Style panel, and that the CMS items are published.';

/**
 * Wait for the count of rendered items of a named collection list and compare.
 *
 * @param {object} world
 * @param {string} name
 * @param {string} accept - A page-side function source: `(count) => count === 3`.
 * @param {(state: object) => string} explain - The failure message for a list that was found.
 */
async function waitForItems(world, name, accept, explain) {
  const lookup = `(${collectionState})(${JSON.stringify(name)})`;
  await waitForCondition(world, `(${accept})(${lookup}.count)`, undefined, async () => {
    const state = await world.page.evaluate(collectionState, name);
    return friendly({
      message: state.lists ? explain(state) : `No collection list called "${name}" was found on the page.`,
      hint: NAME_HINT,
    });
  });
}

/**
 * Assert the number of items rendered inside a named CMS collection list. The
 * count is polled for the wait budget, so a list that is still rendering is
 * waited for; items hidden by conditional visibility are not counted.
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
  await waitForItems(this, name, `(count) => count === ${expected}`, (state) => `Expected ${expected} item(s) in the "${name}" collection list, but it has ${state.count}.`);
});

/**
 * Assert a named collection list renders at least a number of items, for a
 * list whose length changes with the content.
 *
 * Example #1: Then I should see at least 1 item in the "features" collection list
 * Example #2: Then I should see at least 2 items in the "team" collection list
 * Example #3: And we should see at least 3 items in the "pricing" collection list
 * Example #4: Then I should see at least 1 item in the "news" collection list
 * Example #5: And should see at least 2 items in the "events" collection list
 *
 */
Then(/^(I |we )*should see at least (\d+) items? in the "([^"]*)" collection list$/, async function (pronounCase, countStr, name) {
  const minimum = Number(countStr);
  await waitForItems(this, name, `(count) => count >= ${minimum}`, (state) => `Expected at least ${minimum} item(s) in the "${name}" collection list, but it has ${state.count}.`);
});

/**
 * Assert that a named collection list rendered at least one item, or, with
 * "should be empty", none.
 *
 * Example #1: Then the "features" collection list should not be empty
 * Example #2: Then the "team" collection list should not be empty
 * Example #3: And the "pricing" collection list should not be empty
 * Example #4: Then the "archive" collection list should be empty
 * Example #5: And the "events" collection list should be empty
 *
 */
Then(/^the "([^"]*)" collection list should( not)* be empty$/, async function (name, notCase) {
  await waitForItems(
    this,
    name,
    notCase ? '(count) => count > 0' : '(count) => count === 0',
    (state) => (notCase
      ? `Expected the "${name}" collection list to have at least one item, but it is empty.`
      : `Expected the "${name}" collection list to be empty, but it has ${state.count} item(s).`),
  );
});

/**
 * Assert a collection list shows Webflow's empty state (`.w-dyn-empty`, the
 * "No items found." message a Collection List renders when the collection has
 * no items), or, with "should not", that it does not.
 *
 * Example #1: Then the "archive" collection list should show the empty message
 * Example #2: Then the "events" collection list should show the empty state
 * Example #3: And the "team" collection list should not show the empty message
 * Example #4: Then the "news" collection list should show the empty message
 * Example #5: And the "features" collection list should not show the empty state
 *
 */
Then(/^the "([^"]*)" collection list should( not)* show the empty (?:message|state)$/, async function (name, notCase) {
  const lookup = `(${collectionState})(${JSON.stringify(name)})`;
  await waitForCondition(this, `${lookup}.empty === ${!notCase}`, undefined, async () => {
    const state = await this.page.evaluate(collectionState, name);
    return friendly({
      message: state.lists
        ? (notCase ? `Expected the "${name}" collection list not to show the empty message, but it does.` : `Expected the "${name}" collection list to show the empty message, but it does not (it has ${state.count} item(s)).`)
        : `No collection list called "${name}" was found on the page.`,
      hint: NAME_HINT,
    });
  });
});

/**
 * Assert that an item of a named collection list shows a text, or, with
 * "should not", that no item does.
 *
 * Example #1: Then the "features" collection list should contain "Fast"
 * Example #2: Then the "team" collection list should contain "Ava Stone"
 * Example #3: And the "pricing" collection list should contain "Starter"
 * Example #4: Then the "team" collection list should not contain "Former employee"
 * Example #5: And the "features" collection list should not contain "Draft feature"
 *
 */
Then(/^the "([^"]*)" collection list should( not)* contain "([^"]*)"$/, async function (name, notCase, text) {
  const lookup = `(${collectionState})(${JSON.stringify(name)})`;
  await waitForCondition(this, `${lookup}.texts.some((t) => t.includes(${JSON.stringify(text)})) === ${!notCase}`, undefined, async () => {
    const state = await this.page.evaluate(collectionState, name);
    return friendly({
      message: state.lists
        ? (notCase ? `Expected no item of the "${name}" collection list to contain "${text}", but one does.` : `Expected an item of the "${name}" collection list to contain "${text}", but none does.`)
        : `No collection list called "${name}" was found on the page.`,
      hint: state.lists && state.texts.length ? `The items read: ${state.texts.map((t) => `"${t.slice(0, 40)}"`).join(', ')}.` : NAME_HINT,
    });
  });
});

