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

export interface SessionSyncRole {
  uid: string;
  name: string;
  alive: boolean;
  roleId: string | null;
  role: string | null;
  faction: string | null;
  statuses: string[];
}

export interface SessionSyncData {
  gameId: string;
  day: unknown;
  phase: unknown;
  roles: SessionSyncRole[];
  extra: Record<string, unknown>;
}

const ERRORS: Record<number, string> = {
  401: "Chave inválida.",
  404: "Sala não encontrada.",
  429: "Muitas tentativas. Aguarde um minuto.",
  503: "Não configurado no servidor.",
};

export function useSessionSync(key: string, code: string, open: boolean) {
  const [data, setData] = useState<SessionSyncData | null>(null);
  const [error, setError] = useState<string | null>(null);
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

      if (!response.ok) {
        if (response.status === 401) {
          window.localStorage.removeItem(STORAGE_KEY);
        }

        setError(ERRORS[response.status] ?? `Erro ${response.status}.`);
        return;
      }

      setData(await response.json());
      setError(null);
    } catch {
      setError("Sem conexão.");
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

  return { data, error, refresh };
}
