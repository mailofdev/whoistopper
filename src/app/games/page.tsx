import Link from "next/link";
import { GAMES } from "@/config/games";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Games", "Find creators by the games they listed on their profiles.", "/games");

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Games</h1>
        <p className="mt-3 max-w-2xl text-secondary">These pages list approved creators who tagged the game. A tag is what the creator submitted. It is not a partnership with the game.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <Link key={game.slug} className="glass rounded-3xl p-5 text-lg font-semibold hover:text-brand" href={`/games/${game.slug}`}>{game.name}</Link>
        ))}
      </div>
    </div>
  );
}
