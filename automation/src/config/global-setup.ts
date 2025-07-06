import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Any global setup can go here
    // For example, setting up test data, creating test users, etc.
    
    console.log('Global setup completed');
    
    await browser.close();
}

export default globalSetup; 