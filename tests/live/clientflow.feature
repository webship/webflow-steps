# A read-only check of the pack against a public Webflow template site; the file
# name is the site (https://clientflow.webflow.io). See tests/live/auvra.feature.
@live
Feature: The Clientflow template site on webflow.io
  As a maintainer of the pack
  I want the steps to work on a dropdown used as an accordion
  So that a team can rely on them for its own Webflow site

  Scenario: A dropdown opens and closes
    When I am on "/"
    Then the "What is Clientflow?" dropdown should be closed
    When I open the "What is Clientflow?" dropdown
    Then the "What is Clientflow?" dropdown should be open
    When I close the "What is Clientflow?" dropdown
    Then the "What is Clientflow?" dropdown should not be open
