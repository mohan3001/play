import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/auth/LoginPage';
import { InventoryPage } from '../src/pages/shop/InventoryPage';
import { TestDataManager } from '../src/utils/TestDataManager';

test.describe('Inventory Tests', () => {
    let loginPage: LoginPage;
    let inventoryPage: InventoryPage;
    let testData: TestDataManager;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        inventoryPage = new InventoryPage(page);
        testData = TestDataManager.getInstance();
        
        // Login first
        const credentials = testData.getUserCredentials('standard');
        await page.goto('/');
        await loginPage.login(credentials.username, credentials.password);
    });

    test('should display inventory page elements', async () => {
        await inventoryPage.verifyOnInventoryPage();
        await inventoryPage.expectProductToBeVisible('backpack');
        await inventoryPage.expectAddToCartButtonToBeVisible('backpack');
    });

    test('should add product to cart', async () => {
        await inventoryPage.addProductToCart('backpack');
        await inventoryPage.expectCartBadgeToShowCount(1);
        await inventoryPage.expectRemoveButtonToBeVisible('backpack');
    });

    test('should remove product from cart', async () => {
        // First add product
        await inventoryPage.addProductToCart('backpack');
        await inventoryPage.expectCartBadgeToShowCount(1);
        
        // Then remove it
        await inventoryPage.removeProductFromCart('backpack');
        await inventoryPage.expectCartBadgeToNotBeVisible();
        await inventoryPage.expectAddToCartButtonToBeVisible('backpack');
    });

    test('should add multiple products to cart', async () => {
        await inventoryPage.addProductToCart('backpack');
        await inventoryPage.addProductToCart('bikeLight');
        await inventoryPage.addProductToCart('boltTshirt');
        
        await inventoryPage.expectCartBadgeToShowCount(3);
    });

    test('should navigate to shopping cart', async ({ page }) => {
        await inventoryPage.addProductToCart('backpack');
        await inventoryPage.clickShoppingCart();
        
        await expect(page).toHaveURL(/.*cart\.html/);
    });

    test('should sort products by name A to Z', async () => {
        await inventoryPage.sortProducts('az');
        
        const productNames = await inventoryPage.getAllProductNames();
        const sortedNames = [...productNames].sort();
        
        expect(productNames).toEqual(sortedNames);
    });

    test('should sort products by name Z to A', async () => {
        await inventoryPage.sortProducts('za');
        
        const productNames = await inventoryPage.getAllProductNames();
        const sortedNames = [...productNames].sort().reverse();
        
        expect(productNames).toEqual(sortedNames);
    });

    test('should sort products by price low to high', async () => {
        await inventoryPage.sortProducts('lohi');
        
        const productPrices = await inventoryPage.getAllProductPrices();
        const numericPrices = productPrices.map(price => parseFloat(price.replace('$', '')));
        const sortedPrices = [...numericPrices].sort((a, b) => a - b);
        
        expect(numericPrices).toEqual(sortedPrices);
    });

    test('should sort products by price high to low', async () => {
        await inventoryPage.sortProducts('hilo');
        
        const productPrices = await inventoryPage.getAllProductPrices();
        const numericPrices = productPrices.map(price => parseFloat(price.replace('$', '')));
        const sortedPrices = [...numericPrices].sort((a, b) => b - a);
        
        expect(numericPrices).toEqual(sortedPrices);
    });

    test('should display all products', async () => {
        const productNames = await inventoryPage.getAllProductNames();
        expect(productNames.length).toBeGreaterThan(0);
        
        // Verify specific products are present
        expect(productNames).toContain('Sauce Labs Backpack');
        expect(productNames).toContain('Sauce Labs Bike Light');
        expect(productNames).toContain('Sauce Labs Bolt T-Shirt');
    });

    test('should display product prices', async () => {
        const productPrices = await inventoryPage.getAllProductPrices();
        expect(productPrices.length).toBeGreaterThan(0);
        
        // Verify prices are in correct format
        for (const price of productPrices) {
            expect(price).toMatch(/^\$\d+\.\d{2}$/);
        }
    });

    test('should get specific product information', async () => {
        const productName = await inventoryPage.getProductName('backpack');
        const productPrice = await inventoryPage.getProductPrice('backpack');
        
        expect(productName).toBe('Sauce Labs Backpack');
        expect(productPrice).toBe('$29.99');
    });

    test('should handle cart badge visibility', async () => {
        // Initially no badge should be visible
        await inventoryPage.expectCartBadgeToNotBeVisible();
        
        // Add product and badge should appear
        await inventoryPage.addProductToCart('backpack');
        await inventoryPage.expectCartBadgeToBeVisible();
        
        // Remove product and badge should disappear
        await inventoryPage.removeProductFromCart('backpack');
        await inventoryPage.expectCartBadgeToNotBeVisible();
    });
}); 