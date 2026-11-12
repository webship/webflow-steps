'use strict';

// Steps for what Webflow stamps on a published page, whatever the page
// contains. Webflow writes `data-wf-page` (the page's id), `data-wf-site` (the
// site's id) and, on a hosted site, `data-wf-domain` on the `<html>` tag of
// every page it publishes, and the same attributes survive a code export.

const { Then } = require('@cucumber/cucumber');
const { friendly } = require('webship-js/tests/step-definitions/webship');
const { waitForCondition } = require('./webflow-helpers');

/**
 * Assert that the current page is, or is not, a page published by Webflow: its
 * `<html>` tag carries the `data-wf-page` and `data-wf-site` attributes.
 *
 * Example #1: Then this should be a webflow page
 * Example #2: Then this page should be a webflow page
 * Example #3: And this should not be a webflow page
 * Example #4: Then this page should not be a webflow page
 * Example #5: And this page should be a webflow page
 *
 */
Then(/^this( page)? should( not)* be a webflow page$/, async function (pageCase, notCase) {
  await waitForCondition(this, (want) => {
    const html = document.documentElement;
    return (html.hasAttribute('data-wf-page') && html.hasAttribute('data-wf-site')) === want;
  }, !notCase, async () => friendly({
    message: notCase
      ? 'Expected the current page not to be a Webflow page, but its <html> tag has the "data-wf-page" and "data-wf-site" attributes.'
      : 'Expected the current page\'s <html> tag to have the "data-wf-page" and "data-wf-site" attributes, but it does not.',
    hint: 'Webflow stamps `data-wf-page` and `data-wf-site` on the `<html>` tag of every page it publishes or exports; a page served by another tool will not carry them.',
  }));
});

/**
 * Assert the id of the Webflow site that published the page, from `data-wf-site`.
 * It proves a scenario runs against the site it was written for (production,
 * staging or a copy). The id is in Webflow's Site settings, under General.
 *
 * Example #1: Then this should be the webflow site "6a282ca3f318327eefc29a02"
 * Example #2: Then this page should be the webflow site "6a906778b7eda4ebf3917813"
 * Example #3: And this should be the webflow site "69d62bbcbf9a56f0284fdb53"
 * Example #4: Then this page should be the webflow site "webflow-steps-demo"
 * Example #5: And this should be the webflow site "6a083ff5f8d83bda5c5b3e15"
 *
 */
Then(/^this( page)? should be the webflow site "([^"]*)"$/, async function (pageCase, siteId) {
  await waitForCondition(this, (want) => document.documentElement.getAttribute('data-wf-site') === want, siteId, async () => {
    const actual = await this.page.evaluate(() => document.documentElement.getAttribute('data-wf-site'));
    return friendly({
      message: `Expected the Webflow site id "${siteId}", but the page's is ${actual ? `"${actual}"` : 'missing'}.`,
      hint: 'The site id is `data-wf-site` on the `<html>` tag; a different id means the page comes from another Webflow site (a staging copy, for instance).',
    });
  });
});
