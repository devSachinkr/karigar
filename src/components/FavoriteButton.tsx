"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

export function FavoriteButton({ slug, initialSaved = false, onSavedChange }: { slug: string; initialSaved?: boolean; onSavedChange?: (saved: boolean) => void }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialSaved) return;
    let active = true;
    fetch("/api/favorites")
      .then(async response => {
        if (!response.ok) return;
        const data = await response.json() as { slugs?: string[] };
        if (active) setSaved(data.slugs?.includes(slug) ?? false);
      })
      .catch(reason => console.error("Could not check saved craft status", reason));
    return () => { active = false; };
  }, [initialSaved, slug]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/favorites", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await response.json() as { error?: string; saved?: boolean };
      if (response.status === 401) {
        router.push("/sign-in");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not update your saved crafts.");
      const nextSaved = Boolean(data.saved);
      setSaved(nextSaved);
      onSavedChange?.(nextSaved);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update your saved crafts.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`favorite-toggle ${saved ? "is-saved" : ""}`}
      aria-label={saved ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={saved}
      title={error || (saved ? "Remove from favorites" : "Add to favorites")}
      disabled={busy}
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();
        void toggle();
      }}
    >
      <Heart size={17} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
