"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsDown, ThumbsUp } from "lucide-react";

export function ScanFeedbackForm({ scanId }: { scanId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState<"HELPFUL" | "NOT_HELPFUL" | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!rating || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch(`/api/scans/${encodeURIComponent(scanId)}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await response.json() as { error?: string; saved?: boolean };
      if (response.status === 401) {
        router.push("/sign-in");
        return;
      }
      if (!response.ok || !data.saved) throw new Error(data.error || "Could not save your feedback.");
      setStatus("Thank you — feedback saved.");
      setComment("");
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Could not save your feedback.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="feedback-form no-print">
      <div className="feedback-rating" aria-label="Rate this scan result">
        <button type="button" aria-pressed={rating === "HELPFUL"} onClick={() => setRating("HELPFUL")}><ThumbsUp size={14}/> Helpful</button>
        <button type="button" aria-pressed={rating === "NOT_HELPFUL"} onClick={() => setRating("NOT_HELPFUL")}><ThumbsDown size={14}/> Not quite</button>
      </div>
      <textarea className="search feedback-comment" value={comment} maxLength={1000} onChange={event => setComment(event.target.value)} placeholder="Optional note"/>
      <button className="btn btn-outline" type="button" onClick={() => void submit()} disabled={!rating || busy}>{busy ? "Saving…" : "Send feedback"}</button>
      {status && <span role="status" className="feedback-status">{status}</span>}
    </div>
  );
}
