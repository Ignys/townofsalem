import { getRoleById } from "@/data/roles";

import { FACTION_STYLES } from "./role-selection-options";

interface PlayerRoleTagProps {
  roleId?: string;
  className?: string;
}

export function PlayerRoleTag({ roleId, className = "" }: PlayerRoleTagProps) {
  const role = roleId ? getRoleById(roleId) : undefined;
  const style = role ? FACTION_STYLES[role.faction] : FACTION_STYLES.neutral;

  return (
    <span
      className={`inline-flex max-w-32 shrink-0 truncate rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium uppercase ${style.tag} ${className}`}
    >
      {role?.name ?? roleId ?? "sem role"}
    </span>
  );
}
