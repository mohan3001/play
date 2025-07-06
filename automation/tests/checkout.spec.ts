import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/auth/LoginPage';
import { InventoryPage } from '../src/pages/shop/InventoryPage';
import { CartPage } from '../src/pages/shop/CartPage';
import { CheckoutPage } from '../src/pages/shop/CheckoutPage';
import { CheckoutOverviewPage } from '../src/pages/shop/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../src/pages/shop/CheckoutCompletePage';
import { TestDataManager } from '../src/utils/TestDataManager';

test.describe('Checkout Tests', () => {
    let loginPage: LoginPage;
    let inventoryPage: InventoryPage;
    let cartPage: CartPage;
    let checkoutPage: CheckoutPage;
    let checkoutOverviewPage: CheckoutOverviewPage;
    let checkoutCompletePage: CheckoutCompletePage;
    let testData: TestDataManager;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        inventoryPage = new InventoryPage(page);
        cartPage = new CartPage(page);
        checkoutPage = new CheckoutPage(page);
        checkoutOverviewPage = new CheckoutOverviewPage(page);
        checkoutCompletePage = new CheckoutCompletePage(page);
        testData = TestDataManager.getInstance();
        
        // Login and add product to cart
        const credentials = testData.getUserCredentials('standard');
        await page.goto('/');
        await loginPage.login(credentials.username, credentials.password);
        await inventoryPage.addProductToCart('backpack');
        await inventoryPage.clickShoppingCart();
    });

    test('should display cart page elements', async () => {
        await cartPage.verifyOnCartPage();
        await cartPage.expectCartToHaveItems(1);
        await cartPage.expectCartItemToBePresent('backpack');
        await cartPage.expectContinueShoppingButtonToBeVisible();
        await cartPage.expectCheckoutButtonToBeVisible();
        await cartPage.expectCheckoutButtonToBeEnabled();
    });

    test('should navigate to checkout page', async ({ page }) => {
        await cartPage.clickCheckout();
        await expect(page).toHaveURL(/.*checkout-step-one\.html/);
        await checkoutPage.verifyOnCheckoutPage();
    });

    test('should fill checkout information', async ({ page }) => {
        await cartPage.clickCheckout();
        
        const checkoutData = testData.getCheckoutData('valid');
        await checkoutPage.fillCheckoutInfo(checkoutData);
        
        // Verify form values
        const formValues = await checkoutPage.getFormValues();
        expect(formValues.firstName).toBe(checkoutData.firstName);
        expect(formValues.lastName).toBe(checkoutData.lastName);
        expect(formValues.postalCode).toBe(checkoutData.postalCode);
    });

    test('should validate required fields', async ({ page }) => {
        await cartPage.clickCheckout();
        await checkoutPage.validateRequiredFields();
    });

    test('should show error for empty checkout fields', async ({ page }) => {
        await cartPage.clickCheckout();
        await checkoutPage.clickContinue();
        
        await checkoutPage.expectErrorToBeVisible();
        await checkoutPage.expectErrorToContainText('Error: First Name is required');
    });

    test('should complete checkout process', async ({ page }) => {
        // Step 1: Add product and go to cart
        await cartPage.clickCheckout();
        
        // Step 2: Fill checkout information
        const checkoutData = testData.getCheckoutData('valid');
        await checkoutPage.fillCheckoutInfo(checkoutData);
        await checkoutPage.clickContinue();
        
        // Step 3: Verify checkout overview
        await expect(page).toHaveURL(/.*checkout-step-two\.html/);
        await checkoutOverviewPage.verifyOnCheckoutOverviewPage();
        await checkoutOverviewPage.verifyTotalCalculation();
        
        // Step 4: Complete checkout
        await checkoutOverviewPage.clickFinish();
        
        // Step 5: Verify completion
        await expect(page).toHaveURL(/.*checkout-complete\.html/);
        await checkoutCompletePage.verifyOnCheckoutCompletePage();
        await checkoutCompletePage.verifyOrderCompletion();
    });

    test('should calculate correct totals', async ({ page }) => {
        await cartPage.clickCheckout();
        
        const checkoutData = testData.getCheckoutData('valid');
        await checkoutPage.fillCheckoutInfo(checkoutData);
        await checkoutPage.clickContinue();
        
        await checkoutOverviewPage.verifyTotalCalculation();
        
        const itemTotal = await checkoutOverviewPage.getItemTotalNumeric();
        const tax = await checkoutOverviewPage.getTaxNumeric();
        const total = await checkoutOverviewPage.getTotalNumeric();
        
        expect(itemTotal).toBeGreaterThan(0);
        expect(tax).toBeGreaterThan(0);
        expect(total).toBe(itemTotal + tax);
    });

    test('should cancel checkout process', async ({ page }) => {
        await cartPage.clickCheckout();
        await checkoutPage.clickCancel();
        
        // Should return to inventory page
        await expect(page).toHaveURL(/.*inventory\.html/);
    });

    test('should cancel checkout overview', async ({ page }) => {
        await cartPage.clickCheckout();
        
        const checkoutData = testData.getCheckoutData('valid');
        await checkoutPage.fillCheckoutInfo(checkoutData);
        await checkoutPage.clickContinue();
        
        await checkoutOverviewPage.clickCancel();
        
        // Should return to inventory page
        await expect(page).toHaveURL(/.*inventory\.html/);
    });

    test('should return to inventory from completion page', async ({ page }) => {
        // Complete the checkout process
        await cartPage.clickCheckout();
        
        const checkoutData = testData.getCheckoutData('valid');
        await checkoutPage.fillCheckoutInfo(checkoutData);
        await checkoutPage.clickContinue();
        await checkoutOverviewPage.clickFinish();
        
        // Click back home
        await checkoutCompletePage.clickBackHome();
        
        // Should return to inventory page
        await expect(page).toHaveURL(/.*inventory\.html/);
    });

    test('should handle multiple items in checkout', async ({ page }) => {
        // Go back to inventory and add more items
        await cartPage.clickContinueShopping();
        await inventoryPage.addProductToCart('bikeLight');
        await inventoryPage.addProductToCart('boltTshirt');
        await inventoryPage.clickShoppingCart();
        
        // Verify cart has multiple items
        await cartPage.expectCartToHaveItems(3);
        
        // Proceed with checkout
        await cartPage.clickCheckout();
        
        const checkoutData = testData.getCheckoutData('valid');
        await checkoutPage.fillCheckoutInfo(checkoutData);
        await checkoutPage.clickContinue();
        
        // Verify totals are calculated correctly
        await checkoutOverviewPage.verifyTotalCalculation();
    });

    test('should clear checkout form', async ({ page }) => {
        await cartPage.clickCheckout();
        
        const checkoutData = testData.getCheckoutData('valid');
        await checkoutPage.fillCheckoutInfo(checkoutData);
        
        await checkoutPage.clearForm();
        
        const formValues = await checkoutPage.getFormValues();
        expect(formValues.firstName).toBe('');
        expect(formValues.lastName).toBe('');
        expect(formValues.postalCode).toBe('');
    });
}); 