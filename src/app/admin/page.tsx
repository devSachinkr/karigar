import Link from "next/link";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { PageSkeleton } from "@/components/PageSkeleton";
import { AdminDataManager } from "@/components/AdminDataManager";
import { ensureDatabaseUser } from "@/lib/database-user";
import { prisma } from "@/lib/prisma";

export default function AdminPage() {
  return <AdminShell><Suspense fallback={<PageSkeleton title="Loading administration"/>}><AdminContent/></Suspense></AdminShell>;
}

async function AdminContent() {
  const user = await ensureDatabaseUser();
  if (!user) {
    return <div className="panel empty"><h2>Sign in required</h2><p>Sign in with an administrator account to view platform data.</p><Link className="btn btn-primary" href="/sign-in">Sign in</Link></div>;
  }
  if (user.role !== "ADMIN") {
    return <div className="panel empty"><h2>Administrator access required</h2><p>Your account does not have permission to view platform management data.</p><Link className="btn btn-outline" href="/dashboard">Return to dashboard</Link></div>;
  }

  await prisma.adminActivity.create({
    data: { action: "VIEW_ADMIN_OVERVIEW", details: { actorId: user.id } },
  });
  return (
    <>
      <AdminDataManager />
      <p className="admin-note">
        Reference-image matching stays disabled until verified reference images
        and compatible embeddings are available.
      </p>
    </>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return <div className="shell"><Nav/><main className="container">{children}</main></div>;
}
