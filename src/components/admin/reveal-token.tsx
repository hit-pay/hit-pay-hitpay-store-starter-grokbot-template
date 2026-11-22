"use client";

import { useState } from "react";

export function RevealToken() {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    setError(null);
    const response = await fetch("/api/admin/token", { method: "POST" });
    const body = (await response.json().catch(() => ({}))) as { accessToken?: string; expiresAt?: string };
    if (!response.ok || !body.accessToken) {
      setError("Couldn't load the token. Sign in again.");
      return;
    }
    setToken(body.accessToken);
    setExpiresAt(body.expiresAt ?? null);
  }

  if (!token) {
    return (
      <div className="space-y-2">
        <button type="button" className="btn btn-outline" onClick={reveal}>
          Reveal access token
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm">
        Save this as <code>HITPAY_ACCESS_TOKEN</code> in your Vercel project&apos;s environment variables (mark it
        Sensitive), then redeploy. Never commit it or paste it into chat.
      </p>
      <textarea readOnly value={token} rows={4} className="input font-mono text-xs" onFocus={(e) => e.target.select()} />
      {expiresAt && <p className="text-muted-foreground text-xs">Expires {expiresAt}</p>}
      <button type="button" className="btn btn-outline" onClick={() => setToken(null)}>
        Hide
      </button>
    </div>
  );
}
