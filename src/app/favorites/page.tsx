import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { FavoritesCollection } from "@/components/FavoritesCollection";
import { PageSkeleton } from "@/components/PageSkeleton";
import { crafts } from "@/data/crafts";
import { ensureDatabaseUser } from "@/lib/database-user";
import { prisma } from "@/lib/prisma";

export default function FavoritesPage() {
  return (
    <div className="shell">
      <Nav/>
      <main className="container">
        <Suspense fallback={<PageSkeleton title="Loading your favorites"/>}>
          <FavoriteContent/>
        </Suspense>
      </main>
    </div>
  );
}

async function FavoriteContent() {
  const user = await ensureDatabaseUser();
  if (!user) redirect("/sign-in");
  const saved = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { handicraft: { select: { slug: true } } },
    orderBy: { id: "desc" },
  });
  const savedSlugs = new Set(saved.map(item => item.handicraft.slug));
  const items = crafts.filter(craft => savedSlugs.has(craft.slug));

  return (
    <>
      <header className="page-head">
        <span className="eyebrow">Saved collection</span>
        <h1>Favorites</h1>
        <p className="section-lead">Your saved craft traditions, gathered in one place.</p>
      </header>
      <FavoritesCollection items={items}/>
    </>
  );
}
