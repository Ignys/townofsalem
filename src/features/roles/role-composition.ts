export type RoleCompositionRecord = Record<string, number>;

export function roleIdsToCompositionRecord(
  roleIds: readonly string[],
): RoleCompositionRecord {
  return roleIds.reduce<RoleCompositionRecord>((composition, roleId) => {
    composition[roleId] = (composition[roleId] ?? 0) + 1;
    return composition;
  }, {});
}

export function compositionRecordToRoleIds(
  composition: RoleCompositionRecord | null | undefined,
): string[] {
  if (!composition) {
    return [];
  }

  return Object.entries(composition).flatMap(([roleId, count]) =>
    Number.isInteger(count) && count > 0 ? Array<string>(count).fill(roleId) : [],
  );
}
