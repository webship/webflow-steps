# The labels and counts below are those of demo-site/components.html; swap
# them for your own components when you copy this feature.
Feature: Interactive components
  As a website visitor
  I want tabs, sliders, dropdowns and lightboxes that respond
  So that I can reach the content they hold

  Background:
    Given I am an anonymous user
    And I set the viewport to the "desktop" breakpoint
    And I am on the "/components.html" page

  Scenario: Select a tab to show its content
    Then the "Monthly" tab should be selected
    And the "Monthly" tab content should be visible
    And the "Yearly" tab should not be selected
    And the "Yearly" tab content should not be visible
    When I select the "Yearly" tab
    Then the "Yearly" tab should be selected
    And the "Yearly" tab content should be visible
    And the "Monthly" tab content should not be visible
    And I should see "Pay once a year"

  Scenario: Move through the slides of a slider
    Then the slider should have 3 slides
    And the slider should show slide 1 of 3
    When I go to the next slide
    Then the slider should show slide 2 of 3
    When I go to the next slide of the "reviews-slider" slider
    And I go to the next slide
    Then the "reviews-slider" slider should show slide 1 of 3
    When I go to the previous slide
    Then the slider should show slide 3 of 3

  Scenario: Open and close a dropdown
    Then the "Products" dropdown should be closed
    When I open the "Products" dropdown
    Then the "Products" dropdown should be open
    And the "Products" dropdown should list "Pricing"
    And the "Products" dropdown should not list "Admin"
    When I close the "Products" dropdown
    Then the "Products" dropdown should not be open

  Scenario: A dropdown that opens on hover
    When I open the "Resources" dropdown
    Then the "Resources" dropdown should be open
    And the "Resources" dropdown should list "Support"

  Scenario: Open and close a lightbox
    Then the lightbox should be closed
    When I open the "about-light-box" lightbox
    Then the lightbox should be open
    When I close the lightbox
    Then the lightbox should not be open
