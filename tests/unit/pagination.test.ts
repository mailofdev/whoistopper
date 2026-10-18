import { describe, expect, it } from "vitest";
import { LIST_PAGE_SIZE, listHref, pageCount, pageItems, paginate } from "@/lib/pagination";

describe("list pagination", () => {
  it("uses 15 rows per page", () => {
    const page = paginate(Array.from({ length: 40 }, (_, index) => index + 1), 2, LIST_PAGE_SIZE);
    expect(LIST_PAGE_SIZE).toBe(15);
    expect(page.items).toEqual([16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
    expect(pageCount(3129, LIST_PAGE_SIZE)).toBe(209);
  });

  it("collapses page numbers the way the pager is drawn", () => {
    expect(pageItems(1, 63)).toEqual([1, 2, 3, 4, "gap", 63]);
    expect(pageItems(30, 63)).toEqual([1, "gap", 29, 30, 31, "gap", 63]);
    expect(pageItems(63, 63)).toEqual([1, "gap", 60, 61, 62, 63]);
    expect(pageItems(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("builds board links and drops the first page from the query", () => {
    expect(listHref("/", { page: 1 })).toBe("/");
    expect(listHref("/", { page: 2 })).toBe("/?page=2");
    expect(listHref("/", { category: "developer-tools", query: "editor", page: 3 })).toBe("/?category=developer-tools&q=editor&page=3");
    expect(listHref("/categories/developer-tools", { category: "developer-tools", page: 2 })).toBe("/categories/developer-tools?page=2");
  });
});
