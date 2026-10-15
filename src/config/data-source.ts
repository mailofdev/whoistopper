export interface DataSourceEnv {
  NODE_ENV?: string;
  NEXT_PUBLIC_USE_MOCK_DATA?: string;
}

/**
 * Mock data is a development aid.
 * Production always uses real services, even if the public flag is mis-set.
 * When the flag is omitted, mock mode is on only in development.
 */
export function resolveMockDataEnabled(env: DataSourceEnv): boolean {
  if (env.NODE_ENV === "production") return false;
  if (env.NEXT_PUBLIC_USE_MOCK_DATA === "true") return true;
  if (env.NEXT_PUBLIC_USE_MOCK_DATA === "false") return false;
  return env.NODE_ENV === "development";
}

export function isMockDataEnabled(): boolean {
  return resolveMockDataEnabled({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA,
  });
}
