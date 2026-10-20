/** A ação da noite que está usando a lista de jogadores para escolher alvos. */
export interface NightTargetPicker {
  eligibleUids: readonly string[];
  selectedUids: readonly string[];
  /** Werewolf: o alvo principal; os outros escolhidos são vizinhos dele. */
  primaryUid?: string;
  disabled: boolean;
  toggle: (uid: string) => void;
}
