import assert from "node:assert/strict";
import test from "node:test";

import { withDefaultVariants } from "@/game-engine/variants";
import type { PrivatePlayerRecord, PublicPlayerRecord } from "@/lib/firebase/schema";

import {
  getAccusationTallies,
  getAccusationVotesRequired,
  selectAccusationTrigger,
} from "./accusation-threshold";

function publicPlayer(name: string, alive = true): PublicPlayerRecord {
  return { name, alive, disconnected: false, experience: "beginner" } as PublicPlayerRecord;
}

const players: Record<string, PublicPlayerRecord> = {
  a: publicPlayer("A"),
  b: publicPlayer("B"),
  c: publicPlayer("C"),
  d: publicPlayer("D"),
  e: publicPlayer("E"),
};

const privatePlayers: Record<string, PrivatePlayerRecord> = {
  a: { roleId: "townie", faction: "town" },
  b: { roleId: "townie", faction: "town" },
  c: { roleId: "townie", faction: "town" },
  d: { roleId: "townie", faction: "town" },
  e: { roleId: "townie", faction: "town" },
};

const variants = withDefaultVariants({});

test("five alive players need a strict majority of three", () => {
  assert.equal(getAccusationVotesRequired(players), 3);
});

test("no trigger below the threshold", () => {
  assert.equal(
    selectAccusationTrigger({
      accusations: { a: "e", b: "e" },
      players,
      privatePlayers,
      variants,
    }),
    null,
  );
});

test("triggers once the majority converges on one target", () => {
  const trigger = selectAccusationTrigger({
    accusations: { a: "e", b: "e", c: "e" },
    players,
    privatePlayers,
    variants,
  });
  assert.deepEqual(trigger, { targetUid: "e", votes: 3, votesRequired: 3 });
});

test("a tie at the threshold produces no trigger", () => {
  const sixPlayers = { ...players, f: publicPlayer("F") };
  const sixPrivate = { ...privatePlayers, f: { roleId: "townie", faction: "town" } as PrivatePlayerRecord };
  // 6 vivos -> 4 votos necessarios; forcamos um empate acima do limiar e impossivel,
  // entao usamos limiar fixo de 2 para reproduzir o empate.
  const trigger = selectAccusationTrigger({
    accusations: { a: "e", b: "e", c: "f", d: "f" },
    players: sixPlayers,
    privatePlayers: sixPrivate,
    variants,
    settings: { thresholdMode: "fixed", fixedVotesRequired: 2 },
  });
  assert.equal(trigger, null);
});

test("dead voters are ignored in the tally", () => {
  const withDead = { ...players, a: publicPlayer("A", false) };
  const input = {
    accusations: { a: "e", b: "e", c: "e" },
    players: withDead,
    privatePlayers,
    variants,
  };
  assert.deepEqual(getAccusationTallies(input), [{ targetUid: "e", votes: 2 }]);
  // 4 vivos ainda exigem 3 votos, e so 2 sao validos.
  assert.equal(selectAccusationTrigger(input), null);
});

test("a dead target never triggers a trial", () => {
  const deadTarget = { ...players, e: publicPlayer("E", false) };
  assert.equal(
    selectAccusationTrigger({
      accusations: { a: "e", b: "e", c: "e" },
      players: deadTarget,
      privatePlayers,
      variants,
    }),
    null,
  );
});

test("a revealed mayor carries extra weight", () => {
  // Com 5 jogadores o voto do prefeito revelado vale 2 (getRoleResourceLimit),
  // entao ele sozinho nao atinge os 3 exigidos, mas com mais um voto sim.
  const mayorPrivate: Record<string, PrivatePlayerRecord> = {
    ...privatePlayers,
    a: {
      roleId: "mayor",
      faction: "town",
      statuses: { "mayor-revealed": { type: "mayor-revealed" } },
    } as PrivatePlayerRecord,
  };
  assert.equal(
    selectAccusationTrigger({
      accusations: { a: "e" },
      players,
      privatePlayers: mayorPrivate,
      variants,
    }),
    null,
  );
  const trigger = selectAccusationTrigger({
    accusations: { a: "e", b: "e" },
    players,
    privatePlayers: mayorPrivate,
    variants,
  });
  assert.deepEqual(trigger, { targetUid: "e", votes: 3, votesRequired: 3 });
});

test("a blackmailed voter is discarded when the variant is on", () => {
  const blackmailed: Record<string, PrivatePlayerRecord> = {
    ...privatePlayers,
    c: {
      roleId: "townie",
      faction: "town",
      statuses: { blackmailed: { type: "blackmailed" } },
    } as PrivatePlayerRecord,
  };
  const accusations = { a: "e", b: "e", c: "e" };
  assert.equal(
    selectAccusationTrigger({
      accusations,
      players,
      privatePlayers: blackmailed,
      variants: withDefaultVariants({ blackmailedCannotVote: true }),
    }),
    null,
  );
  assert.ok(
    selectAccusationTrigger({
      accusations,
      players,
      privatePlayers: blackmailed,
      variants: withDefaultVariants({ blackmailedCannotVote: false }),
    }),
  );
});

test("tallies are sorted by weighted vote count", () => {
  const tallies = getAccusationTallies({
    accusations: { a: "e", b: "e", c: "d" },
    players,
    privatePlayers,
    variants,
  });
  assert.deepEqual(tallies, [
    { targetUid: "e", votes: 2 },
    { targetUid: "d", votes: 1 },
  ]);
});
