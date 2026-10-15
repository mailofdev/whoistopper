const SENSITIVE = /key|secret|password|token|authorization|cookie|signature|otp/i;

function redact(value: unknown, key: string): unknown {
  if (SENSITIVE.test(key)) return "[redacted]";
  if (Array.isArray(value)) return value.map((item) => redact(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([child, childValue]) => [
        child,
        redact(childValue, child),
      ]),
    );
  }
  return value;
}

export function log(
  level: "info" | "warn" | "error",
  message: string,
  fields: Record<string, unknown> = {},
): void {
  const redacted = redact(fields, "");
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...(redacted && typeof redacted === "object" && !Array.isArray(redacted) ? (redacted as Record<string, unknown>) : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
