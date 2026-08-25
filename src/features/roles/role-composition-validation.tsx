import type { RoleCompositionValidationResult } from "./validate-role-composition";

interface RoleCompositionValidationProps {
  result: RoleCompositionValidationResult;
}

export function RoleCompositionValidation({
  result,
}: RoleCompositionValidationProps) {
  if (result.valid) {
    return (
      <p
        role="status"
        className="rounded-xl border border-[#6f9b77]/35 bg-[#6f9b77]/10 px-4 py-3 text-sm font-medium text-[#bfe0c5]"
      >
        Composição válida e pronta para a etapa de sorteio.
      </p>
    );
  }

  return (
    <div
      role="alert"
      className="rounded-xl border border-[#a33843]/35 bg-[#a33843]/10 px-4 py-3 text-sm text-[#f0b9bd]"
    >
      <p className="font-bold">Revise a composição:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {result.errors.map((error, index) => (
          <li key={`${error.code}-${index}`}>{error.message}</li>
        ))}
      </ul>
    </div>
  );
}
