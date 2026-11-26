import { NextResponse } from "next/server";
import { ensureDatabaseUser } from "@/lib/database-user";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ scanId: string }> },
) {
  try {
    const user = await ensureDatabaseUser();
    if (!user)
      return NextResponse.json(
        { error: "Sign in to leave scan feedback." },
        { status: 401 },
      );
    const { scanId } = await params;
    const payload: unknown = await request.json().catch(() => null);
    if (
      !payload ||
      typeof payload !== "object" ||
      !("rating" in payload) ||
      !["HELPFUL", "NOT_HELPFUL"].includes(String(payload.rating))
    ) {
      return NextResponse.json(
        { error: "Choose whether this result was helpful." },
        { status: 400 },
      );
    }
    const comment =
      "comment" in payload && typeof payload.comment === "string"
        ? payload.comment.trim()
        : "";
    if (comment.length > 1000)
      return NextResponse.json(
        { error: "Feedback must be 1,000 characters or fewer." },
        { status: 400 },
      );

    const scan = await prisma.scan.findFirst({
      where: { id: scanId, userId: user.clerkId },
      select: { id: true },
    });
    if (!scan)
      return NextResponse.json({ error: "Scan not found." }, { status: 404 });
    const feedback = await prisma.scanFeedback.create({
      data: {
        scanId: scan.id,
        rating: String(payload.rating),
        comment: comment || null,
      },
    });
    return NextResponse.json({ saved: true, feedbackId: feedback.id });
  } catch (error) {
    console.error("Could not save scan feedback", error);
    return NextResponse.json(
      { error: "Could not save your feedback." },
      { status: 503 },
    );
  }
}
