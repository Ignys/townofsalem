"use client";

import { History, LayoutDashboard, Moon, ScrollText, Settings, Sun, Users, Vote, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

/** Escolhe um esqueleto só; montar os dois duplicaria sons, espelhos e o piloto automático. */
export function useIsDesktop() {
    return useSyncExternalStore(
        (onChange) => {
            const media = window.matchMedia(DESKTOP_QUERY);
            media.addEventListener("change", onChange);
            return () => media.removeEventListener("change", onChange);
        },
        () => window.matchMedia(DESKTOP_QUERY).matches,
        () => true,
    );
}

export type HostMobileTabId = "players" | "roles" | "settings" | "table" | "phase" | "voting" | "history";

export interface HostMobileTab {
    id: HostMobileTabId;
    label: string;
    content: ReactNode;
    /** Resumo da aba que sobe para o header fixo (contagens, ações rápidas). */
    headerActions?: ReactNode;
}

interface HostMobileConsoleProps {
    code: string;
    phase: string | undefined;
    /** Número da noite atual; o dia leva o mesmo número. */
    roundNumber?: number;
    /** Cabeçalho completo do PC; no celular mora no fim da aba "Mesa". */
    header: ReactNode;
    sidebar: ReactNode;
    tabs: HostMobileTab[];
    /** Ação principal fixa no centro, acima das abas. */
    floatingAction?: ReactNode;
    /** Peças sem tela (sons, espelhos) que precisam viver em qualquer aba. */
    background?: ReactNode;
    activeTab: HostMobileTabId;
    onTabChange: (tab: HostMobileTabId) => void;
    playersOpen: boolean;
    onPlayersOpenChange: (open: boolean) => void;
}

const TAB_ICONS: Record<HostMobileTabId, typeof Moon> = {
    table: LayoutDashboard,
    phase: Moon,
    voting: Vote,
    history: History,
    players: Users,
    roles: ScrollText,
    settings: Settings,
};

export function HostMobileConsole({ code, phase, roundNumber, header, sidebar, tabs, floatingAction, background, activeTab, onTabChange, playersOpen, onPlayersOpenChange }: HostMobileConsoleProps) {
    const drawerRef = useRef<HTMLDialogElement>(null);
    const [scrollPositions] = useState(() => new Map<HostMobileTabId, number>());
    const current = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0].id;
    const hasPlayersTab = tabs.some((tab) => tab.id === "players");
    const currentTab = tabs.find((tab) => tab.id === current);
    const currentLabel = currentTab?.label;

    useEffect(() => {
        const drawer = drawerRef.current;
        if (!drawer) return;
        if (playersOpen && !drawer.open) drawer.showModal();
        if (!playersOpen && drawer.open) drawer.close();
    }, [playersOpen]);

    // Cada subpágina volta para onde o mestre parou de rolar.
    useEffect(() => {
        window.scrollTo({ top: scrollPositions.get(current) ?? 0 });
    }, [current, scrollPositions]);

    const selectTab = (tab: HostMobileTabId) => {
        scrollPositions.set(current, window.scrollY);
        onTabChange(tab);
    };

    return (
        <div className="flex min-h-svh w-full min-w-0 flex-col">
            {background}

            <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#2e3136]/70 bg-[#16181b]/95 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur">
                {!hasPlayersTab && (<button
                    type="button"
                    onClick={() => onPlayersOpenChange(true)}
                    aria-label="Abrir jogadores"
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/15 text-[#e6cfa9] focus-visible:outline-3 focus-visible:outline-[#d3b88c]"
                >
                    <Users aria-hidden="true" className="size-5" />
                </button>)}
                <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-lg font-semibold leading-tight text-[#fffaf0]">{currentLabel}</p>
                    <p className="truncate text-xs text-[#9f9990]">
                        Sala {code}
                        {phase === "night" && `, noite ${roundNumber ?? ""}`}
                        {phase === "day" && `, dia ${roundNumber ?? ""}`}
                    </p>
                </div>
                {currentTab?.headerActions}
                {currentTab?.headerActions ? null : phase === "night" ? (
                    <Moon aria-hidden="true" className="size-5 shrink-0 text-[#d3b88c]" />
                ) : phase === "day" ? (
                    <Sun aria-hidden="true" className="size-5 shrink-0 text-[#d3b88c]" />
                ) : null}
            </header>

            <div className={`flex-1 px-3 pt-3 ${floatingAction ? "pb-44" : "pb-28"}`}>
                {tabs.map((tab) => (
                    // Abas escondidas continuam montadas: seleção da noite e votos não se perdem.
                    <section key={tab.id} hidden={tab.id !== current} aria-label={tab.label} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
                        {tab.content}
                        {/* No jogo os controles da fase vêm primeiro; dados da sala ficam no fim. */}
                        {tab.id === "table" && <div className="-mx-3 rounded-2xl">{header}</div>}
                    </section>
                ))}
            </div>

            {floatingAction && <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2">{floatingAction}</div>}

            {tabs.length > 1 && (<nav aria-label="Seções do painel" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#2e3136] bg-[#16181b]/97 pb-[env(safe-area-inset-bottom)] backdrop-blur">
                <ul className="flex">
                    {tabs.map((tab) => {
                        const Icon = tab.id === "phase" && phase === "day" ? Sun : TAB_ICONS[tab.id];
                        const active = tab.id === current;
                        return (
                            <li key={tab.id} className="flex-1">
                                <button
                                    type="button"
                                    onClick={() => selectTab(tab.id)}
                                    aria-current={active ? "page" : undefined}
                                    className={`relative flex min-h-16 w-full flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-[#d3b88c] ${
                                        active ? "text-[#f6dfb5]" : "text-[#8d877e]"
                                    }`}
                                >
                                    {active && <span aria-hidden="true" className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-[#c18b2f] shadow-[0_0_12px_#c18b2f]" />}
                                    <Icon aria-hidden="true" className="size-5" />
                                    {tab.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>)}

            <dialog
                ref={drawerRef}
                aria-label="Jogadores"
                onClose={() => onPlayersOpenChange(false)}
                onClick={(event) => {
                    if (event.target === event.currentTarget) onPlayersOpenChange(false);
                }}
                className="m-0 mr-auto h-svh max-h-none w-[min(22rem,88vw)] max-w-none bg-transparent p-0 backdrop:bg-black/70 open:animate-[drawer-in_180ms_ease-out] motion-reduce:open:animate-none"
            >
                <div className="relative h-full [&>aside]:h-full [&>aside]:max-h-none [&>aside]:pt-14">
                    {sidebar}
                    <button
                        type="button"
                        onClick={() => onPlayersOpenChange(false)}
                        aria-label="Fechar jogadores"
                        className="absolute top-2 right-2 flex size-10 items-center justify-center rounded-xl text-[#d7d0c4] hover:bg-white/5 focus-visible:outline-3 focus-visible:outline-[#d3b88c]"
                    >
                        <X aria-hidden="true" className="size-5" />
                    </button>
                </div>
            </dialog>
        </div>
    );
}
