export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export class ConfigurationError extends AppError {
  constructor(
    message = "The directory database is not connected. Add the Supabase URL, anon key, and service role key.",
  ) {
    super(message, "not_configured", 503);
  }
}

export class PaymentIntegrityError extends AppError {
  constructor(message: string) {
    super(message, "payment_integrity", 409);
  }
}

export function toPublicError(error: unknown): { message: string; code: string; status: number } {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code, status: error.status };
  }
  return { message: "Something went wrong. Please try again.", code: "internal", status: 500 };
}
