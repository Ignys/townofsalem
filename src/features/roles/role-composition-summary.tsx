import type { BalanceScoreResult } from "./balance-score";

interface RoleCompositionSummaryProps {
    roleCount: number;
    playerCount: number;
    balance: BalanceScoreResult;
}

function getRoleCountStatus(roleCount: number, playerCount: number) {
    return roleCount === playerCount
        ? { className: "bg-[#6f9b77]/15 text-[#bfe0c5]", label: "quantidade correta" }
        : { className: "bg-red-500/15 text-[#f0b9bd]", label: "quantidade incorreta" };
}

function getVirtueStatus(total: number) {
    if (total === 0) {
        return { className: "bg-[#6f9b77]/15 text-[#bfe0c5]", label: "balanceado" };
    }

    if (Math.abs(total) === 1) {
        return { className: "bg-amber-500/15 text-[#e6cfa9]", label: "próximo do ideal" };
    }

    return { className: "bg-red-500/15 text-[#f0b9bd]", label: "desbalanceado" };
}

export function RoleCompositionSummary({ roleCount, playerCount, balance }: RoleCompositionSummaryProps) {
    const signedTotal = balance.total > 0 ? `+${balance.total}` : balance.total;
    const roleCountStatus = getRoleCountStatus(roleCount, playerCount);
    const virtueStatus = getVirtueStatus(balance.total);

    return (
        <aside aria-label="Resumo da composição" className="flex items-center rounded-2xl border border-[#d3b88c]/20 bg-black/20 px-5 py-4 sm:min-w-80">
            <div className="flex w-1/2 flex-col items-center justify-center gap-x-4 gap-y-1">
                <p className="uppercase text-xs text-white/50">Roles/Jogadores</p>
                <p
                    aria-label={`${roleCount} roles para ${playerCount} jogadores: ${roleCountStatus.label}`}
                    className={`rounded-lg px-2 py-0.5 text-xl font-semibold ${roleCountStatus.className}`}
                >
                    {roleCount}/{playerCount}
                </p>
            </div>
            <span className="mx-4 h-8 w-px bg-[#d3b88c]/20" />
            <div className="flex w-1/2 flex-col items-center justify-center gap-x-4 gap-y-1">
                <p className="uppercase text-xs text-white/50">Virtue Value</p>
                <p
                    aria-label={`Virtue Value ${signedTotal}: ${virtueStatus.label}`}
                    className={`rounded-lg px-2 py-0.5 text-xl font-semibold ${virtueStatus.className}`}
                >
                    {signedTotal}
                </p>
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
