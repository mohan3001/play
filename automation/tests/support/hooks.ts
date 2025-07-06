import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';

let browser: Browser;
let context: BrowserContext;
let page: Page;

BeforeAll(async function() {
    browser = await chromium.launch({ headless: false });
});

Before(async function() {
    context = await browser.newContext();
    page = await context.newPage();
    this.page = page;
    this.context = context;
    this.browser = browser;
});

After(async function() {
    await page?.close();
    await context?.close();
});

AfterAll(async function() {
    await browser?.close();
}); 