import { Article } from "@/content/articles";
import { pageMetadata } from "@/lib/metadata";
import { articles } from "@/content/articles";

export const metadata = pageMetadata(articles.terms.title, articles.terms.description, "/terms");

export default function Page() {
  return <Article slug="terms" />;
}
