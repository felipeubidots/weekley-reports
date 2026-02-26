import logger from './logger.js';

export interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

export interface HttpResponse<T> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export class HttpClient {
  private static readonly DEFAULT_TIMEOUT = 30000;
  private static readonly DEFAULT_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 1000;

  static async request<T>(options: HttpRequestOptions): Promise<T> {
    const {
      method,
      url,
      headers = {},
      body,
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRIES
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(
            `HTTP ${response.status}: ${errorText || response.statusText}`
          );
          (error as any).statusCode = response.status;
          throw error;
        }

        const data = (await response.json()) as T;
        return data;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on 4xx errors (except 429)
        const statusCode = (error as any).statusCode;
        if (statusCode && statusCode < 500 && statusCode !== 429) {
          throw error;
        }

        // If this wasn't the last attempt, wait before retrying
        if (attempt < retries) {
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt);
          logger.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`, {
            url,
            error: (error as Error).message
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Unknown HTTP error');
  }

  static async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'GET', url, headers });
  }

  static async post<T>(
    url: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>({ method: 'POST', url, body, headers });
  }

  static async put<T>(
    url: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>({ method: 'PUT', url, body, headers });
  }
}
