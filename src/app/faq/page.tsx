import { Article } from "@/content/articles";
import { pageMetadata } from "@/lib/metadata";
import { articles } from "@/content/articles";

export const metadata = pageMetadata(articles.faq.title, articles.faq.description, "/faq");

export default function Page() {
  return <Article slug="faq" />;
}
