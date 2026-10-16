import { TermsDocument } from "@/content/terms-document";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Terms of Service",
  "Terms for browsing RankPush, claiming a paid rank, and completing checkout.",
  "/terms",
);

export default function Page() {
  return <TermsDocument />;
}
