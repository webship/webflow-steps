'use strict';

const path = require('path');

const stepDefinitionsPath = path.join(__dirname, 'tests', 'step-definitions', 'webflow.steps.js');

module.exports = {
  stepDefinitionsPath,
  stepDefinitionsGlob: path.join(__dirname, 'tests', 'step-definitions', '*.steps.js'),
};
