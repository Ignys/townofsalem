export function scrollToNightConsoleAction(actorUid: string, actionId?: string) {
  const rows = document.querySelectorAll<HTMLElement>("[data-night-console-actor]");
  const row = Array.from(rows).find(
    (candidate) =>
      candidate.dataset.nightConsoleActor === actorUid &&
      (!actionId || candidate.dataset.nightConsoleAction === actionId),
  );

  row?.scrollIntoView({ behavior: "smooth", block: "center" });
  row?.focus({ preventScroll: true });
}
