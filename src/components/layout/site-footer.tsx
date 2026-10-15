import Link from "next/link";

const groups = [
  {
    title: "Discover",
    links: [
      ["Leaderboard", "/leaderboard"],
      ["Today", "/leaderboard/today"],
      ["Categories", "/categories"],
      ["Trending", "/trending"],
      ["New", "/new"],
    ],
  },
  {
    title: "List",
    links: [
      ["Submit a product", "/submit"],
      ["Rules", "/rules"],
      ["FAQ", "/faq"],
      ["Contact", "/contact"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["About", "/about"],
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
      ["Refunds", "/refunds"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-navy">{group.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-secondary">
              {group.links.map(([label, href]) => (
                <li key={href}><Link className="hover:text-navy" href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-line px-4 py-4 text-center text-xs text-secondary">
        Who&apos;s Topper shows paid placement separately from free listings. A rank is a verified INR bid, not a rating.
      </p>
    </footer>
  );
}
