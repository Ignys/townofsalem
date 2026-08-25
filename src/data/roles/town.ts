import type { RoleDefinition } from "@/types";

import { TOWN_INVESTIGATIVE_ROLES } from "./town-investigative";
import { TOWN_KILLING_ROLES } from "./town-killing";
import { TOWN_PROTECTIVE_ROLES } from "./town-protective";
import { TOWN_SUPPORT_ROLES } from "./town-support";

export const TOWN_ROLES = [
  ...TOWN_PROTECTIVE_ROLES,
  ...TOWN_INVESTIGATIVE_ROLES,
  ...TOWN_SUPPORT_ROLES,
  ...TOWN_KILLING_ROLES,
] as const satisfies readonly RoleDefinition[];
