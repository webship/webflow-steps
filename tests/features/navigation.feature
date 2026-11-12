# The labels below are those of the demo site in demo-site/; swap them for
# your own menu when you copy this feature.
Feature: Navigation
  As a website visitor
  I want a navigation bar that works on every screen size
  So that I can reach every page

  Scenario: The Navbar lists the pages of the site
    Given I am an anonymous user
    And I set the viewport to the "desktop" breakpoint
    When I am on the homepage
    Then the navigation should list "Home"
    And the navigation menu should list "Services"
    And the navigation should not list "Admin"

  Scenario: A link block is the current page as well as a nav link
    Given I am an anonymous user
    When I am on the "/contact.html" page
    Then the "Contact" navigation link should be the current page
    And the "Services" navigation link should not be the current page

  Scenario: The brand link of the Navbar is the current page on the home page
    Given I am an anonymous user
    When I am on the homepage
    Then the "Webflow Steps Demo" navigation link should be the current page

  @mobile
  Scenario: Opening an open menu and closing a closed menu change nothing
    Given I am an anonymous user
    And I set the viewport to the "mobile" breakpoint
    When I am on the homepage
    And I close the mobile menu
    Then the mobile menu should be closed
    When I open the mobile menu
    And I open the mobile menu
    Then the mobile menu should be open
