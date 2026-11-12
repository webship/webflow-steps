# The site id below is the demo site's; swap it for the id in your Webflow
# site settings when you copy this feature.
Feature: Webflow site
  As a site owner
  I want to be sure a page is published by the Webflow site I mean
  So that a test never runs against the wrong copy

  Scenario: A published page carries the Webflow site and page ids
    Given I am an anonymous user
    When I am on the homepage
    Then this should be a webflow page
    And this should be the webflow site "6a1f3c0b9d2e4a5b8c7d6e01"

  Scenario: A site on the free hosting plan carries the Webflow badge
    Given I am an anonymous user
    When I am on the "/components.html" page
    Then I should see the Webflow badge

  Scenario: A site on a paid plan has no Webflow badge
    Given I am an anonymous user
    When I am on the homepage
    Then I should not see the Webflow badge
