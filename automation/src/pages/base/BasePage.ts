import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
    protected page: Page;
    protected locators: any;

    constructor(page: Page) {
        this.page = page;
        this.locators = this.getLocators();
    }

    // Standard methods that LLM can understand and reuse
    async waitForElement(selector: string, timeout = 30000): Promise<void> {
        await this.page.waitForSelector(selector, { timeout });
    }

    async clickElement(selector: string): Promise<void> {
        await this.waitForElement(selector);
        await this.page.click(selector);
    }

    async fillInput(selector: string, value: string): Promise<void> {
        await this.waitForElement(selector);
        await this.page.fill(selector, value);
    }

    async getText(selector: string): Promise<string> {
        await this.waitForElement(selector);
        return await this.page.textContent(selector) || '';
    }

    async getInputValue(selector: string): Promise<string> {
        await this.waitForElement(selector);
        return await this.page.inputValue(selector);
    }

    async isElementVisible(selector: string): Promise<boolean> {
        try {
            await this.waitForElement(selector, 5000);
            return await this.page.isVisible(selector);
        } catch {
            return false;
        }
    }

    async waitForPageLoad(): Promise<void> {
        await this.page.waitForLoadState('networkidle');
    }

    async takeScreenshot(name: string): Promise<void> {
        await this.page.screenshot({ path: `screenshots/${name}-${Date.now()}.png` });
    }

    // Abstract method for locators - helps LLM understand structure
    protected abstract getLocators(): any;

    // Common validation methods
    async expectElementToBeVisible(selector: string): Promise<void> {
        await expect(this.page.locator(selector)).toBeVisible();
    }

    async expectElementToHaveText(selector: string, text: string): Promise<void> {
        await expect(this.page.locator(selector)).toHaveText(text);
    }

    async expectElementToContainText(selector: string, text: string): Promise<void> {
        await expect(this.page.locator(selector)).toContainText(text);
    }

    async expectElementToBeEnabled(selector: string): Promise<void> {
        await expect(this.page.locator(selector)).toBeEnabled();
    }

    async expectElementToBeDisabled(selector: string): Promise<void> {
        await expect(this.page.locator(selector)).toBeDisabled();
    }
} 