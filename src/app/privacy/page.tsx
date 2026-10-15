import { Article } from "@/content/articles";
import { pageMetadata } from "@/lib/metadata";
import { articles } from "@/content/articles";

export const metadata = pageMetadata(articles.privacy.title, articles.privacy.description, "/privacy");

export default function Page() {
  return <Article slug="privacy" />;
}
