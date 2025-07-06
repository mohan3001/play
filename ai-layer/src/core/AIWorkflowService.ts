import { GitAutomationService } from './GitAutomationService';
import { OllamaClient } from '../integrations/OllamaClient';
import { LLMConfig } from '../types/AITypes';

export interface WorkflowRequest {
    branchName: string;
    featureDescription: string;
    filesToGenerate: string[];
    commitMessage?: string;
}

export interface WorkflowResult {
    success: boolean;
    message: string;
    branchName?: string;
    filesGenerated?: string[];
    commitHash?: string;
    error?: string;
}

export class AIWorkflowService {
    private gitService: GitAutomationService;
    private ollamaClient: OllamaClient;

    constructor(config: LLMConfig) {
        this.gitService = new GitAutomationService();
        this.ollamaClient = new OllamaClient(config);
    }

    /**
     * Parse natural language request and extract workflow parameters
     */
    async parseWorkflowRequest(userRequest: string): Promise<WorkflowRequest> {
        const prompt = `Parse this user request and extract workflow parameters:

User Request: "${userRequest}"

Extract the following information:
1. Branch name (if mentioned)
2. Feature description
3. Type of files to generate
4. Suggested commit message

Respond with JSON only:
{
  "branchName": "extracted_branch_name",
  "featureDescription": "what they want to create",
  "filesToGenerate": ["list", "of", "files"],
  "commitMessage": "suggested commit message"
}

If branch name is not provided, suggest one based on the feature.`;

        try {
            const result = await this.ollamaClient.generate(prompt);
            const jsonMatch = result.code.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('Failed to parse workflow request:', error);
        }

        // Fallback parsing
        return this.fallbackParseRequest(userRequest);
    }

    /**
     * Fallback parsing for when LLM fails
     */
    private fallbackParseRequest(userRequest: string): WorkflowRequest {
        const lowerRequest = userRequest.toLowerCase();
        
        // Extract branch name
        let branchName = 'feature/ai-generated';
        const branchMatch = userRequest.match(/branch\s+['"`]?([^'"`\s]+)['"`]?/i);
        if (branchMatch) {
            branchName = branchMatch[1];
        } else if (lowerRequest.includes('cart')) {
            branchName = 'feature/add-cart';
        } else if (lowerRequest.includes('login')) {
            branchName = 'feature/login-enhancement';
        }

        // Extract feature description
        let featureDescription = userRequest;
        if (lowerRequest.includes('cart') && lowerRequest.includes('login')) {
            featureDescription = 'Login and add to cart functionality';
        } else if (lowerRequest.includes('cart')) {
            featureDescription = 'Shopping cart functionality';
        } else if (lowerRequest.includes('login')) {
            featureDescription = 'Login functionality';
        }

        // Determine files to generate
        const filesToGenerate: string[] = [];
        if (lowerRequest.includes('feature') || lowerRequest.includes('cucumber')) {
            filesToGenerate.push('automation/tests/features/cart.feature');
            filesToGenerate.push('automation/tests/steps/cartSteps.ts');
        }
        if (lowerRequest.includes('test') || lowerRequest.includes('spec')) {
            filesToGenerate.push('automation/tests/cart.spec.ts');
        }
        if (lowerRequest.includes('page') || lowerRequest.includes('object')) {
            filesToGenerate.push('automation/src/pages/shop/CartPage.ts');
        }

        // Generate commit message
        const commitMessage = `Add ${featureDescription.toLowerCase()}`;

        return {
            branchName,
            featureDescription,
            filesToGenerate,
            commitMessage
        };
    }

    /**
     * Generate code for specific file types
     */
    async generateCodeForFile(filePath: string, featureDescription: string): Promise<string> {
        const fileType = this.getFileType(filePath);
        
        const prompt = this.buildCodeGenerationPrompt(fileType, filePath, featureDescription);
        
        try {
            const result = await this.ollamaClient.generate(prompt);
            return result.code;
        } catch (error) {
            console.error(`Failed to generate code for ${filePath}:`, error);
            return this.getDefaultCode(fileType, filePath);
        }
    }

    /**
     * Build appropriate prompt for different file types
     */
    private buildCodeGenerationPrompt(fileType: string, filePath: string, featureDescription: string): string {
        const basePrompt = `Generate ${fileType} code for: ${featureDescription}
File path: ${filePath}

Requirements:
- Follow existing code patterns in the project
- Use TypeScript
- Include proper error handling
- Add meaningful comments
- Follow best practices

Generate only the code, no explanations:`;

        switch (fileType) {
            case 'cucumber_feature':
                return `${basePrompt}

Generate a Cucumber feature file with scenarios for ${featureDescription}.
Include:
- Feature description
- Background (if needed)
- Multiple scenarios (happy path, error cases)
- Clear step descriptions

Example structure:
\`\`\`gherkin
Feature: [Feature Name]
  As a [user type]
  I want to [action]
  So that [benefit]

  Background:
    Given [setup]

  Scenario: [scenario name]
    When [action]
    Then [expected result]
\`\`\``;

            case 'step_definitions':
                return `${basePrompt}

Generate TypeScript step definitions for the Cucumber feature.
Include:
- Import statements
- Page object usage
- Proper async/await
- Error handling
- TypeScript types

Example structure:
\`\`\`typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CartPage } from '../../src/pages/shop/CartPage';

let cartPage: CartPage;

Given('I am on the cart page', async function() {
    // Implementation
});
\`\`\``;

            case 'playwright_test':
                return `${basePrompt}

Generate Playwright test file with TypeScript.
Include:
- Test descriptions
- Page object usage
- Assertions
- Error handling
- Test data management

Example structure:
\`\`\`typescript
import { test, expect } from '@playwright/test';
import { CartPage } from '../src/pages/shop/CartPage';
import { TestDataManager } from '../src/utils/TestDataManager';

test.describe('Cart Functionality', () => {
    test('should add item to cart', async ({ page }) => {
        // Implementation
    });
});
\`\`\``;

            case 'page_object':
                return `${basePrompt}

Generate Page Object Model class.
Include:
- Locators
- Methods for interactions
- Error handling
- TypeScript types
- Extend BasePage

Example structure:
\`\`\`typescript
import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class CartPage extends BasePage {
    // Locators
    // Methods
}
\`\`\``;

            default:
                return basePrompt;
        }
    }

    /**
     * Get file type based on path
     */
    private getFileType(filePath: string): string {
        if (filePath.endsWith('.feature')) return 'cucumber_feature';
        if (filePath.includes('steps/') && filePath.endsWith('.ts')) return 'step_definitions';
        if (filePath.endsWith('.spec.ts')) return 'playwright_test';
        if (filePath.includes('pages/') && filePath.endsWith('.ts')) return 'page_object';
        return 'typescript';
    }

    /**
     * Get default code templates
     */
    private getDefaultCode(fileType: string, filePath: string): string {
        switch (fileType) {
            case 'cucumber_feature':
                return `Feature: Shopping Cart
  As a user
  I want to add items to my cart
  So that I can purchase them

  Background:
    Given I am logged in to the application

  Scenario: Add item to cart
    When I add an item to the cart
    Then the item should be in my cart
    And the cart count should increase

  Scenario: Remove item from cart
    Given I have items in my cart
    When I remove an item from the cart
    Then the item should be removed from my cart
    And the cart count should decrease`;

            case 'step_definitions':
                return `import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CartPage } from '../../src/pages/shop/CartPage';

let cartPage: CartPage;

Given('I am logged in to the application', async function() {
    const { page } = this;
    // Implementation for login
});

When('I add an item to the cart', async function() {
    const { page } = this;
    cartPage = new CartPage(page);
    await cartPage.addItemToCart();
});

Then('the item should be in my cart', async function() {
    await cartPage.verifyItemInCart();
});

Then('the cart count should increase', async function() {
    await cartPage.verifyCartCountIncreased();
});`;

            case 'playwright_test':
                return `import { test, expect } from '@playwright/test';
import { CartPage } from '../src/pages/shop/CartPage';
import { TestDataManager } from '../src/utils/TestDataManager';

test.describe('Cart Functionality', () => {
    let cartPage: CartPage;
    let testData: TestDataManager;

    test.beforeEach(async ({ page }) => {
        cartPage = new CartPage(page);
        testData = TestDataManager.getInstance();
    });

    test('should add item to cart', async ({ page }) => {
        await cartPage.addItemToCart();
        await expect(cartPage.getCartCount()).toBeGreaterThan(0);
    });

    test('should remove item from cart', async ({ page }) => {
        await cartPage.addItemToCart();
        const initialCount = await cartPage.getCartCount();
        await cartPage.removeItemFromCart();
        await expect(cartPage.getCartCount()).toBeLessThan(initialCount);
    });
});`;

            case 'page_object':
                return `import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class CartPage extends BasePage {
    // Locators
    private readonly addToCartButton = '[data-test="add-to-cart"]';
    private readonly removeFromCartButton = '[data-test="remove-from-cart"]';
    private readonly cartCount = '.cart-count';
    private readonly cartItems = '.cart-item';

    constructor(page: Page) {
        super(page);
    }

    async addItemToCart(): Promise<void> {
        await this.clickElement(this.addToCartButton);
        await this.waitForPageLoad();
    }

    async removeItemFromCart(): Promise<void> {
        await this.clickElement(this.removeFromCartButton);
        await this.waitForPageLoad();
    }

    async getCartCount(): Promise<number> {
        const countText = await this.page.textContent(this.cartCount);
        return parseInt(countText || '0', 10);
    }

    async verifyItemInCart(): Promise<void> {
        await this.page.waitForSelector(this.cartItems);
    }

    async verifyCartCountIncreased(): Promise<void> {
        const count = await this.getCartCount();
        expect(count).toBeGreaterThan(0);
    }
}`;

            default:
                return `// Generated code for ${filePath}
// TODO: Implement functionality`;
        }
    }

    /**
     * Execute complete AI workflow
     */
    async executeWorkflow(userRequest: string): Promise<WorkflowResult> {
        try {
            console.log('🤖 Parsing your request...');
            
            // Step 1: Parse the request
            const workflowRequest = await this.parseWorkflowRequest(userRequest);
            
            console.log(`📋 Parsed Request:`);
            console.log(`  Branch: ${workflowRequest.branchName}`);
            console.log(`  Feature: ${workflowRequest.featureDescription}`);
            console.log(`  Files: ${workflowRequest.filesToGenerate.join(', ')}`);

            // Step 2: Create branch
            console.log(`\n🌱 Creating branch: ${workflowRequest.branchName}`);
            const branchResult = await this.gitService.createBranch(workflowRequest.branchName);
            if (!branchResult.success) {
                return {
                    success: false,
                    message: `Failed to create branch: ${branchResult.error}`,
                    error: branchResult.error
                };
            }

            // Step 3: Generate and save files
            console.log('\n💻 Generating code files...');
            const generatedFiles: string[] = [];
            
            for (const filePath of workflowRequest.filesToGenerate) {
                console.log(`  Generating: ${filePath}`);
                const code = await this.generateCodeForFile(filePath, workflowRequest.featureDescription);
                const saveResult = await this.gitService.generateAndSaveCode(filePath, code);
                
                if (saveResult.success) {
                    generatedFiles.push(filePath);
                    console.log(`  ✅ Generated: ${filePath}`);
                } else {
                    console.log(`  ❌ Failed: ${filePath} - ${saveResult.error}`);
                }
            }

            // Step 4: Commit changes
            console.log('\n💾 Committing changes...');
            const commitResult = await this.gitService.commitChanges(
                generatedFiles,
                workflowRequest.commitMessage
            );

            if (!commitResult.success) {
                return {
                    success: false,
                    message: `Failed to commit changes: ${commitResult.error}`,
                    error: commitResult.error
                };
            }

            // Step 5: Push to remote
            console.log('\n🚀 Pushing to remote...');
            const pushResult = await this.gitService.pushBranch(workflowRequest.branchName);
            
            if (!pushResult.success) {
                return {
                    success: false,
                    message: `Failed to push: ${pushResult.error}`,
                    error: pushResult.error
                };
            }

            return {
                success: true,
                message: `✅ Workflow completed successfully!
📋 Summary:
  • Branch: ${workflowRequest.branchName}
  • Files Generated: ${generatedFiles.length}
  • Commit: ${commitResult.commitHash}
  • Pushed to remote

🔍 Next Steps:
  • Review the generated code
  • Create a pull request
  • Run tests to verify functionality`,
                branchName: workflowRequest.branchName,
                filesGenerated: generatedFiles,
                commitHash: commitResult.commitHash
            };

        } catch (error) {
            return {
                success: false,
                message: 'Workflow execution failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
} 