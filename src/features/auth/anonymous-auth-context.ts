import { createContext } from "react";

import type { AnonymousAuthState } from "./types";

export const AnonymousAuthContext = createContext<
  AnonymousAuthState | undefined
>(undefined);
