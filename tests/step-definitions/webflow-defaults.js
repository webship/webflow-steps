'use strict';

// The defaults this pack ships for every scenario. Not a step file: it
// registers one hook and no step definitions.
//
// The named selectors for the markup Webflow renders
// (`tests/selectors/webflow.json`: "navbar", "form success message",
// "collection item", "shown tab panel", "cart", "webflow badge", ...) are
// merged into webship-js's selector registry after it has loaded the
// project's own `worldParameters.selectors` and files, and never override a
// name the project defined. So `Then I see visible navbar` works on any
// Webflow site with nothing configured, and a project keeps the last word.

const fs = require('fs');
const path = require('path');
const { Before } = require('@cucumber/cucumber');

const WEBFLOW_SELECTORS_FILE = path.join(__dirname, '..', 'selectors', 'webflow.json');

/**
 * Merge a selector preset (`{ css: {name: selector}, xpath: {...} }`) into the
 * World's selector registries without overriding what is already there.
 *
 * @param {object} world - The cucumber World.
 * @param {string} file - A preset JSON file.
 * @returns {number} How many names were added.
 */
function mergeSelectorPreset(world, file) {
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  world.__selectorsCss = world.__selectorsCss || {};
  world.__selectorsXpath = world.__selectorsXpath || {};
  let added = 0;
  for (const [registry, entries] of [[world.__selectorsCss, parsed.css || {}], [world.__selectorsXpath, parsed.xpath || {}]]) {
    for (const [name, selector] of Object.entries(entries)) {
      if (!(name in world.__selectorsCss) && !(name in world.__selectorsXpath)) {
        registry[name] = selector;
        added += 1;
      }
    }
  }
  return added;
}

// webship-js fills the registries in a hook with the default order (10000);
// this one runs right after it so the project's names are already in place.
Before({ order: 10100 }, function () {
  mergeSelectorPreset(this, WEBFLOW_SELECTORS_FILE);
});

module.exports = { WEBFLOW_SELECTORS_FILE, mergeSelectorPreset };
