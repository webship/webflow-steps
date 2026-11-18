# A read-only check of the pack against a public Webflow template site (a
# preview site Webflow hosts on webflow.io), to prove the steps read the markup
# and states a real Webflow runtime produces, not only those of demo-site/.
# The file name is the site: `koorse.feature` runs against
# https://koorse.webflow.io. It is not part of the default run: `npm run
# test:live`. Nothing is submitted: the form endpoint and the Turnstile
# challenge are test doubles. Each scenario loads one page, to keep the load
# on the site low. The site belongs to its author and may change; update the
# copy here when it does.
@live
Feature: The Koorse template site on webflow.io
  As a maintainer of the pack
  I want the steps to work on sites that Webflow itself publishes
  So that a team can rely on them for its own Webflow site

  Scenario: The home page: page ids, Navbar of link blocks, collection lists, slider, lightbox and cart
    Given I set the viewport to the "desktop" breakpoint
    When I am on "/"
    Then this should be a published page
    And this should be the site "6a906778b7eda4ebf3917813"
    And I should not see the hosting badge
    And I should see the navigation
    And the navigation should list "Course"
    And the "Home" navigation link should be the current page
    And the "Course" navigation link should not be the current page
    And I should see 4 items in the "work-cl" collection list
    And I should see at least 3 items in the "blog-cl" collection list
    And the "testi-slider" slider should have 4 slides
    When I go to the next slide of the "testi-slider" slider
    Then the "testi-slider" slider should show slide 2 of 4
    When I go to the previous slide of the "testi-slider" slider
    Then the "testi-slider" slider should show slide 1 of 4
    And the lightbox should be closed
    When I open the lightbox
    Then the lightbox should be open
    When I close the lightbox
    Then the lightbox should be closed
    And the cart should be closed
    And the cart should be empty
    When I open the cart
    Then the cart should be open
    And the cart should contain 0 items
    And the cart should not contain "Course"
    When I close the cart
    Then the cart should not be open

  Scenario: A Turnstile-protected form shows the success state
    Given the form endpoint accepts submissions
    And the Turnstile challenge passes
    When I am on "/"
    Then the "Email Form" form should be protected by a challenge
    When I fill in "email" with "visitor@example.com" by "name" attribute
    And I submit the "Email Form" form
    Then I should see the form success message
    And the form success message should contain "Thank you"

  Scenario: A Turnstile-protected form shows the error state
    Given the form endpoint rejects submissions
    And the Turnstile challenge passes
    When I am on "/"
    And I fill in "email" with "visitor@example.com" by "name" attribute
    And I submit the "Email Form" form
    Then I should see the form error message
    And I should not see the form success message

  Scenario: The checkout page shows the sections of its form
    When I am on "/checkout"
    Then I should see the checkout form
    And the checkout form should have the "customer information" section
    And the checkout form should have the "payment" section
    And the checkout form should have the "order summary" section
