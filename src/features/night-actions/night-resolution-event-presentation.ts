import type { EngineEvent } from "@/game-engine/types";

import { getNightStatusLabel } from "./night-resolution-labels";
import {
  resolutionPlayerPart,
  resolutionTextPart,
} from "./night-resolution-message-builders";
import type { NightResolutionMessageLine } from "./night-resolution-message-types";

export function presentNightResolutionEvent(
  event: EngineEvent,
  playerNames: Readonly<Record<string, string>>,
): NightResolutionMessageLine | null {
  const actor = event.actorUid
    ? resolutionPlayerPart(event.actorUid, playerNames)
    : null;
  const target = event.targetUid
    ? resolutionPlayerPart(event.targetUid, playerNames)
    : null;

  switch (event.type) {
    case "ACTION_UNAVAILABLE":
      return actor ? { parts: [actor, resolutionTextPart(" não pôde realizar sua ação nesta noite.")] } : null;
    case "ACTION_BLOCKED":
      return actor ? { parts: [actor, resolutionTextPart(" teve sua ação bloqueada.")] } : null;
    case "PLAYER_ROLEBLOCKED":
      return actor && target
        ? { parts: [actor, resolutionTextPart(" bloqueou a ação de "), target, resolutionTextPart(".")] }
        : null;
    case "PROTECTION_BLOCKED":
      return actor && target
        ? { parts: [actor, resolutionTextPart(" tentou proteger "), target, resolutionTextPart(", mas a proteção foi impedida pelo status do alvo.")] }
        : null;
    case "INVESTIGATION_RESULT":
      return actor && target
        ? { parts: [actor, resolutionTextPart(" investigou "), target, resolutionTextPart(` e recebeu o resultado ${String(event.details?.result ?? "registrado")}.`)] }
        : null;
    case "STATUS_APPLIED":
      return actor && target
        ? { parts: [actor, resolutionTextPart(" aplicou em "), target, resolutionTextPart(` o status ${getNightStatusLabel(String(event.details?.statusType ?? "registrado"), playerNames)}.`)] }
        : null;
    case "VETERAN_VISITOR_ATTACKED":
      return actor && target
        ? { parts: [target, resolutionTextPart(" visitou "), actor, resolutionTextPart(" durante o Alert e foi atacado.")] }
        : null;
    case "BODYGUARD_INTERCEPTED_ATTACK":
      return actor && target
        ? { parts: [actor, resolutionTextPart(" interceptou o ataque destinado a "), target, resolutionTextPart(".")] }
        : null;
    case "BODYGUARD_SACRIFICED":
      return actor && target
        ? { parts: [actor, resolutionTextPart(" se sacrificou para proteger "), target, resolutionTextPart(".")] }
        : null;
    case "BODYGUARD_COUNTERATTACK":
      return actor && target
        ? { parts: [actor, resolutionTextPart(" contra-atacou "), target, resolutionTextPart(".")] }
        : null;
    case "DOCTOR_PREVENTED_DEATH":
      return target
        ? { parts: [resolutionTextPart("A proteção de Doctor impediu a morte de "), target, resolutionTextPart(".")] }
        : null;
    case "NIGHT_IMMUNITY_PREVENTED_DEATH":
      return target
        ? { parts: [target, resolutionTextPart(" sobreviveu graças à imunidade noturna.")] }
        : null;
    case "PLAYER_ATTACKED":
      return actor && target
        ? { parts: [actor, resolutionTextPart(" realizou um ataque bem-sucedido contra "), target, resolutionTextPart(".")] }
        : target
          ? { parts: [target, resolutionTextPart(" sofreu um ataque bem-sucedido.")] }
          : null;
    case "JANITOR_CLEANED_MAFIA_VICTIM":
      return actor && target
        ? { parts: [actor, resolutionTextPart(" limpou o corpo de "), target, resolutionTextPart(".")] }
        : null;
    case "EXECUTIONER_BECAME_JESTER":
      return actor && target
        ? { parts: [actor, resolutionTextPart(" virou Jester porque seu alvo "), target, resolutionTextPart(" morreu durante a noite.")] }
        : null;
    case "WITCH_CURSE_WIN_TRIGGERED":
      return actor
        ? { parts: [actor, resolutionTextPart(" cumpriu sua condição de vitória como Witch.")] }
        : null;
    case "WITCH_DEATH_KILLED_CURSED_PLAYERS":
      return actor
        ? { parts: [resolutionTextPart("A morte de "), actor, resolutionTextPart(" ativou a variante que mata jogadores amaldiçoados.")] }
        : null;
    case "MAFIA_MEMBER_RANDOMLY_SELECTED":
      if (event.reasonCode === "VETERAN_MAFIA_VISITOR_SELECTED" && actor && target) {
        return { parts: [target, resolutionTextPart(" foi sorteado para representar a visita da Máfia contra "), actor, resolutionTextPart(".")] };
      }
      if (event.reasonCode === "BODYGUARD_MAFIA_TARGET_SELECTED" && actor && target) {
        return { parts: [target, resolutionTextPart(" foi sorteado como alvo do contra-ataque de "), actor, resolutionTextPart(".")] };
      }
      return actor && target
        ? { parts: [actor, resolutionTextPart(" foi escolhido como responsável pelo ataque da Máfia contra "), target, resolutionTextPart(".")] }
        : null;
    case "AMNESIAC_REMEMBERED_ROLE":
      return actor
        ? { parts: [actor, resolutionTextPart(" lembrou uma nova role como Amnesiac.")] }
        : null;
    default:
      return null;
  }
}
