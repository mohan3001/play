import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { LOCATORS, ProductKey } from '../locators';

export class InventoryPage extends BasePage {
    protected getLocators() {
        return LOCATORS.inventory;
    }

    async addProductToCart(productKey: ProductKey): Promise<void> {
        const productLocator = LOCATORS.products[productKey].addToCart;
        await this.clickElement(productLocator);
    }

    async removeProductFromCart(productKey: ProductKey): Promise<void> {
        const productLocator = LOCATORS.products[productKey].remove;
        await this.clickElement(productLocator);
    }

    async getProductName(productKey: ProductKey): Promise<string> {
        const productName = LOCATORS.products[productKey].name;
        const productElement = this.page.locator(this.locators.productName).filter({ hasText: productName });
        return await productElement.textContent() || '';
    }

    async getProductPrice(productKey: ProductKey): Promise<string> {
        const productName = LOCATORS.products[productKey].name;
        const productContainer = this.page.locator(this.locators.productContainer).filter({ hasText: productName });
        const priceElement = productContainer.locator(this.locators.productPrice);
        return await priceElement.textContent() || '';
    }

    async getCartItemCount(): Promise<number> {
        const badgeText = await this.getText(this.locators.shoppingCartBadge);
        return badgeText ? parseInt(badgeText) : 0;
    }

    async clickShoppingCart(): Promise<void> {
        await this.clickElement(this.locators.shoppingCartLink);
        await this.waitForPageLoad();
    }

    async sortProducts(sortOption: string): Promise<void> {
        await this.page.selectOption(this.locators.sortDropdown, sortOption);
        await this.waitForPageLoad();
    }

    async expectProductToBeVisible(productKey: ProductKey): Promise<void> {
        const productName = LOCATORS.products[productKey].name;
        await this.expectElementToContainText(this.locators.productName, productName);
    }

    async expectAddToCartButtonToBeVisible(productKey: ProductKey): Promise<void> {
        const addToCartLocator = LOCATORS.products[productKey].addToCart;
        await this.expectElementToBeVisible(addToCartLocator);
    }

    async expectRemoveButtonToBeVisible(productKey: ProductKey): Promise<void> {
        const removeLocator = LOCATORS.products[productKey].remove;
        await this.expectElementToBeVisible(removeLocator);
    }

    async expectCartBadgeToShowCount(count: number): Promise<void> {
        const actualCount = await this.getCartItemCount();
        if (actualCount !== count) {
            throw new Error(`Expected cart badge to show ${count}, but it shows ${actualCount}`);
        }
    }

    async expectCartBadgeToBeVisible(): Promise<void> {
        await this.expectElementToBeVisible(this.locators.shoppingCartBadge);
    }

    async expectCartBadgeToNotBeVisible(): Promise<void> {
        const isVisible = await this.isElementVisible(this.locators.shoppingCartBadge);
        if (isVisible) {
            throw new Error('Cart badge should not be visible');
        }
    }

    // Method to get all product names on the page
    async getAllProductNames(): Promise<string[]> {
        const productElements = this.page.locator(this.locators.productName);
        const count = await productElements.count();
        const names: string[] = [];
        
        for (let i = 0; i < count; i++) {
            const name = await productElements.nth(i).textContent();
            if (name) {
                names.push(name);
            }
        }
        
        return names;
    }

    // Method to get all product prices on the page
    async getAllProductPrices(): Promise<string[]> {
        const priceElements = this.page.locator(this.locators.productPrice);
        const count = await priceElements.count();
        const prices: string[] = [];
        
        for (let i = 0; i < count; i++) {
            const price = await priceElements.nth(i).textContent();
            if (price) {
                prices.push(price);
            }
        }
        
        return prices;
    }

    // Method to verify we're on the inventory page
    async verifyOnInventoryPage(): Promise<void> {
        const currentUrl = await this.page.url();
        if (!currentUrl.includes('/inventory.html')) {
            throw new Error('Not on inventory page');
        }
        await this.expectElementToBeVisible(this.locators.sortDropdown);
    }
} 