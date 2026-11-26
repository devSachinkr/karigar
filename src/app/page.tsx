import Link from "next/link";
import { ArrowRight, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { Nav } from "@/components/Nav";
import { CraftScene3D } from "@/components/CraftScene3D";
import { crafts } from "@/data/crafts";

export default function Home() {
  return (
    <div className="shell">
      <Nav />
      <main>
        <div className="container hero">
          <div>
            <span className="eyebrow"><Sparkles size={14}/>Preserving living heritage</span>
            <h1>See the story in every <em>craft.</em></h1>
            <p className="hero-copy">Explore India&apos;s remarkable handicrafts and compare visual characteristics with reference collections. A thoughtful starting point for curiosity, not a guarantee of authenticity.</p>
            <div className="hero-actions">
              <Link href="/scan" className="btn btn-primary"><ScanLine size={18}/> Analyze a craft</Link>
              <Link href="/explore" className="btn btn-outline">Explore collection <ArrowRight size={17}/></Link>
            </div>
          </div>
          <div className="hero-visual hero-3d">
            <div className="hero-3d-glow"/>
            <CraftScene3D/>
            <div className="visual-card"><span className="pill">Craft, in motion</span><p style={{fontFamily:"Georgia,serif",fontSize:18,margin:"10px 0 4px"}}>Patterns hold memory</p><p style={{fontSize:12,color:"#6c7974",margin:0}}>Region • technique • material</p></div>
          </div>
        </div>

        <section className="section" id="featured">
          <div className="container">
            <span className="eyebrow">From the collection</span>
            <h2 className="section-title">Traditions worth knowing</h2>
            <p className="section-lead">A curated introduction to remarkable crafts and the communities that sustain them.</p>
            <div className="grid-3">
              {crafts.slice(0,3).map(craft => (
                <Link href={`/explore/${craft.slug}`} className="craft-card" key={craft.slug}>
                  <img className="craft-image" src={craft.image} alt={craft.name}/>
                  <div className="craft-body"><span className="pill">{craft.category}</span><h3 style={{fontFamily:"Georgia,serif",fontSize:21,margin:"12px 0 5px"}}>{craft.name}</h3><p style={{color:"#738078",fontSize:13}}>{craft.region}, {craft.state}</p></div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="how-it-works" style={{background:"#edf1eb"}}>
          <div className="container">
            <span className="eyebrow">How it works</span><h2 className="section-title">From image to insight</h2>
            <div className="steps">
              <div className="step"><div className="step-number">1</div><h3>Upload a craft</h3><p>Add a clear, well-lit image in JPG, PNG or WEBP format.</p></div>
              <div className="step"><div className="step-number">2</div><h3>Visual analysis</h3><p>When configured, the AI service examines visual patterns and compares embeddings.</p></div>
              <div className="step"><div className="step-number">3</div><h3>Learn with context</h3><p>Review likely characteristics, limitations and relevant cultural information.</p></div>
            </div>
          </div>
        </section>

        <section className="section"><div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:30}}>
          <div><span className="eyebrow"><ShieldCheck size={14}/>Responsible by design</span><h2 className="section-title">Curiosity, with context</h2><p className="section-lead">Karigar never presents a photo alone as proof of authenticity. Material, provenance and making processes require expert and physical verification.</p></div>
          <Link href="/scan" className="btn btn-primary">Start a visual check <ArrowRight size={17}/></Link>
        </div></section>
      </main>
      <footer className="footer"><div className="container" style={{display:"flex",justifyContent:"space-between"}}><span className="brand" style={{color:"#fff"}}>Karigar</span><span style={{fontSize:13}}>Visual education for living craft traditions</span></div></footer>
    </div>
  );
}
