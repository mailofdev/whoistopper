import { RulesDocument } from "@/content/rules-document";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Rules",
  "How RankPush orders a paid public leaderboard. Rank is the amount you pay in INR. It is a labelled advertisement, not an auction.",
  "/rules",
);

export default function Page() {
  return <RulesDocument />;
}
