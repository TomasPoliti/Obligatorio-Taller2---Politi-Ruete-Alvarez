import { ValidationError } from './validation';

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    };
  }

  if (error instanceof ValidationError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    };
  }

  // Generic error
  console.error('Unexpected error:', error);
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  };
}
