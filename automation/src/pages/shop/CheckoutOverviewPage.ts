import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { LOCATORS } from '../locators';

export class CheckoutOverviewPage extends BasePage {
    protected getLocators() {
        return LOCATORS.checkoutOverview;
    }

    async getItemTotal(): Promise<string> {
        return await this.getText(this.locators.itemTotal);
    }

    async getTax(): Promise<string> {
        return await this.getText(this.locators.tax);
    }

    async getTotal(): Promise<string> {
        return await this.getText(this.locators.total);
    }

    async clickFinish(): Promise<void> {
        await this.clickElement(this.locators.finishButton);
        await this.waitForPageLoad();
    }

    async clickCancel(): Promise<void> {
        await this.clickElement(this.locators.cancelButton);
        await this.waitForPageLoad();
    }

    async expectOverviewElementsToBeVisible(): Promise<void> {
        await this.expectElementToBeVisible(this.locators.itemTotal);
        await this.expectElementToBeVisible(this.locators.tax);
        await this.expectElementToBeVisible(this.locators.total);
        await this.expectElementToBeVisible(this.locators.finishButton);
        await this.expectElementToBeVisible(this.locators.cancelButton);
    }

    async expectFinishButtonToBeEnabled(): Promise<void> {
        await this.expectElementToBeEnabled(this.locators.finishButton);
    }

    // Method to extract numeric values from price strings
    async getItemTotalNumeric(): Promise<number> {
        const itemTotalText = await this.getItemTotal();
        return this.extractNumericValue(itemTotalText);
    }

    async getTaxNumeric(): Promise<number> {
        const taxText = await this.getTax();
        return this.extractNumericValue(taxText);
    }

    async getTotalNumeric(): Promise<number> {
        const totalText = await this.getTotal();
        return this.extractNumericValue(totalText);
    }

    private extractNumericValue(text: string): number {
        // Extract numeric value from strings like "Item total: $29.99"
        const match = text.match(/\$(\d+\.?\d*)/);
        return match && match[1] ? parseFloat(match[1]) : 0;
    }

    // Method to verify total calculation
    async verifyTotalCalculation(): Promise<void> {
        const itemTotal = await this.getItemTotalNumeric();
        const tax = await this.getTaxNumeric();
        const total = await this.getTotalNumeric();
        
        const expectedTotal = itemTotal + tax;
        
        if (Math.abs(total - expectedTotal) > 0.01) {
            throw new Error(`Total calculation incorrect. Expected: ${expectedTotal}, Actual: ${total}`);
        }
    }

    // Method to verify we're on the checkout overview page
    async verifyOnCheckoutOverviewPage(): Promise<void> {
        const currentUrl = await this.page.url();
        if (!currentUrl.includes('/checkout-step-two.html')) {
            throw new Error('Not on checkout overview page');
        }
        await this.expectOverviewElementsToBeVisible();
    }

    async getTotalAmount(): Promise<number> {
        const totalText = await this.getText(this.locators.total);
        const match = totalText.match(/\$(\d+\.\d+)/);
        return match && match[1] ? parseFloat(match[1]) : 0;
    }
} 