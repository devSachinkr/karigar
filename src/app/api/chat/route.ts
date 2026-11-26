import { NextResponse } from "next/server";
import { ensureDatabaseUser } from "@/lib/database-user";
import { prisma } from "@/lib/prisma";

function answerCraftQuestion(question: string) {
  const query = question.toLowerCase();
  if (query.includes("pashmina")) {
    return "Pashmina is traditionally associated with fine cashmere wool and Kashmir. Visual clues can include softness, drape and fine weave, but the material must be professionally tested.";
  }
  if (query.includes("banarasi")) {
    return "Banarasi textiles are associated with Varanasi and characteristic brocade, motifs and zari work. A visual analysis can identify similarities, not a definitive origin.";
  }
  if (query.includes("pottery")) {
    return "Pottery can be compared by glaze, geometry, surface texture and painted motifs. Firing, clay composition and manufacturing provenance need other evidence.";
  }
  return "I can explain common visual characteristics, but I cannot confirm origin or authenticity from a photo alone.";
}

export async function GET() {
  try {
    const user = await ensureDatabaseUser();
    if (!user) return NextResponse.json({ error: "Sign in to load saved conversations." }, { status: 401 });
    const conversations = await prisma.chatConversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Could not load craft assistant conversations", error);
    return NextResponse.json({ error: "Could not load your conversations." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await ensureDatabaseUser();
    if (!user) return NextResponse.json({ error: "Sign in to save assistant conversations." }, { status: 401 });
    const payload: unknown = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object" || !("message" in payload) || typeof payload.message !== "string") {
      return NextResponse.json({ error: "A message is required." }, { status: 400 });
    }
    const message = payload.message.trim();
    if (!message || message.length > 2000) {
      return NextResponse.json({ error: "Messages must be between 1 and 2,000 characters." }, { status: 400 });
    }
    const conversationId = "conversationId" in payload && typeof payload.conversationId === "string"
      ? payload.conversationId
      : null;
    if (conversationId) {
      const ownedConversation = await prisma.chatConversation.findFirst({
        where: { id: conversationId, userId: user.id },
        select: { id: true },
      });
      if (!ownedConversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    const response = answerCraftQuestion(message);
    const saved = await prisma.$transaction(async tx => {
      const conversation = conversationId
        ? await tx.chatConversation.findFirstOrThrow({
            where: { id: conversationId, userId: user.id },
            select: { id: true },
          })
        : await tx.chatConversation.create({
            data: { userId: user.id, title: message.slice(0, 80) || "New conversation" },
          });
      await tx.chatMessage.createMany({
        data: [
          { conversationId: conversation.id, role: "user", content: message },
          { conversationId: conversation.id, role: "assistant", content: response },
        ],
      });
      return conversation;
    });
    return NextResponse.json({ conversationId: saved.id, answer: response });
  } catch (error) {
    console.error("Could not save craft assistant message", error);
    return NextResponse.json({ error: "Could not save your message. Please try again." }, { status: 503 });
  }
}
