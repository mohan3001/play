Feature: Login Functionality
  As a user
  I want to be able to login to the application
  So that I can access my account

  Background:
    Given I am on the login page

  Scenario: Successful login with valid credentials
    When I enter valid username "standard_user"
    And I enter valid password "secret_sauce"
    And I click the login button
    Then I should be redirected to the inventory page

  Scenario: Failed login with invalid credentials
    When I enter invalid username "invalid_user"
    And I enter invalid password "wrong_password"
    And I click the login button
    Then I should see an error message
    And I should remain on the login page

  Scenario: Failed login with locked out user
    When I enter username "locked_out_user"
    And I enter password "secret_sauce"
    And I click the login button
    Then I should see a locked out error message

  Scenario: Failed login with empty credentials
    When I click the login button without entering credentials
    Then I should see a required field error message 