'use strict';

// Steps for Webflow's interactive components: Tabs, Slider, Dropdown and
// Lightbox. Each is a state machine that Webflow's runtime drives with classes
// and ARIA attributes; the steps read those, so they work whatever classes a
// designer gave the elements.
//
// What the runtime renders, observed on public Webflow sites:
//
// - Tabs: `.w-tabs` > `.w-tab-menu` > `a.w-tab-link` (`role="tab"`,
//   `data-w-tab="Tab 1"`, `aria-selected`, `w--current` on the selected one)
//   and `.w-tab-content` > `.w-tab-pane` (`role="tabpanel"`, the same
//   `data-w-tab`, `w--tab-active` on the shown one).
// - Slider: `.w-slider` (`role="region"`) > `.w-slider-mask` > `.w-slide`; the
//   shown slide is the one without `aria-hidden="true"`; `.w-slider-arrow-left`
//   and `-right` (`role="button"`), optional `.w-slider-nav` dots
//   (`.w-slider-dot`, `w-active`, `aria-pressed`), and a live region
//   `.w-slider-aria-label` that reads "Slide 2 of 3.". A slider with
//   `data-autoplay="true"` moves on by itself every `data-delay` ms.
// - Dropdown: `.w-dropdown` > `.w-dropdown-toggle` (`role="button"`,
//   `aria-expanded`, `w--open` while open) + `.w-dropdown-list` (`w--open`).
//   `data-hover="true"` opens it on hover instead of click.
// - Lightbox: `a.w-lightbox` opens `.w-lightbox-backdrop` on the body; closing
//   adds `w-lightbox-hide` to it. The page does not scroll meanwhile
//   (`w-lightbox-noscroll` on `<html>`).

const { When, Then } = require('@cucumber/cucumber');
const { friendly } = require('webship-js/tests/step-definitions/webship');
const {
  budget,
  supplied,
  actOrExplain,
  waitForCondition,
} = require('./webflow-helpers');

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

// Runs in the page. The tab called `label` (by its text), its state and the
// state of its panel, and the labels of all the tabs for the error message.
function tabState(label) {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const links = [...document.querySelectorAll('.w-tab-link')];
  const link = links.find((a) => norm(a.textContent) === label);
  const state = { labels: links.map((a) => norm(a.textContent)).filter(Boolean), found: Boolean(link), selected: false, panelVisible: false };
  if (!link) return state;
  state.selected = link.getAttribute('aria-selected') === 'true' || link.classList.contains('w--current');
  const tabs = link.closest('.w-tabs');
  const pane = tabs && [...tabs.querySelectorAll('.w-tab-pane')].find((p) => p.getAttribute('data-w-tab') === link.getAttribute('data-w-tab'));
  state.panelVisible = Boolean(pane) && pane.classList.contains('w--tab-active') && getComputedStyle(pane).display !== 'none';
  return state;
}

const TAB_HINT = 'A tab is a `.w-tab-link` found by its exact text; its panel is the `.w-tab-pane` with the same `data-w-tab`.';

async function requireTab(world, label) {
  await waitForCondition(world, `(${tabState})(${JSON.stringify(label)}).found`, undefined, async () => {
    const { labels } = await world.page.evaluate(tabState, label);
    return friendly({
      message: `No "${label}" tab was found on the page.`,
      hint: labels.length ? `The tabs on the page are: ${labels.map((l) => `"${l}"`).join(', ')}.` : 'The page has no Webflow Tabs element (`.w-tabs`).',
    });
  });
}

/**
 * Select a tab of a Webflow Tabs element by its text, and wait until it is
 * the selected one. Selecting the selected tab does nothing.
 *
 * Example #1: When I select the "Monthly" tab
 * Example #2: When I select the "Custom Project" tab
 * Example #3: When we select the "Overview" tab
 * Example #4: And I select the "Specifications" tab
 * Example #5: And we select the "Reviews" tab
 *
 */
When(/^(I |we )*select the "([^"]*)" tab$/, async function (pronounCase, label) {
  await requireTab(this, label);
  const state = await this.page.evaluate(tabState, label);
  if (!state.selected) {
    await actOrExplain('select', `the "${label}" tab`, async () => {
      await this.page.locator('.w-tab-link').filter({ hasText: label }).first().click();
    }, TAB_HINT);
  }
  await waitForCondition(this, `(${tabState})(${JSON.stringify(label)}).selected`, undefined, async () => friendly({
    message: `The "${label}" tab was clicked, but it did not become the selected tab.`,
    hint: TAB_HINT,
  }));
});

/**
 * Assert a tab is, or is not, the selected one: `aria-selected="true"`, and
 * the `w--current` class Webflow puts on it.
 *
 * Example #1: Then the "Monthly" tab should be selected
 * Example #2: Then the "Custom Project" tab should not be selected
 * Example #3: And the "Overview" tab should be selected
 * Example #4: Then the "Reviews" tab should not be selected
 * Example #5: And the "Specifications" tab should be selected
 *
 */
Then(/^the "([^"]*)" tab should( not)* be selected$/, async function (label, notCase) {
  await requireTab(this, label);
  await waitForCondition(this, `(${tabState})(${JSON.stringify(label)}).selected === ${!notCase}`, undefined, async () => friendly({
    message: notCase ? `Expected the "${label}" tab not to be selected, but it is.` : `Expected the "${label}" tab to be selected, but it is not.`,
    hint: TAB_HINT,
  }));
});

/**
 * Assert the content of a tab is, or is not, shown: its `.w-tab-pane` has
 * `w--tab-active` and is displayed.
 *
 * Example #1: Then the "Monthly" tab content should be visible
 * Example #2: Then the "Custom Project" tab content should not be visible
 * Example #3: And the "Overview" tab content should be visible
 * Example #4: Then the "Reviews" tab content should not be visible
 * Example #5: And the "Specifications" tab content should be visible
 *
 */
Then(/^the "([^"]*)" tab content should( not)* be visible$/, async function (label, notCase) {
  await requireTab(this, label);
  await waitForCondition(this, `(${tabState})(${JSON.stringify(label)}).panelVisible === ${!notCase}`, undefined, async () => friendly({
    message: notCase ? `Expected the content of the "${label}" tab not to be shown, but it is.` : `Expected the content of the "${label}" tab to be shown, but it is not.`,
    hint: TAB_HINT,
  }));
});

// ---------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------

// Runs in the page. The Webflow slider called `name` (by a class on it; the
// first slider when `name` is null): the shown slide (1-based), the number of
// slides, and how many sliders the page has.
function sliderState(name) {
  const sliders = [...document.querySelectorAll('.w-slider')];
  const slider = name === null ? sliders[0] : sliders.find((s) => s.classList.contains(name));
  const state = { sliders: sliders.length, found: Boolean(slider), current: 0, total: 0, classes: sliders.map((s) => s.className.replace('w-slider', '').trim()).filter(Boolean) };
  if (!slider) return state;
  const slides = [...slider.querySelectorAll('.w-slide')];
  state.total = slides.length;
  state.current = slides.findIndex((s) => s.getAttribute('aria-hidden') !== 'true') + 1;
  return state;
}

const SLIDER_HINT = 'The shown slide of a Webflow Slider is the `.w-slide` without `aria-hidden="true"`. A slider with autoplay moves on by itself every `data-delay` ms, so a slide can change between two steps.';

async function requireSlider(world, name) {
  const arg = JSON.stringify(supplied(name) ? name : null);
  await waitForCondition(world, `(${sliderState})(${arg}).found`, undefined, async () => {
    const state = await world.page.evaluate(sliderState, supplied(name) ? name : null);
    return friendly({
      message: supplied(name) ? `No slider called "${name}" was found on the page.` : 'The page has no Webflow Slider (`.w-slider`).',
      hint: state.classes.length ? `The sliders on the page have the classes: ${state.classes.map((c) => `"${c}"`).join(', ')}.` : 'A Slider element renders `.w-slider`.',
    });
  });
  return JSON.stringify(supplied(name) ? name : null);
}

/**
 * Go to the next or the previous slide of a Webflow slider with its arrow, and
 * wait until the shown slide changes. Without a name it is the first slider of
 * the page; with one, the slider that has that class.
 *
 * Example #1: When I go to the next slide
 * Example #2: When I go to the previous slide
 * Example #3: When we go to the next slide of the "reviews-slider" slider
 * Example #4: And I go to the previous slide of the "gallery" slider
 * Example #5: And we go to the next slide
 *
 */
When(/^(I |we )*go to the (next|previous) slide(?: of the "([^"]*)" slider)?$/, async function (pronounCase, direction, name) {
  const arg = await requireSlider(this, name);
  const before = await this.page.evaluate(sliderState, supplied(name) ? name : null);
  const selector = direction === 'next' ? '.w-slider-arrow-right' : '.w-slider-arrow-left';
  await actOrExplain('go to the slide', `the ${direction} slide`, async () => {
    const slider = supplied(name) ? this.page.locator(`.w-slider.${name}`).first() : this.page.locator('.w-slider').first();
    await slider.locator(selector).first().click({ force: true, timeout: budget(this) });
  }, 'The arrow is `.w-slider-arrow-right` or `.w-slider-arrow-left`; a slider whose arrows are hidden in the Designer has none to click.');
  await waitForCondition(this, `(${sliderState})(${arg}).current !== ${before.current}`, undefined, async () => friendly({
    message: `The ${direction} arrow was clicked, but the shown slide is still ${before.current} of ${before.total}.`,
    hint: SLIDER_HINT,
  }));
});

/**
 * Assert which slide of a Webflow slider is shown, from `aria-hidden` on its
 * slides. Without a name it is the first slider of the page.
 *
 * Example #1: Then the slider should show slide 1 of 3
 * Example #2: Then the slider should show slide 2 of 3
 * Example #3: And the "reviews-slider" slider should show slide 1 of 3
 * Example #4: Then the "gallery" slider should show slide 3 of 5
 * Example #5: And the slider should show slide 1 of 4
 *
 */
Then(/^the (?:"([^"]*)" )?slider should show slide (\d+) of (\d+)$/, async function (name, current, total) {
  const arg = await requireSlider(this, name);
  await waitForCondition(this, `(${sliderState})(${arg}).current === ${Number(current)} && (${sliderState})(${arg}).total === ${Number(total)}`, undefined, async () => {
    const state = await this.page.evaluate(sliderState, supplied(name) ? name : null);
    return friendly({
      message: `Expected the slider to show slide ${current} of ${total}, but it shows slide ${state.current} of ${state.total}.`,
      hint: SLIDER_HINT,
    });
  });
});

/**
 * Assert how many slides a Webflow slider has. Without a name it is the first
 * slider of the page.
 *
 * Example #1: Then the slider should have 3 slides
 * Example #2: Then the "reviews-slider" slider should have 3 slides
 * Example #3: And the "gallery" slider should have 8 slides
 * Example #4: Then the slider should have 1 slide
 * Example #5: And the "testi-slider" slider should have 4 slides
 *
 */
Then(/^the (?:"([^"]*)" )?slider should have (\d+) slides?$/, async function (name, total) {
  const arg = await requireSlider(this, name);
  await waitForCondition(this, `(${sliderState})(${arg}).total === ${Number(total)}`, undefined, async () => {
    const state = await this.page.evaluate(sliderState, supplied(name) ? name : null);
    return friendly({
      message: `Expected the slider to have ${total} slide(s), but it has ${state.total}.`,
      hint: 'The slides of a Webflow Slider are the `.w-slide` elements inside it.',
    });
  });
});

// ---------------------------------------------------------------------------
// Dropdown
// ---------------------------------------------------------------------------

// Runs in the page. The dropdown called `name`: by the exact text of its
// toggle, or by a class on `.w-dropdown`. Its state and the links in its list.
function dropdownState(name) {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const all = [...document.querySelectorAll('.w-dropdown')];
  const labelOf = (d) => norm((d.querySelector(':scope > .w-dropdown-toggle') || d).textContent);
  const dropdown = all.find((d) => labelOf(d) === name) || all.find((d) => d.classList.contains(name));
  const state = { found: Boolean(dropdown), index: all.indexOf(dropdown), labels: all.map(labelOf).filter(Boolean), open: false, links: [] };
  if (!dropdown) return state;
  const toggle = dropdown.querySelector(':scope > .w-dropdown-toggle');
  const list = dropdown.querySelector(':scope > .w-dropdown-list');
  state.open = Boolean(toggle) && (toggle.getAttribute('aria-expanded') === 'true' || toggle.classList.contains('w--open')) && Boolean(list) && list.classList.contains('w--open');
  state.links = list ? [...list.querySelectorAll('a')].map((a) => norm(a.textContent)) : [];
  return state;
}

const DROPDOWN_HINT = 'A dropdown is found by the exact text of its toggle, or by a class on its `.w-dropdown` element.';

async function requireDropdown(world, name) {
  await waitForCondition(world, `(${dropdownState})(${JSON.stringify(name)}).found`, undefined, async () => {
    const { labels } = await world.page.evaluate(dropdownState, name);
    return friendly({
      message: `No "${name}" dropdown was found on the page.`,
      hint: labels.length ? `The dropdowns on the page are: ${labels.map((l) => `"${l}"`).join(', ')}.` : 'The page has no Webflow Dropdown (`.w-dropdown`).',
    });
  });
}

/**
 * Open or close a Webflow dropdown by the text of its toggle (or a class on
 * it). A dropdown set to open on hover is hovered; any other is clicked. The
 * step does nothing when the dropdown is already in the state asked for.
 *
 * Example #1: When I open the "Products" dropdown
 * Example #2: When I close the "Products" dropdown
 * Example #3: When we open the "Resources" dropdown
 * Example #4: And I open the "faq-card" dropdown
 * Example #5: And we close the "Resources" dropdown
 *
 */
When(/^(I |we )*(open|close) the "([^"]*)" dropdown$/, async function (pronounCase, action, name) {
  const wantOpen = action === 'open';
  await requireDropdown(this, name);
  const state = await this.page.evaluate(dropdownState, name);
  if (state.open !== wantOpen) {
    await actOrExplain(action, `the "${name}" dropdown`, async () => {
      const dropdown = this.page.locator('.w-dropdown').nth(state.index);
      const toggle = dropdown.locator(':scope > .w-dropdown-toggle');
      if (wantOpen && (await dropdown.getAttribute('data-hover')) === 'true') await toggle.hover({ timeout: budget(this) });
      else await toggle.click({ timeout: budget(this) });
    }, DROPDOWN_HINT);
  }
  await waitForCondition(this, `(${dropdownState})(${JSON.stringify(name)}).open === ${wantOpen}`, undefined, async () => friendly({
    message: `Expected the "${name}" dropdown to be ${wantOpen ? 'open' : 'closed'} after the ${action}, but it is not.`,
    hint: 'Webflow sets `w--open` on the toggle and the list, and `aria-expanded` on the toggle, while the dropdown is open.',
  }));
});

/**
 * Assert a Webflow dropdown is, or is not, open.
 *
 * Example #1: Then the "Products" dropdown should be open
 * Example #2: Then the "Products" dropdown should be closed
 * Example #3: And the "Resources" dropdown should not be open
 * Example #4: Then the "faq-card" dropdown should be open
 * Example #5: And the "Resources" dropdown should not be closed
 *
 */
Then(/^the "([^"]*)" dropdown should( not)* be (open|closed)$/, async function (name, notCase, state) {
  const wantOpen = notCase ? state !== 'open' : state === 'open';
  await requireDropdown(this, name);
  await waitForCondition(this, `(${dropdownState})(${JSON.stringify(name)}).open === ${wantOpen}`, undefined, async () => friendly({
    message: `Expected the "${name}" dropdown to be ${wantOpen ? 'open' : 'closed'}, but it is ${wantOpen ? 'closed' : 'open'}.`,
    hint: DROPDOWN_HINT,
  }));
});

/**
 * Assert a Webflow dropdown lists, or does not list, a link by its exact text.
 * The links of a closed dropdown are in the markup, so the dropdown need not
 * be open.
 *
 * Example #1: Then the "Products" dropdown should list "Pricing"
 * Example #2: Then the "Resources" dropdown should list "Documentation"
 * Example #3: And the "Products" dropdown should not list "Admin"
 * Example #4: Then the "Resources" dropdown should not list "Login"
 * Example #5: And the "Products" dropdown should list "Features"
 *
 */
Then(/^the "([^"]*)" dropdown should( not)* list "([^"]*)"$/, async function (name, notCase, text) {
  await requireDropdown(this, name);
  await waitForCondition(this, `(${dropdownState})(${JSON.stringify(name)}).links.includes(${JSON.stringify(text)}) === ${!notCase}`, undefined, async () => {
    const { links } = await this.page.evaluate(dropdownState, name);
    return friendly({
      message: notCase ? `Expected the "${name}" dropdown not to list "${text}", but it does.` : `Expected the "${name}" dropdown to list "${text}", but it does not.`,
      hint: links.length ? `The dropdown lists: ${links.map((l) => `"${l}"`).join(', ')}.` : 'The dropdown has no links in its `.w-dropdown-list`.',
    });
  });
});

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------

// Runs in the page. Whether a lightbox is open: its backdrop is on the page and
// not hidden.
function lightboxOpen() {
  const backdrop = document.querySelector('.w-lightbox-backdrop');
  return Boolean(backdrop) && !backdrop.classList.contains('w-lightbox-hide') && getComputedStyle(backdrop).display !== 'none';
}

const LIGHTBOX_HINT = 'A lightbox is an `a.w-lightbox` link; opening it adds `.w-lightbox-backdrop` to the body, and closing it adds `w-lightbox-hide` to the backdrop.';

/**
 * Open a Webflow lightbox by clicking its link, and wait until its backdrop
 * is shown. Without a name it is the first lightbox of the page; with one,
 * the lightbox that has that class.
 *
 * Example #1: When I open the lightbox
 * Example #2: When I open the "about-light-box" lightbox
 * Example #3: When we open the lightbox
 * Example #4: And I open the "gallery-item" lightbox
 * Example #5: And we open the "video-link" lightbox
 *
 */
When(/^(I |we )*open the (?:"([^"]*)" )?lightbox$/, async function (pronounCase, name) {
  const link = supplied(name) ? this.page.locator(`.w-lightbox.${name}`).first() : this.page.locator('.w-lightbox').first();
  await actOrExplain('open', 'the lightbox', async () => {
    await link.scrollIntoViewIfNeeded({ timeout: budget(this) });
    await link.click({ timeout: budget(this) });
  }, supplied(name) ? `No lightbox with the class "${name}" was found; ${LIGHTBOX_HINT}` : LIGHTBOX_HINT);
  await waitForCondition(this, `(${lightboxOpen})()`, undefined, async () => friendly({
    message: 'The lightbox link was clicked, but no lightbox opened.',
    hint: LIGHTBOX_HINT,
  }));
});

/**
 * Close the open Webflow lightbox with its close control, and wait until its
 * backdrop is hidden.
 *
 * Example #1: When I close the lightbox
 * Example #2: When we close the lightbox
 * Example #3: And I close the lightbox
 * Example #4: And we close the lightbox
 * Example #5: Then I close the lightbox
 *
 */
When(/^(I |we )*close the lightbox$/, async function (pronounCase) {
  await actOrExplain('close', 'the lightbox', async () => {
    await this.page.locator('.w-lightbox-backdrop:not(.w-lightbox-hide) .w-lightbox-close').first().click({ timeout: budget(this) });
  }, 'The close control is `.w-lightbox-close`, inside the open `.w-lightbox-backdrop`; open the lightbox first.');
  await waitForCondition(this, `!(${lightboxOpen})()`, undefined, async () => friendly({
    message: 'The close control was clicked, but the lightbox is still open.',
    hint: LIGHTBOX_HINT,
  }));
});

/**
 * Assert a Webflow lightbox is, or is not, open.
 *
 * Example #1: Then the lightbox should be open
 * Example #2: Then the lightbox should be closed
 * Example #3: And the lightbox should not be open
 * Example #4: Then the lightbox should not be closed
 * Example #5: And the lightbox should be open
 *
 */
Then(/^the lightbox should( not)* be (open|closed)$/, async function (notCase, state) {
  const wantOpen = notCase ? state !== 'open' : state === 'open';
  await waitForCondition(this, `(${lightboxOpen})() === ${wantOpen}`, undefined, async () => friendly({
    message: `Expected the lightbox to be ${wantOpen ? 'open' : 'closed'}, but it is ${wantOpen ? 'closed' : 'open'}.`,
    hint: LIGHTBOX_HINT,
  }));
});
