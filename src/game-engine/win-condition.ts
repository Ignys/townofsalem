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

/** Neutros que não impedem a vitória de ninguém (o regulamento: "may still win if ... alive"). */
const BENIGN_NEUTRAL_ROLES = new Set(["jester", "executioner", "amnesiac"]);
const NEUTRAL_KILLER_ROLES = new Set(["serial-killer", "werewolf", "witch"]);

/** Lado que precisa eliminar os outros para vencer; neutros benignos não têm lado. */
function getEliminationSide(player: EngineGameState["players"][number]): string | null {
  if (BENIGN_NEUTRAL_ROLES.has(player.roleId)) return null;
  if (player.faction === "town" || player.faction === "mafia") return player.faction;
  return NEUTRAL_KILLER_ROLES.has(player.roleId) ? player.roleId : null;
}

/**
 * Vitória por eliminação, do regulamento: a Cidade vence quando não sobra Máfia, Serial
 * Killer, Werewolf nem Witch; a Máfia, quando não sobra ninguém que não se submeta; cada
 * neutro assassino, quando sobra só ele. Neutros benignos vivos não impedem a vitória.
 */
export const ELIMINATION_RULES: readonly WinConditionRule[] = [
  {
    id: "last-side-standing",
    evaluate: (state) => {
      const alive = state.players.filter(({ alive: isAlive }) => isAlive);
      const sides = new Set(alive.map(getEliminationSide).filter((side): side is string => side !== null));
      if (sides.size > 1) return null;
      if (sides.size === 0) return result("NO_SIDE_LEFT_DRAW", [], []);

      const [side] = [...sides];
      const members = state.players.filter((player) => getEliminationSide(player) === side);
      if (side === "town" || side === "mafia") {
        return result(`${side.toUpperCase()}_ELIMINATED_OPPOSITION`, [side], members.map(({ uid }) => uid));
      }
      return result("NEUTRAL_KILLER_LAST_STANDING", ["neutral"], members.filter(({ alive: isAlive }) => isAlive).map(({ uid }) => uid));
    },
  },
];

export const DEFAULT_WIN_RULES: readonly WinConditionRule[] = [
  ...CARD_GAME_STALEMATE_RULES,
  ...ELIMINATION_RULES,
];

export function checkWinCondition(
  gameState: EngineGameState,
  confirmedRules: readonly WinConditionRule[] = DEFAULT_WIN_RULES,
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
