export interface LLMConfig {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    topK: number;
    repeatPenalty: number;
    contextWindow: number;
    batchSize: number;
}

export interface CodeGenerationRequest {
    userInput: string;
    context?: any;
    type: 'test' | 'page_object' | 'step_definition' | 'feature';
    framework: 'playwright' | 'selenium' | 'cypress';
    language: 'typescript' | 'javascript' | 'python';
}

export interface GeneratedCode {
    code: string;
    explanation: string;
    metadata: {
        model: string;
        generationTime: number;
        tokensUsed: number;
        confidence: number;
    };
}

export interface FrameworkContext {
    existingPages: any[];
    existingSteps: any[];
    existingFeatures: any[];
    relevantCode: any[];
    patterns: any;
    knownPages: any;
    intent: any;
    locators: any;
    testData: any;
}

export interface ValidationResult {
    isValid: boolean;
    violations: ValidationViolation[];
    recommendations: string[];
}

export interface ValidationViolation {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    line?: number;
}

export interface TenantConfig {
    id: string;
    name: string;
    resourceLimits: ResourceLimits;
    permissions: Permission[];
    isolation: IsolationLevel;
    compliance: ComplianceConfig;
    features: FeatureFlags;
}

export interface ResourceLimits {
    maxLLMCallsPerHour: number;
    maxTokensPerHour: number;
    maxStorageGB: number;
    maxConcurrentTests: number;
    maxUsers: number;
}

export interface Permission {
    id: string;
    name: string;
    description: string;
    resources: string[];
    actions: string[];
}

export interface ComplianceConfig {
    gdprEnabled: boolean;
    dataRetentionDays: number;
    auditLogging: boolean;
    dataEncryption: boolean;
    accessLogging: boolean;
}

export interface FeatureFlags {
    aiCodeGeneration: boolean;
    testExecution: boolean;
    reporting: boolean;
    collaboration: boolean;
    advancedAnalytics: boolean;
}

export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    userId: string;
    tenantId: string;
    action: string;
    resource: string;
    details: any;
    ipAddress: string;
    userAgent: string;
}

export interface MemoryEntry {
    id: string;
    type: 'conversation' | 'pattern' | 'result';
    data: any;
    metadata: {
        tenantId: string;
        userId: string;
        timestamp: Date;
        tags: string[];
    };
}

export interface ConversationMemory {
    sessionId: string;
    interactions: Interaction[];
    context: any;
}

export interface Interaction {
    id: string;
    timestamp: Date;
    userInput: string;
    aiResponse: string;
    context: any;
    metadata: any;
}

export interface CodePattern {
    id: string;
    description: string;
    code: string;
    usageCount: number;
    lastUsed: Date;
    success: boolean;
    tags: string[];
}

export interface TestResult {
    id: string;
    testName: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    duration: number;
    startTime: Date;
    endTime: Date;
    error?: string;
    screenshots?: string[];
    metadata: any;
}

export type IsolationLevel = 'NONE' | 'TENANT' | 'USER' | 'SESSION';

export interface RepoMetadata {
    poms: string[];
    utilities: string[];
    baseUrl: string;
    testFolders: string[];
    userRoles: string[];
} 