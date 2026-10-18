/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pagination } from "@/components/ui/primitives";
import { LIST_PAGE_SIZE } from "@/lib/pagination";

describe("Pagination", () => {
  it("renders page numbers under a multi-page list and links each page", () => {
    const { container } = render(
      <Pagination
        page={1}
        total={3129}
        pageSize={LIST_PAGE_SIZE}
        hrefFor={(page) => (page === 1 ? "/" : `/?page=${page}`)}
      />,
    );
    const nav = container.querySelector("nav");
    expect(nav?.getAttribute("aria-label")).toBe("Pagination");
    expect(nav?.textContent).toContain("1 - 15 of 3,129");
    const links = [...container.querySelectorAll("a")].map((anchor) => [anchor.getAttribute("aria-label"), anchor.getAttribute("href")]);
    expect(links).toEqual([
      ["Page 2", "/?page=2"],
      ["Page 3", "/?page=3"],
      ["Page 4", "/?page=4"],
      ["Page 209", "/?page=209"],
      ["Next page", "/?page=2"],
    ]);
    expect(container.querySelector("[aria-current='page']")?.textContent).toBe("1");
  });

  it("hides the control when one page covers the list", () => {
    const { container } = render(<Pagination page={1} total={15} pageSize={LIST_PAGE_SIZE} hrefFor={() => "/"} />);
    expect(container.querySelector("nav")).toBeNull();
  });
});
