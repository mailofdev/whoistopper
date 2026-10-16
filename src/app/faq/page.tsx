import { FaqDocument } from "@/content/faq-document";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "FAQ",
  "Common questions about RankPush: what a rank costs, which board it buys, what you can list, and when a payment is refunded.",
  "/faq",
);

export default function Page() {
  return <FaqDocument />;
}
