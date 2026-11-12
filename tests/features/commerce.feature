# The product names, prices and paths below are those of demo-site/shop.html and
# demo-site/checkout.html; swap them for your own store when you copy this
# feature. On a real store, run the scenarios that add to the cart against a
# store in test mode.
Feature: Ecommerce
  As a shopper
  I want a cart and a checkout that work
  So that I can buy a product

  Background:
    Given I am an anonymous user
    And I set the viewport to the "desktop" breakpoint

  Scenario: The cart of a new visitor is closed and empty
    When I am on the "/shop.html" page
    Then the cart should be closed
    And the cart should be empty
    When I open the cart
    Then the cart should be open
    And the cart should contain 0 items
    When I close the cart
    Then the cart should not be open

  Scenario: Add a product to the cart and go to the checkout
    When I am on the "/shop.html" page
    And I add the product to the cart
    Then the cart should be open
    And the cart should not be empty
    And the cart should contain 1 item
    And the cart should contain "Sticker pack"
    And the cart should not contain "Poster"
    And the cart total should contain "9.00"
    And I should not see the add to cart error
    When I continue to checkout
    Then I should be on "/checkout.html"
    And I should see the checkout form
    And the checkout form should have the "customer information" section
    And the checkout form should have the "shipping address" section
    And the checkout form should have the "shipping methods" section
    And the checkout form should have the "payment" section
    And the checkout form should have the "order summary" section

  Scenario: A product that is out of stock
    When I am on the "/shop.html" page
    Then the product should be out of stock
