import { Page, Locator, expect } from '@playwright/test';

export class ElementHelper {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // Wait for element to be visible
    async waitForElement(selector: string, timeout = 30000): Promise<void> {
        await this.page.waitForSelector(selector, { state: 'visible', timeout });
    }

    // Wait for element to be hidden
    async waitForElementHidden(selector: string, timeout = 30000): Promise<void> {
        await this.page.waitForSelector(selector, { state: 'hidden', timeout });
    }

    // Wait for element to be attached to DOM
    async waitForElementAttached(selector: string, timeout = 30000): Promise<void> {
        await this.page.waitForSelector(selector, { state: 'attached', timeout });
    }

    // Wait for element to be detached from DOM
    async waitForElementDetached(selector: string, timeout = 30000): Promise<void> {
        await this.page.waitForSelector(selector, { state: 'detached', timeout });
    }

    // Click element with retry
    async clickWithRetry(selector: string, maxRetries = 3): Promise<void> {
        let lastError: Error | null = null;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                await this.waitForElement(selector);
                await this.page.click(selector);
                return;
            } catch (error) {
                lastError = error as Error;
                if (i < maxRetries - 1) {
                    await this.page.waitForTimeout(1000);
                }
            }
        }
        
        throw lastError || new Error(`Failed to click element ${selector} after ${maxRetries} retries`);
    }

    // Fill input with retry
    async fillWithRetry(selector: string, value: string, maxRetries = 3): Promise<void> {
        let lastError: Error | null = null;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                await this.waitForElement(selector);
                await this.page.fill(selector, value);
                return;
            } catch (error) {
                lastError = error as Error;
                if (i < maxRetries - 1) {
                    await this.page.waitForTimeout(1000);
                }
            }
        }
        
        throw lastError || new Error(`Failed to fill element ${selector} after ${maxRetries} retries`);
    }

    // Clear and fill input
    async clearAndFill(selector: string, value: string): Promise<void> {
        await this.waitForElement(selector);
        await this.page.fill(selector, '');
        await this.page.fill(selector, value);
    }

    // Get element text with retry
    async getTextWithRetry(selector: string, maxRetries = 3): Promise<string> {
        let lastError: Error | null = null;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                await this.waitForElement(selector);
                const text = await this.page.textContent(selector);
                return text || '';
            } catch (error) {
                lastError = error as Error;
                if (i < maxRetries - 1) {
                    await this.page.waitForTimeout(1000);
                }
            }
        }
        
        throw lastError || new Error(`Failed to get text from element ${selector} after ${maxRetries} retries`);
    }

    // Check if element is visible
    async isElementVisible(selector: string, timeout = 5000): Promise<boolean> {
        try {
            await this.waitForElement(selector, timeout);
            return await this.page.isVisible(selector);
        } catch {
            return false;
        }
    }

    // Check if element is enabled
    async isElementEnabled(selector: string): Promise<boolean> {
        await this.waitForElement(selector);
        return await this.page.isEnabled(selector);
    }

    // Get element count
    async getElementCount(selector: string): Promise<number> {
        const elements = this.page.locator(selector);
        return await elements.count();
    }

    // Wait for page to load
    async waitForPageLoad(): Promise<void> {
        await this.page.waitForLoadState('networkidle');
    }

    // Wait for specific URL
    async waitForUrl(url: string, timeout = 30000): Promise<void> {
        await this.page.waitForURL(url, { timeout });
    }

    // Wait for URL to contain text
    async waitForUrlContains(text: string, timeout = 30000): Promise<void> {
        await this.page.waitForURL(`**${text}**`, { timeout });
    }

    // Take screenshot
    async takeScreenshot(name: string): Promise<void> {
        await this.page.screenshot({ 
            path: `screenshots/${name}-${Date.now()}.png`,
            fullPage: true 
        });
    }

    // Scroll to element
    async scrollToElement(selector: string): Promise<void> {
        await this.waitForElement(selector);
        await this.page.locator(selector).scrollIntoViewIfNeeded();
    }

    // Hover over element
    async hoverOverElement(selector: string): Promise<void> {
        await this.waitForElement(selector);
        await this.page.hover(selector);
    }

    // Select option from dropdown
    async selectOption(selector: string, value: string): Promise<void> {
        await this.waitForElement(selector);
        await this.page.selectOption(selector, value);
    }

    // Check checkbox
    async checkCheckbox(selector: string): Promise<void> {
        await this.waitForElement(selector);
        await this.page.check(selector);
    }

    // Uncheck checkbox
    async uncheckCheckbox(selector: string): Promise<void> {
        await this.waitForElement(selector);
        await this.page.uncheck(selector);
    }

    // Get input value
    async getInputValue(selector: string): Promise<string> {
        await this.waitForElement(selector);
        return await this.page.inputValue(selector);
    }

    // Wait for element to have specific text
    async waitForElementText(selector: string, text: string, timeout = 30000): Promise<void> {
        await this.page.waitForFunction(
            () => {
                const element = document.querySelector(selector);
                return element && element.textContent?.includes(text);
            },
            { timeout }
        );
    }

    // Wait for element to not have specific text
    async waitForElementNotText(selector: string, text: string, timeout = 30000): Promise<void> {
        await this.page.waitForFunction(
            () => {
                const element = document.querySelector(selector);
                return element && !element.textContent?.includes(text);
            },
            { timeout }
        );
    }

    // Get all elements with specific text
    async getElementsWithText(selector: string, text: string): Promise<Locator[]> {
        const elements = this.page.locator(selector);
        const count = await elements.count();
        const matchingElements: Locator[] = [];
        
        for (let i = 0; i < count; i++) {
            const element = elements.nth(i);
            const elementText = await element.textContent();
            if (elementText && elementText.includes(text)) {
                matchingElements.push(element);
            }
        }
        
        return matchingElements;
    }

    // Wait for network request to complete
    async waitForNetworkIdle(): Promise<void> {
        await this.page.waitForLoadState('networkidle');
    }

    // Wait for specific network request
    async waitForRequest(url: string, timeout = 30000): Promise<void> {
        await this.page.waitForRequest(request => request.url().includes(url), { timeout });
    }

    // Wait for specific network response
    async waitForResponse(url: string, timeout = 30000): Promise<void> {
        await this.page.waitForResponse(response => response.url().includes(url), { timeout });
    }
} 