import type { BalanceScoreResult } from "./balance-score";
import { BALANCE_RATING_LABELS } from "./balance-score";

interface BalanceSummaryProps {
  balance: BalanceScoreResult;
}

const FAVORED_LABELS = {
  town: "favorece a Town",
  evil: "favorece as roles malignas",
  none: "sem vantagem pelo Virtue Value",
} as const;

export function BalanceSummary({ balance }: BalanceSummaryProps) {
  const signedTotal = balance.total > 0 ? `+${balance.total}` : balance.total;

  return (
    <section
      aria-label="Balanceamento da composição"
      className="mt-4 rounded-xl border border-[#d3b88c]/20 bg-[#d3b88c]/[0.06] p-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold tracking-wide text-[#9f9990] uppercase">
            Virtue Value
          </p>
          <p className="mt-1 text-2xl font-bold text-[#fffaf0]">
            {signedTotal}
          </p>
        </div>
        <p className="text-right text-sm font-semibold text-[#e6cfa9]">
          {BALANCE_RATING_LABELS[balance.rating]}
        </p>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#bdb7ad]">
        {balance.total === 0
          ? "A soma está exatamente em zero."
          : `A soma está a ${balance.distanceFromZero} de zero e ${FAVORED_LABELS[balance.favoredSide]}.`}
      </p>
    </section>
  );
}
