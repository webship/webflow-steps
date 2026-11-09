Feature: Contact page
  As a website visitor
  I want to send a message through the contact form
  So that the team can get back to me

  Scenario: View the contact page on desktop
    Given I am an anonymous user
    And I set the viewport to the "desktop" breakpoint
    When I am on the "/contact.html" page
    Then this should be a webflow page
    And I should see the webflow navigation menu
    And I should see "Contact us"
    And the "Contact" navigation link should be the current page

  Scenario: Submit the contact form successfully
    Given I am an anonymous user
    When I am on the "/contact.html" page
    And I fill in "Name" with "Jane Doe"
    And I fill in "Email" with "jane@example.com"
    And I fill in "Message" with "How can we help?"
    And I submit the webflow form
    Then I should see the webflow form success message

  Scenario: Contact form submission shows an error state
    Given I am an anonymous user
    When I am on the "/contact.html" page
    And I fill in "Name" with "Jane Doe"
    And I fill in "Email" with "fail@example.com"
    And I fill in "Message" with "How can we help?"
    And I submit the webflow form
    Then I should see the webflow form error message

  @mobile
  Scenario: View the contact page on mobile
    Given I am an anonymous user
    And I set the viewport to the "mobile" breakpoint
    When I am on the "/contact.html" page
    Then I should see "Contact us"
    And the mobile menu should not be open
