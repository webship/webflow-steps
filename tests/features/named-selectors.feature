# The pack names the markup Webflow renders, so a scenario can use webship-js's
# named selector steps with nothing configured. The names are listed in
# tests/selectors/webflow.json.
Feature: Named selectors
  As a tester of a Webflow site
  I want names for the parts of a Webflow page
  So that a scenario reads like the page does

  Scenario: The parts of the home page
    Given I am an anonymous user
    And I set the viewport to the "desktop" breakpoint
    When I am on the homepage
    Then I see visible navbar, navbar logo, collection list, collection item, webflow form, form submit button
    And I see navbar above collection list
    And I don't see form success message, form error message, webflow badge

  Scenario: The parts of the components page
    Given I am an anonymous user
    And I set the viewport to the "desktop" breakpoint
    When I am on the "/components.html" page
    Then I see visible tabs, selected tab, shown tab panel, slider, slide, slider arrow next, dropdown toggle, background video, background video control, webflow badge
    And I don't see open dropdown list, lightbox backdrop
