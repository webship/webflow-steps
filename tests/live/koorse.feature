# A read-only check of the pack against a public Webflow template site; the file
# name is the site (https://koorse.webflow.io). See tests/live/auvra.feature.
@live
Feature: The Koorse template site on webflow.io
  As a maintainer of the pack
  I want the steps to work on a Navbar of link blocks, a slider and a lightbox
  So that a team can rely on them for its own Webflow site

  Scenario: The home page: Navbar of link blocks, slider and lightbox
    Given I set the viewport to the "desktop" breakpoint
    When I am on "/"
    Then this should be a webflow page
    And the navigation should list "Course"
    And the "Home" navigation link should be the current page
    And the "Course" navigation link should not be the current page
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

  Scenario: The checkout page shows the sections of its form
    When I am on "/checkout"
    Then I should see the checkout form
    And the checkout form should have the "customer information" section
    And the checkout form should have the "payment" section
    And the checkout form should have the "order summary" section
