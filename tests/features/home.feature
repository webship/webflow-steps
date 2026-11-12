# The copy, item counts and paths below are those of the demo site in demo-site/;
# swap them for your own content when you copy this feature.
Feature: Home page
  As a website visitor
  I want to browse the home page
  So that I can learn about the product and subscribe to updates

  Scenario: View the home page on desktop
    Given I am an anonymous user
    And I set the viewport to the "desktop" breakpoint
    When I am on the homepage
    Then this should be a webflow page
    And I should see the webflow navigation menu
    And I should see "Build faster with our demo product"
    And I should see 3 items in the "features" collection list
    And the "features" collection list should contain "Reliable"
    And the "features" collection list should not contain "Draft feature"
    And the "Home" navigation link should be the current page
    And the "About" navigation link should not be the current page

  @mobile
  Scenario: Use the mobile nav menu to reach another page
    Given I am an anonymous user
    And I set the viewport to the "mobile" breakpoint
    When I am on the homepage
    Then the mobile menu should not be open
    When I open the mobile menu
    Then the mobile menu should be open
    When I follow "About"
    Then I should be on "/about.html"
    And the "About" navigation link should be the current page

  Scenario: Subscribe to the newsletter successfully
    Given the webflow form endpoint accepts submissions
    And I am an anonymous user
    When I am on the homepage
    And I fill in "email" with "visitor@example.com" by "name" attribute
    And I submit the "Newsletter" form
    Then I should see the webflow form success message
    And the form success message should contain "Thank you"

  Scenario: Newsletter submission shows an error state
    Given the webflow form endpoint rejects submissions
    And I am an anonymous user
    When I am on the homepage
    And I fill in "email" with "visitor@example.com" by "name" attribute
    And I submit the webflow form
    Then I should see the webflow form error message
    And I should not see the webflow form success message
    And the form error message should contain "Something went wrong"
