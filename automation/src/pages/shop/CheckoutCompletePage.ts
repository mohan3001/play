import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { LOCATORS } from '../locators';

export class CheckoutCompletePage extends BasePage {
    protected getLocators() {
        return LOCATORS.checkoutComplete;
    }

    async getCompleteHeader(): Promise<string> {
        return await this.getText(this.locators.completeHeader);
    }

    async getCompleteText(): Promise<string> {
        return await this.getText(this.locators.completeText);
    }

    async clickBackHome(): Promise<void> {
        await this.clickElement(this.locators.backHomeButton);
        await this.waitForPageLoad();
    }

    async expectCompleteElementsToBeVisible(): Promise<void> {
        await this.expectElementToBeVisible(this.locators.completeHeader);
        await this.expectElementToBeVisible(this.locators.completeText);
        await this.expectElementToBeVisible(this.locators.backHomeButton);
    }

    async expectBackHomeButtonToBeEnabled(): Promise<void> {
        await this.expectElementToBeEnabled(this.locators.backHomeButton);
    }

    async expectSuccessMessage(): Promise<void> {
        const header = await this.getCompleteHeader();
        if (!header.includes('THANK YOU')) {
            throw new Error(`Expected success message, but got: ${header}`);
        }
    }

    async expectCompleteTextToContain(text: string): Promise<void> {
        await this.expectElementToContainText(this.locators.completeText, text);
    }

    // Method to verify we're on the checkout complete page
    async verifyOnCheckoutCompletePage(): Promise<void> {
        const currentUrl = await this.page.url();
        if (!currentUrl.includes('/checkout-complete.html')) {
            throw new Error('Not on checkout complete page');
        }
        await this.expectCompleteElementsToBeVisible();
    }

    // Method to verify order completion
    async verifyOrderCompletion(): Promise<void> {
        await this.expectSuccessMessage();
        await this.expectElementToContainText(this.locators.completeText, 'Your order has been dispatched');
    }
} 