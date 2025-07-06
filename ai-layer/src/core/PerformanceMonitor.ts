export class PerformanceMonitor {
    private metrics: Map<string, any[]> = new Map();
    private rateLimits: Map<string, any> = new Map();

    async recordMetric(metricName: string, data: any): Promise<void> {
        if (!this.metrics.has(metricName)) {
            this.metrics.set(metricName, []);
        }

        const metricData = {
            ...data,
            timestamp: new Date(),
            id: this.generateId()
        };

        this.metrics.get(metricName)!.push(metricData);

        // Keep only last 1000 entries per metric
        const metricArray = this.metrics.get(metricName)!;
        if (metricArray.length > 1000) {
            metricArray.splice(0, metricArray.length - 1000);
        }
    }

    async getMetric(metricName: string, timeRange?: { start: Date; end: Date }): Promise<any[]> {
        const metricData = this.metrics.get(metricName) || [];
        
        if (!timeRange) {
            return metricData;
        }

        return metricData.filter(data => 
            data.timestamp >= timeRange.start && data.timestamp <= timeRange.end
        );
    }

    async getMetricSummary(metricName: string, timeRange?: { start: Date; end: Date }): Promise<any> {
        const data = await this.getMetric(metricName, timeRange);
        
        if (data.length === 0) {
            return {
                count: 0,
                average: 0,
                min: 0,
                max: 0,
                total: 0
            };
        }

        const values = data.map(d => d.executionTime || 0).filter(v => v > 0);
        
        if (values.length === 0) {
            return {
                count: data.length,
                average: 0,
                min: 0,
                max: 0,
                total: 0
            };
        }

        const total = values.reduce((sum, val) => sum + val, 0);
        const average = total / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        return {
            count: data.length,
            average,
            min,
            max,
            total
        };
    }

    async checkRateLimit(tenantId: string, userId: string): Promise<boolean> {
        const key = `${tenantId}:${userId}`;
        const now = new Date();
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, {
                requests: [],
                lastReset: now
            });
        }

        const rateLimit = this.rateLimits.get(key)!;
        
        // Reset if it's a new hour
        if (now.getTime() - rateLimit.lastReset.getTime() > 60 * 60 * 1000) {
            rateLimit.requests = [];
            rateLimit.lastReset = now;
        }

        // Check if user has exceeded rate limit (100 requests per hour)
        if (rateLimit.requests.length >= 100) {
            return false;
        }

        // Add current request
        rateLimit.requests.push(now);
        
        return true;
    }

    async getPerformanceReport(timeRange?: { start: Date; end: Date }): Promise<any> {
        const report = {
            timestamp: new Date(),
            timeRange,
            metrics: {} as Record<string, any>,
            summary: {
                totalMetrics: 0,
                averageResponseTime: 0,
                totalRequests: 0,
                errorRate: 0
            }
        };

        // Get summary for each metric
        for (const [metricName] of this.metrics) {
            const summary = await this.getMetricSummary(metricName, timeRange);
            report.metrics[metricName] = summary;
        }

        // Calculate overall summary
        const allData = Array.from(this.metrics.values()).flat();
        const responseTimes = allData
            .map(d => d.executionTime || 0)
            .filter(t => t > 0);

        if (responseTimes.length > 0) {
            report.summary.averageResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
        }

        report.summary.totalMetrics = this.metrics.size;
        report.summary.totalRequests = allData.length;

        const errorData = allData.filter(d => d.error || d.status === 'error');
        report.summary.errorRate = allData.length > 0 ? (errorData.length / allData.length) * 100 : 0;

        return report;
    }

    async getSlowestOperations(limit: number = 10): Promise<any[]> {
        const allData = Array.from(this.metrics.values()).flat();
        
        return allData
            .filter(d => d.executionTime && d.executionTime > 0)
            .sort((a, b) => (b.executionTime || 0) - (a.executionTime || 0))
            .slice(0, limit)
            .map(d => ({
                metric: d.metricName,
                executionTime: d.executionTime,
                timestamp: d.timestamp,
                tenantId: d.tenantId,
                userId: d.userId
            }));
    }

    async getErrorSummary(timeRange?: { start: Date; end: Date }): Promise<any> {
        const allData = Array.from(this.metrics.values()).flat();
        const errorData = allData.filter(d => 
            d.error || d.status === 'error' || d.action?.includes('FAILURE')
        );

        if (timeRange) {
            errorData.filter(d => 
                d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
            );
        }

        const errorTypes = {} as Record<string, number>;
        const errorByTenant = {} as Record<string, number>;
        const errorByUser = {} as Record<string, number>;

        errorData.forEach(error => {
            const errorType = error.error?.type || error.action || 'UNKNOWN';
            errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
            
            if (error.tenantId) {
                errorByTenant[error.tenantId] = (errorByTenant[error.tenantId] || 0) + 1;
            }
            
            if (error.userId) {
                errorByUser[error.userId] = (errorByUser[error.userId] || 0) + 1;
            }
        });

        return {
            totalErrors: errorData.length,
            errorTypes,
            errorByTenant,
            errorByUser,
            recentErrors: errorData.slice(-10) // Last 10 errors
        };
    }

    async clearMetrics(metricName?: string): Promise<void> {
        if (metricName) {
            this.metrics.delete(metricName);
        } else {
            this.metrics.clear();
        }
    }

    async clearRateLimits(): Promise<void> {
        this.rateLimits.clear();
    }

    private generateId(): string {
        return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
} 