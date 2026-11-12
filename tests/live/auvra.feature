# A read-only check of the pack against a public Webflow template site (a
# preview site Webflow hosts on webflow.io), to prove the steps read the markup
# and states a real Webflow runtime produces, not only those of demo-site/.
# The file name is the site: `auvra.feature` runs against
# https://auvra.webflow.io. It is not part of the default run: `npm run
# test:live`. Nothing is submitted: the form endpoint and the Turnstile
# challenge are test doubles. Each scenario loads one page, to keep the load
# on the site low. The site belongs to its author and may change; update the
# copy here when it does.
@live
Feature: The Auvra template site on webflow.io
  As a maintainer of the pack
  I want the steps to work on sites that Webflow itself publishes
  So that a team can rely on them for its own Webflow site

  Scenario: The home page: page ids, Navbar, tabs, slider and collection lists
    Given I set the viewport to the "desktop" breakpoint
    When I am on "/"
    Then this should be a webflow page
    And this should be the webflow site "6a282ca3f318327eefc29a02"
    And I should see the webflow navigation
    And the navigation should list "Contact Us"
    And the "Home" navigation link should be the current page
    And the "Projects" navigation link should not be the current page
    And the "Monthly" tab should be selected
    And the "Monthly" tab content should be visible
    When I select the "Custom Project" tab
    Then the "Custom Project" tab should be selected
    And the "Custom Project" tab content should be visible
    And the "Monthly" tab content should not be visible
    And the "reviews-slider" slider should have 3 slides
    When I go to the next slide of the "reviews-slider" slider
    Then I should see 3 items in the "home-blog-collection-wrap" collection list
    And I should see at least 3 items in the "projects-list" collection list

  @mobile
  Scenario: The mobile menu opens and closes with the state Webflow keeps
    Given I set the viewport to the "mobile" breakpoint
    When I am on "/"
    Then the mobile menu should be closed
    When I open the mobile menu
    Then the mobile menu should be open
    When I close the mobile menu
    Then the mobile menu should be closed

  Scenario: A Turnstile-protected form shows the success state
    Given the webflow form endpoint accepts submissions
    And the Turnstile challenge passes
    When I am on "/contact"
    Then the "Contact Form" form should be protected by a challenge
    When I fill in "Name" with "Test Visitor"
    And I fill in "Email" with "info@webship.co"
    And I fill in "Company" with "Webship"
    And I select "$5k - $10K" from "Budget"
    And I fill in "Tell Us your boldest idea?" with "A test message that is never sent."
    And I submit the "Contact Form" form
    Then I should see the webflow form success message
    And the form success message should contain "Thank you"

  Scenario: A Turnstile-protected form shows the error state
    Given the webflow form endpoint rejects submissions
    And the Turnstile challenge passes
    When I am on "/contact"
    And I fill in "Name" with "Test Visitor"
    And I fill in "Email" with "info@webship.co"
    And I fill in "Company" with "Webship"
    And I select "$5k - $10K" from "Budget"
    And I fill in "Tell Us your boldest idea?" with "A test message that is never sent."
    And I submit the "Contact Form" form
    Then I should see the webflow form error message
    And I should not see the webflow form success message
