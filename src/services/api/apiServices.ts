import type { ModelType } from '../../types/core/CommonTypes';
import { BaseApiService } from './baseApi';

// Proper OpenAI API types
interface OpenAIMessage {
  role: 'user' | 'system' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
      detail?: 'low' | 'high' | 'auto';
    };
  }>;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens: number;
  temperature: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }>;
}

export interface APIResponse {
  content: string;
  tokensUsed: number;
  modelUsed: ModelType;
}

export class ApiService extends BaseApiService {
  async callVisionAPI(base64Image: string, prompt: string): Promise<APIResponse> {
    const requestPayload: OpenAIRequest = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    };

    const response = await this.retryRequest(async () => {
      return await this.makeRequest<OpenAIResponse>('/chat/completions', {
        method: 'POST',
        body: JSON.stringify(requestPayload)
      });
    }, 3, 2000);

    if (!response.success) {
      throw new Error(`Vision API call failed: ${response.error}`);
    }

    const apiData = response.data!;
    const choice = apiData.choices[0];
    
    if (!choice?.message?.content) {
      throw new Error('Invalid response from Vision API');
    }

    return {
      content: choice.message.content,
      tokensUsed: apiData.usage.total_tokens,
      modelUsed: 'gpt-4o'
    };
  }

  async callTextAPI(prompt: string): Promise<APIResponse> {
    const requestPayload: OpenAIRequest = {
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.1
    };

    const response = await this.retryRequest(async () => {
      return await this.makeRequest<OpenAIResponse>('/chat/completions', {
        method: 'POST',
        body: JSON.stringify(requestPayload)
      });
    }, 3, 1000);

    if (!response.success) {
      throw new Error(`Text API call failed: ${response.error}`);
    }

    const apiData = response.data!;
    const choice = apiData.choices[0];
    
    if (!choice?.message?.content) {
      throw new Error('Invalid response from Text API');
    }

    return {
      content: choice.message.content,
      tokensUsed: apiData.usage.total_tokens,
      modelUsed: 'gpt-4-turbo'
    };
  }
}
