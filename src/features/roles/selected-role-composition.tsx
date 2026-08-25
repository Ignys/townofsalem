import { getRoleById } from "@/data/roles";

interface SelectedRoleCompositionProps {
  roleIds: readonly string[];
  disabled: boolean;
  onRemove: (index: number) => void;
}

export function SelectedRoleComposition({
  roleIds,
  disabled,
  onRemove,
}: SelectedRoleCompositionProps) {
  if (roleIds.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-[#9f9990]">
        Nenhuma role selecionada.
      </p>
    );
  }

  return (
    <ol className="grid gap-2">
      {roleIds.map((roleId, index) => {
        const role = getRoleById(roleId);

        return (
          <li
            key={`${roleId}-${index}`}
            className="flex min-h-11 items-center gap-3 rounded-xl border border-white/8 bg-black/15 px-4 py-2"
          >
            <span className="min-w-0 flex-1 truncate font-medium text-[#f8f1e5]">
              {role?.name ?? roleId}
            </span>
            {role && (
              <span className="text-xs font-semibold text-[#9f9990]">
                {role.virtueValue > 0 ? "+" : ""}{role.virtueValue}
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={disabled}
              aria-label={`Remover ${role?.name ?? roleId}`}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-[#e6cfa9] hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remover
            </button>
          </li>
        );
      })}
    </ol>
  );
}
