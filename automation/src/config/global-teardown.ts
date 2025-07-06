import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Any global cleanup can go here
    // For example, cleaning up test data, removing test users, etc.
    
    console.log('Global teardown completed');
    
    await browser.close();
}

export default globalTeardown; 