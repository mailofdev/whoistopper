import { describe, expect, it } from "vitest";
import { LIST_PAGE_SIZE, canonicalPage, listHref, pageCount, pageItems, pageParamNeedsRedirect, paginate } from "@/lib/pagination";

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

  it("clamps a page past the end and only redirects dirty page params", () => {
    expect(canonicalPage(9, 40, LIST_PAGE_SIZE)).toBe(3);
    expect(paginate([1, 2, 3], 9, LIST_PAGE_SIZE)).toMatchObject({ items: [1, 2, 3], page: 1, total: 3 });
    expect(pageParamNeedsRedirect(undefined, 1)).toBe(false);
    expect(pageParamNeedsRedirect("1", 1)).toBe(true);
    expect(pageParamNeedsRedirect("2", 2)).toBe(false);
    expect(pageParamNeedsRedirect("9", 3)).toBe(true);
    expect(pageParamNeedsRedirect("02", 2)).toBe(true);
    expect(pageParamNeedsRedirect(undefined, 1, { dropPageSize: true })).toBe(true);
  });

  it("keeps the current page and both ends in the window without repeating a number", () => {
    for (let pages = 1; pages <= 30; pages += 1) {
      for (let page = 1; page <= pages; page += 1) {
        const items = pageItems(page, pages);
        const numbers = items.filter((item): item is number => item !== "gap");
        expect(new Set(numbers).size).toBe(numbers.length);
        expect(numbers[0]).toBe(1);
        expect(numbers.at(-1)).toBe(pages);
        expect(numbers).toContain(page);
        for (let index = 0; index < items.length; index += 1) {
          if (items[index] !== "gap") continue;
          const before = items[index - 1];
          const after = items[index + 1];
          expect(typeof before).toBe("number");
          expect(typeof after).toBe("number");
          expect((after as number) - (before as number)).toBeGreaterThan(1);
        }
      }
    }
  });
});
