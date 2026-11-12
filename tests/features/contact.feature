# The copy, item counts and paths below are those of the demo site in demo-site/;
# swap them for your own content when you copy this feature.
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

  Scenario: The contact form is protected by a challenge
    Given the URL "https://challenges.cloudflare.com/**" is blocked
    And I am an anonymous user
    When I am on the "/contact.html" page
    Then the "Contact Form" form should be protected by a challenge
    And the form submit button should be disabled

  Scenario: Submit the contact form successfully
    Given the webflow form endpoint accepts submissions
    And the Turnstile challenge passes
    And I am an anonymous user
    When I am on the "/contact.html" page
    And I fill in "Name" with "Jane Doe"
    And I fill in "Email" with "jane@example.com"
    And I fill in "Message" with "How can we help?"
    And I submit the "Contact Form" form
    Then I should see the webflow form success message
    And the form success message should contain "Your submission has been received"

  Scenario: Contact form submission shows an error state
    Given the webflow form endpoint rejects submissions
    And the Turnstile challenge passes
    And I am an anonymous user
    When I am on the "/contact.html" page
    And I fill in "Name" with "Jane Doe"
    And I fill in "Email" with "jane@example.com"
    And I fill in "Message" with "How can we help?"
    And I submit the "Contact Form" form
    Then I should see the webflow form error message
    And I should not see the webflow form success message

  @mobile
  Scenario: View the contact page on mobile
    Given I am an anonymous user
    And I set the viewport to the "mobile" breakpoint
    When I am on the "/contact.html" page
    Then I should see "Contact us"
    And the mobile menu should not be open
