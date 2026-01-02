/**
 * Vincere API Client
 *
 * Handles authentication and requests to the Vincere API with automatic token refresh.
 *
 * API URLs:
 * - Auth: https://id.vincere.io/oauth2/token
 * - API: https://lighthouse-careers.vincere.io/api/v2
 */

const AUTH_URL = 'https://id.vincere.io/oauth2/token';
const API_BASE_URL = 'https://lighthouse-careers.vincere.io/api/v2';

interface TokenResponse {
  id_token: string;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
}

interface VincereConfig {
  clientId: string;
  apiKey: string;
  refreshToken: string;
}

export class VincereClient {
  private config: VincereConfig;
  private idToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config?: Partial<VincereConfig>) {
    this.config = {
      clientId: config?.clientId ?? process.env.VINCERE_CLIENT_ID ?? '',
      apiKey: config?.apiKey ?? process.env.VINCERE_API_KEY ?? '',
      refreshToken: config?.refreshToken ?? process.env.VINCERE_REFRESH_TOKEN ?? '',
    };

    if (!this.config.clientId || !this.config.apiKey || !this.config.refreshToken) {
      throw new Error('Missing required Vincere configuration. Ensure VINCERE_CLIENT_ID, VINCERE_API_KEY, and VINCERE_REFRESH_TOKEN are set.');
    }
  }

  /**
   * Authenticate with Vincere using OAuth2 refresh token flow
   */
  async authenticate(): Promise<string> {
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      grant_type: 'refresh_token',
      refresh_token: this.config.refreshToken,
    });

    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vincere authentication failed: ${response.status} ${errorText}`);
    }

    const data: TokenResponse = await response.json();

    if (!data.id_token) {
      throw new Error('No id_token returned from Vincere authentication');
    }

    this.idToken = data.id_token;
    // Token expires in 1 hour, but refresh 5 minutes early
    this.tokenExpiresAt = Date.now() + ((data.expires_in ?? 3600) - 300) * 1000;

    return this.idToken;
  }

  /**
   * Get a valid token, refreshing if necessary
   */
  private async getToken(): Promise<string> {
    if (!this.idToken || Date.now() >= this.tokenExpiresAt) {
      await this.authenticate();
    }
    return this.idToken!;
  }

  /**
   * Make an authenticated request to the Vincere API
   */
  async request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: Record<string, unknown> | unknown[],
    options: { retryOnAuthError?: boolean } = { retryOnAuthError: true }
  ): Promise<T> {
    const token = await this.getToken();

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'accept': 'application/json',
      'id-token': token,
      'x-api-key': this.config.apiKey,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, fetchOptions);

    // Handle token expiration - retry once with fresh token
    if (response.status === 401 && options.retryOnAuthError) {
      this.idToken = null;
      this.tokenExpiresAt = 0;
      return this.request(method, endpoint, data, { retryOnAuthError: false });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new VincereApiError(
        `Vincere API error: ${response.status} ${response.statusText}`,
        response.status,
        errorText
      );
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  /**
   * GET request helper
   */
  async get<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  /**
   * POST request helper
   */
  async post<T = unknown>(endpoint: string, data?: Record<string, unknown> | unknown[]): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  /**
   * PUT request helper
   */
  async put<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  /**
   * PATCH request helper
   */
  async patch<T = unknown>(endpoint: string, data?: Record<string, unknown> | unknown[]): Promise<T> {
    return this.request<T>('PATCH', endpoint, data);
  }

  /**
   * DELETE request helper
   */
  async delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  /**
   * GET request that returns raw binary data (for file downloads)
   */
  async getRaw(endpoint: string): Promise<ArrayBuffer> {
    const token = await this.getToken();

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'id-token': token,
      'x-api-key': this.config.apiKey,
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new VincereApiError(
        `Vincere API error: ${response.status} ${response.statusText}`,
        response.status,
        errorText
      );
    }

    return response.arrayBuffer();
  }
}

/**
 * Custom error class for Vincere API errors
 */
export class VincereApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody: string
  ) {
    super(message);
    this.name = 'VincereApiError';
  }
}

// Singleton instance for convenience
let defaultClient: VincereClient | null = null;

/**
 * Get or create the default Vincere client instance
 */
export function getVincereClient(): VincereClient {
  if (!defaultClient) {
    defaultClient = new VincereClient();
  }
  return defaultClient;
}

/**
 * Create a new Vincere client with custom configuration
 */
export function createVincereClient(config: Partial<VincereConfig>): VincereClient {
  return new VincereClient(config);
}
