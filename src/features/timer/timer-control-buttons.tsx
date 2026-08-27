import { ClockArrowUp, ClockPlus, Pause, Play, Square } from "lucide-react";

import type { SynchronizedTimerState } from "./timer-state";

interface TimerControlButtonsProps {
    status: SynchronizedTimerState["status"];
    disabled: boolean;
    onToggle: () => void;
    onStop: () => void;
    onAddThirtySeconds: () => void;
}

const CONTROL_BUTTON_CLASS =
    "grid size-12 shrink-0 place-items-center rounded-full bg-white/8 text-[#fffaf0] transition-colors hover:bg-white/12 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-50";

export function TimerControlButtons({ status, disabled, onToggle, onStop, onAddThirtySeconds }: TimerControlButtonsProps) {
    const paused = status === "paused";
    const toggleLabel = paused ? "Retomar timer" : "Pausar timer";
    const ToggleIcon = paused ? Play : Pause;

    return (
        <div className="flex shrink-0 items-center gap-2" aria-label="Controles do timer">
            <button type="button" onClick={onToggle} disabled={disabled} aria-label={toggleLabel} title={toggleLabel} className={CONTROL_BUTTON_CLASS}>
                <ToggleIcon aria-hidden="true" size={24} stroke="1" fill="white" />
            </button>

            <button
                type="button"
                onClick={onStop}
                disabled={disabled}
                aria-label="Parar timer"
                title="Parar timer"
                className={`${CONTROL_BUTTON_CLASS} border-[#a33843]/40 bg-[#a33843]/10 text-[#f0b9bd] hover:bg-[#a33843]/20`}
            >
                <Square aria-hidden="true" size={24} stroke="1" fill="currentColor" />
            </button>

            <button type="button" onClick={onAddThirtySeconds} disabled={disabled} aria-label="Adicionar 30 segundos" title="Adicionar 30 segundos" className={CONTROL_BUTTON_CLASS}>
                <ClockArrowUp aria-hidden="true" size={24} />
            </button>
        </div>
    );
}
