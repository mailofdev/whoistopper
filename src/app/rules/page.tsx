import { Article } from "@/content/articles";
import { pageMetadata } from "@/lib/metadata";
import { articles } from "@/content/articles";

export const metadata = pageMetadata(articles.rules.title, articles.rules.description, "/rules");

export default function Page() {
  return <Article slug="rules" />;
}
