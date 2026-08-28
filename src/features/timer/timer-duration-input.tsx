import type { FormEvent } from "react";

import {
  formatTimerDurationMask,
  normalizeTimerDurationDigits,
} from "./timer-duration-mask";

interface TimerDurationInputProps {
  value: string;
  disabled: boolean;
  valid: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function TimerDurationInput({
  value,
  disabled,
  valid,
  onChange,
  onSubmit,
}: TimerDurationInputProps) {
  const maskedValue = formatTimerDurationMask(value);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (valid && !disabled) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={maskedValue}
        placeholder="--:--"
        aria-label="Duração do timer em minutos e segundos"
        aria-invalid={value.length > 0 && !valid}
        title="Digite a duração no formato mm:ss e pressione Enter"
        disabled={disabled}
        onChange={(event) =>
          onChange(normalizeTimerDurationDigits(event.target.value))
        }
        onFocus={(event) => {
          const end = event.currentTarget.value.length;
          event.currentTarget.setSelectionRange(end, end);
        }}
        onClick={(event) => {
          const end = event.currentTarget.value.length;
          event.currentTarget.setSelectionRange(end, end);
        }}
        className="-ml-1 w-[5.5ch] rounded-lg bg-transparent px-1 text-inherit outline-none transition-colors placeholder:text-current hover:bg-white/8 focus:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </form>
  );
}
