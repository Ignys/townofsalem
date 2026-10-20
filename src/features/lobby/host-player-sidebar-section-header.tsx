interface HostPlayerSidebarSectionHeaderProps {
  label: string;
  playerCount: number;
}

export function HostPlayerSidebarSectionHeader({
  label,
  playerCount,
}: HostPlayerSidebarSectionHeaderProps) {
  return (
    <li
      role="separator"
      aria-label={`${playerCount} jogadores ${label.toLocaleLowerCase("pt-BR")}`}
      className="flex items-center gap-2 px-2 py-2 font-serif text-sm font-semibold text-[#bdb7ad]"
    >
      <span>{label}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
      <span className="flex items-center justify-center font-sans text-sm tabular-nums">
        {playerCount}
      </span>
    </li>
  );
}
