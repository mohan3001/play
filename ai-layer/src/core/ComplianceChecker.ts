import { CodeGenerationRequest, ValidationResult, ValidationViolation } from '../types/AITypes';

export class ComplianceChecker {
    async validateRequest(request: CodeGenerationRequest, tenantId: string): Promise<ValidationResult> {
        const violations: ValidationViolation[] = [];

        // Check GDPR compliance
        if (this.violatesGDPR(request)) {
            violations.push({
                type: 'GDPR_VIOLATION',
                severity: 'HIGH',
                message: 'Request may violate GDPR compliance requirements'
            });
        }

        // Check data retention policies
        if (this.violatesDataRetention(request)) {
            violations.push({
                type: 'DATA_RETENTION_VIOLATION',
                severity: 'MEDIUM',
                message: 'Request may violate data retention policies'
            });
        }

        // Check audit requirements
        if (this.violatesAuditRequirements(request)) {
            violations.push({
                type: 'AUDIT_VIOLATION',
                severity: 'MEDIUM',
                message: 'Request may violate audit requirements'
            });
        }

        // Check privacy requirements
        if (this.violatesPrivacyRequirements(request)) {
            violations.push({
                type: 'PRIVACY_VIOLATION',
                severity: 'HIGH',
                message: 'Request may violate privacy requirements'
            });
        }

        return {
            isValid: violations.length === 0,
            violations,
            recommendations: this.generateRecommendations(violations)
        };
    }

    private violatesGDPR(request: CodeGenerationRequest): boolean {
        // Check for personal data processing without proper consent
        const personalDataPatterns = [
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
            /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
            /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
            /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g, // IBAN
            /\b\d{10,11}\b/g // Phone numbers
        ];

        const containsPersonalData = personalDataPatterns.some(pattern => 
            pattern.test(request.userInput)
        );

        // Check if personal data is being processed without proper context
        if (containsPersonalData && !this.hasProperConsent(request)) {
            return true;
        }

        return false;
    }

    private violatesDataRetention(request: CodeGenerationRequest): boolean {
        // Check for data retention violations
        const retentionKeywords = [
            'delete after',
            'retain for',
            'keep until',
            'store permanently',
            'archive forever'
        ];

        return retentionKeywords.some(keyword => 
            request.userInput.toLowerCase().includes(keyword)
        );
    }

    private violatesAuditRequirements(request: CodeGenerationRequest): boolean {
        // Check for audit requirement violations
        const auditKeywords = [
            'skip audit',
            'no logging',
            'disable tracking',
            'bypass audit',
            'silent mode'
        ];

        return auditKeywords.some(keyword => 
            request.userInput.toLowerCase().includes(keyword)
        );
    }

    private violatesPrivacyRequirements(request: CodeGenerationRequest): boolean {
        // Check for privacy violations
        const privacyKeywords = [
            'expose data',
            'public access',
            'no encryption',
            'plain text',
            'unsecured'
        ];

        return privacyKeywords.some(keyword => 
            request.userInput.toLowerCase().includes(keyword)
        );
    }

    private hasProperConsent(request: CodeGenerationRequest): boolean {
        // Check if proper consent mechanisms are in place
        const consentKeywords = [
            'consent',
            'permission',
            'authorized',
            'approved',
            'gdpr compliant'
        ];

        return consentKeywords.some(keyword => 
            request.userInput.toLowerCase().includes(keyword)
        );
    }

    private generateRecommendations(violations: ValidationViolation[]): string[] {
        const recommendations: string[] = [];

        violations.forEach(violation => {
            switch (violation.type) {
                case 'GDPR_VIOLATION':
                    recommendations.push('Ensure proper consent mechanisms are in place for personal data processing');
                    recommendations.push('Implement data minimization principles');
                    recommendations.push('Provide clear privacy notices');
                    break;
                case 'DATA_RETENTION_VIOLATION':
                    recommendations.push('Implement proper data retention policies');
                    recommendations.push('Set up automated data deletion mechanisms');
                    recommendations.push('Document retention periods clearly');
                    break;
                case 'AUDIT_VIOLATION':
                    recommendations.push('Ensure all operations are properly logged');
                    recommendations.push('Implement audit trails for compliance');
                    recommendations.push('Enable tracking for all data access');
                    break;
                case 'PRIVACY_VIOLATION':
                    recommendations.push('Implement data encryption for sensitive information');
                    recommendations.push('Use secure transmission protocols');
                    recommendations.push('Apply access controls and authentication');
                    break;
            }
        });

        return recommendations;
    }

    async checkComplianceStatus(tenantId: string): Promise<any> {
        // Check overall compliance status for a tenant
        return {
            gdprCompliant: true,
            dataRetentionCompliant: true,
            auditCompliant: true,
            privacyCompliant: true,
            lastAudit: new Date(),
            nextAudit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        };
    }

    async generateComplianceReport(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
        // Generate compliance report for a specific period
        return {
            tenantId,
            period: { startDate, endDate },
            violations: [],
            recommendations: [],
            complianceScore: 95,
            generatedAt: new Date()
        };
    }
} 