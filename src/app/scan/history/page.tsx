import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { ensureDatabaseUser } from "@/lib/database-user";
import { prisma } from "@/lib/prisma";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ScanFeedbackForm } from "@/components/ScanFeedbackForm";

export default function HistoryPage() {
  return <Suspense fallback={<PageSkeleton title="Loading your scans"/>}><HistoryContent/></Suspense>;
}

async function HistoryContent(){
  const user = await ensureDatabaseUser();
  if (!user) redirect("/sign-in");
  const scans = await prisma.scan.findMany({
    where:{userId:user.clerkId},
    include:{result:true},
    orderBy:{createdAt:"desc"},
    take:50,
  });

  return <div className="shell"><Nav/><main className="container"><header className="page-head"><span className="eyebrow">Your collection of moments</span><h1>Scan history</h1><p className="section-lead">Your uploaded images and their analysis are saved privately to your account.</p></header>
    {scans.length ? <div className="history-grid">{scans.map(scan=><article className="history-card history-record" key={scan.id}><img src={scan.imageUrl} alt={scan.category || "Scanned handicraft"}/><div><span className="history-badge">{scan.status}</span><h3>{scan.category || "Analysis pending"}</h3><p>{new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short"}).format(scan.createdAt)}</p>{scan.result && typeof scan.result.result === "object" && scan.result.result !== null && "explanation" in scan.result.result && <p className="history-explanation">{String(scan.result.result.explanation)}</p>}</div><ScanFeedbackForm scanId={scan.id}/></article>)}</div>
    : <div className="panel empty"><h2 style={{fontFamily:"Georgia,serif",color:"var(--ink)"}}>No scans yet</h2><p>Analyze a craft and it will be saved here with its Cloudinary image and result.</p><Link href="/scan" className="btn btn-primary">Start a scan</Link></div>}
  </main></div>;
}
