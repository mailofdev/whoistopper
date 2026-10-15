import { Article } from "@/content/articles";
import { pageMetadata } from "@/lib/metadata";
import { articles } from "@/content/articles";

export const metadata = pageMetadata(articles.refunds.title, articles.refunds.description, "/refunds");

export default function Page() {
  return <Article slug="refunds" />;
}
