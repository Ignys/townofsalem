import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const databaseRules = JSON.parse(readFileSync(new URL("../../../database.rules.json", import.meta.url), "utf8"));
const gameRules = databaseRules.rules.games.$gameId;

test("security rules parse and keep every administrative night branch host-only", () => {
  for (const branch of ["phaseSessions", "nightSessions", "hostNightActions", "hostNotes", "nightResolutions", "nightResolutionVersions", "events"]) {
    assert.match(gameRules[branch][".read"], /hostUid/);
    assert.match(gameRules[branch][".write"], /hostUid/);
    assert.doesNotMatch(gameRules[branch][".write"], /auth\.uid === \$uid/);
  }
});

test("players cannot write legacy automated actions or votes in principal mode", () => {
  assert.match(gameRules.actions[".write"], /hostUid/);
  assert.match(gameRules.votes[".write"], /hostUid/);
  assert.equal(gameRules.actions.$nightNumber.$uid[".write"], undefined);
  assert.equal(gameRules.votes.$dayNumber.accusations.$uid[".write"], undefined);
});

test("private roles are readable only by their owner or through the host parent rule", () => {
  assert.match(gameRules.privatePlayers[".read"], /hostUid/);
  assert.match(gameRules.privatePlayers[".write"], /hostUid/);
  assert.equal(gameRules.privatePlayers.$uid[".read"], "auth !== null && auth.uid === $uid");
  assert.equal(gameRules[".read"], undefined);
});

test("simulated player markers are restricted to host-created bot keys", () => {
  const botValidation = gameRules.players.$uid.isBot[".validate"] as string;

  assert.match(botValidation, /hostUid/);
  assert.match(botValidation, /\^bot-/);
  assert.match(botValidation, /newData\.val\(\) === true/);
});

test("phase validation permits free host selection without transition graph checks", () => {
  const validation = gameRules.public.phase[".validate"] as string;
  for (const phase of ["lobby", "day", "discussion", "trial", "defense", "verdict", "night", "custom"]) assert.match(validation, new RegExp(`'${phase}'`));
  assert.match(validation, /newData\.parent\(\)\.child\('status'\)/);
  assert.doesNotMatch(validation, /data\.val\(\) === 'day'/);
});

test("host can atomically return a game to an editable lobby", () => {
  const statusValidation = gameRules.public.status[".validate"] as string;
  const assignmentWrite = gameRules.settings.rolesAssignedAt[".write"] as string;

  assert.match(statusValidation, /in-progress.*lobby/);
  assert.match(assignmentWrite, /hostUid/);
  assert.match(assignmentWrite, /!newData\.exists\(\)/);
});

test("role rules include the complete physical catalog and copy limits", () => {
  const compositionValidation =
    gameRules.settings.roleComposition.$roleId[".validate"] as string;
  const assignmentValidation =
    gameRules.privatePlayers.$uid.roleId[".validate"] as string;

  for (const roleId of [
    "bodyguard",
    "mayor",
    "townie",
    "blackmailer",
    "janitor",
    "amnesiac",
    "werewolf",
    "witch",
  ]) {
    assert.match(compositionValidation, new RegExp(`'${roleId}'`));
    assert.match(assignmentValidation, new RegExp(`'${roleId}'`));
  }

  assert.match(compositionValidation, /townie.*<= 8/);
  assert.match(compositionValidation, /mafioso.*<= 5/);
  assert.match(compositionValidation, /politician.*<= 2/);
});

test("the graveyard is readable by every player but only the host can bury", () => {
  assert.equal(gameRules.graveyard[".read"], "auth !== null");
  assert.match(gameRules.graveyard[".write"], /hostUid/);
  assert.match(gameRules.graveyard.$uid[".validate"], /'cleaned', 'diedAt'/);
  assert.equal(gameRules.graveyard.$uid.$other[".validate"], false);
  // A cleaned grave must be able to omit the role entirely.
  assert.doesNotMatch(gameRules.graveyard.$uid[".validate"], /'roleId'/);
});
