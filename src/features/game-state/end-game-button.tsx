import { ChevronRight, LoaderCircle, OctagonMinus, Skull } from "lucide-react";

interface EndGameButtonProps {
    busy: boolean;
    onClick: () => void;
}

export function EndGameButton({ busy, onClick }: EndGameButtonProps) {
    return (
        <button
            type="button"
            disabled={busy}
            onClick={onClick}
            className="group relative mt-5 flex min-h-16 w-full items-center gap-2 overflow-hidden rounded-2xl border border-[#a33843]/45 bg-[linear-gradient(110deg,rgba(125,35,48,0.32),rgba(76,25,32,0.24)_55%,rgba(20,13,15,0.36))] px-3 py-3 text-left shadow-[0_10px_28px_rgba(69,16,24,0.18)] transition-[transform,border-color,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:border-[#c85660]/70 hover:bg-[#7d2330]/20 hover:shadow-[0_14px_34px_rgba(94,22,32,0.3)] active:translate-y-0 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d3b88c] disabled:cursor-wait disabled:translate-y-0 disabled:opacity-55 disabled:shadow-none"
        >
            <span aria-hidden="true" className="absolute -right-8 -top-10 size-28 rounded-full bg-[#a33843]/10 blur-2xl transition-colors duration-200 group-hover:bg-[#c85660]/20" />

            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl text-[#ffb9be] transition-colors duration-200 group-hover:bg-[#a33843]/28 group-hover:text-[#ffd5d8]">
                {busy ? <LoaderCircle aria-hidden="true" size={24} className="animate-spin" /> : <OctagonMinus aria-hidden="true" size={24} strokeWidth={1.8} />}
            </span>

            <span className="relative min-w-0 flex-1">
                <span className="block text-sm font-extrabold tracking-wide text-[#ffe8e5]">{busy ? "Encerrando partida…" : "Encerrar partida"}</span>
                <span className="mt-0.5 block text-xs leading-5 text-[#cda5a7]">Finaliza a sessão e leva todos de volta ao lobby</span>
            </span>

            <ChevronRight aria-hidden="true" size={18} className="relative shrink-0 text-[#d98c92] transition-transform duration-200 group-hover:translate-x-1" />
        </button>
    );
}
