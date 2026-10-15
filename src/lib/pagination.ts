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
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total: items.length,
  };
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
