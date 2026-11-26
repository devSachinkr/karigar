import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Bookmark, Compass, History, ScanLine, Sparkles } from "lucide-react";
import { Nav } from "@/components/Nav";
import { ensureDatabaseUser } from "@/lib/database-user";
import { prisma } from "@/lib/prisma";
import { PageSkeleton } from "@/components/PageSkeleton";

export default function Dashboard() {
  return <Suspense fallback={<PageSkeleton title="Loading your workspace"/>}><DashboardContent/></Suspense>;
}

async function DashboardContent(){
  const user = await ensureDatabaseUser();
  if (!user) redirect("/sign-in");

  const [scanCount, favoriteCount, recentScans] = await Promise.all([
    prisma.scan.count({where:{userId:user.clerkId}}),
    prisma.favorite.count({where:{userId:user.id}}),
    prisma.scan.findMany({where:{userId:user.clerkId},orderBy:{createdAt:"desc"},take:4}),
  ]);
  const firstName = user.email.split("@")[0];

  return <div className="shell"><Nav/><main className="container">
    <header className="dashboard-hero page-head"><span className="eyebrow"><Sparkles size={14}/> Your creative space</span><h1>Welcome back, {firstName}</h1><p className="section-lead">Your craft discoveries, scans and saved traditions—together in one place.</p><Link href="/scan" className="btn btn-primary"><ScanLine size={17}/> Start a new scan</Link></header>
    <div className="dashboard-stats"><div className="dashboard-stat"><span>Saved scans</span><strong>{scanCount}</strong><History size={19}/></div><div className="dashboard-stat"><span>Favorite crafts</span><strong>{favoriteCount}</strong><Bookmark size={19}/></div><Link href="/explore" className="dashboard-stat stat-link"><span>Discover traditions</span><strong>Explore</strong><Compass size={19}/></Link></div>
    <section className="dashboard-section"><div className="section-heading-row"><div><span className="eyebrow">Your trail</span><h2 className="section-title">Recent scans</h2></div><Link className="text-link" href="/scan/history">View all <History size={15}/></Link></div>
      {recentScans.length ? <div className="history-grid">{recentScans.map(scan=><Link className="history-card" href="/scan/history" key={scan.id}><img src={scan.imageUrl} alt={scan.category || "Scanned handicraft"}/><div><span className="history-badge">{scan.status}</span><h3>{scan.category || "Analysis in progress"}</h3><p>{new Intl.DateTimeFormat("en-IN",{dateStyle:"medium"}).format(scan.createdAt)}</p></div></Link>)}</div> : <div className="empty panel dashboard-empty"><div className="intro-orbit"><ScanLine size={22}/><span/></div><h2 style={{fontFamily:"Georgia,serif",color:"var(--ink)"}}>Your first discovery is waiting</h2><p>Upload an image to start building your craft story.</p><Link href="/scan" className="btn btn-primary">Analyze an image</Link></div>}
    </section>
  </main></div>;
}
