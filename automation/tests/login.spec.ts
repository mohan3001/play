import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/auth/LoginPage';
import { TestDataManager } from '../src/utils/TestDataManager';

test.describe('Login Tests', () => {
    let loginPage: LoginPage;
    let testData: TestDataManager;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        testData = TestDataManager.getInstance();
        await page.goto('/');
    });

    test('should display login form elements', async () => {
        await loginPage.expectLoginFormToBeVisible();
        await loginPage.expectLoginButtonToBeEnabled();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        const credentials = testData.getUserCredentials('standard');
        
        await loginPage.login(credentials.username, credentials.password);
        
        // Should redirect to inventory page
        await expect(page).toHaveURL(/.*inventory\.html/);
    });

    test('should show error message for locked out user', async () => {
        const credentials = testData.getUserCredentials('locked_out');
        
        await loginPage.login(credentials.username, credentials.password);
        
        await loginPage.expectErrorToBeVisible();
        await loginPage.expectErrorToContainText('Epic sadface: Sorry, this user has been locked out');
    });

    test('should show error message for invalid username', async () => {
        await loginPage.login('invalid_user', 'secret_sauce');
        
        await loginPage.expectErrorToBeVisible();
        await loginPage.expectErrorToContainText('Epic sadface: Username and password do not match any user in this service');
    });

    test('should show error message for invalid password', async () => {
        await loginPage.login('standard_user', 'wrong_password');
        
        await loginPage.expectErrorToBeVisible();
        await loginPage.expectErrorToContainText('Epic sadface: Username and password do not match any user in this service');
    });

    test('should show error message for empty username', async () => {
        await loginPage.login('', 'secret_sauce');
        
        await loginPage.expectErrorToBeVisible();
        await loginPage.expectErrorToContainText('Epic sadface: Username is required');
    });

    test('should show error message for empty password', async () => {
        await loginPage.login('standard_user', '');
        
        await loginPage.expectErrorToBeVisible();
        await loginPage.expectErrorToContainText('Epic sadface: Password is required');
    });

    test('should show error message for empty credentials', async () => {
        await loginPage.login('', '');
        
        await loginPage.expectErrorToBeVisible();
        await loginPage.expectErrorToContainText('Epic sadface: Username is required');
    });

    test('should clear form fields', async () => {
        await loginPage.fillInput(loginPage['locators'].usernameInput, 'test_user');
        await loginPage.fillInput(loginPage['locators'].passwordInput, 'test_password');
        
        await loginPage.clearForm();
        
        const usernameValue = await loginPage.getInputValue(loginPage['locators'].usernameInput);
        const passwordValue = await loginPage.getInputValue(loginPage['locators'].passwordInput);
        
        expect(usernameValue).toBe('');
        expect(passwordValue).toBe('');
    });

    test('should verify on login page', async () => {
        await loginPage.verifyOnLoginPage();
    });

    test('should handle performance glitch user', async ({ page }) => {
        const credentials = testData.getUserCredentials('performance_glitch');
        
        // This user has performance issues, so we'll wait longer
        await loginPage.login(credentials.username, credentials.password);
        
        // Should eventually redirect to inventory page
        await expect(page).toHaveURL(/.*inventory\.html/, { timeout: 10000 });
    });

    test('should handle problem user', async ({ page }) => {
        const credentials = testData.getUserCredentials('problem');
        
        await loginPage.login(credentials.username, credentials.password);
        
        // Problem user should still be able to login
        await expect(page).toHaveURL(/.*inventory\.html/);
    });
}); 