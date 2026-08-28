import { TIMER_CONTROL_BUTTON_CLASS } from "./timer-control-styles";

const TIMER_PRESETS = [
  { label: "30s", durationSeconds: 30 },
  { label: "1m", durationSeconds: 60 },
  { label: "2m", durationSeconds: 120 },
] as const;

interface TimerPresetButtonsProps {
  disabled: boolean;
  onSelect: (durationSeconds: number) => void;
}

export function TimerPresetButtons({
  disabled,
  onSelect,
}: TimerPresetButtonsProps) {
  return (
    <div
      className="flex shrink-0 items-center gap-2"
      aria-label="Durações rápidas do timer"
    >
      {TIMER_PRESETS.map(({ label, durationSeconds }) => (
        <button
          key={durationSeconds}
          type="button"
          disabled={disabled}
          aria-label={`Iniciar timer com ${label}`}
          title={`Iniciar timer com ${label}`}
          className={`${TIMER_CONTROL_BUTTON_CLASS} font-mono text-sm font-bold`}
          onClick={() => onSelect(durationSeconds)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
