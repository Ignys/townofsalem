"use client";

import { useState, useSyncExternalStore } from "react";

import { buildRoomShareUrl } from "@/lib/utils/room-share-url";
import { Clipboard, Link2 } from "lucide-react";

interface RoomShareCardProps {
  code: string;
}

type CopyFeedback = "code" | "link" | "error" | null;

const subscribeToOrigin = () => () => undefined;
const getBrowserOrigin = () => window.location.origin;
const getServerOrigin = () => "";

export function RoomShareCard({ code }: RoomShareCardProps) {
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    getBrowserOrigin,
    getServerOrigin,
  );

  const shareUrl = buildRoomShareUrl(origin, code);

  const copyValue = async (value: string, feedback: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      console.log(feedback)
    }
  };

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono tracking-[0.15em] mr-2">{code}</span>
        <button
          type="button"
          onClick={() => void copyValue(code, "code")}
          className="flex gap-2 items-center rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-[#f8f1e5] transition-colors hover:bg-white/8 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c]"
        >
          <Clipboard size={16} /> Copiar código
        </button>
        <button
          type="button"
          onClick={() => void copyValue(shareUrl, "link")}
          disabled={!shareUrl}
          className="flex gap-2 items-center rounded-lg bg-[#7d2330] border border-transparent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:bg-[#766c67]"
        >
          <Link2 size={16} /> Copiar link
        </button>
      </div>
    </div>
  );
}
