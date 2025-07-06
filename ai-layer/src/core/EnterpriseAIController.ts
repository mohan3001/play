import { OllamaClient } from '../integrations/OllamaClient';
import { SecurityValidator } from './SecurityValidator';
import { ComplianceChecker } from './ComplianceChecker';
import { MultiTenantManager } from './MultiTenantManager';
import { AuditLogger } from './AuditLogger';
import { PerformanceMonitor } from './PerformanceMonitor';
import { 
    LLMConfig, 
    CodeGenerationRequest, 
    GeneratedCode, 
    FrameworkContext,
    TenantConfig 
} from '../types/AITypes';

export class EnterpriseAIController {
    private ollamaClient: OllamaClient;
    private securityValidator: SecurityValidator;
    private complianceChecker: ComplianceChecker;
    private multiTenantManager: MultiTenantManager;
    private auditLogger: AuditLogger;
    private performanceMonitor: PerformanceMonitor;
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        this.config = config;
        this.ollamaClient = new OllamaClient(config);
        this.securityValidator = new SecurityValidator();
        this.complianceChecker = new ComplianceChecker();
        this.multiTenantManager = new MultiTenantManager();
        this.auditLogger = new AuditLogger();
        this.performanceMonitor = new PerformanceMonitor();
    }

    async generateTestCode(
        request: CodeGenerationRequest,
        tenantId: string,
        userId: string
    ): Promise<GeneratedCode> {
        const startTime = Date.now();

        try {
            // 1. Validate request and permissions
            await this.validateRequest(request, tenantId, userId);

            // 2. Check rate limits
            await this.checkRateLimits(tenantId, userId);

            // 3. Get tenant context
            const tenantContext = await this.multiTenantManager.getTenantContext(tenantId);

            // 4. Generate code with security validation
            const generatedCode = await this.generateCodeWithValidation(request, tenantContext);

            // 5. Audit the action
            await this.auditLogger.log('TEST_GENERATION_SUCCESS', {
                tenantId,
                userId,
                requestType: request.type,
                executionTime: Date.now() - startTime,
                timestamp: new Date()
            });

            // 6. Record performance metrics
            await this.performanceMonitor.recordMetric('test_generation_success', {
                tenantId,
                executionTime: Date.now() - startTime,
                codeSize: generatedCode.code.length
            });

            return {
                ...generatedCode,
                metadata: {
                    ...generatedCode.metadata,
                    generationTime: Date.now() - startTime
                }
            };

        } catch (error) {
            await this.handleError(error, tenantId, userId, startTime);
            throw error;
        }
    }

    async updateExistingTest(
        testPath: string, 
        updateRequest: string, 
        tenantId: string, 
        userId: string
    ): Promise<GeneratedCode> {
        const startTime = Date.now();

        try {
            // Validate permissions for updating
            await this.validateUpdatePermissions(testPath, tenantId, userId);

            // Get existing code context
            const existingCode = await this.getExistingCodeContext(testPath);
            
            // Generate update
            const request: CodeGenerationRequest = {
                userInput: updateRequest,
                type: 'test',
                framework: 'playwright',
                language: 'typescript',
                context: existingCode
            };

            const updatedCode = await this.generateTestCode(request, tenantId, userId);

            // Audit update
            await this.auditLogger.log('TEST_UPDATE_SUCCESS', {
                tenantId,
                userId,
                testPath,
                executionTime: Date.now() - startTime,
                timestamp: new Date()
            });

            return updatedCode;

        } catch (error) {
            await this.handleError(error, tenantId, userId, startTime);
            throw error;
        }
    }

    async executeTest(
        testPath: string, 
        tenantId: string, 
        userId: string
    ): Promise<any> {
        const startTime = Date.now();

        try {
            // Validate test execution permissions
            await this.validateExecutionPermissions(testPath, tenantId, userId);

            // Execute the test
            const result = await this.runTest(testPath);

            // Audit execution
            await this.auditLogger.log('TEST_EXECUTION_SUCCESS', {
                tenantId,
                userId,
                testPath,
                result: result.status,
                executionTime: Date.now() - startTime,
                timestamp: new Date()
            });

            return result;

        } catch (error) {
            await this.handleError(error, tenantId, userId, startTime);
            throw error;
        }
    }

    async viewResults(
        testId: string, 
        tenantId: string, 
        userId: string
    ): Promise<any> {
        try {
            // Validate access permissions
            await this.validateAccessPermissions(testId, tenantId, userId);

            // Get test results
            const results = await this.getTestResults(testId);

            // Audit access
            await this.auditLogger.log('RESULTS_ACCESS', {
                tenantId,
                userId,
                testId,
                timestamp: new Date()
            });

            return results;

        } catch (error) {
            await this.handleError(error, tenantId, userId, 0);
            throw error;
        }
    }

    private async validateRequest(
        request: CodeGenerationRequest,
        tenantId: string,
        userId: string
    ): Promise<void> {
        // Security validation
        const securityResult = await this.securityValidator.validateCodeGeneration(request);
        if (!securityResult.isValid) {
            throw new Error(`Security validation failed: ${securityResult.violations.map(v => v.message).join(', ')}`);
        }

        // Compliance validation
        const complianceResult = await this.complianceChecker.validateRequest(request, tenantId);
        if (!complianceResult.isValid) {
            throw new Error(`Compliance validation failed: ${complianceResult.violations.map(v => v.message).join(', ')}`);
        }

        // Tenant resource validation
        const resourceResult = await this.multiTenantManager.validateResourceUsage(tenantId, {
            type: 'test_generation',
            estimatedTokens: this.estimateTokens(request.userInput)
        });
        if (!resourceResult) {
            throw new Error('Tenant resource limit exceeded');
        }
    }

    private async checkRateLimits(tenantId: string, userId: string): Promise<void> {
        // Implement rate limiting logic here
        const canProceed = await this.performanceMonitor.checkRateLimit(tenantId, userId);
        if (!canProceed) {
            throw new Error('Rate limit exceeded');
        }
    }

    private async generateCodeWithValidation(
        request: CodeGenerationRequest,
        tenantContext: TenantConfig
    ): Promise<GeneratedCode> {
        // Build comprehensive prompt
        const prompt = await this.buildPrompt(request, tenantContext);
        
        // Generate code using Ollama
        const generatedCode = await this.ollamaClient.generate(prompt, {
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens
        });

        // Validate generated code
        const validationResult = await this.securityValidator.validateGeneratedCode(generatedCode.code);
        if (!validationResult.isValid) {
            throw new Error(`Generated code validation failed: ${validationResult.violations.map(v => v.message).join(', ')}`);
        }

        return generatedCode;
    }

    private async buildPrompt(request: CodeGenerationRequest, tenantContext: TenantConfig): Promise<string> {
        // Build a comprehensive prompt based on the request and context
        return `
You are an expert Playwright automation engineer working with the Sauce Demo application.
Generate ${request.type} code for the following request:

Request: ${request.userInput}
Framework: ${request.framework}
Language: ${request.language}

Requirements:
1. Use Page Object Model pattern
2. Follow existing code conventions
3. Include proper error handling
4. Add meaningful assertions
5. Use data-test attributes for selectors
6. Follow TypeScript best practices

Generate the code:
        `;
    }

    private estimateTokens(text: string): number {
        // Rough estimation: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }

    private async handleError(error: any, tenantId: string, userId: string, startTime: number): Promise<void> {
        await this.auditLogger.log('AI_OPERATION_FAILURE', {
            tenantId,
            userId,
            error: error.message,
            executionTime: Date.now() - startTime,
            timestamp: new Date()
        });

        await this.performanceMonitor.recordMetric('ai_operation_failure', {
            tenantId,
            error: error.message,
            executionTime: Date.now() - startTime
        });
    }

    // Implemented methods for additional functionality
    private async validateUpdatePermissions(testPath: string, tenantId: string, userId: string): Promise<void> {
        const tenant = await this.multiTenantManager.getTenantContext(tenantId);
        const hasPermission = tenant.permissions.some(p => 
            p.id === 'test_generator' && 
            p.resources.includes('tests') && 
            p.actions.includes('update')
        );
        
        if (!hasPermission) {
            throw new Error(`User ${userId} does not have update permissions for tests in tenant ${tenantId}`);
        }
    }

    private async validateExecutionPermissions(testPath: string, tenantId: string, userId: string): Promise<void> {
        const tenant = await this.multiTenantManager.getTenantContext(tenantId);
        const hasPermission = tenant.permissions.some(p => 
            p.id === 'test_executor' && 
            p.resources.includes('tests') && 
            p.actions.includes('execute')
        );
        
        if (!hasPermission) {
            throw new Error(`User ${userId} does not have execution permissions for tests in tenant ${tenantId}`);
        }
    }

    private async validateAccessPermissions(testId: string, tenantId: string, userId: string): Promise<void> {
        const tenant = await this.multiTenantManager.getTenantContext(tenantId);
        const hasPermission = tenant.permissions.some(p => 
            p.id === 'results_viewer' && 
            p.resources.includes('results') && 
            p.actions.includes('read')
        );
        
        if (!hasPermission) {
            throw new Error(`User ${userId} does not have access permissions for results in tenant ${tenantId}`);
        }
    }

    private async getExistingCodeContext(testPath: string): Promise<any> {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            // Read the existing test file
            const testContent = await fs.readFile(testPath, 'utf-8');
            
            // Read related page objects and utilities
            const testDir = path.dirname(testPath);
            const srcDir = path.join(testDir, '..', 'src');
            
            const context: any = {
                testContent,
                pageObjects: {},
                utilities: {},
                locators: {}
            };
            
            // Read page objects
            try {
                const pagesDir = path.join(srcDir, 'pages');
                const pageFiles = await fs.readdir(pagesDir);
                
                for (const file of pageFiles) {
                    if (file.endsWith('.ts')) {
                        const pagePath = path.join(pagesDir, file);
                        context.pageObjects[file] = await fs.readFile(pagePath, 'utf-8');
                    }
                }
            } catch (error) {
                // Page objects directory might not exist
            }
            
            // Read utilities
            try {
                const utilsDir = path.join(srcDir, 'utils');
                const utilFiles = await fs.readdir(utilsDir);
                
                for (const file of utilFiles) {
                    if (file.endsWith('.ts')) {
                        const utilPath = path.join(utilsDir, file);
                        context.utilities[file] = await fs.readFile(utilPath, 'utf-8');
                    }
                }
            } catch (error) {
                // Utils directory might not exist
            }
            
            return context;
        } catch (error) {
            return { testContent: '', pageObjects: {}, utilities: {}, locators: {} };
        }
    }

    private async runTest(testPath: string): Promise<any> {
        const { spawn } = require('child_process');
        const path = require('path');
        
        return new Promise((resolve, reject) => {
            const testProcess = spawn('npx', ['playwright', 'test', testPath], {
                cwd: path.join(process.cwd(), 'automation'),
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let output = '';
            let errorOutput = '';
            
            testProcess.stdout.on('data', (data: Buffer) => {
                output += data.toString();
            });
            
            testProcess.stderr.on('data', (data: Buffer) => {
                errorOutput += data.toString();
            });
            
            const startTime = Date.now();
            
            testProcess.on('close', (code: number) => {
                const duration = Date.now() - startTime;
                const status = code === 0 ? 'PASS' : 'FAIL';
                
                resolve({
                    status,
                    duration,
                    exitCode: code,
                    output,
                    errorOutput,
                    testPath
                });
            });
            
            testProcess.on('error', (error: Error) => {
                reject(error);
            });
        });
    }

    private async getTestResults(testId: string): Promise<any> {
        // In a real implementation, this would query a database or file system
        // For now, return mock results
        return {
            testId,
            status: 'PASS',
            results: {
                duration: 1500,
                assertions: 5,
                passed: 5,
                failed: 0,
                screenshots: [],
                videos: [],
                traces: []
            },
            metadata: {
                timestamp: new Date(),
                browser: 'chromium',
                viewport: '1280x720',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        };
    }
} 