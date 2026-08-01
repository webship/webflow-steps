Feature: About page
  As a website visitor
  I want to browse the about page
  So that I can learn who is behind the product

  Scenario: View the about page on desktop
    Given I am an anonymous user
    And I set the viewport to the "desktop" breakpoint
    When I am on the "/about.html" page
    Then this should be a webflow page
    And I should see the webflow navigation menu
    And I should see "About us"
    And I should see 2 items in the "team" collection list
    And the "About" navigation link should be the current page
    And the "Home" navigation link should not be the current page

  @mobile
  Scenario: View the about page on mobile
    Given I am an anonymous user
    And I set the viewport to the "mobile" breakpoint
    When I am on the "/about.html" page
    Then I should see "Our team"
    And the mobile menu should not be open
    When I open the mobile menu
    Then the mobile menu should be open
    When I close the mobile menu
    Then the mobile menu should be closed
