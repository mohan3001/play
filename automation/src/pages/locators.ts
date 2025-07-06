export const LOCATORS = {
    // Login page locators
    login: {
        usernameInput: '[data-test="username"]',
        passwordInput: '[data-test="password"]',
        loginButton: '[data-test="login-button"]',
        errorMessage: '[data-test="error"]',
        errorContainer: '.error-message-container'
    },

    // Inventory/Products page locators
    inventory: {
        productContainer: '.inventory_item',
        productName: '.inventory_item_name',
        productPrice: '.inventory_item_price',
        productDescription: '.inventory_item_desc',
        addToCartButton: '[data-test="add-to-cart-sauce-labs-backpack"]',
        removeButton: '[data-test="remove-sauce-labs-backpack"]',
        sortDropdown: '[data-test="product_sort_container"]',
        shoppingCartBadge: '.shopping_cart_badge',
        shoppingCartLink: '.shopping_cart_link'
    },

    // Shopping cart page locators
    cart: {
        cartItem: '.cart_item',
        cartItemName: '.inventory_item_name',
        cartItemPrice: '.inventory_item_price',
        cartItemQuantity: '.cart_quantity',
        removeButton: '[data-test="remove-sauce-labs-backpack"]',
        continueShoppingButton: '[data-test="continue-shopping"]',
        checkoutButton: '[data-test="checkout"]',
        cartQuantity: '.cart_quantity'
    },

    // Checkout page locators
    checkout: {
        firstNameInput: '[data-test="firstName"]',
        lastNameInput: '[data-test="lastName"]',
        postalCodeInput: '[data-test="postalCode"]',
        continueButton: '[data-test="continue"]',
        cancelButton: '[data-test="cancel"]',
        errorMessage: '[data-test="error"]'
    },

    // Checkout overview page locators
    checkoutOverview: {
        itemTotal: '.summary_subtotal_label',
        tax: '.summary_tax_label',
        total: '.summary_total_label',
        finishButton: '[data-test="finish"]',
        cancelButton: '[data-test="cancel"]'
    },

    // Checkout complete page locators
    checkoutComplete: {
        completeHeader: '.complete-header',
        completeText: '.complete-text',
        backHomeButton: '[data-test="back-to-products"]'
    },

    // Common locators
    common: {
        menuButton: '#react-burger-menu-btn',
        menuCloseButton: '#react-burger-cross-btn',
        menuItems: '.bm-item-list',
        logoutLink: '#logout_sidebar_link',
        resetLink: '#reset_sidebar_link',
        allItemsLink: '#inventory_sidebar_link',
        aboutLink: '#about_sidebar_link'
    },

    // Product specific locators (using data-test attributes)
    products: {
        backpack: {
            name: 'Sauce Labs Backpack',
            addToCart: '[data-test="add-to-cart-sauce-labs-backpack"]',
            remove: '[data-test="remove-sauce-labs-backpack"]'
        },
        bikeLight: {
            name: 'Sauce Labs Bike Light',
            addToCart: '[data-test="add-to-cart-sauce-labs-bike-light"]',
            remove: '[data-test="remove-sauce-labs-bike-light"]'
        },
        boltTshirt: {
            name: 'Sauce Labs Bolt T-Shirt',
            addToCart: '[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]',
            remove: '[data-test="remove-sauce-labs-bolt-t-shirt"]'
        },
        fleeceJacket: {
            name: 'Sauce Labs Fleece Jacket',
            addToCart: '[data-test="add-to-cart-sauce-labs-fleece-jacket"]',
            remove: '[data-test="remove-sauce-labs-fleece-jacket"]'
        },
        onesie: {
            name: 'Sauce Labs Onesie',
            addToCart: '[data-test="add-to-cart-sauce-labs-onesie"]',
            remove: '[data-test="remove-sauce-labs-onesie"]'
        },
        redTshirt: {
            name: 'Test.allTheThings() T-Shirt (Red)',
            addToCart: '[data-test="add-to-cart-test.allthethings()-t-shirt-(red)"]',
            remove: '[data-test="remove-test.allthethings()-t-shirt-(red)"]'
        }
    }
} as const;

export type LocatorKey = keyof typeof LOCATORS;
export type ProductKey = keyof typeof LOCATORS.products; 