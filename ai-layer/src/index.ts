import { EnterpriseAIController } from './core/EnterpriseAIController';
import { getDefaultConfig } from './config/llm-config';
import { CodeGenerationRequest } from './types/AITypes';

// Main AI layer entry point
export class AILayer {
    private controller: EnterpriseAIController;

    constructor() {
        const config = getDefaultConfig();
        this.controller = new EnterpriseAIController(config);
    }

    async generateTestCode(
        userInput: string,
        tenantId: string = 'default',
        userId: string = 'system'
    ) {
        const request: CodeGenerationRequest = {
            userInput,
            type: 'test',
            framework: 'playwright',
            language: 'typescript'
        };

        return await this.controller.generateTestCode(request, tenantId, userId);
    }

    async updateTest(
        testPath: string,
        updateRequest: string,
        tenantId: string = 'default',
        userId: string = 'system'
    ) {
        return await this.controller.updateExistingTest(testPath, updateRequest, tenantId, userId);
    }

    async executeTest(
        testPath: string,
        tenantId: string = 'default',
        userId: string = 'system'
    ) {
        return await this.controller.executeTest(testPath, tenantId, userId);
    }

    async viewResults(
        testId: string,
        tenantId: string = 'default',
        userId: string = 'system'
    ) {
        return await this.controller.viewResults(testId, tenantId, userId);
    }
}

// Export main components
export { EnterpriseAIController } from './core/EnterpriseAIController';
export { OllamaClient } from './integrations/OllamaClient';
export { SecurityValidator } from './core/SecurityValidator';
export { ComplianceChecker } from './core/ComplianceChecker';
export { MultiTenantManager } from './core/MultiTenantManager';
export { AuditLogger } from './core/AuditLogger';
export { PerformanceMonitor } from './core/PerformanceMonitor';

// Export types
export * from './types/AITypes';

// Export configurations
export { getLLMConfig, getDefaultConfig } from './config/llm-config'; 