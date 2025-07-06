import { World, setWorldConstructor } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';

export interface CustomWorld extends World {
    browser?: Browser;
    context?: BrowserContext;
    page?: Page;
}

class CustomWorldImpl extends World implements CustomWorld {
    browser?: Browser;
    context?: BrowserContext;
    page?: Page;
}

setWorldConstructor(CustomWorldImpl); 