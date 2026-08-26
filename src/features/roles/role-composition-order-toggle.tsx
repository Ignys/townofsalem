import { ArrowUpDown } from "lucide-react";

import type { RoleCompositionOrder } from "./role-composition-order";

interface RoleCompositionOrderToggleProps {
    order: RoleCompositionOrder;
    onChange: (order: RoleCompositionOrder) => void;
}

const ORDER_LABELS: Record<RoleCompositionOrder, string> = {
    natural: "Ordem por alinhamento",
    virtue: "Ordem por virtue value",
};

export function RoleCompositionOrderToggle({ order, onChange }: RoleCompositionOrderToggleProps) {
    const nextOrder: RoleCompositionOrder = order === "natural" ? "virtue" : "natural";

    return (
        <button
            type="button"
            onClick={() => onChange(nextOrder)}
            aria-label={`${ORDER_LABELS[order]}. Alterar para ${ORDER_LABELS[nextOrder].toLocaleLowerCase("pt-BR")}`}
            title={`Alterar para ${ORDER_LABELS[nextOrder].toLocaleLowerCase("pt-BR")}`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-xs text-[#d8d2c8] transition hover:border-[#d3b88c]/40 hover:bg-white/8 hover:text-[#fffaf0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c]"
        >
            <ArrowUpDown aria-hidden="true" size={14} strokeWidth={1.8} />
            {ORDER_LABELS[order]}
        </button>
    );
}
