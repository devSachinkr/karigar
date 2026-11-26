import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { ChatAssistant } from "@/components/ChatAssistant";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ensureDatabaseUser } from "@/lib/database-user";
import { prisma } from "@/lib/prisma";

export default function AssistantPage() {
  return (
    <div className="shell">
      <Nav/>
      <main className="container">
        <Suspense fallback={<PageSkeleton title="Loading your craft assistant"/>}>
          <AssistantContent/>
        </Suspense>
      </main>
    </div>
  );
}

async function AssistantContent() {
  const user = await ensureDatabaseUser();
  const conversations = user
    ? await prisma.chatConversation.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : [];
  const serialized = conversations.map(conversation => ({
    id: conversation.id,
    title: conversation.title,
    messages: conversation.messages.map(message => ({
      id: message.id,
      role: message.role,
      content: message.content,
    })),
  }));

  return <>
    <header className="page-head">
      <span className="eyebrow">Karigar assistant</span>
      <h1>Ask about craft</h1>
      <p className="section-lead">Learn about techniques and materials, with clear limits around photo-based authenticity claims.</p>
    </header>
    <ChatAssistant initialConversations={serialized}/>
  </>;
}
