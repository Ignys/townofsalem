"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "tos.session.s";

function readKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get("s");

  if (fromUrl) {
    window.localStorage.setItem(STORAGE_KEY, fromUrl);
    url.searchParams.delete("s");
    window.history.replaceState(window.history.state, "", url);
  }

  return window.localStorage.getItem(STORAGE_KEY);
}

export function useSessionSyncKey(): string | null {
  const [key] = useState(readKey);

  return key;
}

export function useSessionSync(key: string, code: string, open: boolean) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) {
      return;
    }

    busy.current = true;

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ k: key, c: code }),
        cache: "no-store",
      });

      if (response.status === 404) {
        window.localStorage.removeItem(STORAGE_KEY);
        setFailed(true);
        return;
      }

      setData(await response.json());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
    }
  }, [key, code]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const first = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => void refresh(), 5000);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [open, refresh]);

  return { data, failed, refresh };
}
