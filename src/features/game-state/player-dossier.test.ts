import assert from "node:assert/strict";
import test from "node:test";

import { describeGraveyardDeath } from "./graveyard-entry";
import { getPlayerDossier } from "./player-dossier";

const playerNames = { ana: "Ana", bia: "Bia" };
const mention = (uid: string, text: string) => ({ parts: [{ kind: "player" as const, playerUid: uid, text }] });

test("collects announcements, own actions and own results about one player, by night", () => {
  const entries = getPlayerDossier({
    targetUid: "ana",
    announcements: {
      n2: { nightNumber: 2, createdAt: 2, lines: [mention("ana", "Ana"), mention("bia", "Bia")] },
    },
    dawnResults: { n1: { nightNumber: 1, createdAt: 1, lines: [mention("ana", "Ana foi atacada")] } },
    instantResults: { n2: { r1: { nightNumber: 2, createdAt: 2, line: mention("bia", "Bia") } } },
    submissions: {
      n1: {
        heal: { nightId: "n1", nightNumber: 1, actionId: "heal", roleIdSnapshot: "doctor", targetUids: ["ana"], createdAt: 1, updatedAt: 1 },
      },
      n2: {
        heal: { nightId: "n2", nightNumber: 2, actionId: "heal", roleIdSnapshot: "doctor", targetUids: ["ana"], skipped: true, createdAt: 2, updatedAt: 2 },
      },
    },
    nightNumberById: { n1: 1, n2: 2 },
    playerNames,
  });

  assert.deepEqual(
    entries.map(({ nightNumber, visibility }) => [nightNumber, visibility]),
    [[1, "private"], [1, "private"], [2, "public"]],
  );
});

test("describes when and how a player died from the tombstone", () => {
  assert.deepEqual(
    describeGraveyardDeath({ cleaned: false, diedAt: 1, diedPhase: "day", diedNumber: 2, cause: "hanging" }),
    { cause: "Enforcado pela cidade", when: "Dia 2" },
  );
  assert.deepEqual(
    describeGraveyardDeath({ cleaned: true, diedAt: 1, diedPhase: "night", diedNumber: 1, cause: "mafia-attack" }),
    { cause: "Morto pela Máfia", when: "Noite 1" },
  );
  assert.deepEqual(
    describeGraveyardDeath({ cleaned: false, diedAt: 1, diedPhase: "night", diedNumber: 2, cause: "night-attack", killerRoleId: "serial-killer" }),
    { cause: "Morto pelo Serial Killer", when: "Noite 2" },
  );
  assert.equal(describeGraveyardDeath({ cleaned: false, diedAt: 1 }), null);
});
