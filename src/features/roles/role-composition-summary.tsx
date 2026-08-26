import type { BalanceScoreResult } from "./balance-score";
import { BALANCE_RATING_LABELS } from "./balance-score";

interface RoleCompositionSummaryProps {
    roleCount: number;
    playerCount: number;
    balance: BalanceScoreResult;
}

function getSummaryMessage(roleCount: number, playerCount: number, balance: BalanceScoreResult) {
    if (playerCount === 0) {
        return "Aguardando jogadores conectados.";
    }

    const difference = playerCount - roleCount;

    if (difference > 0) {
        return `Faltam ${difference} role${difference === 1 ? "" : "s"} para completar a composição.`;
    }

    if (difference < 0) {
        const excess = Math.abs(difference);
        return `Remova ${excess} role${excess === 1 ? "" : "s"} para igualar aos jogadores.`;
    }

    return balance.total === 0 ? "Virtue está perfeitamente balanceado." : `Virtue está desbalanceado: ${BALANCE_RATING_LABELS[balance.rating].toLocaleLowerCase("pt-BR")}.`;
}

export function RoleCompositionSummary({ roleCount, playerCount, balance }: RoleCompositionSummaryProps) {
    const signedTotal = balance.total > 0 ? `+${balance.total}` : balance.total;
    const ready = playerCount >= 2 && roleCount === playerCount && balance.total === 0;

    return (
        <aside aria-label="Resumo da composição" className="flex rounded-2xl border border-[#d3b88c]/20 bg-black/20 px-5 py-4 sm:min-w-80">
            <div className="flex grow">
                <p className="text-lg text-white/70">{getSummaryMessage(roleCount, playerCount, balance)}</p>
            </div>
            <div className="space-y-2">
                <div className="mt-2 flex flex-col text-right justify-between gap-x-4 gap-y-1">
                    <p className="uppercase text-xs text-white/50">Virtue Value</p>
                    <p className="text-sm font-semibold text-[#d3b88c]">{signedTotal}</p>
                </div>
                <div className="flex flex-col text-right justify-between gap-x-4 gap-y-1">
                    <p className="uppercase text-xs text-white/50">Roles/Jogadores</p>
                    <p className="text-sm font-semibold text-[#d3b88c]">
                        {roleCount}/{playerCount}
                    </p>
                </div>
            </div>
        </aside>
    );
}

// <aside
//   aria-label="Resumo da composição"
//   className="min-w-0 rounded-2xl border border-[#d3b88c]/20 bg-black/20 px-5 py-4 sm:min-w-80"
// >
//   <p className="text-xs font-semibold tracking-wide text-[#bdb7ad] uppercase">
//     {roleCount} roles selecionadas / {playerCount} jogadores conectados
//   </p>
//   <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
//     <span className="text-sm font-semibold text-[#d3b88c]">
//       Virtue Value
//     </span>
//     <strong className="font-serif text-3xl text-[#fffaf0]">
//       {signedTotal}
//     </strong>
//   </div>
//   <p
//     role="status"
//     className={`mt-2 text-sm leading-5 ${
//       ready ? "text-[#bfe0c5]" : "text-[#e6cfa9]"
//     }`}
//   >
//     {getSummaryMessage(roleCount, playerCount, balance)}
//   </p>
// </aside>
