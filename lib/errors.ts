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
