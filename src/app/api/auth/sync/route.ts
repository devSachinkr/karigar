import { NextResponse } from "next/server";
import { ensureDatabaseUser } from "@/lib/database-user";

export async function POST() {
  try {
    const user = await ensureDatabaseUser();
    if (!user) return NextResponse.json({ error: "Sign in to sync your account." }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Clerk user database sync failed", error);
    return NextResponse.json(
      { error: "We couldn't create your Karigar profile. Please retry or contact support." },
      { status: 503 }
    );
  }
}
