"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import type { Craft } from "@/data/crafts";

export function FavoritesCollection({ items }: { items: Craft[] }) {
  const [favorites, setFavorites] = useState(items);

  if (!favorites.length) {
    return (
      <div className="panel empty">
        <Heart size={28} color="var(--palette-primary)"/>
        <h2>Nothing saved yet</h2>
        <p>Save crafts while exploring to build your personal collection.</p>
        <Link href="/explore" className="btn btn-primary">Browse crafts</Link>
      </div>
    );
  }

  return (
    <div className="grid-3 favorites-grid">
      {favorites.map(craft => (
        <article className="craft-card" key={craft.slug}>
          <FavoriteButton
            slug={craft.slug}
            initialSaved
            onSavedChange={saved => {
              if (!saved) setFavorites(current => current.filter(item => item.slug !== craft.slug));
            }}
          />
          <Link href={`/explore/${craft.slug}`} className="craft-card-link">
            <img className="craft-image" src={craft.image} alt={craft.name}/>
            <div className="craft-body">
              <span className="pill">{craft.category}</span>
              <h3 className="favorite-craft-title">{craft.name}</h3>
              <p>{craft.region}, {craft.state}</p>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
