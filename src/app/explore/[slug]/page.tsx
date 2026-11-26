import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { FavoriteButton } from "@/components/FavoriteButton";
import { crafts } from "@/data/crafts";

export function generateStaticParams(){ return crafts.map(c=>({slug:c.slug})); }

export default async function CraftDetail({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const craft=crafts.find(c=>c.slug===slug) ?? crafts[0];
  return <div className="shell"><Nav/><main className="container">
    <div className="craft-back"><Link href="/explore"><ArrowLeft size={16}/> Back to collection</Link></div>
    <div className="result-layout"><img src={craft.image} alt={craft.name} className="craft-detail-image"/><section className="panel craft-detail-panel">
      <span className="pill">{craft.category}</span><h1 className="craft-detail-title">{craft.name}</h1><p className="craft-detail-region">{craft.region} · {craft.state}</p><p className="craft-detail-description">{craft.description}</p>
      <div className="craft-detail-columns"><div><strong>Techniques</strong>{craft.techniques.map(x=><p key={x}>{x}</p>)}</div><div><strong>Common materials</strong>{craft.materials.map(x=><p key={x}>{x}</p>)}</div></div>
      <div className="craft-detail-actions"><span className="detail-favorite"><FavoriteButton slug={craft.slug}/></span><Link href="/scan" className="btn btn-primary">Visual check</Link></div>
    </section></div>
  </main></div>;
}
