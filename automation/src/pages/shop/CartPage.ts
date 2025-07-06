import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { LOCATORS, ProductKey } from '../locators';

export class CartPage extends BasePage {
    protected getLocators() {
        return LOCATORS.cart;
    }

    async getCartItemCount(): Promise<number> {
        const cartItems = this.page.locator(this.locators.cartItem);
        return await cartItems.count();
    }

    async getCartItemName(index: number): Promise<string> {
        const cartItem = this.page.locator(this.locators.cartItem).nth(index);
        const nameElement = cartItem.locator(this.locators.cartItemName);
        return await nameElement.textContent() || '';
    }

    async getCartItemPrice(index: number): Promise<string> {
        const cartItem = this.page.locator(this.locators.cartItem).nth(index);
        const priceElement = cartItem.locator(this.locators.cartItemPrice);
        return await priceElement.textContent() || '';
    }

    async getCartItemQuantity(index: number): Promise<string> {
        const cartItem = this.page.locator(this.locators.cartItem).nth(index);
        const quantityElement = cartItem.locator(this.locators.cartItemQuantity);
        return await quantityElement.textContent() || '';
    }

    async removeCartItem(productKey: ProductKey): Promise<void> {
        const removeLocator = LOCATORS.products[productKey].remove;
        await this.clickElement(removeLocator);
    }

    async clickContinueShopping(): Promise<void> {
        await this.clickElement(this.locators.continueShoppingButton);
        await this.waitForPageLoad();
    }

    async clickCheckout(): Promise<void> {
        await this.clickElement(this.locators.checkoutButton);
        await this.waitForPageLoad();
    }

    async expectCartToBeEmpty(): Promise<void> {
        const itemCount = await this.getCartItemCount();
        if (itemCount !== 0) {
            throw new Error(`Expected cart to be empty, but it contains ${itemCount} items`);
        }
    }

    async expectCartToHaveItems(count: number): Promise<void> {
        const itemCount = await this.getCartItemCount();
        if (itemCount !== count) {
            throw new Error(`Expected cart to have ${count} items, but it has ${itemCount}`);
        }
    }

    async expectCartItemToBePresent(productKey: ProductKey): Promise<void> {
        const productName = LOCATORS.products[productKey].name;
        const cartItems = this.page.locator(this.locators.cartItem);
        const count = await cartItems.count();
        
        let found = false;
        for (let i = 0; i < count; i++) {
            const itemName = await this.getCartItemName(i);
            if (itemName === productName) {
                found = true;
                break;
            }
        }
        
        if (!found) {
            throw new Error(`Product ${productName} not found in cart`);
        }
    }

    async expectContinueShoppingButtonToBeVisible(): Promise<void> {
        await this.expectElementToBeVisible(this.locators.continueShoppingButton);
    }

    async expectCheckoutButtonToBeVisible(): Promise<void> {
        await this.expectElementToBeVisible(this.locators.checkoutButton);
    }

    async expectCheckoutButtonToBeEnabled(): Promise<void> {
        await this.expectElementToBeEnabled(this.locators.checkoutButton);
    }

    // Method to get all cart item names
    async getAllCartItemNames(): Promise<string[]> {
        const count = await this.getCartItemCount();
        const names: string[] = [];
        
        for (let i = 0; i < count; i++) {
            const name = await this.getCartItemName(i);
            names.push(name);
        }
        
        return names;
    }

    // Method to get all cart item prices
    async getAllCartItemPrices(): Promise<string[]> {
        const count = await this.getCartItemCount();
        const prices: string[] = [];
        
        for (let i = 0; i < count; i++) {
            const price = await this.getCartItemPrice(i);
            prices.push(price);
        }
        
        return prices;
    }

    // Method to verify we're on the cart page
    async verifyOnCartPage(): Promise<void> {
        const currentUrl = await this.page.url();
        if (!currentUrl.includes('/cart.html')) {
            throw new Error('Not on cart page');
        }
        await this.expectElementToBeVisible(this.locators.continueShoppingButton);
    }

    // Method to calculate total price of all items in cart
    async calculateTotalPrice(): Promise<number> {
        const prices = await this.getAllCartItemPrices();
        let total = 0;
        
        for (const price of prices) {
            // Remove '$' and convert to number
            const numericPrice = parseFloat(price.replace('$', ''));
            if (!isNaN(numericPrice)) {
                total += numericPrice;
            }
        }
        
        return total;
    }
} 