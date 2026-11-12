'use strict';

// Steps for Webflow forms.
//
// What Webflow renders and does, read from its published script and observed
// on public Webflow sites:
//
//   <div class="w-form">
//     <form name="wf-form-Contact" data-name="Contact" method="get" aria-label="Contact">...
//       <input type="submit" class="w-button" data-wait="Please wait...">
//     </form>
//     <div class="w-form-done" role="region" aria-label="Contact success">...</div>
//     <div class="w-form-fail" role="region" aria-label="Contact failure">...</div>
//   </div>
//
// On submit the runtime posts the fields as JSON to
// `https://webflow.com/api/v1/form/<data-wf-site>`. An answer with
// `{"code": 200}` hides the form and shows `.w-form-done`; any other answer
// keeps the form and shows `.w-form-fail`. A form carrying
// `data-turnstile-sitekey` is protected by a Cloudflare Turnstile challenge:
// its submit button stays disabled until the challenge hands the runtime a
// token, which a scripted browser never gets from the real service.
//
// The two Given steps replace those two outside services with test doubles, so
// that a scenario can drive the success and the failure state of any Webflow
// site, a public one included, without submitting anything to it.

const { Given, When, Then } = require('@cucumber/cucumber');
const { friendly } = require('webship-js/tests/step-definitions/webship');
const {
  budget,
  supplied,
  escapeRe,
  assertPresence,
  waitForCondition,
  formScope,
} = require('./webflow-helpers');

const ENDPOINT = '**/api/v1/form/**';
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js*';
const TURNSTILE_STUB = 'window.turnstile={render:function(el,o){setTimeout(function(){o&&o.callback&&o.callback("webship-test-token")},0);return"webship-widget"},reset:function(){},remove:function(){},isExpired:function(){return false},getResponse:function(){return"webship-test-token"}};';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };

const SUBMIT = 'input[type="submit"], button[type="submit"]';

/**
 * Answer every call to Webflow's form endpoint with a fixed result, in place
 * of the real service.
 *
 * @param {object} world
 * @param {number} status
 * @param {object} body
 */
async function answerFormEndpoint(world, status, body) {
  await world.page.route(ENDPOINT, (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    return route.fulfill({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

/**
 * Make Webflow's form endpoint accept every submission, as it does for a
 * working form: the runtime hides the form and shows its success message.
 * Nothing leaves the browser. Give it before opening the page.
 *
 * Example #1: Given the webflow form endpoint accepts submissions
 * Example #2: Given the form endpoint accepts submissions
 * Example #3: Given the webflow forms endpoint accepts submissions
 * Example #4: And the form endpoint accepts submissions
 * Example #5: Given the webflow form endpoint accepts all submissions
 *
 */
Given(/^the (?:webflow )?forms? endpoint accepts (?:all )?submissions$/, async function () {
  await answerFormEndpoint(this, 200, { msg: 'ok', code: 200 });
});

/**
 * Make Webflow's form endpoint refuse every submission, as it does when the
 * form is rejected: the runtime keeps the form and shows its error message.
 * Nothing leaves the browser. Give it before opening the page.
 *
 * Example #1: Given the webflow form endpoint rejects submissions
 * Example #2: Given the form endpoint rejects submissions
 * Example #3: Given the webflow forms endpoint rejects submissions
 * Example #4: And the form endpoint rejects submissions
 * Example #5: Given the webflow form endpoint rejects all submissions
 *
 */
Given(/^the (?:webflow )?forms? endpoint rejects (?:all )?submissions$/, async function () {
  await answerFormEndpoint(this, 500, { msg: 'Form submission failed', code: 500 });
});

/**
 * Let the Cloudflare Turnstile challenge of a protected form pass at once, so
 * the submit button is enabled. A scripted browser cannot solve the real
 * challenge; this replaces Cloudflare's script with a stub that hands the
 * form a token. Give it before opening the page: the runtime loads the script
 * when the page is ready. Use it on a staging copy or with the form endpoint
 * steps, never to bypass the protection of a live form.
 *
 * Example #1: Given the Turnstile challenge passes
 * Example #2: Given the form challenge passes
 * Example #3: Given the webflow form challenge passes
 * Example #4: And the Turnstile challenge passes
 * Example #5: Given the Turnstile challenge always passes
 *
 */
Given(/^the (?:webflow form |form )?(?:Turnstile )?challenge (?:always )?passes$/, async function () {
  await this.page.route(TURNSTILE_SCRIPT, (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: TURNSTILE_STUB }));
});

/**
 * Submit a Webflow form by its submit button, and wait for the runtime's
 * answer (the success or the error message). Without a name it submits the
 * first visible form; with one it submits the form whose name, `data-name`,
 * id or `aria-label` is that text. The form submitted is the one the next
 * success or error steps look at. Fill the fields beforehand with webship-js's
 * "fill in" steps.
 *
 * Example #1: When I submit the webflow form
 * Example #2: When we submit the webflow form
 * Example #3: And I submit the form
 * Example #4: When I submit the "Contact Form" form
 * Example #5: And we submit the "Newsletter" webflow form
 *
 */
When(/^(I |we )*submit the (?:"([^"]*)" )?(?:webflow )?form$/, async function (pronounCase, name) {
  const index = await this.page.evaluate((formName) => {
    const wrappers = [...document.querySelectorAll('.w-form')];
    const visible = (el) => Boolean(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
    return wrappers.findIndex((wrapper) => {
      const form = wrapper.querySelector('form');
      if (!form || !form.querySelector('input[type="submit"], button[type="submit"]')) return false;
      if (formName === null) return visible(form);
      return [form.getAttribute('data-name'), form.getAttribute('name'), form.id, form.getAttribute('aria-label')].includes(formName);
    });
  }, supplied(name) ? name : null);
  if (index < 0) {
    const available = await this.page.evaluate(() => [...document.querySelectorAll('.w-form form')].map((f) => f.getAttribute('data-name') || f.getAttribute('name') || f.id).filter(Boolean));
    throw friendly({
      message: !supplied(name) ? 'No visible Webflow form with a submit button was found on the page.' : `No Webflow form called "${name}" was found on the page.`,
      hint: available.length ? `The forms on the page are: ${available.map((n) => `"${n}"`).join(', ')}.` : 'A Webflow form is a `form` inside `.w-form`; check that the page has one and that its section is not hidden.',
    });
  }
  const wrapper = this.page.locator('.w-form').nth(index);
  const form = wrapper.locator('form').first();
  const submit = form.locator(SUBMIT).first();
  await submit.scrollIntoViewIfNeeded();
  try {
    await submit.waitFor({ state: 'visible', timeout: budget(this) });
    await this.page.waitForFunction((el) => !el.disabled, await submit.elementHandle(), { timeout: budget(this) });
  } catch (err) {
    const protectedForm = await form.evaluate((f) => f.hasAttribute('data-turnstile-sitekey')).catch(() => false);
    throw friendly({
      action: 'submit',
      target: 'the Webflow form',
      cause: err,
      hint: protectedForm
        ? 'The form is protected by a Cloudflare Turnstile challenge, and its submit button stays disabled until the challenge passes. On a staging copy, give "the Turnstile challenge passes" before opening the page, or turn the protection off for the test site.'
        : 'The submit button must be visible and enabled; fill the required fields first with the "fill in" steps.',
    });
  }
  this.webflowForm = wrapper;
  await submit.click();
  // The runtime answers asynchronously; wait for its message, but do not fail
  // here when the browser refused the submit (a required field is empty):
  // the success and error steps judge the outcome.
  await this.page.waitForFunction((el) => {
    const shown = (node) => Boolean(node) && getComputedStyle(node).display !== 'none';
    return shown(el.querySelector('.w-form-done')) || shown(el.querySelector('.w-form-fail'));
  }, await wrapper.elementHandle(), { timeout: 3000 }).catch(() => {});
});

/**
 * Assert the Webflow form's success message (`.w-form-done`) is, or is not,
 * visible: the state the runtime shows after the form endpoint accepts a
 * submission. It looks at the form the scenario submitted last, or at any
 * form of the page when none was.
 *
 * Example #1: Then I should see the webflow form success message
 * Example #2: Then I should see the webflow form success state
 * Example #3: And we should see the form success message
 * Example #4: Then I should not see the webflow form success message
 * Example #5: And I should see the form success state
 *
 */
Then(/^(I |we )*should( not)* see the (?:webflow )?form success (?:message|state)$/, async function (pronounCase, notCase) {
  await assertPresence(formScope(this).locator('.w-form-done'), notCase, {
    label: 'the Webflow form success message (.w-form-done)',
    hint: 'The runtime shows `.w-form-done` after the form endpoint answers `{"code": 200}`; submit the form first, and check the endpoint (or "the form endpoint accepts submissions") answers.',
    timeout: budget(this),
  });
});

/**
 * Assert the Webflow form's error message (`.w-form-fail`) is, or is not,
 * visible: the state the runtime shows when the form endpoint refuses a
 * submission or cannot be reached.
 *
 * Example #1: Then I should see the webflow form error message
 * Example #2: Then I should see the webflow form error state
 * Example #3: And we should see the form error message
 * Example #4: Then I should not see the webflow form error message
 * Example #5: And I should see the form error state
 *
 */
Then(/^(I |we )*should( not)* see the (?:webflow )?form error (?:message|state)$/, async function (pronounCase, notCase) {
  await assertPresence(formScope(this).locator('.w-form-fail'), notCase, {
    label: 'the Webflow form error message (.w-form-fail)',
    hint: 'The runtime shows `.w-form-fail` when the form endpoint answers anything but `{"code": 200}`; submit the form first, and check the endpoint (or "the form endpoint rejects submissions") answers.',
    timeout: budget(this),
  });
});

/**
 * Assert the text of the form's success or error message, so a scenario
 * proves the visitor reads the right words, not only that a box appeared.
 *
 * Example #1: Then the form success message should contain "Thank you"
 * Example #2: Then the form error message should contain "Something went wrong"
 * Example #3: And the webflow form success message should contain "received"
 * Example #4: Then the form error message should not contain "Thank you"
 * Example #5: And the webflow form success message should not contain "Oops"
 *
 */
Then(/^the (?:webflow )?form (success|error) message should( not)* contain "([^"]*)"$/, async function (kind, notCase, text) {
  const selector = kind === 'success' ? '.w-form-done' : '.w-form-fail';
  const message = formScope(this).locator(selector).filter({ hasText: new RegExp(escapeRe(text)) }).first();
  try {
    await message.waitFor({ state: notCase ? 'detached' : 'attached', timeout: budget(this) });
  } catch {
    const actual = await formScope(this).locator(selector).first().textContent().catch(() => null);
    throw friendly({
      message: notCase
        ? `Expected the form ${kind} message not to contain "${text}", but it does.`
        : `Expected the form ${kind} message to contain "${text}", but it reads "${(actual || '').replace(/\s+/g, ' ').trim()}".`,
      hint: 'The message is the text a designer typed in the form\'s Success and Error states (`.w-form-done`, `.w-form-fail`).',
    });
  }
});

/**
 * Assert a Webflow form is, or is not, protected against spam by a challenge:
 * a Cloudflare Turnstile site key on the form (`data-turnstile-sitekey`, the
 * default for new Webflow forms) or a reCAPTCHA element (`.w-form-formrecaptcha`).
 *
 * Example #1: Then the webflow form should be protected by a challenge
 * Example #2: Then the form should be protected by a challenge
 * Example #3: And the webflow form should not be protected by a challenge
 * Example #4: Then the "Contact Form" form should be protected by a challenge
 * Example #5: And the "Newsletter" form should not be protected by a challenge
 *
 */
Then(/^the (?:"([^"]*)" )?(?:webflow )?form should( not)* be protected by a challenge$/, async function (name, notCase) {
  const lookup = (formName) => {
    const forms = [...document.querySelectorAll('.w-form form')].filter((f) => formName === null || [f.getAttribute('data-name'), f.getAttribute('name'), f.id, f.getAttribute('aria-label')].includes(formName));
    return {
      forms: forms.length,
      protectedForm: forms.some((f) => f.hasAttribute('data-turnstile-sitekey') || Boolean(f.querySelector('.w-form-formrecaptcha, .g-recaptcha'))),
    };
  };
  const arg = JSON.stringify(supplied(name) ? name : null);
  await waitForCondition(this, `(${lookup})(${arg}).forms > 0`, undefined, async () => friendly({
    message: !supplied(name) ? 'No Webflow form was found on the page.' : `No Webflow form called "${name}" was found on the page.`,
    hint: 'A Webflow form is a `form` inside `.w-form`; the name is its name, `data-name`, id or `aria-label`.',
  }));
  await waitForCondition(this, `(${lookup})(${arg}).protectedForm === ${!notCase}`, undefined, async () => friendly({
    message: notCase ? 'Expected the form not to be protected by a challenge, but it is.' : 'Expected the form to be protected by a challenge, but it is not.',
    hint: 'Webflow adds a Turnstile site key (`data-turnstile-sitekey`) to a form when its spam protection is on (Form settings in the Designer).',
  }));
});

/**
 * Assert the submit button of the form is, or is not, disabled. A form that
 * waits for its Turnstile challenge keeps the button disabled until the
 * challenge passes.
 *
 * Example #1: Then the form submit button should be disabled
 * Example #2: Then the webflow form submit button should be disabled
 * Example #3: And the form submit button should not be disabled
 * Example #4: Then the webflow form submit button should not be disabled
 * Example #5: And the form submit button should be disabled
 *
 */
Then(/^the (?:webflow )?form submit button should( not)* be disabled$/, async function (notCase) {
  const submit = formScope(this).locator(SUBMIT).first();
  try {
    await submit.waitFor({ state: 'attached', timeout: budget(this) });
    await this.page.waitForFunction(([el, want]) => el.disabled === want, [await submit.elementHandle(), !notCase], { timeout: budget(this) });
  } catch {
    throw friendly({
      message: notCase ? 'Expected the form submit button to be enabled, but it is disabled.' : 'Expected the form submit button to be disabled, but it is enabled.',
      hint: 'A form with `data-turnstile-sitekey` keeps its submit button disabled until the challenge passes.',
    });
  }
});
