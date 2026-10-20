import assert from "node:assert/strict";
import test from "node:test";

import { tallyMafiaKill } from "./mafia-kill-projection";

const team = {
  gf: { roleId: "godfather" },
  maf: { roleId: "mafioso" },
  cons: { roleId: "consigliere" },
};

function vote(targetUid: string, locked = true) {
  return { "mafia-kill-vote": { targetUids: [targetUid], locked, updatedAt: 1 } };
}

test("the most voted target dies", () => {
  const tally = tallyMafiaKill({ maf: vote("ana"), cons: vote("ana"), gf: vote("bia") }, team);
  assert.equal(tally.projectedTargetUid, "ana");
  assert.deepEqual(tally.votesByTarget.ana.map(({ uid }) => uid).sort(), ["cons", "maf"]);
});

test("the godfather only breaks a tie", () => {
  assert.equal(tallyMafiaKill({ maf: vote("ana"), gf: vote("bia") }, team).projectedTargetUid, "bia");
  const noGodfather = { maf: { roleId: "mafioso" }, cons: { roleId: "consigliere" } };
  const tied = tallyMafiaKill({ maf: vote("ana"), cons: vote("bia") }, noGodfather);
  assert.equal(tied.projectedTargetUid, null);
  assert.equal(tied.tied, true);
});

test("every saved pick counts, locked or not", () => {
  const tally = tallyMafiaKill({ maf: vote("ana", false), cons: vote("ana", false), gf: vote("bia") }, team);
  assert.equal(tally.projectedTargetUid, "ana");
});

test("picks from outside the team are ignored", () => {
  const tally = tallyMafiaKill({ intruder: vote("ana") }, team);
  assert.deepEqual(tally.votesByTarget, {});
  assert.equal(tally.projectedTargetUid, null);
});
