"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, Send } from "lucide-react";

type ConversationMessage = { id: string; role: string; content: string };
type Conversation = { id: string; title: string; messages: ConversationMessage[] };

export function ChatAssistant({ initialConversations }: { initialConversations: Conversation[] }) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [conversationId, setConversationId] = useState<string | null>(initialConversations[0]?.id ?? null);
  const [messages, setMessages] = useState<ConversationMessage[]>(initialConversations[0]?.messages ?? []);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    const message = text.trim();
    if (!message || busy) return;
    setText("");
    setError("");
    setMessages(current => [...current, { id: `pending-${Date.now()}`, role: "user", content: message }]);
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
      });
      const data = await response.json() as { error?: string; answer?: string; conversationId?: string };
      if (response.status === 401) {
        router.push("/sign-in");
        return;
      }
      if (!response.ok || !data.answer || !data.conversationId) {
        throw new Error(data.error || "Could not send your message.");
      }
      const assistantMessage = { id: `reply-${Date.now()}`, role: "assistant", content: data.answer };
      const nextId = data.conversationId;
      setConversationId(nextId);
      setMessages(current => [...current, assistantMessage]);
      setConversations(current => {
        const existing = current.find(conversation => conversation.id === nextId);
        const updated: Conversation = existing
          ? { ...existing, messages: [...existing.messages, { id: `user-${Date.now()}`, role: "user", content: message }, assistantMessage] }
          : { id: nextId, title: message.slice(0, 80), messages: [{ id: `user-${Date.now()}`, role: "user", content: message }, assistantMessage] };
        return [updated, ...current.filter(conversation => conversation.id !== nextId)];
      });
    } catch (reason) {
      setMessages(current => current.filter(item => !item.id.startsWith("pending-")));
      setText(message);
      setError(reason instanceof Error ? reason.message : "Could not send your message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="assistant-layout">
      <aside className="panel assistant-sidebar">
        <button className="btn btn-outline assistant-new" onClick={() => { setConversationId(null); setMessages([]); setError(""); }}>
          <MessageSquarePlus size={16}/> New conversation
        </button>
        <p className="eyebrow">Saved conversations</p>
        {conversations.map(conversation => (
          <button
            className={`conversation-link ${conversationId === conversation.id ? "is-active" : ""}`}
            key={conversation.id}
            onClick={() => { setConversationId(conversation.id); setMessages(conversation.messages); setError(""); }}
          >
            {conversation.title}
          </button>
        ))}
        {!conversations.length && <p className="assistant-help">Your questions and answers will be saved here after you sign in.</p>}
      </aside>
      <section className="panel assistant-panel">
        <div className="assistant-messages" aria-live="polite">
          {!messages.length && <div className="assistant-welcome"><span className="eyebrow">Karigar assistant</span><h2>Ask about a craft tradition</h2><p>Explore craft materials, techniques, GI information or how to interpret visual clues.</p></div>}
          {messages.map((message, index) => (
            <div className="assistant-message-row" key={message.id || `${message.role}-${index}`} data-role={message.role}>
              <div className={`assistant-bubble ${message.role === "user" ? "is-user" : ""}`}>{message.content}</div>
            </div>
          ))}
          {busy && <div className="assistant-bubble assistant-typing" role="status">Thinking through the craft details…</div>}
        </div>
        {error && <p className="scan-error" role="alert">{error}</p>}
        <form className="assistant-composer" onSubmit={event => { event.preventDefault(); void send(); }}>
          <input className="search" maxLength={2000} value={text} onChange={event => setText(event.target.value)} placeholder="Ask a question..." aria-label="Ask the Karigar assistant"/>
          <button type="submit" className="btn btn-primary" disabled={busy || !text.trim()} aria-label="Send message"><Send size={16}/></button>
        </form>
      </section>
    </div>
  );
}
