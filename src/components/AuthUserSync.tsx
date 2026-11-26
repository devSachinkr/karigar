"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export function AuthUserSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const userId = user?.id;
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    let active = true;
    fetch("/api/auth/sync", { method: "POST" })
      .then(async response => {
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.error || "Profile sync failed.");
        }
        if (active) setSyncError("");
      })
      .catch(error => {
        console.error("Karigar account sync failed", error);
        if (active) setSyncError(error instanceof Error ? error.message : "Profile sync failed.");
      });
    return () => { active = false; };
  }, [isLoaded, isSignedIn, userId]);

  if (!syncError) return null;
  return <div className="sync-alert" role="alert">{syncError}</div>;
}
