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

test("the legacy automated actions path stays closed to players", () => {
  assert.match(gameRules.actions[".write"], /hostUid/);
  assert.equal(gameRules.actions.$nightNumber.$uid[".write"], undefined);
});

test("players may only cast their own accusation, while alive and in an accusation phase", () => {
  assert.match(gameRules.votes[".write"], /hostUid/);
  const write = gameRules.votes.$dayNumber.accusations.$uid[".write"] as string;

  assert.match(write, /auth\.uid === \$uid/);
  assert.match(write, /child\('alive'\)\.val\(\) === true/);
  assert.match(write, /'day'/);
  assert.match(write, /'discussion'/);
  // Uma vez que o julgamento começou, nenhuma acusação nova entra.
  assert.match(write, /!.*child\('accusedPlayerUid'\)\.exists\(\)/);
  assert.match(write, /child\('day'\)\.val\(\) \+ '' === \$dayNumber/);

  const validate = gameRules.votes.$dayNumber.accusations.$uid[".validate"] as string;
  assert.match(validate, /newData\.val\(\) !== auth\.uid/, "ninguém se auto-acusa");
  assert.match(validate, /child\('alive'\)\.val\(\) === true/, "o alvo precisa estar vivo");
});

test("verdicts are secret until the host closes them", () => {
  const verdicts = gameRules.votes.$dayNumber.verdicts;

  // Leitura do subnó inteiro só depois de fechado, e sempre restrita ao dia corrente.
  assert.match(verdicts[".read"], /child\('verdictClosedAt'\)\.exists\(\)/);
  assert.match(verdicts[".read"], /child\('day'\)\.val\(\) \+ '' === \$dayNumber/);
  // Antes disso, cada jogador só enxerga o próprio voto.
  assert.equal(verdicts.$uid[".read"], "auth !== null && auth.uid === $uid");

  const write = verdicts.$uid[".write"] as string;
  assert.match(write, /auth\.uid === \$uid/);
  assert.match(write, /child\('phase'\)\.val\(\) === 'verdict'/);
  assert.match(write, /child\('accusedPlayerUid'\)\.val\(\) !== auth\.uid/, "o acusado não vota");
  assert.match(write, /!.*child\('verdictClosedAt'\)\.exists\(\)/);
});

test("player night submissions are private, alive-only and locked after resolution", () => {
  const node = gameRules.playerNightActions.$nightId.$uid;

  assert.match(gameRules.playerNightActions[".read"], /hostUid/);
  assert.equal(node[".read"], "auth !== null && auth.uid === $uid");

  const write = node[".write"] as string;
  assert.match(write, /auth\.uid === \$uid/);
  assert.match(write, /child\('alive'\)\.val\(\) === true/);
  assert.match(write, /child\('phase'\)\.val\(\) === 'night'/);
  assert.match(write, /child\('currentNightId'\)\.val\(\) === \$nightId/);
  assert.match(write, /!.*child\('resolutionAppliedAt'\)\.exists\(\)/);

  // A role enviada é fixada no valor do servidor: não dá para se passar por outra.
  const validate = node.$actionId[".validate"] as string;
  assert.match(validate, /child\('privatePlayers'\)\.child\(\$uid\)\.child\('roleId'\)/);
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
