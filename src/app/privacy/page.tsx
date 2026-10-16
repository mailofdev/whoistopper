import { PrivacyDocument } from "@/content/privacy-document";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Privacy Policy",
  "How RankPush, as a data fiduciary in India, handles listing data, payments, and account information.",
  "/privacy",
);

export default function Page() {
  return <PrivacyDocument />;
}
