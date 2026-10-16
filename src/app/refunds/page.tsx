import { RefundsDocument } from "@/content/refunds-document";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Refunds",
  "When a RankPush ranking payment is final, and when an unapplied payment is refunded through Razorpay.",
  "/refunds",
);

export default function Page() {
  return <RefundsDocument />;
}
