import { AuditLogEntry } from '../types/AITypes';
import * as fs from 'fs';
import * as path from 'path';

export class AuditLogger {
    private logDirectory: string;
    private logFile: string;

    constructor() {
        this.logDirectory = path.join(process.cwd(), 'logs', 'audit');
        this.logFile = path.join(this.logDirectory, `audit-${new Date().toISOString().split('T')[0]}.log`);
        this.ensureLogDirectory();
    }

    async log(action: string, details: any): Promise<void> {
        const auditEntry: AuditLogEntry = {
            id: this.generateId(),
            timestamp: new Date(),
            userId: details.userId || 'system',
            tenantId: details.tenantId || 'system',
            action: action,
            resource: details.resource || 'ai_system',
            details: details,
            ipAddress: details.ipAddress || 'localhost',
            userAgent: details.userAgent || 'system'
        };

        await this.writeLogEntry(auditEntry);
    }

    async logSecurityEvent(event: string, details: any): Promise<void> {
        await this.log(`SECURITY_${event}`, {
            ...details,
            severity: 'SECURITY',
            timestamp: new Date()
        });
    }

    async logComplianceEvent(event: string, details: any): Promise<void> {
        await this.log(`COMPLIANCE_${event}`, {
            ...details,
            severity: 'COMPLIANCE',
            timestamp: new Date()
        });
    }

    async logPerformanceEvent(event: string, details: any): Promise<void> {
        await this.log(`PERFORMANCE_${event}`, {
            ...details,
            severity: 'PERFORMANCE',
            timestamp: new Date()
        });
    }

    async logUserAction(userId: string, action: string, details: any): Promise<void> {
        await this.log(`USER_${action}`, {
            userId,
            ...details,
            severity: 'USER_ACTION',
            timestamp: new Date()
        });
    }

    async logSystemEvent(event: string, details: any): Promise<void> {
        await this.log(`SYSTEM_${event}`, {
            ...details,
            severity: 'SYSTEM',
            timestamp: new Date()
        });
    }

    async getAuditLogs(
        tenantId?: string,
        userId?: string,
        startDate?: Date,
        endDate?: Date,
        action?: string
    ): Promise<AuditLogEntry[]> {
        try {
            const logContent = await this.readLogFile();
            const logs = logContent
                .filter(line => line.trim())
                .map(line => JSON.parse(line))
                .filter((entry: AuditLogEntry) => {
                    if (tenantId && entry.tenantId !== tenantId) return false;
                    if (userId && entry.userId !== userId) return false;
                    if (action && !entry.action.includes(action)) return false;
                    if (startDate && entry.timestamp < startDate) return false;
                    if (endDate && entry.timestamp > endDate) return false;
                    return true;
                });

            return logs;
        } catch (error) {
            console.error('Error reading audit logs:', error);
            return [];
        }
    }

    async getAuditSummary(tenantId?: string, startDate?: Date, endDate?: Date): Promise<any> {
        const logs = await this.getAuditLogs(tenantId, undefined, startDate, endDate);
        
        const summary = {
            totalEvents: logs.length,
            eventsByType: {} as Record<string, number>,
            eventsByUser: {} as Record<string, number>,
            eventsBySeverity: {} as Record<string, number>,
            averageResponseTime: 0,
            errorCount: 0,
            securityEvents: 0,
            complianceEvents: 0
        };

        let totalResponseTime = 0;
        let responseTimeCount = 0;

        logs.forEach(log => {
            // Count by action type
            const actionType = log.action.split('_')[0];
            summary.eventsByType[actionType] = (summary.eventsByType[actionType] || 0) + 1;

            // Count by user
            summary.eventsByUser[log.userId] = (summary.eventsByUser[log.userId] || 0) + 1;

            // Count by severity
            const severity = log.details?.severity || 'UNKNOWN';
            summary.eventsBySeverity[severity] = (summary.eventsBySeverity[severity] || 0) + 1;

            // Calculate response time
            if (log.details?.executionTime) {
                totalResponseTime += log.details.executionTime;
                responseTimeCount++;
            }

            // Count errors
            if (log.action.includes('FAILURE') || log.action.includes('ERROR')) {
                summary.errorCount++;
            }

            // Count security and compliance events
            if (log.action.includes('SECURITY')) {
                summary.securityEvents++;
            }
            if (log.action.includes('COMPLIANCE')) {
                summary.complianceEvents++;
            }
        });

        if (responseTimeCount > 0) {
            summary.averageResponseTime = totalResponseTime / responseTimeCount;
        }

        return summary;
    }

    async exportAuditLogs(
        format: 'json' | 'csv' | 'txt',
        tenantId?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<string> {
        const logs = await this.getAuditLogs(tenantId, undefined, startDate, endDate);
        
        switch (format) {
            case 'json':
                return JSON.stringify(logs, null, 2);
            case 'csv':
                return this.convertToCSV(logs);
            case 'txt':
                return this.convertToText(logs);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    private async writeLogEntry(entry: AuditLogEntry): Promise<void> {
        try {
            const logLine = JSON.stringify(entry) + '\n';
            await fs.promises.appendFile(this.logFile, logLine);
        } catch (error) {
            console.error('Error writing audit log:', error);
        }
    }

    private async readLogFile(): Promise<string[]> {
        try {
            if (!fs.existsSync(this.logFile)) {
                return [];
            }
            const content = await fs.promises.readFile(this.logFile, 'utf8');
            return content.split('\n');
        } catch (error) {
            console.error('Error reading audit log file:', error);
            return [];
        }
    }

    private ensureLogDirectory(): void {
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }
    }

    private generateId(): string {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private convertToCSV(logs: AuditLogEntry[]): string {
        if (logs.length === 0) return '';

        const headers = ['id', 'timestamp', 'userId', 'tenantId', 'action', 'resource', 'ipAddress', 'userAgent'];
        const csvLines = [headers.join(',')];

        logs.forEach(log => {
            const row = headers.map(header => {
                const value = log[header as keyof AuditLogEntry];
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csvLines.push(row.join(','));
        });

        return csvLines.join('\n');
    }

    private convertToText(logs: AuditLogEntry[]): string {
        return logs.map(log => 
            `[${log.timestamp.toISOString()}] ${log.action} - User: ${log.userId}, Tenant: ${log.tenantId}, Resource: ${log.resource}`
        ).join('\n');
    }
} 