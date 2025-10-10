// 🚀 Frontend Queue Service - Handles job submission and status polling

import { APP_CONFIG } from '../../constants/app/config';
import type { SchemaItem, EnhancedExtractionResult } from '../../types/extraction/ExtractionTypes';

export interface QueueJobRequest {
  image: string; // base64
  schema: SchemaItem[];
  categoryName?: string;
  department?: string;
  subDepartment?: string;
  priority?: 'low' | 'normal' | 'high';
  userId?: string;
  discoveryMode?: boolean;
}

export interface QueueJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: EnhancedExtractionResult;
  error?: string;
  processingTime?: number;
  estimatedTokens: number;
  actualTokens?: number;
  queuePosition: number;
  estimatedWaitTime: number; // seconds
  queueStats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    totalTokensUsed: number;
    averageProcessingTime: number;
  };
}

export interface QueueHealth {
  status: 'healthy' | 'degraded';
  canAcceptJobs: boolean;
  queueStats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  tokenBudget: {
    remaining: number;
    utilizationPercent: number;
  };
  activeJobs: number;
  maxConcurrent: number;
}

export class QueueService {
  private baseURL: string;

  constructor() {
    this.baseURL = APP_CONFIG.api.baseURL;
  }

  // 🎯 Submit job to queue
  async submitJob(request: QueueJobRequest): Promise<{ jobId: string; message: string }> {
    try {
      console.log(`📋 Submitting job to queue - Category: ${request.categoryName}, Schema: ${request.schema.length} attrs`);
      
      const response = await fetch(`${this.baseURL}/queue/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Queue submission failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Job submission failed');
      }

      console.log(`✅ Job submitted successfully: ${result.data.jobId}`);
      return result.data;

    } catch (error) {
      console.error('❌ Queue submission failed:', error);
      throw new Error(`Job submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🎯 Get job status with polling support
  async getJobStatus(jobId: string): Promise<QueueJobStatus> {
    try {
      const response = await fetch(`${this.baseURL}/queue/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 404) {
          throw new Error('Job not found - it may have been cleaned up');
        }
        
        throw new Error(errorData.error || `Status check failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Status check failed');
      }

      return result.data;

    } catch (error) {
      console.error('❌ Status check failed:', error);
      throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🎯 Poll job status until completion
  async pollJobUntilComplete(
    jobId: string, 
    onProgress?: (status: QueueJobStatus) => void,
    timeoutMs: number = 120000 // 2 minutes timeout
  ): Promise<EnhancedExtractionResult> {
    
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error('Job polling timeout - job may still be processing'));
            return;
          }

          const status = await this.getJobStatus(jobId);
          
          // Call progress callback
          if (onProgress) {
            onProgress(status);
          }

          // Check if job is complete
          if (status.status === 'completed') {
            if (status.result) {
              console.log(`✅ Job ${jobId} completed successfully`);
              resolve(status.result);
            } else {
              reject(new Error('Job completed but no result returned'));
            }
            return;
          }

          // Check if job failed
          if (status.status === 'failed') {
            reject(new Error(status.error || 'Job processing failed'));
            return;
          }

          // Continue polling
          setTimeout(poll, pollInterval);

        } catch (error) {
          console.error('❌ Polling error:', error);
          reject(error);
        }
      };

      // Start polling
      poll();
    });
  }

  // 🎯 Check queue health
  async getQueueHealth(): Promise<QueueHealth> {
    try {
      const response = await fetch(`${this.baseURL}/queue/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Health check failed');
      }

      return result.data;

    } catch (error) {
      console.error('❌ Queue health check failed:', error);
      // Return degraded status on error
      return {
        status: 'degraded',
        canAcceptJobs: false,
        queueStats: { pending: 0, processing: 0, completed: 0, failed: 0 },
        tokenBudget: { remaining: 0, utilizationPercent: 100 },
        activeJobs: 0,
        maxConcurrent: 0
      };
    }
  }

  // 🎯 Utility: Estimate processing time
  estimateProcessingTime(schemaLength: number, queuePosition: number): number {
    const baseProcessingTime = 15; // 15 seconds base
    const schemaComplexityFactor = Math.min(schemaLength * 1.2, 20); // Max 20s for complexity
    const queueWaitTime = queuePosition * 3; // 3 seconds per position
    
    return Math.round(baseProcessingTime + schemaComplexityFactor + queueWaitTime);
  }

  // 🎯 Utility: Format wait time for display
  formatWaitTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }
}