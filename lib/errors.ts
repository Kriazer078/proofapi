/** Invalid input from the caller. Maps to HTTP 400. `code` lets the interface show the message in the viewer's language. */
export class ValidationError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Requested entity does not exist. Maps to HTTP 404. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/** The chain rejected or could not process a write. */
export class ChainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChainError";
  }
}

/** The caller may not do this to this resource. Maps to HTTP 403. */
export class ForbiddenError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Too many requests in the current window. Maps to HTTP 429. */
export class RateLimitError extends Error {
  constructor(
    message = "Too many certificates from this address. Please try again in an hour.",
    readonly code = "rate_limited",
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

/** The AI provider could not answer (quota, outage, malformed reply). Maps to HTTP 503. */
export class AIUnavailableError extends Error {
  readonly code = "ai_unavailable";
  constructor(message = "The AI service is busy right now. Please try again in a minute.") {
    super(message);
    this.name = "AIUnavailableError";
  }
}

/** Missing or invalid credentials. Maps to HTTP 401. */
export class UnauthorizedError extends Error {
  constructor(
    message = "This API key isn't valid. Check it in the console or create a new one.",
    readonly code = "invalid_key",
  ) {
    super(message);
    this.name = "UnauthorizedError";
  }
}
