import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { LOCATORS } from '../locators';

export interface CheckoutInfo {
    firstName: string;
    lastName: string;
    postalCode: string;
}

export class CheckoutPage extends BasePage {
    protected getLocators() {
        return LOCATORS.checkout;
    }

    async fillCheckoutInfo(info: CheckoutInfo): Promise<void> {
        await this.fillInput(this.locators.firstNameInput, info.firstName);
        await this.fillInput(this.locators.lastNameInput, info.lastName);
        await this.fillInput(this.locators.postalCodeInput, info.postalCode);
    }

    async clickContinue(): Promise<void> {
        await this.clickElement(this.locators.continueButton);
        await this.waitForPageLoad();
    }

    async clickCancel(): Promise<void> {
        await this.clickElement(this.locators.cancelButton);
        await this.waitForPageLoad();
    }

    async getErrorMessage(): Promise<string> {
        return await this.getText(this.locators.errorMessage);
    }

    async isErrorVisible(): Promise<boolean> {
        return await this.isElementVisible(this.locators.errorMessage);
    }

    async expectCheckoutFormToBeVisible(): Promise<void> {
        await this.expectElementToBeVisible(this.locators.firstNameInput);
        await this.expectElementToBeVisible(this.locators.lastNameInput);
        await this.expectElementToBeVisible(this.locators.postalCodeInput);
        await this.expectElementToBeVisible(this.locators.continueButton);
        await this.expectElementToBeVisible(this.locators.cancelButton);
    }

    async expectContinueButtonToBeEnabled(): Promise<void> {
        await this.expectElementToBeEnabled(this.locators.continueButton);
    }

    async expectErrorToBeVisible(): Promise<void> {
        await this.expectElementToBeVisible(this.locators.errorMessage);
    }

    async expectErrorToContainText(text: string): Promise<void> {
        await this.expectElementToContainText(this.locators.errorMessage, text);
    }

    // Method to clear form fields
    async clearForm(): Promise<void> {
        await this.page.fill(this.locators.firstNameInput, '');
        await this.page.fill(this.locators.lastNameInput, '');
        await this.page.fill(this.locators.postalCodeInput, '');
    }

    // Method to verify we're on the checkout page
    async verifyOnCheckoutPage(): Promise<void> {
        const currentUrl = await this.page.url();
        if (!currentUrl.includes('/checkout-step-one.html')) {
            throw new Error('Not on checkout page');
        }
        await this.expectCheckoutFormToBeVisible();
    }

    // Method to validate form fields are required
    async validateRequiredFields(): Promise<void> {
        // Try to continue without filling any fields
        await this.clickElement(this.locators.continueButton);
        
        // Should show error message
        await this.expectErrorToBeVisible();
    }

    // Method to get current form values
    async getFormValues(): Promise<CheckoutInfo> {
        const firstName = await this.page.inputValue(this.locators.firstNameInput);
        const lastName = await this.page.inputValue(this.locators.lastNameInput);
        const postalCode = await this.page.inputValue(this.locators.postalCodeInput);
        
        return {
            firstName,
            lastName,
            postalCode
        };
    }
} 