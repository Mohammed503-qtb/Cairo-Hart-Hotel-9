"use client";

// Hooks for the guest app data fetching with polling.

import * as React from "react";

export interface FetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useFetch<T>(url: string, opts?: { intervalMs?: number; enabled?: boolean }): FetchResult<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);
  const intervalMs = opts?.intervalMs;
  const enabled = opts?.enabled !== false;

  const refresh = React.useCallback(() => setTick((t) => t + 1), []);

  React.useEffect(() => {
    if (!enabled || !url) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (cancelled) return;
        const json = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setData(json as T);
          setError(null);
        } else {
          setError((json as { error?: string }).error || `request_failed_${res.status}`);
        }
      } catch {
        if (!cancelled) setError("network_error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [url, tick, enabled]);

  // Polling
  React.useEffect(() => {
    if (!enabled || !intervalMs || !url) return;
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [url, intervalMs, enabled]);

  return { data, loading, error, refresh };
}

export async function apiPost(url: string, body?: unknown): Promise<{ ok: boolean; data?: unknown; error?: string; status?: number }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: (json as { error?: string }).error || `request_failed_${res.status}`, status: res.status, data: json };
    return { ok: true, data: json };
  } catch {
    return { ok: false, error: "network_error" };
  }
}
