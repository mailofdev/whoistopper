import { Article } from "@/content/articles";
import { pageMetadata } from "@/lib/metadata";
import { articles } from "@/content/articles";

export const metadata = pageMetadata(articles.about.title, articles.about.description, "/about");

export default function Page() {
  return <Article slug="about" />;
}
