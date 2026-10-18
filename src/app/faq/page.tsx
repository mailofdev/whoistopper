import { FaqDocument } from "@/content/faq-document";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "FAQ",
  "What RankPush is, what an advertising package includes, and how refunds work.",
  "/faq",
);

export default function Page() {
  return <FaqDocument />;
}
