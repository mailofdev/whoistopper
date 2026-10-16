import { TermsDocument } from "@/content/terms-document";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Terms of Service",
  "Terms for using RankPush. A paid rank is an advertisement priced in INR, not an auction.",
  "/terms",
);

export default function Page() {
  return <TermsDocument />;
}
