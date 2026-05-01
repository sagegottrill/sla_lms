/**
 * API Response Utilities
 * Standardizes API response handling across the application
 */

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Wraps a promise to return a standardized ApiResponse
 * @param promiseFn Function that returns a promise
 * @returns Promise resolving to ApiResponse
 */
export async function apiResponse<T>(promiseFn: Promise<T>): Promise<ApiResponse<T>> {
  try {
    const data = await promiseFn;
    return {
      data: data ?? null,
      error: null,
      success: true
    };
  } catch (error: any) {
    return {
      data: null,
      error: error?.message || 'An unknown error occurred',
      success: false
    };
  }
}

/**
 * Validates if an API response was successful
 * @param response ApiResponse to validate
 * @returns boolean indicating success
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
  return response.success && response.data !== null;
}

/**
 * Handles API errors with consistent logging and user feedback
 * @param error Error object from API call
 * @param context Optional context for logging
 */
export function handleApiError(error: any, context?: string): void {
  console.error(`API Error${context ? ` (${context})` : ''}:`, error);
  
  // In a real app, you might send this to an error tracking service
  // For now, we'll just log it
}

/**
 * Retry mechanism for API calls with exponential backoff
 * @param fn Function to retry
 * @param maxAttempts Maximum number of attempts (default: 3)
 * @param baseDelay Base delay in ms (default: 1000)
 * @returns Promise resolving to function result
 */
export async function retryApiCall<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If this was the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}