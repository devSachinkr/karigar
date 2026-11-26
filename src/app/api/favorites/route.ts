import { NextResponse } from "next/server";
import { ensureDatabaseUser } from "@/lib/database-user";
import { ensureCraftRecord } from "@/lib/craft-record";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await ensureDatabaseUser();
    if (!user) return NextResponse.json({ error: "Sign in to view your saved crafts." }, { status: 401 });
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      select: { handicraft: { select: { slug: true } } },
    });
    return NextResponse.json({ slugs: favorites.map(favorite => favorite.handicraft.slug) });
  } catch (error) {
    console.error("Could not load saved crafts", error);
    return NextResponse.json({ error: "Could not load saved crafts." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await ensureDatabaseUser();
    if (!user) return NextResponse.json({ error: "Sign in to save crafts." }, { status: 401 });
    const payload: unknown = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object" || !("slug" in payload) || typeof payload.slug !== "string") {
      return NextResponse.json({ error: "A craft slug is required." }, { status: 400 });
    }

    const craft = await prisma.handicraft.findUnique({ where: { slug: payload.slug }, select: { id: true } })
      ?? await ensureCraftRecord(payload.slug);
    if (!craft) return NextResponse.json({ error: "That craft is not available to save yet." }, { status: 404 });

    await prisma.favorite.upsert({
      where: { userId_handicraftId: { userId: user.id, handicraftId: craft.id } },
      create: { userId: user.id, handicraftId: craft.id },
      update: {},
    });
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Could not save craft", error);
    return NextResponse.json({ error: "Could not save this craft." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await ensureDatabaseUser();
    if (!user) return NextResponse.json({ error: "Sign in to manage saved crafts." }, { status: 401 });
    const payload: unknown = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object" || !("slug" in payload) || typeof payload.slug !== "string") {
      return NextResponse.json({ error: "A craft slug is required." }, { status: 400 });
    }
    await prisma.favorite.deleteMany({
      where: { userId: user.id, handicraft: { slug: payload.slug } },
    });
    return NextResponse.json({ saved: false });
  } catch (error) {
    console.error("Could not remove saved craft", error);
    return NextResponse.json({ error: "Could not remove this craft." }, { status: 503 });
  }
}
