import { API_BASE_URL } from './config';
import type {
  PredictRequest,
  PredictResponse,
  FeedbackRequest,
  FeedbackResponse,
  HealthResponse,
} from '@/types/api';

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new APIError(
        response.status,
        `API Error: ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(0, 'Network error: Unable to connect to server');
  }
}

export const api = {
  async health(): Promise<HealthResponse> {
    return fetchAPI<HealthResponse>('/health');
  },

  async predict(data: PredictRequest): Promise<PredictResponse> {
    return fetchAPI<PredictResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async feedback(data: FeedbackRequest): Promise<FeedbackResponse> {
    return fetchAPI<FeedbackResponse>('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
