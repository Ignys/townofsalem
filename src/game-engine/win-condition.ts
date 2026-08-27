import type { EngineGameState } from "./types";

export interface WinConditionResult {
  gameOver: boolean;
  winningFactions: readonly string[];
  winningPlayerUids: readonly string[];
  reasonCode: string;
  confidenceOrWarnings: readonly string[];
}

export interface WinConditionRule {
  id: string;
  evaluate: (state: EngineGameState) => Omit<WinConditionResult, "confidenceOrWarnings"> | null;
}

const TOWN_KILLING_ROLES = new Set(["bodyguard", "veteran", "vigilante"]);

export function getCompletedIndividualWinnerUids(
  state: EngineGameState,
): readonly string[] {
  return state.players
    .filter((player) =>
      player.statuses.some((status) => status.endsWith("-won"))
      || (player.roleId === "amnesiac" && (state.nightNumber ?? 1) < 3),
    )
    .map(({ uid }) => uid)
    .sort();
}

function result(
  reasonCode: string,
  winningFactions: readonly string[],
  winningPlayerUids: readonly string[],
) {
  return { gameOver: true, winningFactions, winningPlayerUids, reasonCode };
}

export const CARD_GAME_STALEMATE_RULES: readonly WinConditionRule[] = [
  {
    id: "survivor-killer",
    evaluate: (state) => {
      const alive = state.players.filter(({ alive: isAlive }) => isAlive);
      if (alive.length !== 2) return null;
      const survivor = alive.find(({ roleId }) => roleId === "survivor");
      const killer = alive.find(({ uid }) => uid !== survivor?.uid);
      if (!survivor || !killer) return null;
      const killerQualifies = killer.roleId === "serial-killer"
        || killer.roleId === "werewolf"
        || killer.faction === "mafia";
      return killerQualifies
        ? result("SURVIVOR_KILLER_STALEMATE", [killer.faction], [killer.uid])
        : null;
    },
  },
  {
    id: "jester-town-no-kill",
    evaluate: (state) => {
      const alive = state.players.filter(({ alive: isAlive }) => isAlive);
      if (alive.length !== 2) return null;
      const jester = alive.find(({ roleId }) => roleId === "jester");
      const town = alive.find(({ faction, roleId }) =>
        faction === "town" && !TOWN_KILLING_ROLES.has(roleId),
      );
      return jester && town
        ? result("JESTER_TOWN_NON_KILLING_STALEMATE", ["town"], [town.uid])
        : null;
    },
  },
  {
    id: "executioner-town-no-kill",
    evaluate: (state) => {
      const alive = state.players.filter(({ alive: isAlive }) => isAlive);
      if (alive.length !== 2) return null;
      const executioner = alive.find(({ roleId }) => roleId === "executioner");
      const town = alive.find(({ faction, roleId }) =>
        faction === "town" && !TOWN_KILLING_ROLES.has(roleId),
      );
      if (!executioner || !town) return null;
      const individualWinners = executioner.statuses.includes("executioner-won")
        ? [executioner.uid]
        : [];
      return result(
        "EXECUTIONER_TOWN_NON_KILLING_STALEMATE",
        ["town"],
        [town.uid, ...individualWinners],
      );
    },
  },
  {
    id: "two-jesters",
    evaluate: (state) => {
      const alive = state.players.filter(({ alive: isAlive }) => isAlive);
      return alive.length === 2 && alive.every(({ roleId }) => roleId === "jester")
        ? result("TWO_JESTERS_DRAW", [], [])
        : null;
    },
  },
  {
    id: "two-executioners",
    evaluate: (state) => {
      const alive = state.players.filter(({ alive: isAlive }) => isAlive);
      if (alive.length !== 2 || !alive.every(({ roleId }) => roleId === "executioner")) {
        return null;
      }
      return result(
        "TWO_EXECUTIONERS_DRAW",
        [],
        alive
          .filter(({ statuses }) => statuses.includes("executioner-won"))
          .map(({ uid }) => uid),
      );
    },
  },
];

export function checkWinCondition(
  gameState: EngineGameState,
  confirmedRules: readonly WinConditionRule[] = CARD_GAME_STALEMATE_RULES,
): WinConditionResult {
  for (const rule of confirmedRules) {
    const result = rule.evaluate(gameState);
    if (result) return {
      ...result,
      winningPlayerUids: [...new Set([
        ...result.winningPlayerUids,
        ...getCompletedIndividualWinnerUids(gameState),
      ])].sort(),
      confidenceOrWarnings: [],
    };
  }
  return {
    gameOver: false,
    winningFactions: [],
    winningPlayerUids: [],
    reasonCode: "NO_CONFIRMED_WIN_CONDITION",
    confidenceOrWarnings: ["As condições específicas desta composição ainda não foram confirmadas."],
  };
}
