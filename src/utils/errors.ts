// src/utils/errors.ts

// Base class for all API errors
export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

// 400 - Bad Request (e.g., validation errors)
export class BadRequestError extends ApiError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

// 401 - Unauthorized (e.g., missing or invalid token)
export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

// 403 - Forbidden (e.g., user is authenticated but not authorized)
export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

// 404 - Not Found (e.g., resource does not exist)
export class NotFoundError extends ApiError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

// 409 - Conflict (e.g., email already exists)
export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

// 429 - Too Many Requests (for rate limiting)
export class TooManyRequestsError extends ApiError {
  constructor(message = "Too Many Requests") {
    super(message, 429);
  }
}

// 500 - Internal Server Error (e.g., database error)
export class InternalServerError extends ApiError {
  constructor(message = "Internal Server Error") {
    super(message, 500);
  }
}
