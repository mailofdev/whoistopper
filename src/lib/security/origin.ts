import { AppError } from "@/lib/errors";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    throw new AppError("This action must come from the site.", "csrf", 403);
  }
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AppError("This action must come from the site.", "csrf", 403);
  }
  if (originHost !== host) {
    throw new AppError("Cross-origin request blocked.", "csrf", 403);
  }
}
