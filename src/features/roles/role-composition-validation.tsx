import { CircleAlert, CircleCheck } from "lucide-react";

import type { RoleCompositionValidationResult } from "./validate-role-composition";

interface RoleCompositionValidationProps {
  result: RoleCompositionValidationResult;
}

/** Metade de cima do bloco de início: diz se dá para sortear e, se não, o que falta. */
export function RoleCompositionValidation({
  result,
}: RoleCompositionValidationProps) {
  if (result.valid) {
    return (
      <p role="status" className="flex items-start gap-3 px-4 py-3.5 text-sm text-[#bfe0c5]">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <span>
          <span className="block font-semibold text-[#e2f2e5]">Composição pronta</span>
          Cada jogador recebe uma role ao sortear.
        </span>
      </p>
    );
  }

  return (
    <div role="alert" className="flex items-start gap-3 px-4 py-3.5 text-sm text-[#f0b9bd]">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold text-[#fbe0e2]">Antes de sortear</p>
        <ul className="mt-1 grid gap-1">
          {result.errors.map((error, index) => (
            <li key={`${error.code}-${index}`}>{error.message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
