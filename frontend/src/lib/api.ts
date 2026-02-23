const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:4000/api/v1';
const LAB_API_URL = process.env.NEXT_PUBLIC_LAB_API_URL || 'http://localhost:8000/api/v1';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  baseUrl: string,
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${baseUrl}${path}`;

  try {
    const response = await fetch(url, {
      credentials: 'include', // Include HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
      throw new ApiError(
        json.error?.code || 'UNKNOWN_ERROR',
        json.error?.message || `HTTP ${response.status}`,
        response.status,
        json.error?.details
      );
    }

    return json;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    // Handle network errors
    throw new ApiError(
      'NETWORK_ERROR',
      'Network error. Please check your connection.',
      0
    );
  }
}

// Core API client
export const coreApi = {
  get: <T>(path: string) => fetchApi<T>(CORE_API_URL, path),
  post: <T>(path: string, data?: unknown) =>
    fetchApi<T>(CORE_API_URL, path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(path: string, data?: unknown) =>
    fetchApi<T>(CORE_API_URL, path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(path: string, data?: unknown) =>
    fetchApi<T>(CORE_API_URL, path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(path: string) =>
    fetchApi<T>(CORE_API_URL, path, { method: 'DELETE' }),
};

// Lab API client
export const labApi = {
  get: <T>(path: string) => fetchApi<T>(LAB_API_URL, path),
  post: <T>(path: string, data?: unknown) =>
    fetchApi<T>(LAB_API_URL, path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  uploadFile: async <T>(path: string, formData: FormData): Promise<ApiResponse<T>> => {
    const url = `${LAB_API_URL}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      // Don't set Content-Type for multipart/form-data - browser will set it with boundary
    });
    const json: ApiResponse<T> = await response.json();
    if (!response.ok || !json.success) {
      throw new ApiError(
        json.error?.code || 'UPLOAD_ERROR',
        json.error?.message || 'Upload failed',
        response.status
      );
    }
    return json;
  },
};
