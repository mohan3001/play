import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/auth/LoginPage';
import { TestDataManager } from '../../src/utils/TestDataManager';

let loginPage: LoginPage;
let testData: TestDataManager;

Given('I am on the login page', async function() {
    const { page } = this;
    loginPage = new LoginPage(page);
    testData = TestDataManager.getInstance();
    // Page is already navigated to base URL in hooks
});

When('I enter valid username {string}', async function(username: string) {
    await loginPage.fillInput(loginPage['locators'].usernameInput, username);
});

When('I enter valid password {string}', async function(password: string) {
    await loginPage.fillInput(loginPage['locators'].passwordInput, password);
});

When('I enter invalid username {string}', async function(username: string) {
    await loginPage.fillInput(loginPage['locators'].usernameInput, username);
});

When('I enter invalid password {string}', async function(password: string) {
    await loginPage.fillInput(loginPage['locators'].passwordInput, password);
});

When('I enter username {string}', async function(username: string) {
    await loginPage.fillInput(loginPage['locators'].usernameInput, username);
});

When('I enter password {string}', async function(password: string) {
    await loginPage.fillInput(loginPage['locators'].passwordInput, password);
});

When('I click the login button', async function() {
    await loginPage.clickElement(loginPage['locators'].loginButton);
    await loginPage.waitForPageLoad();
});

When('I click the login button without entering credentials', async function() {
    await loginPage.clickElement(loginPage['locators'].loginButton);
});

Then('I should be redirected to the inventory page', async function() {
    const { page } = this;
    await expect(page).toHaveURL(/.*inventory\.html/);
});

Then('I should see an error message', async function() {
    await loginPage.expectErrorToBeVisible();
});

Then('I should remain on the login page', async function() {
    const { page } = this;
    await expect(page).toHaveURL(/.*\/$/);
});

Then('I should see a locked out error message', async function() {
    await loginPage.expectErrorToBeVisible();
    await loginPage.expectErrorToContainText('Epic sadface: Sorry, this user has been locked out');
});

Then('I should see a required field error message', async function() {
    await loginPage.expectErrorToBeVisible();
    await loginPage.expectErrorToContainText('Epic sadface: Username is required');
}); 