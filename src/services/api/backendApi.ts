import type { SchemaItem, EnhancedExtractionResult } from '../../types/extraction/ExtractionTypes';
import { APP_CONFIG } from '../../constants/app/config';

export interface BackendExtractionRequest {
  image: string; // base64 encoded image
  schema: SchemaItem[];
  categoryName?: string;
  customPrompt?: string;
  discoveryMode?: boolean;
}

export interface BackendExtractionResponse {
  success: boolean;
  data?: EnhancedExtractionResult;
  error?: string;
  timestamp: number;
}

export class BackendApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = APP_CONFIG.api.baseURL;
  }

  async extractFromBase64(request: BackendExtractionRequest): Promise<EnhancedExtractionResult> {
    try {
      // 🔧 LOG DISCOVERY MODE STATUS
      console.log(`🔍 Backend API Call - Discovery Mode: ${request.discoveryMode || false}`);
      
      const response = await fetch(`${this.baseURL}/extract/base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          discoveryMode: request.discoveryMode || false // Ensure boolean
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const result: BackendExtractionResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Extraction failed');
      }

      if (!result.data) {
        throw new Error('No data returned from extraction');
      }

      return result.data;
    } catch (error) {
      console.error('Backend API extraction failed:', error);
      throw new Error(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractFromFile(file: File, schema: SchemaItem[], categoryName?: string, discoveryMode = false): Promise<EnhancedExtractionResult> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('schema', JSON.stringify(schema));
      
      if (categoryName) {
        formData.append('categoryName', categoryName);
      }
      
      if (discoveryMode) {
        formData.append('discoveryMode', 'true');
      }

      const response = await fetch(`${this.baseURL}/extract/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const result: BackendExtractionResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Extraction failed');
      }

      if (!result.data) {
        throw new Error('No data returned from extraction');
      }

      return result.data;
    } catch (error) {
      console.error('Backend API file extraction failed:', error);
      throw new Error(`File extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractWithDebug(request: BackendExtractionRequest): Promise<EnhancedExtractionResult & { debugInfo?: unknown }> {
    try {
      const response = await fetch(`${this.baseURL}/extract/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const result: BackendExtractionResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Debug extraction failed');
      }

      if (!result.data) {
        throw new Error('No data returned from debug extraction');
      }

      return result.data as EnhancedExtractionResult & { debugInfo?: unknown };
    } catch (error) {
      console.error('Backend API debug extraction failed:', error);
      throw new Error(`Debug extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<{ success: boolean; message: string; version: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Backend health check failed:', error);
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isConfigured(): boolean {
    return !!this.baseURL;
  }

  async listUploads(page = 1, pageSize = 20) {
    const resp = await fetch(`${this.baseURL}/uploads?page=${page}&pageSize=${pageSize}`);
    if (!resp.ok) throw new Error(`Failed to fetch uploads: ${resp.status}`);
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Failed to list uploads');
    return json.data;
  }

  async getUpload(id: string) {
    const resp = await fetch(`${this.baseURL}/uploads/${id}`);
    if (!resp.ok) throw new Error(`Failed to fetch upload: ${resp.status}`);
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Failed to get upload');
    return json.data;
  }

  async updateUpload(id: string, data: { status?: string; filename?: string }) {
    const token = localStorage.getItem('authToken');
    const resp = await fetch(`${this.baseURL}/uploads/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error(`Failed to update upload: ${resp.status}`);
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Failed to update upload');
    return json.data;
  }

  async deleteUpload(id: string) {
    const token = localStorage.getItem('authToken');
    const resp = await fetch(`${this.baseURL}/uploads/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!resp.ok) throw new Error(`Failed to delete upload: ${resp.status}`);
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete upload');
    return json.data;
  }

  async getAdminStats() {
    const token = localStorage.getItem('authToken');
    const resp = await fetch(`${this.baseURL}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!resp.ok) throw new Error(`Failed to fetch admin stats: ${resp.status}`);
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Failed to get admin stats');
    return json.data;
  }

  async login(email: string, password: string) {
    const resp = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) throw new Error(`Login failed: ${resp.status}`);
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Login failed');
    return json.data;
  }

  async register(email: string, password: string) {
    const resp = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) throw new Error(`Registration failed: ${resp.status}`);
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Registration failed');
    return json.data;
  }

  async getMe() {
    const token = localStorage.getItem('authToken');
    const resp = await fetch(`${this.baseURL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error(`Failed to get user info: ${resp.status}`);
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Failed to get user info');
    return json.data;
  }
}