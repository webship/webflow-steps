# A read-only check of the pack against a public Webflow template site; the file
# name is the site (https://deluix.webflow.io). See tests/live/auvra.feature.
@live
Feature: The Deluix template site on webflow.io
  As a maintainer of the pack
  I want the steps to see the Background Video of a hero section
  So that a team can rely on them for its own Webflow site

  Scenario: The hero background video plays
    When I am on "/"
    Then this should be a webflow page
    And the background video should be playing
