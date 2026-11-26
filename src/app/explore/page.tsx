"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Nav } from "@/components/Nav";
import { FavoriteButton } from "@/components/FavoriteButton";
import { crafts } from "@/data/crafts";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("All states");
  const visible = useMemo(
    () =>
      crafts.filter(
        (c) =>
          `${c.name} ${c.category} ${c.region}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (state === "All states" || c.state === state),
      ),
    [query, state],
  );
  const states = [
    "All states",
    ...Array.from(new Set(crafts.map((c) => c.state))),
  ];
  return (
    <div className="shell">
      <Nav />
      <main className="container">
        <header className="page-head">
          <span className="eyebrow">Handicraft collection</span>
          <h1>Explore India&apos;s craft traditions</h1>
          <p className="section-lead">
            Discover patterns, regions and the ideas behind living traditions.
          </p>
        </header>
        <div className="toolbar">
          <label style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: 12,
                color: "#809087",
              }}
            />
            <input
              className="search"
              style={{ paddingLeft: 36 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search crafts or regions"
            />
          </label>
          <select
            className="search"
            style={{ minWidth: 180 }}
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            {states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {visible.length ? (
          <div className="grid-3">
            {visible.map((craft) => (
              <article className="craft-card" key={craft.slug}>
                <FavoriteButton slug={craft.slug}/>
                <Link href={`/explore/${craft.slug}`} className="craft-card-link">
                  <img className="craft-image" src={craft.image} alt={craft.name}/>
                  <div className="craft-body">
                  <span className="pill">{craft.category}</span>
                  <h3
                    style={{
                      fontFamily: "Georgia,serif",
                      fontSize: 21,
                      margin: "12px 0 5px",
                    }}
                  >
                    {craft.name}
                  </h3>
                  <p style={{ color: "#738078", fontSize: 13 }}>
                    {craft.region}, {craft.state}
                  </p>
                  <p style={{ fontSize: 12, color: "#3e6755", marginTop: 12 }}>
                    {craft.giStatus}
                  </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty panel">No crafts match this search.</div>
        )}
      </main>
    </div>
  );
}
