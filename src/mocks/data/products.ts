import type { ProductStatus } from "@/types/domain";

export interface SeedProduct {
  n: number;
  slug: string;
  name: string;
  host: string;
  short: string;
  full: string;
  categorySlug: string;
  owner: "ananya" | "rohan" | null;
  status: ProductStatus;
  verified: boolean;
  tags: string[];
  allTimePaise?: number;
  allTimeAt?: string;
  categoryPaise?: number;
  creator: string;
}

export function productId(n: number): string {
  return `30000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

export const seedProducts: SeedProduct[] = [
  { n: 1, slug: "nadi-payroll", name: "Nadi Payroll", host: "nadi-payroll.example", short: "Payroll for Indian SMEs that want PF and salary runs in one place.", full: "Nadi Payroll helps small teams run monthly salaries, payslips, and PF reminders without a large HR suite. The listing is fictional and used for product discovery.", categorySlug: "saas", owner: "ananya", status: "approved", verified: true, tags: ["payroll", "sme"], allTimePaise: 500_000, allTimeAt: "2026-09-01T08:00:00.000Z", creator: "Ananya Iyer" },
  { n: 2, slug: "chaileger", name: "ChaiLedger", host: "chaileger.example", short: "A lightweight expense book for studios and neighbourhood shops.", full: "ChaiLedger keeps daily expenses, vendor notes, and simple monthly summaries. Same all-time amount as Nadi Payroll, confirmed later, so it ranks second on a tie.", categorySlug: "fintech", owner: "ananya", status: "approved", verified: true, tags: ["expenses", "sme"], allTimePaise: 500_000, allTimeAt: "2026-09-01T09:00:00.000Z", creator: "Ananya Iyer" },
  { n: 3, slug: "kiln-ci", name: "Kiln CI", host: "kiln-ci.example", short: "Hosted continuous integration for small Indian engineering teams.", full: "Kiln CI runs tests on each push and keeps logs for a week. It is a fictional developer tool in the directory.", categorySlug: "developer-tools", owner: "rohan", status: "approved", verified: true, tags: ["ci", "devops"], allTimePaise: 250_000, allTimeAt: "2026-09-12T10:00:00.000Z", creator: "Rohan Deshmukh" },
  { n: 4, slug: "bazaarkit", name: "BazaarKit", host: "bazaarkit.example", short: "A storefront kit for D2C brands that sell in rupees.", full: "BazaarKit sets up catalogues, GST-labelled prices, and shipping notes. Paid placement on this board is a bid, not a review.", categorySlug: "commerce", owner: "rohan", status: "approved", verified: true, tags: ["d2c", "storefront"], allTimePaise: 100_000, allTimeAt: "2026-09-20T10:00:00.000Z", creator: "Rohan Deshmukh" },
  { n: 5, slug: "pathshala-live", name: "Pathshala Live", host: "pathshala-live.example", short: "Live classes and homework for independent tutors.", full: "Pathshala Live gives tutors a room link, attendance, and homework box. It is listed as a fictional education product.", categorySlug: "education", owner: "ananya", status: "approved", verified: true, tags: ["tutors", "classes"], allTimePaise: 9_900, allTimeAt: "2026-10-01T06:30:00.000Z", creator: "Ananya Iyer" },
  { n: 6, slug: "ghats-health", name: "Ghats Health", host: "ghats-health.example", short: "Appointment books for clinics in smaller towns.", full: "Ghats Health tracks visits and follow-ups for a single clinic. This free listing is not a paid rank.", categorySlug: "health", owner: "rohan", status: "approved", verified: true, tags: ["clinics"], creator: "Rohan Deshmukh" },
  { n: 7, slug: "monsoon-mail", name: "Monsoon Mail", host: "monsoon-mail.example", short: "Transactional email for apps that send OTPs and receipts.", full: "Monsoon Mail is a fictional email API with delivery logs and template previews.", categorySlug: "developer-tools", owner: "ananya", status: "approved", verified: true, tags: ["email", "api"], creator: "Ananya Iyer" },
  { n: 8, slug: "saffron-crm", name: "Saffron CRM", host: "saffron-crm.example", short: "A distributor CRM with beat plans for field sales.", full: "Saffron CRM stores outlets, visits, and order notes for wholesale teams. It holds a category bid on SaaS.", categorySlug: "saas", owner: "rohan", status: "approved", verified: true, tags: ["crm", "sales"], categoryPaise: 75_000, creator: "Rohan Deshmukh" },
  { n: 9, slug: "deccan-deploy", name: "Deccan Deploy", host: "deccan-deploy.example", short: "Preview environments for frontend teams.", full: "Deccan Deploy builds a preview for every pull request. The product is fictional.", categorySlug: "developer-tools", owner: "ananya", status: "approved", verified: true, tags: ["preview", "devops"], creator: "Ananya Iyer" },
  { n: 10, slug: "lotus-lms", name: "Lotus LMS", host: "lotus-lms.example", short: "Course hosting for coaching centres.", full: "Lotus LMS organises batches, recorded classes, and quizzes for coaching centres.", categorySlug: "education", owner: "rohan", status: "approved", verified: true, tags: ["courses"], creator: "Rohan Deshmukh" },
  { n: 11, slug: "amber-invoice", name: "Amber Invoice", host: "amber-invoice.example", short: "GST-labelled invoices for freelancers and studios.", full: "Amber Invoice creates simple tax invoices and payment reminders. It does not file returns.", categorySlug: "fintech", owner: "ananya", status: "approved", verified: true, tags: ["invoices", "gst"], creator: "Ananya Iyer" },
  { n: 12, slug: "coromandel-cart", name: "Coromandel Cart", host: "coromandel-cart.example", short: "Catalogue links for coastal home businesses.", full: "Coromandel Cart publishes a shareable catalogue and collects enquiries.", categorySlug: "commerce", owner: "rohan", status: "approved", verified: true, tags: ["catalogue"], creator: "Rohan Deshmukh" },
  { n: 13, slug: "nilgiri-notes", name: "Nilgiri Notes", host: "nilgiri-notes.example", short: "A quiet newsletter editor for independent writers.", full: "Nilgiri Notes focuses on writing, scheduling, and a plain archive.", categorySlug: "media", owner: "ananya", status: "approved", verified: true, tags: ["newsletter"], creator: "Ananya Iyer" },
  { n: 14, slug: "ghats-watch", name: "Western Ghats Watch", host: "ghats-watch.example", short: "Community rainfall notes for the western ghats.", full: "Western Ghats Watch collects local rainfall observations. It is not an official weather service.", categorySlug: "climate", owner: "rohan", status: "approved", verified: true, tags: ["rainfall"], creator: "Rohan Deshmukh" },
  { n: 15, slug: "tankertrack", name: "TankerTrack", host: "tankertrack.example", short: "Dispatch board for water tanker operators.", full: "TankerTrack is waiting for review. It should not appear on public leaderboards.", categorySlug: "saas", owner: "ananya", status: "pending_review", verified: true, tags: ["logistics"], creator: "Ananya Iyer" },
  { n: 16, slug: "indus-forms", name: "Indus Forms", host: "indus-forms.example", short: "Offline-friendly forms for field staff.", full: "Indus Forms is waiting for ownership verification before review.", categorySlug: "saas", owner: "rohan", status: "pending_verification", verified: false, tags: ["forms"], creator: "Rohan Deshmukh" },
  { n: 17, slug: "malabar-metrics", name: "Malabar Metrics", host: "malabar-metrics.example", short: "A draft analytics sketch for indie app makers.", full: "Malabar Metrics is still a draft. Only the owner should see it in the dashboard.", categorySlug: "developer-tools", owner: "ananya", status: "draft", verified: false, tags: ["analytics"], creator: "Ananya Iyer" },
  { n: 18, slug: "thar-solar", name: "Thar Solar Desk", host: "thar-solar.example", short: "Rooftop solar survey worksheets for installers.", full: "Thar Solar Desk was rejected in this fictional dataset because the description was incomplete.", categorySlug: "climate", owner: "rohan", status: "rejected", verified: false, tags: ["solar"], creator: "Rohan Deshmukh" },
  { n: 19, slug: "rangoli-studio", name: "Rangoli Studio", host: "rangoli-studio.example", short: "Design briefs for neighbourhood print shops.", full: "Rangoli Studio is suspended in the sample data and hidden from public pages.", categorySlug: "media", owner: "ananya", status: "suspended", verified: true, tags: ["design"], creator: "Ananya Iyer" },
  { n: 20, slug: "kodagu-club", name: "Kodagu Club", host: "kodagu-club.example", short: "A coffee subscription club that has not been claimed.", full: "Kodagu Club is an approved unclaimed listing. A registered user can request ownership.", categorySlug: "commerce", owner: null, status: "approved", verified: false, tags: ["coffee"], creator: "Kodagu Club" },
  { n: 21, slug: "metrodesk", name: "MetroDesk", host: "metrodesk.example", short: "Desk booking for neighbourhood work rooms.", full: "MetroDesk was removed from the public directory in the sample data.", categorySlug: "saas", owner: "rohan", status: "removed", verified: true, tags: ["coworking"], creator: "Rohan Deshmukh" },
  { n: 22, slug: "loomfield", name: "Loomfield", host: "loomfield.example", short: "Inventory notes for handloom cooperatives.", full: "Loomfield had a ranking payment that was refunded. It is a free listing again.", categorySlug: "commerce", owner: "ananya", status: "approved", verified: true, tags: ["handloom"], creator: "Ananya Iyer" },
  { n: 23, slug: "spiceroute", name: "SpiceRoute Books", host: "spiceroute.example", short: "A trader ledger for spice wholesalers.", full: "SpiceRoute Books appears on today's sample leaderboard when the daily board is generated.", categorySlug: "fintech", owner: "rohan", status: "approved", verified: true, tags: ["ledger"], creator: "Rohan Deshmukh" },
  { n: 24, slug: "vetri-links", name: "Vetri Links", host: "vetri-links.example", short: "Payment links for neighbourhood stores.", full: "Vetri Links is fictional and is not a bank or a UPI app. It is here to exercise daily ranking.", categorySlug: "fintech", owner: "ananya", status: "approved", verified: true, tags: ["payments"], creator: "Ananya Iyer" },
];
