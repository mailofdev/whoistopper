import { RulesDocument } from "@/content/rules-document";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Rules",
  "How RankPush labels advertisements, orders organic listings, and prices fixed packages in INR.",
  "/rules",
);

export default function Page() {
  return <RulesDocument />;
}
