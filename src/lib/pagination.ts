/** Directory and search lists show this many rows, then a page control. */
export const LIST_PAGE_SIZE = 15;

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  if (!Number.isInteger(page) || page < 1) return 1;
  return Math.min(page, 10_000);
}

export function parsePageSize(value: string | string[] | undefined, fallback = 12): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const size = Number(raw);
  if (!Number.isInteger(size) || size < 1) return fallback;
  return Math.min(size, 48);
}

export function paginate<T>(items: T[], page: number, pageSize: number): PageResult<T> {
  const size = Math.max(1, pageSize);
  const safePage = canonicalPage(page, items.length, size);
  const start = (safePage - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: safePage,
    pageSize: size,
    total: items.length,
  };
}

/** The page that actually contains rows, never past the last page. */
export function canonicalPage(page: number, total: number, pageSize: number): number {
  return Math.min(Math.max(1, Math.trunc(page) || 1), pageCount(total, pageSize));
}

/**
 * Replace the URL when the page param is missing its canonical form, including `page=1`
 * and a page past the end. `dropPageSize` covers old links that still carry a page size.
 */
export function pageParamNeedsRedirect(
  raw: string | string[] | undefined,
  canonical: number,
  options?: { dropPageSize?: boolean },
): boolean {
  if (options?.dropPageSize) return true;
  if (raw === undefined) return false;
  const value = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  if (canonical <= 1) return true;
  return value !== String(canonical);
}

export function pageCount(total: number, pageSize: number): number {
  if (pageSize < 1) return 1;
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}

/** Page numbers for the control: `1  2  3  4  …  63`, collapsing the middle. */
export function pageItems(page: number, pages: number): Array<number | "gap"> {
  const count = Math.max(1, pages);
  const current = Math.min(Math.max(page, 1), count);
  if (count <= 6) return Array.from({ length: count }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, "gap", count];
  if (current >= count - 3) return [1, "gap", count - 3, count - 2, count - 1, count];
  return [1, "gap", current - 1, current, current + 1, "gap", count];
}

/** Board URL that keeps category and search, and omits `page` on the first page. */
export function listHref(path: string, input: { category?: string; query?: string; page?: number }): string {
  const params = new URLSearchParams();
  if (input.category && !path.startsWith("/categories/")) params.set("category", input.category);
  if (input.query) params.set("q", input.query);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
