export class ApiError extends Error {
  constructor(
    public statusCode = 500,
    message = "Internal Server Error",
    public isOperational = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad Request") {
    super(400, message);
  }
}
export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}
export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}
export class NotFoundError extends ApiError {
  constructor(message = "Not Found") {
    super(404, message);
  }
}
export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}

export const handleError = (err: unknown, res: import("express").Response) => {
  const error = err instanceof ApiError ? err : new ApiError();

  console.error(`[Error] ${error.statusCode} – ${error.message}`);
  if (error.statusCode === 500) {
    console.error(error.stack);
  }

  res.status(error.statusCode).json({
    success: false,
    status: error.statusCode,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};
