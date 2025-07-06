import { TenantConfig, ResourceLimits, Permission, IsolationLevel } from '../types/AITypes';

export class MultiTenantManager {
    private tenantConfigs: Map<string, TenantConfig> = new Map();
    private resourceUsage: Map<string, any> = new Map();

    constructor() {
        this.initializeDefaultTenants();
    }

    async getTenantContext(tenantId: string): Promise<TenantConfig> {
        const config = this.tenantConfigs.get(tenantId);
        if (!config) {
            throw new Error(`Tenant ${tenantId} not found`);
        }

        return config;
    }

    async validateResourceUsage(tenantId: string, operation: any): Promise<boolean> {
        const tenant = await this.getTenantContext(tenantId);
        const usage = this.getCurrentUsage(tenantId);

        // Check various resource limits
        const checks = [
            this.checkTokenUsage(usage, operation, tenant.resourceLimits),
            this.checkRequestCount(usage, operation, tenant.resourceLimits),
            this.checkStorageUsage(usage, operation, tenant.resourceLimits),
            this.checkConcurrentOperations(usage, operation, tenant.resourceLimits)
        ];

        return checks.every(check => check);
    }

    async updateResourceUsage(tenantId: string, operation: any): Promise<void> {
        const usage = this.getCurrentUsage(tenantId);
        
        // Update usage based on operation
        usage.tokenCount += operation.estimatedTokens || 0;
        usage.requestCount += 1;
        usage.lastRequestTime = new Date();

        // Reset counters if needed
        this.resetCountersIfNeeded(usage);

        this.resourceUsage.set(tenantId, usage);
    }

    async createTenant(tenantConfig: TenantConfig): Promise<void> {
        if (this.tenantConfigs.has(tenantConfig.id)) {
            throw new Error(`Tenant ${tenantConfig.id} already exists`);
        }

        this.tenantConfigs.set(tenantConfig.id, tenantConfig);
        this.resourceUsage.set(tenantConfig.id, this.initializeUsage(tenantConfig.id));
    }

    async updateTenant(tenantId: string, updates: Partial<TenantConfig>): Promise<void> {
        const existingConfig = this.tenantConfigs.get(tenantId);
        if (!existingConfig) {
            throw new Error(`Tenant ${tenantId} not found`);
        }

        const updatedConfig = { ...existingConfig, ...updates };
        this.tenantConfigs.set(tenantId, updatedConfig);
    }

    async deleteTenant(tenantId: string): Promise<void> {
        if (!this.tenantConfigs.has(tenantId)) {
            throw new Error(`Tenant ${tenantId} not found`);
        }

        this.tenantConfigs.delete(tenantId);
        this.resourceUsage.delete(tenantId);
    }

    async getTenantUsage(tenantId: string): Promise<any> {
        return this.getCurrentUsage(tenantId);
    }

    async getAllTenants(): Promise<TenantConfig[]> {
        return Array.from(this.tenantConfigs.values());
    }

    private initializeDefaultTenants(): void {
        // Create default tenant configurations
        const defaultTenant: TenantConfig = {
            id: 'default',
            name: 'Default Tenant',
            resourceLimits: {
                maxLLMCallsPerHour: 1000,
                maxTokensPerHour: 100000,
                maxStorageGB: 10,
                maxConcurrentTests: 10,
                maxUsers: 100
            },
            permissions: [
                {
                    id: 'test_generator',
                    name: 'Test Generator',
                    description: 'Can generate test code',
                    resources: ['tests', 'page_objects'],
                    actions: ['create', 'read', 'update']
                },
                {
                    id: 'test_executor',
                    name: 'Test Executor',
                    description: 'Can execute tests',
                    resources: ['tests'],
                    actions: ['execute', 'read']
                },
                {
                    id: 'results_viewer',
                    name: 'Results Viewer',
                    description: 'Can view test results',
                    resources: ['results'],
                    actions: ['read']
                }
            ],
            isolation: 'TENANT',
            compliance: {
                gdprEnabled: true,
                dataRetentionDays: 90,
                auditLogging: true,
                dataEncryption: true,
                accessLogging: true
            },
            features: {
                aiCodeGeneration: true,
                testExecution: true,
                reporting: true,
                collaboration: true,
                advancedAnalytics: true
            }
        };

        this.tenantConfigs.set('default', defaultTenant);
        this.resourceUsage.set('default', this.initializeUsage('default'));
    }

    private initializeUsage(tenantId: string): any {
        return {
            tenantId,
            tokenCount: 0,
            requestCount: 0,
            storageUsed: 0,
            concurrentTests: 0,
            lastRequestTime: new Date(),
            hourlyTokenCount: 0,
            hourlyRequestCount: 0
        };
    }

    private getCurrentUsage(tenantId: string): any {
        return this.resourceUsage.get(tenantId) || this.initializeUsage(tenantId);
    }

    private checkTokenUsage(usage: any, operation: any, limits: ResourceLimits): boolean {
        const currentHour = new Date().getHours();
        
        // Reset hourly counter if it's a new hour
        if (usage.lastRequestTime.getHours() !== currentHour) {
            usage.hourlyTokenCount = 0;
        }
        
        if (usage.hourlyTokenCount + (operation.estimatedTokens || 0) > limits.maxTokensPerHour) {
            return false;
        }
        
        return true;
    }

    private checkRequestCount(usage: any, operation: any, limits: ResourceLimits): boolean {
        const currentHour = new Date().getHours();
        
        // Reset hourly counter if it's a new hour
        if (usage.lastRequestTime.getHours() !== currentHour) {
            usage.hourlyRequestCount = 0;
        }
        
        if (usage.hourlyRequestCount + 1 > limits.maxLLMCallsPerHour) {
            return false;
        }
        
        return true;
    }

    private checkStorageUsage(usage: any, operation: any, limits: ResourceLimits): boolean {
        // Estimate storage usage based on operation
        const estimatedStorage = operation.estimatedStorage || 0;
        
        if (usage.storageUsed + estimatedStorage > limits.maxStorageGB * 1024 * 1024 * 1024) { // Convert GB to bytes
            return false;
        }
        
        return true;
    }

    private checkConcurrentOperations(usage: any, operation: any, limits: ResourceLimits): boolean {
        if (operation.type === 'test_execution') {
            if (usage.concurrentTests + 1 > limits.maxConcurrentTests) {
                return false;
            }
        }
        
        return true;
    }

    private resetCountersIfNeeded(usage: any): void {
        const now = new Date();
        const lastRequest = usage.lastRequestTime;
        
        // Reset hourly counters if more than an hour has passed
        if (now.getTime() - lastRequest.getTime() > 60 * 60 * 1000) {
            usage.hourlyTokenCount = 0;
            usage.hourlyRequestCount = 0;
        }
    }
} 