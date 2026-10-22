/** Cores das roles neutras do jogo digital; tags de categoria ("Neutro") seguem cinza. */
export const NEUTRAL_ROLE_COLORS: Record<string, string> = {
  "serial-killer": "#4d6bff", // #000080 no jogo, clareado para leitura no fundo escuro
  werewolf: "#b0703f", // #784421 clareado
  jester: "#f5a6d4",
  executioner: "#acacac",
  witch: "#bf5fff",
  amnesiac: "#22ffff",
  vampire: "#9aab84", // #7B8968 clareado
};

/** Cor do nome da role: própria para neutras, da facção para Cidade e Máfia. */
export function roleNameColor(roleId: string, faction?: string | null) {
  return NEUTRAL_ROLE_COLORS[roleId] ?? (faction === "town" ? "#3dd69b" : faction === "mafia" ? "#db4242" : undefined);
}

export function roleTagStyle(roleId?: string) {
  const color = roleId ? NEUTRAL_ROLE_COLORS[roleId] : undefined;
  if (!color) return undefined;
  const bg = `color-mix(in srgb, ${color} 22%, #111)`;
  return { color, backgroundColor: bg, borderColor: bg };
}
