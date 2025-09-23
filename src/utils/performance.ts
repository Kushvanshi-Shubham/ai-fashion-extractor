class PerformanceMonitor {
    private metrics: Map<string, number[]> = new Map();

    startTimer(operation: string): () => number {
        const start = performance.now();
        
        return () => {
            const duration = performance.now() - start;
            this.recordMetric(operation, duration);
            return duration;
        };
    }

    recordMetric(operation: string, duration: number): void {
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, []);
        }
        
        const metrics = this.metrics.get(operation)!;
        metrics.push(duration);
        
        // Keep only last 100 measurements
        if (metrics.length > 100) {
            metrics.shift();
        }
        
        // Log slow operations
        if (duration > 1000) {
            console.warn(`%c[Performance] Slow operation: ${operation} took ${duration.toFixed(2)}ms`, 'color: #faad14;');
        }
    }

    getAverageTime(operation: string): number {
        const metrics = this.metrics.get(operation);
        if (!metrics || metrics.length === 0) return 0;
        
        return metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
    }

    getAllMetrics(): Record<string, { avg: number; count: number; min: number; max: number }> {
        const result: Record<string, any> = {};
        
        for (const [operation, times] of this.metrics.entries()) {
            if (times.length === 0) continue;
            
            result[operation] = {
                avg: times.reduce((sum, time) => sum + time, 0) / times.length,
                count: times.length,
                min: Math.min(...times),
                max: Math.max(...times)
            };
        }
        
        return result;
    }

    logSummary(): void {
        const metrics = this.getAllMetrics();
        console.group('%c[Performance Summary]', 'color: #1890ff; font-weight: bold;');
        
        for (const [operation, stats] of Object.entries(metrics)) {
            console.log(`${operation}: avg ${stats.avg.toFixed(2)}ms (${stats.count} samples)`);
        }
        
        console.groupEnd();
    }
}

export const performanceMonitor = new PerformanceMonitor();

