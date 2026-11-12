'use strict';

const path = require('path');

const stepDefinitionsDir = path.join(__dirname, 'tests', 'step-definitions');
const stepDefinitionsGlob = path.join(stepDefinitionsDir, '*.steps.js');

module.exports = {
  // The folder with every step file of the pack, and the glob that loads them.
  stepDefinitionsDir,
  stepDefinitionsGlob,
  // Kept for projects that required the single file of 2.0.1: it now names
  // every step file of the pack, so a `require: [stepDefinitionsPath]` keeps working.
  stepDefinitionsPath: stepDefinitionsGlob,
};
