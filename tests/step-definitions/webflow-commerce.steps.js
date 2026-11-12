'use strict';

// Steps for Webflow Ecommerce: the cart, the Add to cart button of a product
// and the checkout page.
//
// What Webflow's runtime renders, observed on a public Webflow store template
// and read from its markup:
//
// - Cart: `.w-commerce-commercecartwrapper` (`data-wf-cart-type` is
//   `rightSidebar`, `leftSidebar`, `rightDropdown`, `leftDropdown` or `modal`)
//   holds the open link `a.w-commerce-commercecartopenlink` (`role="button"`,
//   `aria-haspopup="dialog"`) with the item count in
//   `.w-commerce-commercecartopenlinkcount`, and the cart itself in
//   `.w-commerce-commercecartcontainerwrapper`, which is `display: none` until
//   the cart opens. The cart has a close link (`.w-commerce-commercecartcloselink`),
//   an empty state (`.w-commerce-commercecartemptystate`, "No items found."),
//   a form (`.w-commerce-commercecartform`) with the items
//   (`.w-commerce-commercecartitem`, named by `.w-commerce-commercecartproductname`),
//   the total (`.w-commerce-commercecartordervalue`), and the checkout button
//   (`a.w-commerce-commercecartcheckoutbutton`, to `/checkout`).
// - Product: `form.w-commerce-commerceaddtocartform` with the button
//   `.w-commerce-commerceaddtocartbutton`, and beside it the out of stock
//   message (`.w-commerce-commerceaddtocartoutofstock`) and the error message
//   (`.w-commerce-commerceaddtocarterror`), both hidden until needed.
// - Checkout: `.w-commerce-commercecheckoutformcontainer` with the sections
//   customer info, shipping address, shipping methods, payment info and order
//   summary (`.w-commerce-commercecheckout<name>wrapper`).
//
// Adding to a cart on a real store changes that store's data, and placing an
// order takes a payment: use a store in test mode for those steps. The steps
// that only look at the cart and the checkout page are safe on any store.

const { When, Then } = require('@cucumber/cucumber');
const { friendly } = require('webship-js/tests/step-definitions/webship');
const {
  budget,
  actOrExplain,
  assertPresence,
  waitForCondition,
} = require('./webflow-helpers');

const CART_HINT = 'The cart is `.w-commerce-commercecartwrapper`; a page has one when the site has Ecommerce turned on and the Cart element is on the page (usually in the header).';

// Runs in the page. The state of the cart of the page: whether it is open, how
// many items it holds (the count in the open link), the names of the items in
// its list, and its total.
function cartState() {
  const wrapper = document.querySelector('.w-commerce-commercecartwrapper');
  if (!wrapper) return { found: false };
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const container = wrapper.querySelector('.w-commerce-commercecartcontainerwrapper');
  const badge = wrapper.querySelector('.w-commerce-commercecartopenlinkcount');
  const items = [...wrapper.querySelectorAll('.w-commerce-commercecartitem')];
  const total = wrapper.querySelector('.w-commerce-commercecartordervalue');
  return {
    found: true,
    open: Boolean(container) && getComputedStyle(container).display !== 'none',
    count: badge ? (parseInt(badge.textContent, 10) || 0) : items.length,
    names: items.map((item) => norm((item.querySelector('.w-commerce-commercecartproductname') || item).textContent)),
    total: total ? norm(total.textContent) : '',
  };
}

async function requireCart(world) {
  await waitForCondition(world, `(${cartState})().found`, undefined, async () => friendly({
    message: 'The page has no Webflow cart (`.w-commerce-commercecartwrapper`).',
    hint: CART_HINT,
  }));
}

/**
 * Open or close the Webflow cart with its open or close link, and wait until
 * the cart is shown or hidden. The step does nothing when the cart is already
 * in the state asked for.
 *
 * Example #1: When I open the cart
 * Example #2: When I close the cart
 * Example #3: When we open the cart
 * Example #4: And I open the cart
 * Example #5: And we close the cart
 *
 */
When(/^(I |we )*(open|close) the cart$/, async function (pronounCase, action) {
  const wantOpen = action === 'open';
  await requireCart(this);
  const state = await this.page.evaluate(cartState);
  if (state.open !== wantOpen) {
    const link = this.page.locator(wantOpen ? '.w-commerce-commercecartopenlink' : '.w-commerce-commercecartcloselink').first();
    await actOrExplain(action, 'the cart', async () => {
      await link.click({ timeout: budget(this) });
    }, wantOpen ? 'The cart opens from `.w-commerce-commercecartopenlink`; it must be visible on the page.' : 'The cart closes from `.w-commerce-commercecartcloselink`, inside the open cart.');
  }
  await waitForCondition(this, `(${cartState})().open === ${wantOpen}`, undefined, async () => friendly({
    message: `Expected the cart to be ${wantOpen ? 'open' : 'closed'} after the ${action}, but it is not.`,
    hint: 'The cart is shown when `.w-commerce-commercecartcontainerwrapper` is not `display: none`.',
  }));
});

/**
 * Assert the Webflow cart is, or is not, open.
 *
 * Example #1: Then the cart should be open
 * Example #2: Then the cart should be closed
 * Example #3: And the cart should not be open
 * Example #4: Then the cart should not be closed
 * Example #5: And the cart should be closed
 *
 */
Then(/^the cart should( not)* be (open|closed)$/, async function (notCase, state) {
  const wantOpen = notCase ? state !== 'open' : state === 'open';
  await requireCart(this);
  await waitForCondition(this, `(${cartState})().open === ${wantOpen}`, undefined, async () => friendly({
    message: `Expected the cart to be ${wantOpen ? 'open' : 'closed'}, but it is ${wantOpen ? 'closed' : 'open'}.`,
    hint: 'The cart is shown when `.w-commerce-commercecartcontainerwrapper` is not `display: none`.',
  }));
});

/**
 * Assert the Webflow cart is, or is not, empty: the count in its open link is
 * zero (and its list has no item).
 *
 * Example #1: Then the cart should be empty
 * Example #2: Then the cart should not be empty
 * Example #3: And the cart should be empty
 * Example #4: Then the cart should not be empty
 * Example #5: And the cart should not be empty
 *
 */
Then(/^the cart should( not)* be empty$/, async function (notCase) {
  await requireCart(this);
  await waitForCondition(this, `((${cartState})().count === 0) === ${!notCase}`, undefined, async () => {
    const state = await this.page.evaluate(cartState);
    return friendly({
      message: notCase ? 'Expected the cart to hold items, but it is empty.' : `Expected the cart to be empty, but it holds ${state.count} item(s).`,
      hint: 'The count is the number in `.w-commerce-commercecartopenlinkcount`.',
    });
  });
});

/**
 * Assert how many items the Webflow cart holds, from the count in its open
 * link.
 *
 * Example #1: Then the cart should contain 1 item
 * Example #2: Then the cart should contain 2 items
 * Example #3: And the cart should contain 0 items
 * Example #4: Then the cart should contain 3 items
 * Example #5: And the cart should contain 1 item
 *
 */
Then(/^the cart should contain (\d+) items?$/, async function (countStr) {
  const expected = Number(countStr);
  await requireCart(this);
  await waitForCondition(this, `(${cartState})().count === ${expected}`, undefined, async () => {
    const state = await this.page.evaluate(cartState);
    return friendly({
      message: `Expected the cart to contain ${expected} item(s), but it contains ${state.count}.`,
      hint: 'The count is the number in `.w-commerce-commercecartopenlinkcount`.',
    });
  });
});

/**
 * Assert the Webflow cart holds, or does not hold, a product by its name, as
 * the cart lists it (`.w-commerce-commercecartproductname`).
 *
 * Example #1: Then the cart should contain "Course"
 * Example #2: Then the cart should contain "UI/UX Design Course"
 * Example #3: And the cart should not contain "Gift card"
 * Example #4: Then the cart should not contain "Course"
 * Example #5: And the cart should contain "Sticker pack"
 *
 */
Then(/^the cart should( not)* contain "([^"]*)"$/, async function (notCase, name) {
  await requireCart(this);
  await waitForCondition(this, `(${cartState})().names.some((n) => n.includes(${JSON.stringify(name)})) === ${!notCase}`, undefined, async () => {
    const state = await this.page.evaluate(cartState);
    return friendly({
      message: notCase ? `Expected the cart not to contain "${name}", but it does.` : `Expected the cart to contain "${name}", but it does not.`,
      hint: state.names.length ? `The cart lists: ${state.names.map((n) => `"${n}"`).join(', ')}.` : 'The cart has no item. A product is added with its Add to cart button.',
    });
  });
});

/**
 * Assert the total of the Webflow cart (`.w-commerce-commercecartordervalue`)
 * contains a text, such as the amount.
 *
 * Example #1: Then the cart total should contain "19"
 * Example #2: Then the cart total should contain "$49.00"
 * Example #3: And the cart total should contain "EUR"
 * Example #4: Then the cart total should contain "38"
 * Example #5: And the cart total should contain "0"
 *
 */
Then(/^the cart total should contain "([^"]*)"$/, async function (text) {
  await requireCart(this);
  await waitForCondition(this, `(${cartState})().total.includes(${JSON.stringify(text)})`, undefined, async () => {
    const state = await this.page.evaluate(cartState);
    return friendly({
      message: `Expected the cart total to contain "${text}", but it reads "${state.total}".`,
      hint: 'The total is `.w-commerce-commercecartordervalue`, in the cart footer; it is empty while the cart is.',
    });
  });
});

/**
 * Follow the checkout button of the open Webflow cart ("Continue to
 * Checkout") to the checkout page.
 *
 * Example #1: When I continue to checkout
 * Example #2: When we continue to checkout
 * Example #3: And I continue to checkout
 * Example #4: And we continue to checkout
 * Example #5: Then I continue to checkout
 *
 */
When(/^(I |we )*continue to checkout$/, async function (pronounCase) {
  await actOrExplain('continue', 'to checkout', async () => {
    await this.page.locator('.w-commerce-commercecartcheckoutbutton').first().click({ timeout: budget(this) });
    await this.page.waitForURL(/checkout/, { timeout: budget(this) });
  }, 'The checkout button is `.w-commerce-commercecartcheckoutbutton`, in the footer of the open cart; the cart needs an item before it shows.');
});

/**
 * Add the product of the page to the cart with its Add to cart button, and wait
 * until the cart count goes up or the add to cart error appears. On a real
 * store this changes the store's data: use a store in test mode.
 *
 * Example #1: When I add the product to the cart
 * Example #2: When we add the product to the cart
 * Example #3: And I add the product to the cart
 * Example #4: And we add the product to the cart
 * Example #5: Then I add the product to the cart
 *
 */
When(/^(I |we )*add the product to the cart$/, async function (pronounCase) {
  const before = (await this.page.evaluate(cartState)).count || 0;
  await actOrExplain('add', 'the product to the cart', async () => {
    await this.page.locator('.w-commerce-commerceaddtocartbutton').first().click({ timeout: budget(this) });
  }, 'The button is `.w-commerce-commerceaddtocartbutton`, inside the product\'s `form.w-commerce-commerceaddtocartform`; choose the product options first.');
  await waitForCondition(this, `(() => { const s = (${cartState})(); const e = document.querySelector('.w-commerce-commerceaddtocarterror'); return (s.found && s.count > ${before}) || Boolean(e && getComputedStyle(e).display !== 'none'); })()`, undefined, async () => friendly({
    message: 'The product was not added to the cart: the cart count did not change and no error appeared.',
    hint: 'Choose every option of the product first; the cart count is `.w-commerce-commercecartopenlinkcount`.',
  }));
});

/**
 * Assert the product of the page is, or is not, out of stock: Webflow shows
 * `.w-commerce-commerceaddtocartoutofstock` in place of the Add to cart form.
 *
 * Example #1: Then the product should be out of stock
 * Example #2: Then the product should not be out of stock
 * Example #3: And the product should be out of stock
 * Example #4: Then the product should not be out of stock
 * Example #5: And the product should not be out of stock
 *
 */
Then(/^the product should( not)* be out of stock$/, async function (notCase) {
  await assertPresence(this.page.locator('.w-commerce-commerceaddtocartoutofstock'), notCase, {
    label: 'the out of stock message (.w-commerce-commerceaddtocartoutofstock)',
    hint: 'Webflow shows the message in place of the Add to cart button when a product or its chosen variant has no stock left.',
    timeout: budget(this),
  });
});

/**
 * Assert the add to cart error message is, or is not, shown: Webflow shows
 * `.w-commerce-commerceaddtocarterror` when a product cannot be added (an
 * option is not chosen, or the quantity is not available).
 *
 * Example #1: Then I should see the add to cart error
 * Example #2: Then I should not see the add to cart error
 * Example #3: And we should see the add to cart error
 * Example #4: Then we should not see the add to cart error
 * Example #5: And I should not see the add to cart error
 *
 */
Then(/^(I |we )*should( not)* see the add to cart error$/, async function (pronounCase, notCase) {
  await assertPresence(this.page.locator('.w-commerce-commerceaddtocarterror'), notCase, {
    label: 'the add to cart error (.w-commerce-commerceaddtocarterror)',
    hint: 'Webflow shows it when a product cannot be added: an option was not chosen, or the quantity is not available.',
    timeout: budget(this),
  });
});

const CHECKOUT_SECTIONS = {
  'customer information': 'customerinfo',
  'shipping address': 'shippingaddress',
  'shipping methods': 'shippingmethods',
  payment: 'paymentinfo',
  'order summary': 'ordersummary',
};

/**
 * Assert the checkout page shows its form (`.w-commerce-commercecheckoutformcontainer`).
 *
 * Example #1: Then I should see the checkout form
 * Example #2: Then we should see the checkout form
 * Example #3: And I should see the checkout form
 * Example #4: Then I should not see the checkout form
 * Example #5: And we should not see the checkout form
 *
 */
Then(/^(I |we )*should( not)* see the checkout form$/, async function (pronounCase, notCase) {
  await assertPresence(this.page.locator('.w-commerce-commercecheckoutformcontainer'), notCase, {
    label: 'the checkout form (.w-commerce-commercecheckoutformcontainer)',
    hint: 'The checkout page is `/checkout`; Webflow shows the form there when the cart holds an item.',
    timeout: budget(this),
  });
});

/**
 * Assert the checkout form has, or does not have, one of its sections:
 * customer information, shipping address, shipping methods, payment or order
 * summary. A section the designer removed, or a digital product that needs no
 * shipping, is not on the page.
 *
 * Example #1: Then the checkout form should have the "customer information" section
 * Example #2: Then the checkout form should have the "payment" section
 * Example #3: And the checkout form should have the "order summary" section
 * Example #4: Then the checkout form should not have the "shipping methods" section
 * Example #5: And the checkout form should have the "shipping address" section
 *
 */
Then(/^the checkout form should( not)* have the "(customer information|shipping address|shipping methods|payment|order summary)" section$/, async function (notCase, section) {
  const selector = `.w-commerce-commercecheckout${CHECKOUT_SECTIONS[section]}wrapper`;
  await assertPresence(this.page.locator(selector), notCase, {
    label: `the "${section}" section of the checkout form (${selector})`,
    hint: 'The sections are `.w-commerce-commercecheckout<name>wrapper`: customerinfo, shippingaddress, shippingmethods, paymentinfo and ordersummary.',
    timeout: budget(this),
  });
});
