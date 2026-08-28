const TIMER_MASK_DIGITS = 4;
const SECONDS_PER_MINUTE = 60;

export function normalizeTimerDurationDigits(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(-TIMER_MASK_DIGITS)
    .replace(/^0+/, "");
}

export function formatTimerDurationMask(value: string): string {
  const digits = normalizeTimerDurationDigits(value);

  if (!digits) {
    return "";
  }

  const paddedDigits = digits.padStart(TIMER_MASK_DIGITS, "0");
  return `${paddedDigits.slice(0, 2)}:${paddedDigits.slice(2)}`;
}

export function parseTimerDurationSeconds(value: string): number | null {
  const digits = normalizeTimerDurationDigits(value);

  if (!digits) {
    return null;
  }

  const paddedDigits = digits.padStart(TIMER_MASK_DIGITS, "0");
  const minutes = Number(paddedDigits.slice(0, 2));
  const seconds = Number(paddedDigits.slice(2));

  if (seconds >= SECONDS_PER_MINUTE) {
    return null;
  }

  const totalSeconds = minutes * SECONDS_PER_MINUTE + seconds;
  return totalSeconds > 0 ? totalSeconds : null;
}
