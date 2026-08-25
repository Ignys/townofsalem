export interface RoleCompositionRules {
  allowDuplicateRoleIds: boolean;
  enforceCardCounts?: boolean;
}

export const ROLE_COMPOSITION_RULES: RoleCompositionRules = {
  allowDuplicateRoleIds: true,
  enforceCardCounts: true,
};
