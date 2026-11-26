import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { Nav } from "@/components/Nav";
import { PageSkeleton } from "@/components/PageSkeleton";
import { crafts } from "@/data/crafts";
import { prisma } from "@/lib/prisma";

type GIRecord = { status: string; registration: string | null; origin: string | null; sourceUrl: string | null };

export default function GIPage() {
  return (
    <div className="shell">
      <Nav/>
      <main className="container">
        <Suspense fallback={<PageSkeleton title="Loading GI craft records"/>}>
          <GIContent/>
        </Suspense>
      </main>
    </div>
  );
}

async function GIContent() {
  const records = await prisma.handicraft.findMany({
    select: {
      slug: true,
      gi: { select: { status: true, registration: true, origin: true, sourceUrl: true } },
    },
  });
  const recordsBySlug = new Map<string, GIRecord | null>(records.map(record => [record.slug, record.gi]));

  return (
    <>
      <header className="page-head">
        <span className="eyebrow">GI knowledge</span>
        <h1>Geographical indications</h1>
        <p className="section-lead">Explore place-based craft knowledge. Registration status should always be confirmed against official sources.</p>
      </header>
      <div className="grid-3">
        {crafts.map(craft => {
          const record = recordsBySlug.get(craft.slug);
          const status = record?.status === "REGISTERED" ? "GI registered" : record?.status ?? craft.giStatus;
          return (
            <article className="craft-card" key={craft.slug}>
              <img className="craft-image" src={craft.image} alt={craft.name}/>
              <div className="craft-body">
                <BadgeCheck size={18} color="var(--palette-primary)"/>
                <h3 className="favorite-craft-title">{craft.name}</h3>
                <p className="gi-origin">{record?.origin || `${craft.region}, ${craft.state}`}</p>
                <p>{status}{record?.registration ? ` · ${record.registration}` : ""}</p>
                {record?.sourceUrl && <a className="text-link gi-source" href={record.sourceUrl} target="_blank" rel="noreferrer">Official source <ArrowUpRight size={14}/></a>}
                <Link href={`/explore/${craft.slug}`} className="text-link">Learn more <ArrowUpRight size={14}/></Link>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
