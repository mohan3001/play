import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { LOCATORS } from '../locators';

export class LoginPage extends BasePage {
    protected getLocators() {
        return LOCATORS.login;
    }

    async login(username: string, password: string): Promise<void> {
        await this.fillInput(this.locators.usernameInput, username);
        await this.fillInput(this.locators.passwordInput, password);
        await this.clickElement(this.locators.loginButton);
        await this.waitForPageLoad();
    }

    async getErrorMessage(): Promise<string> {
        return await this.getText(this.locators.errorMessage);
    }

    async isErrorVisible(): Promise<boolean> {
        return await this.isElementVisible(this.locators.errorMessage);
    }

    async expectLoginFormToBeVisible(): Promise<void> {
        await this.expectElementToBeVisible(this.locators.usernameInput);
        await this.expectElementToBeVisible(this.locators.passwordInput);
        await this.expectElementToBeVisible(this.locators.loginButton);
    }

    async expectLoginButtonToBeEnabled(): Promise<void> {
        await this.expectElementToBeEnabled(this.locators.loginButton);
    }

    async expectErrorToBeVisible(): Promise<void> {
        await this.expectElementToBeVisible(this.locators.errorMessage);
    }

    async expectErrorToContainText(text: string): Promise<void> {
        await this.expectElementToContainText(this.locators.errorMessage, text);
    }

    // Method to clear form fields
    async clearForm(): Promise<void> {
        await this.page.fill(this.locators.usernameInput, '');
        await this.page.fill(this.locators.passwordInput, '');
    }

    // Method to get current URL to verify we're on login page
    async getCurrentUrl(): Promise<string> {
        return this.page.url();
    }

    // Method to verify we're on the login page
    async verifyOnLoginPage(): Promise<void> {
        const currentUrl = await this.getCurrentUrl();
        if (!currentUrl.includes('/')) {
            throw new Error('Not on login page');
        }
        await this.expectLoginFormToBeVisible();
    }
} 