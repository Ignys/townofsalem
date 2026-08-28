import type { PublicPlayerRecord } from "@/lib/firebase/schema";
import type { DeputyPromotionRecord } from "@/types";

interface HostDeputyPromotionNoticeProps {
  promotion?: DeputyPromotionRecord;
  players: Readonly<Record<string, PublicPlayerRecord>>;
}

export function HostDeputyPromotionNotice({
  promotion,
  players,
}: HostDeputyPromotionNoticeProps) {
  if (!promotion) return null;

  const promotedName = players[promotion.playerUid]?.name ?? promotion.playerUid;
  const candidateNames = promotion.candidateUids.map(
    (uid) => players[uid]?.name ?? uid,
  );
  const drawDescription = candidateNames.length > 1
    ? ` Foi sorteado entre: ${candidateNames.join(", ")}.`
    : "";

  return (
    <aside className="mb-3 rounded-xl border border-[#d3b88c]/35 bg-[#d3b88c]/10 p-3 text-sm text-[#f0dfc1]">
      <p className="font-semibold">Promoção automática do Deputy</p>
      <p className="mt-1">
        {promotedName} agora é Sheriff e já pode investigar nesta noite.
        {drawDescription}
      </p>
    </aside>
  );
}
