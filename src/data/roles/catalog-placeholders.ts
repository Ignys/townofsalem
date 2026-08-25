export const NEEDS_VERIFICATION_ALIGNMENT = "needs-verification";

export function needsVerificationDescription(roleName: string): string {
  return `TODO: confirmar a descrição e as mecânicas de ${roleName} para a edição física usada pelo projeto.`;
}

export function needsVerificationGoal(roleName: string): string {
  return `TODO: confirmar a condição de vitória de ${roleName}.`;
}

export const UNVERIFIED_MECHANICS_NOTE =
  "Os valores mecânicos desta role precisam ser confirmados antes de uso pelo Game Engine.";
