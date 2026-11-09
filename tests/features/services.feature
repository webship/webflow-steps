Feature: Services page
  As a website visitor
  I want to browse the services page
  So that I can compare pricing plans and reach the contact page

  Scenario: View the services page on desktop
    Given I am an anonymous user
    And I set the viewport to the "desktop" breakpoint
    When I am on the "/services.html" page
    Then this should be a webflow page
    And I should see the webflow navigation menu
    And I should see "Our services"
    And I should see 2 items in the "pricing" collection list
    And the "Services" navigation link should be the current page

  Scenario: Choose a plan and land on the contact page
    Given I am an anonymous user
    When I am on the "/services.html" page
    And I click "Choose plan"
    Then I should be on "/contact.html"

  @mobile
  Scenario: View the services page on mobile
    Given I am an anonymous user
    And I set the viewport to the "mobile" breakpoint
    When I am on the "/services.html" page
    Then I should see "Our services"
    And the mobile menu should not be open
