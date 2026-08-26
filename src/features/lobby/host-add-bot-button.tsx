import { Bot } from "lucide-react";

interface HostAddBotButtonProps {
  disabled: boolean;
  adding: boolean;
  onAdd: () => void;
}

export function HostAddBotButton({
  disabled,
  adding,
  onAdd,
}: HostAddBotButtonProps) {
  const label = disabled
    ? "Bots só podem ser adicionados antes do início da partida"
    : adding
      ? "Adicionando bot"
      : "Adicionar jogador bot";

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled || adding}
      aria-label={label}
      title={label}
      className="flex size-8 items-center justify-center rounded-full border border-[#d3b88c]/25 bg-[#d3b88c]/10 text-[#e6cfa9] transition hover:border-[#d3b88c]/50 hover:bg-[#d3b88c]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Bot
        aria-hidden="true"
        className={adding ? "animate-pulse" : ""}
        size={18}
      />
    </button>
  );
}
