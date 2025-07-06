import { CodeGenerationRequest, ValidationResult, ValidationViolation } from '../types/AITypes';

export class SecurityValidator {
    async validateCodeGeneration(request: CodeGenerationRequest): Promise<ValidationResult> {
        const violations: ValidationViolation[] = [];

        // Check for sensitive data in input
        if (this.containsSensitiveData(request.userInput)) {
            violations.push({
                type: 'SENSITIVE_DATA_EXPOSURE',
                severity: 'HIGH',
                message: 'Input contains potentially sensitive data'
            });
        }

        // Check for injection attempts
        if (this.containsInjectionAttempt(request.userInput)) {
            violations.push({
                type: 'CODE_INJECTION_ATTEMPT',
                severity: 'CRITICAL',
                message: 'Potential code injection detected'
            });
        }

        // Check for malicious patterns
        if (this.containsMaliciousPatterns(request.userInput)) {
            violations.push({
                type: 'MALICIOUS_PATTERN',
                severity: 'HIGH',
                message: 'Malicious pattern detected in input'
            });
        }

        return {
            isValid: violations.length === 0,
            violations,
            recommendations: this.generateRecommendations(violations)
        };
    }

    async validateGeneratedCode(code: string): Promise<ValidationResult> {
        const violations: ValidationViolation[] = [];

        // Check for hardcoded credentials
        if (this.containsHardcodedCredentials(code)) {
            violations.push({
                type: 'HARDCODED_CREDENTIALS',
                severity: 'HIGH',
                message: 'Generated code contains hardcoded credentials'
            });
        }

        // Check for unsafe operations
        if (this.containsUnsafeOperations(code)) {
            violations.push({
                type: 'UNSAFE_OPERATION',
                severity: 'CRITICAL',
                message: 'Generated code contains unsafe operations'
            });
        }

        // Check for injection vulnerabilities
        if (this.containsInjectionVulnerabilities(code)) {
            violations.push({
                type: 'INJECTION_VULNERABILITY',
                severity: 'HIGH',
                message: 'Generated code contains injection vulnerabilities'
            });
        }

        // Check for data leakage
        if (this.containsDataLeakage(code)) {
            violations.push({
                type: 'DATA_LEAKAGE',
                severity: 'MEDIUM',
                message: 'Generated code may cause data leakage'
            });
        }

        return {
            isValid: violations.length === 0,
            violations,
            recommendations: this.generateRecommendations(violations)
        };
    }

    private containsSensitiveData(input: string): boolean {
        const sensitivePatterns = [
            /password\s*=\s*['"][^'"]+['"]/gi,
            /api_key\s*=\s*['"][^'"]+['"]/gi,
            /secret\s*=\s*['"][^'"]+['"]/gi,
            /token\s*=\s*['"][^'"]+['"]/gi,
            /key\s*=\s*['"][^'"]+['"]/gi,
            /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card pattern
            /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g // Email pattern
        ];

        return sensitivePatterns.some(pattern => pattern.test(input));
    }

    private containsInjectionAttempt(input: string): boolean {
        const injectionPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /eval\s*\(/gi,
            /Function\s*\(/gi,
            /document\.write/gi,
            /innerHTML\s*=/gi,
            /outerHTML\s*=/gi
        ];

        return injectionPatterns.some(pattern => pattern.test(input));
    }

    private containsMaliciousPatterns(input: string): boolean {
        const maliciousPatterns = [
            /rm\s+-rf/gi,
            /del\s+\/s/gi,
            /format\s+c:/gi,
            /shutdown/gi,
            /restart/gi,
            /kill\s+-9/gi,
            /taskkill/gi
        ];

        return maliciousPatterns.some(pattern => pattern.test(input));
    }

    private containsHardcodedCredentials(code: string): boolean {
        const credentialPatterns = [
            /password\s*=\s*['"][^'"]+['"]/gi,
            /api_key\s*=\s*['"][^'"]+['"]/gi,
            /secret\s*=\s*['"][^'"]+['"]/gi,
            /token\s*=\s*['"][^'"]+['"]/gi,
            /key\s*=\s*['"][^'"]+['"]/gi,
            /auth\s*=\s*['"][^'"]+['"]/gi
        ];

        return credentialPatterns.some(pattern => pattern.test(code));
    }

    private containsUnsafeOperations(code: string): boolean {
        const unsafePatterns = [
            /eval\s*\(/gi,
            /Function\s*\(/gi,
            /exec\s*\(/gi,
            /spawn\s*\(/gi,
            /child_process/gi,
            /fs\.writeFileSync/gi,
            /fs\.unlinkSync/gi
        ];

        return unsafePatterns.some(pattern => pattern.test(code));
    }

    private containsInjectionVulnerabilities(code: string): boolean {
        const injectionPatterns = [
            /innerHTML\s*=\s*[^;]+/gi,
            /outerHTML\s*=\s*[^;]+/gi,
            /document\.write\s*\(/gi,
            /document\.writeln\s*\(/gi,
            /\.innerHTML\s*=/gi,
            /\.outerHTML\s*=/gi
        ];

        return injectionPatterns.some(pattern => pattern.test(code));
    }

    private containsDataLeakage(code: string): boolean {
        const leakagePatterns = [
            /alert\s*\(/gi,
            /confirm\s*\(/gi,
            /prompt\s*\(/gi,
            /window\.open\s*\(/gi,
            /location\.href\s*=/gi
        ];

        return leakagePatterns.some(pattern => pattern.test(code));
    }

    private generateRecommendations(violations: ValidationViolation[]): string[] {
        const recommendations: string[] = [];

        violations.forEach(violation => {
            switch (violation.type) {
                case 'SENSITIVE_DATA_EXPOSURE':
                    recommendations.push('Remove sensitive data from input or use environment variables');
                    break;
                case 'CODE_INJECTION_ATTEMPT':
                    recommendations.push('Sanitize input to prevent code injection');
                    break;
                case 'MALICIOUS_PATTERN':
                    recommendations.push('Review input for malicious content');
                    break;
                case 'HARDCODED_CREDENTIALS':
                    recommendations.push('Use environment variables or secure configuration management');
                    break;
                case 'UNSAFE_OPERATION':
                    recommendations.push('Replace unsafe operations with safer alternatives');
                    break;
                case 'INJECTION_VULNERABILITY':
                    recommendations.push('Use proper input validation and sanitization');
                    break;
                case 'DATA_LEAKAGE':
                    recommendations.push('Remove or secure logging statements');
                    break;
            }
        });

        return recommendations;
    }
} 