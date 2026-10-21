import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after, before } from "node:test";

import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { get, ref, remove, set, update } from "firebase/database";

let environment: RulesTestEnvironment;
const projectId = "demo-townofsalem";
const resetGameFixture = {
  hostUid: "host",
  public: {
    code: "RESET1",
    status: "in-progress",
    phase: "night",
    day: 2,
    currentNightId: "night-current",
  },
  settings: {
    roleComposition: { doctor: 1, mafioso: 1 },
    rolesAssignedAt: 1,
  },
  players: {
    player: {
      name: "Player",
      alive: false,
      disconnected: false,
      experience: "beginner",
      seat: 1,
    },
    other: {
      name: "Other",
      alive: true,
      disconnected: true,
      experience: "experienced",
      seat: 2,
    },
  },
  privatePlayers: {
    player: { roleId: "doctor", faction: "town" },
    other: { roleId: "mafioso", faction: "mafia" },
  },
  votes: { 2: { accusations: { player: "other" } } },
};

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: readFileSync("database.rules.json", "utf8"),
    },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), "games/game"), {
      hostUid: "host",
      public: { code: "ABCDEF", status: "in-progress", phase: "day", day: 1 },
      players: {
        player: { name: "Player", alive: true, disconnected: false, experience: "beginner", seat: 1 },
        other: { name: "Other", alive: true, disconnected: false, experience: "experienced", seat: 2 },
        newRole: { name: "New Role", alive: true, disconnected: false, experience: "experienced", seat: 3 },
      },
      privatePlayers: {
        player: { roleId: "doctor", faction: "town" },
        other: { roleId: "sheriff", faction: "town" },
      },
    });
    await set(ref(context.database(), "games/lobbyGame"), {
      hostUid: "host",
      public: { code: "QWERTY", status: "lobby", phase: "lobby", day: 0 },
      settings: { maxPlayers: 15 },
    });
    await set(ref(context.database(), "games/startGame"), {
      hostUid: "host",
      public: { code: "START1", status: "lobby", phase: "lobby", day: 0 },
      settings: { maxPlayers: 15, roleComposition: { doctor: 1 } },
      players: {
        player: { name: "Player", alive: true, disconnected: false, experience: "beginner", seat: 1 },
      },
    });
    await set(ref(context.database(), "games/resetGame"), resetGameFixture);

    // Partida em fase de acusação, para os testes de votação e submissão de noite.
    await set(ref(context.database(), "games/voteGame"), {
      hostUid: "host",
      public: {
        code: "VOTE01",
        status: "in-progress",
        phase: "discussion",
        day: 3,
        currentNightId: "night-current",
      },
      players: {
        player: { name: "Player", alive: true, disconnected: false, experience: "beginner", seat: 1 },
        other: { name: "Other", alive: true, disconnected: false, experience: "beginner", seat: 2 },
        third: { name: "Third", alive: true, disconnected: false, experience: "beginner", seat: 3 },
        ghost: { name: "Ghost", alive: false, disconnected: false, experience: "beginner", seat: 4 },
      },
      privatePlayers: {
        player: { roleId: "sheriff", faction: "town" },
        other: { roleId: "doctor", faction: "town" },
        third: { roleId: "mafioso", faction: "mafia" },
        ghost: { roleId: "townie", faction: "town" },
      },
      nightSessions: { "night-current": { id: "night-current" } },
    });
  });
});

after(async () => environment?.cleanup());

const VOTE = "games/voteGame";

async function setPhase(phase: string, extra: Record<string, unknown> = {}) {
  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}/public`), { phase, ...extra });
  });
}

test("players may cast and clear their own accusation during an accusation phase", async () => {
  await setPhase("discussion", { accusedPlayerUid: null, verdictClosedAt: null });
  const player = environment.authenticatedContext("player").database();

  await assertSucceeds(set(ref(player, `${VOTE}/votes/3/accusations/player`), "other"));
  // .validate não roda em deleção: retirar o voto é permitido.
  await assertSucceeds(set(ref(player, `${VOTE}/votes/3/accusations/player`), null));

  await setPhase("day");
  await assertSucceeds(set(ref(player, `${VOTE}/votes/3/accusations/player`), "other"));
});

test("accusation writes are rejected outside the accusation phases", async () => {
  const player = environment.authenticatedContext("player").database();

  for (const phase of ["night", "trial", "defense", "verdict"]) {
    await setPhase(phase);
    await assertFails(set(ref(player, `${VOTE}/votes/3/accusations/player`), "other"));
  }
});

test("a player cannot vote for someone else, on the wrong day, or against a dead or self target", async () => {
  await setPhase("discussion", { accusedPlayerUid: null });
  const player = environment.authenticatedContext("player").database();
  const ghost = environment.authenticatedContext("ghost").database();

  await assertFails(set(ref(player, `${VOTE}/votes/3/accusations/other`), "third"));
  await assertFails(set(ref(player, `${VOTE}/votes/9/accusations/player`), "other"));
  await assertFails(set(ref(player, `${VOTE}/votes/3/accusations/player`), "ghost"));
  await assertFails(set(ref(player, `${VOTE}/votes/3/accusations/player`), "player"));
  await assertFails(set(ref(ghost, `${VOTE}/votes/3/accusations/ghost`), "other"));
});

test("once a trial is claimed no further accusations are accepted", async () => {
  await setPhase("discussion", { accusedPlayerUid: "third" });
  const player = environment.authenticatedContext("player").database();

  await assertFails(set(ref(player, `${VOTE}/votes/3/accusations/player`), "other"));
});

test("the live accusation tally is readable by members only", async () => {
  await setPhase("discussion", { accusedPlayerUid: null });
  const player = environment.authenticatedContext("player").database();
  const stranger = environment.authenticatedContext("stranger").database();

  await assertSucceeds(get(ref(player, `${VOTE}/votes/3/accusations`)));
  await assertFails(get(ref(stranger, `${VOTE}/votes/3/accusations`)));
});

test("verdict votes are public to the game while they are cast", async () => {
  await setPhase("verdict", { accusedPlayerUid: "third", verdictClosedAt: null, verdictOutcome: null });
  const player = environment.authenticatedContext("player").database();
  const other = environment.authenticatedContext("other").database();

  await assertSucceeds(set(ref(player, `${VOTE}/votes/3/verdicts/player`), "guilty"));
  // Todo mundo na partida vê cada voto (e cada troca) na hora.
  await assertSucceeds(get(ref(other, `${VOTE}/votes/3/verdicts`)));
  await assertSucceeds(get(ref(player, `${VOTE}/votes/3/verdicts`)));
  // Quem não está na partida, não.
  await assertFails(get(ref(environment.authenticatedContext("stranger").database(), `${VOTE}/votes/3/verdicts`)));
  // E ninguém vota no lugar de outro.
  await assertFails(set(ref(other, `${VOTE}/votes/3/verdicts/player`), "innocent"));
});

test("the accused cannot vote, and nobody votes after the verdict closes", async () => {
  await setPhase("verdict", { accusedPlayerUid: "player", verdictClosedAt: null });
  const player = environment.authenticatedContext("player").database();
  const other = environment.authenticatedContext("other").database();

  await assertFails(set(ref(player, `${VOTE}/votes/3/verdicts/player`), "innocent"));
  await assertFails(set(ref(other, `${VOTE}/votes/3/verdicts/other`), "maybe"));
  await assertSucceeds(set(ref(other, `${VOTE}/votes/3/verdicts/other`), "abstain"));

  await setPhase("verdict", { verdictClosedAt: 123 });
  await assertFails(set(ref(other, `${VOTE}/votes/3/verdicts/other`), "guilty"));
});

test("a player submits their own night action and nobody else can read it", async () => {
  await setPhase("night", { accusedPlayerUid: null, verdictClosedAt: null });
  const player = environment.authenticatedContext("player").database();
  const other = environment.authenticatedContext("other").database();
  const submission = {
    nightId: "night-current",
    nightNumber: 2,
    actionId: "interrogate",
    roleIdSnapshot: "sheriff",
    targetUids: ["other"],
    createdAt: 1,
    updatedAt: 1,
  };

  await assertSucceeds(set(ref(player, `${VOTE}/playerNightActions/night-current/player/interrogate`), submission));
  await assertSucceeds(get(ref(player, `${VOTE}/playerNightActions/night-current/player`)));
  await assertFails(get(ref(other, `${VOTE}/playerNightActions/night-current/player`)));
  await assertSucceeds(get(ref(environment.authenticatedContext("host").database(), `${VOTE}/playerNightActions/night-current`)));

  // Não dá para escrever no nó de outro jogador nem se passar por outra role.
  await assertFails(set(ref(other, `${VOTE}/playerNightActions/night-current/player/interrogate`), submission));
  await assertFails(set(ref(player, `${VOTE}/playerNightActions/night-current/player/interrogate`), { ...submission, roleIdSnapshot: "godfather" }));
  await assertFails(set(ref(player, `${VOTE}/playerNightActions/night-current/player/interrogate`), { ...submission, targetUids: ["ghost-que-nao-existe"] }));

  // Até a noite acabar o jogador troca o alvo ou apaga a escolha.
  await assertSucceeds(set(ref(player, `${VOTE}/playerNightActions/night-current/player/interrogate`), { ...submission, targetUids: ["player"], updatedAt: 2 }));
  await assertSucceeds(remove(ref(player, `${VOTE}/playerNightActions/night-current/player/interrogate`)));
  await assertFails(remove(ref(player, `${VOTE}/playerNightActions/night-current/player`)));
});

test("night submissions are rejected off-phase, off-night, when dead, and after resolution", async () => {
  const player = environment.authenticatedContext("player").database();
  const ghost = environment.authenticatedContext("ghost").database();
  const submission = {
    nightId: "night-current",
    nightNumber: 2,
    actionId: "interrogate",
    roleIdSnapshot: "sheriff",
    targetUids: ["other"],
    createdAt: 1,
    updatedAt: 1,
  };
  const path = `${VOTE}/playerNightActions/night-current/player/interrogate`;
  // Limpa o que o teste anterior deixou.
  await environment.withSecurityRulesDisabled(async (context) => {
    await remove(ref(context.database(), `${VOTE}/playerNightActions`));
  });

  await setPhase("discussion");
  await assertFails(set(ref(player, path), submission));

  await setPhase("night");
  await assertSucceeds(set(ref(player, path), submission));
  await assertFails(set(ref(ghost, `${VOTE}/playerNightActions/night-current/ghost/x`), { ...submission, actionId: "x", roleIdSnapshot: "townie" }));

  // Noite diferente da corrente.
  await assertFails(set(ref(player, `${VOTE}/playerNightActions/night-old/player/interrogate`), { ...submission, nightId: "night-old" }));

  // Depois que o mestre resolve a noite, o envio fecha — e reabre no rollback.
  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}/nightSessions/night-current`), { resolutionAppliedAt: 999 });
  });
  const otherActionPath = `${VOTE}/playerNightActions/night-current/player/second-look`;
  const otherAction = { ...submission, actionId: "second-look", updatedAt: 2 };
  await assertFails(set(ref(player, otherActionPath), otherAction));

  // O rollback reabre a noite: o jogador volta a poder mudar as escolhas.
  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}/nightSessions/night-current`), { resolutionAppliedAt: null });
  });
  await assertSucceeds(set(ref(player, otherActionPath), otherAction));
  await assertSucceeds(set(ref(player, path), { ...submission, updatedAt: 3 }));
});

test("night results: instant ones reach only their owner, dawn ones wait for the night to end", async () => {
  const host = environment.authenticatedContext("host").database();
  const player = environment.authenticatedContext("player").database();
  const other = environment.authenticatedContext("other").database();
  const line = { parts: [{ kind: "text", text: "Você investigou alguém." }] };
  const dawn = { nightNumber: 2, lines: [line], createdAt: 1 };

  await setPhase("night");
  // Só o mestre escreve resultados.
  await assertFails(set(ref(player, `${VOTE}/playerInstantResults/player/night-current/investigation-x`), { nightNumber: 2, line, createdAt: 1 }));
  await assertFails(set(ref(player, `${VOTE}/playerDawnResults/player/night-current`), dawn));
  await assertFails(set(ref(player, `${VOTE}/dayAnnouncements/night-current`), dawn));
  await assertSucceeds(set(ref(host, `${VOTE}/playerInstantResults/player/night-current/investigation-x`), { nightNumber: 2, line, createdAt: 1 }));
  await assertSucceeds(set(ref(host, `${VOTE}/playerDawnResults/player/night-current`), dawn));
  await assertSucceeds(set(ref(host, `${VOTE}/dayAnnouncements/night-current`), dawn));

  // O resultado instantâneo é do dono, na hora.
  await assertSucceeds(get(ref(player, `${VOTE}/playerInstantResults/player`)));
  await assertFails(get(ref(other, `${VOTE}/playerInstantResults/player`)));

  // O amanhecer fica fechado durante a noite, mesmo já aplicado.
  await assertFails(get(ref(player, `${VOTE}/playerDawnResults/player`)));
  await assertFails(get(ref(player, `${VOTE}/dayAnnouncements`)));

  await setPhase("day");
  await assertSucceeds(get(ref(player, `${VOTE}/playerDawnResults/player`)));
  await assertFails(get(ref(other, `${VOTE}/playerDawnResults/player`)));
  await assertSucceeds(get(ref(player, `${VOTE}/dayAnnouncements`)));
  await assertSucceeds(get(ref(other, `${VOTE}/dayAnnouncements`)));
  await assertFails(get(ref(environment.authenticatedContext("stranger").database(), `${VOTE}/dayAnnouncements`)));
});

test("actions without a target are accepted: the RTDB drops empty lists", async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await remove(ref(context.database(), `${VOTE}/playerNightActions`));
    await update(ref(context.database(), `${VOTE}/nightSessions/night-current`), { resolutionAppliedAt: null });
  });
  await setPhase("night");
  const player = environment.authenticatedContext("player").database();
  const host = environment.authenticatedContext("host").database();
  // `targetUids: []` chega ao servidor sem o campo; o alerta do Veteran precisa passar mesmo assim.
  const alert = { nightId: "night-current", nightNumber: 2, actionId: "alert", roleIdSnapshot: "sheriff", targetUids: [], createdAt: 1, updatedAt: 1 };

  await assertSucceeds(set(ref(player, `${VOTE}/playerNightActions/night-current/player/alert`), alert));
  await assertSucceeds(set(ref(host, `${VOTE}/hostNightActions/night-current/player-player-alert`), {
    ...alert,
    id: "player-player-alert",
    actorUid: "player",
    status: "confirmed",
  }));
});

test("only vampires see the vampires: team and live picks", async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}`), {
      vampireTeam: { player: { roleId: "vampire" } },
      "players/player/alive": true,
    });
  });
  await setPhase("night", { currentNightId: "night-current" });
  const vampire = environment.authenticatedContext("player").database();
  const town = environment.authenticatedContext("other").database();
  await assertSucceeds(get(ref(vampire, `${VOTE}/vampireTeam`)));
  await assertFails(get(ref(town, `${VOTE}/vampireTeam`)));
  await assertSucceeds(set(ref(vampire, `${VOTE}/vampireBoard/night-current/player/vampire-bite-vote`), { targetUids: ["other"], locked: false, updatedAt: 1 }));
  await assertSucceeds(get(ref(vampire, `${VOTE}/vampireBoard/night-current`)));
});

test("only the mafia sees the mafia: team, live picks and reactions", async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}`), {
      mafiaTeam: { player: { roleId: "godfather" }, third: { roleId: "mafioso" } },
      mafiaBoard: null,
      mafiaReactions: null,
      "players/player/alive": true,
      "players/other/alive": true,
    });
  });
  await setPhase("night", { currentNightId: "night-current" });
  const mafia = environment.authenticatedContext("player").database();
  const town = environment.authenticatedContext("other").database();
  const pick = `${VOTE}/mafiaBoard/night-current/player/mafia-kill-vote`;

  // Quem é da Máfia: só a Máfia lê; ninguém além do mestre escreve.
  await assertSucceeds(get(ref(mafia, `${VOTE}/mafiaTeam`)));
  await assertFails(get(ref(town, `${VOTE}/mafiaTeam`)));
  await assertFails(set(ref(town, `${VOTE}/mafiaTeam/other`), { roleId: "godfather" }));
  await assertFails(set(ref(mafia, `${VOTE}/mafiaTeam/other`), { roleId: "mafioso" }));

  // Escolha ao vivo: troca à vontade até confirmar; confirmada, trava.
  await assertSucceeds(set(ref(mafia, pick), { targetUids: ["other"], locked: false, updatedAt: 1 }));
  await assertSucceeds(set(ref(mafia, pick), { targetUids: ["third"], locked: false, updatedAt: 2 }));
  await assertSucceeds(set(ref(mafia, pick), { targetUids: ["other"], locked: true, updatedAt: 3 }));
  await assertFails(set(ref(mafia, pick), { targetUids: ["third"], locked: false, updatedAt: 4 }));
  await assertSucceeds(get(ref(mafia, `${VOTE}/mafiaBoard/night-current`)));
  await assertFails(get(ref(town, `${VOTE}/mafiaBoard/night-current`)));
  await assertFails(set(ref(town, `${VOTE}/mafiaBoard/night-current/other/x`), { targetUids: ["player"], updatedAt: 1 }));

  // Reações: só membros vivos, em nome próprio, à noite.
  await assertSucceeds(set(ref(mafia, `${VOTE}/mafiaReactions/night-current/r1`), { uid: "player", key: "trust", at: 1 }));
  await assertFails(set(ref(mafia, `${VOTE}/mafiaReactions/night-current/r2`), { uid: "third", key: "no", at: 1 }));
  await assertFails(set(ref(town, `${VOTE}/mafiaReactions/night-current/r3`), { uid: "other", key: "go", at: 1 }));
  await assertFails(get(ref(town, `${VOTE}/mafiaReactions/night-current`)));

  await setPhase("discussion");
  await assertFails(set(ref(mafia, `${VOTE}/mafiaReactions/night-current/r4`), { uid: "player", key: "ok", at: 2 }));
});

test("the pace is set in the lobby; in fast track a living player can pass the night once", async () => {
  const host = environment.authenticatedContext("host").database();
  const player = environment.authenticatedContext("player").database();
  const other = environment.authenticatedContext("other").database();

  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}/public`), { status: "lobby", phase: "lobby" });
  });
  await assertSucceeds(set(ref(host, `${VOTE}/public/gamePace`), "fast"));
  await assertFails(set(ref(host, `${VOTE}/public/gamePace`), "turbo"));
  await assertFails(set(ref(player, `${VOTE}/public/gamePace`), "normal"));
  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}/public`), { status: "in-progress" });
    await update(ref(context.database(), `${VOTE}`), { "players/player/alive": true, nightPasses: null });
  });
  await assertFails(set(ref(host, `${VOTE}/public/gamePace`), "relaxed"));

  await setPhase("night", { currentNightId: "night-current" });
  await assertSucceeds(set(ref(player, `${VOTE}/nightPasses/night-current/player`), 1));
  await assertFails(set(ref(player, `${VOTE}/nightPasses/night-current/player`), 2));
  await assertFails(set(ref(other, `${VOTE}/nightPasses/night-current/player`), 1));
  await assertFails(get(ref(other, `${VOTE}/nightPasses/night-current/player`)));
  await assertFails(set(ref(player, `${VOTE}/nightPasses/night-old/player`), 1));
});

test("in the preparation a living player marks themselves ready once, and the game sees it", async () => {
  const player = environment.authenticatedContext("player").database();
  const other = environment.authenticatedContext("other").database();
  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}`), { "public/status": "in-progress", "players/player/alive": true, dawnReady: null });
  });

  await setPhase("discussion", { day: 3 });
  await assertFails(set(ref(player, `${VOTE}/dawnReady/3/player`), 1));

  await setPhase("day", { day: 3 });
  await assertSucceeds(set(ref(player, `${VOTE}/dawnReady/3/player`), 1));
  await assertFails(set(ref(player, `${VOTE}/dawnReady/3/player`), 2));
  await assertFails(set(ref(other, `${VOTE}/dawnReady/3/player`), 1));
  await assertFails(set(ref(player, `${VOTE}/dawnReady/2/player`), 1));
  await assertSucceeds(get(ref(other, `${VOTE}/dawnReady/3`)));
});

test("unauthenticated and cross-player secret reads fail", async () => {
  await assertFails(get(ref(environment.unauthenticatedContext().database(), "games/game/public")));
  const player = environment.authenticatedContext("player").database();
  await assertSucceeds(get(ref(player, "games/game/privatePlayers/player")));
  await assertFails(get(ref(player, "games/game/privatePlayers/other")));
  await assertFails(get(ref(player, "games/game/privatePlayers")));
});

test("the play mode is chosen in the lobby and frozen once the game starts", async () => {
  const host = environment.authenticatedContext("host").database();
  const player = environment.authenticatedContext("player").database();
  const field = `${VOTE}/public/playMode`;

  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}/public`), { status: "lobby", phase: "lobby" });
  });
  await assertSucceeds(set(ref(host, field), "hostless"));
  await assertFails(set(ref(host, field), "anarchy"));
  await assertFails(set(ref(player, field), "hosted"));

  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}/public`), { status: "in-progress", phase: "night" });
  });
  await assertFails(set(ref(host, field), "hosted"));
  await assertSucceeds(set(ref(host, field), "hostless"));
});

test("only the real mayor reveals themselves, alive, by day, once", async () => {
  const player = environment.authenticatedContext("player").database();
  const other = environment.authenticatedContext("other").database();
  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}`), {
      "privatePlayers/player/roleId": "mayor",
      "privatePlayers/other/roleId": "sheriff",
      "players/player/alive": true,
      mayorReveals: null,
    });
  });

  await setPhase("night");
  await assertFails(set(ref(player, `${VOTE}/mayorReveals/player`), 1));

  await setPhase("discussion");
  await assertFails(set(ref(other, `${VOTE}/mayorReveals/other`), 1));
  await assertFails(set(ref(other, `${VOTE}/mayorReveals/player`), 1));
  await assertSucceeds(set(ref(player, `${VOTE}/mayorReveals/player`), 1));
  await assertFails(set(ref(player, `${VOTE}/mayorReveals/player`), 2));
  await assertSucceeds(get(ref(other, `${VOTE}/mayorReveals`)));
});

test("a lynched jester picks one guilty voter, once, during the verdict", async () => {
  const jester = environment.authenticatedContext("player").database();
  const other = environment.authenticatedContext("other").database();
  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}`), {
      "privatePlayers/player/statuses/jester-revenge-pending": { type: "jester-revenge-pending" },
      "privatePlayers/other/statuses/jester-revenge-pending": null,
      "players/player/alive": false,
      "players/other/alive": true,
      "votes/3/verdicts": { other: "guilty", third: "innocent" },
      jesterRevenge: null,
    });
  });
  await setPhase("verdict", { verdictClosedAt: 123, verdictOutcome: "guilty", accusedPlayerUid: "player" });

  // Só quem votou culpado; e só quem tem a vingança pendente.
  await assertFails(set(ref(jester, `${VOTE}/jesterRevenge/3/player`), "third"));
  await assertFails(set(ref(other, `${VOTE}/jesterRevenge/3/other`), "player"));
  await assertSucceeds(set(ref(jester, `${VOTE}/jesterRevenge/3/player`), "other"));
  await assertFails(set(ref(jester, `${VOTE}/jesterRevenge/3/player`), "other"));
  await assertFails(get(ref(other, `${VOTE}/jesterRevenge/3/player`)));

  await environment.withSecurityRulesDisabled(async (context) => {
    await update(ref(context.database(), `${VOTE}`), {
      "privatePlayers/player/statuses/jester-revenge-pending": null,
      "players/player/alive": true,
      jesterRevenge: null,
    });
  });
});

test("malicious player administrative writes fail", async () => {
  const player = environment.authenticatedContext("player").database();
  await assertFails(update(ref(player), { "games/game/public/phase": "night" }));
  await assertFails(update(ref(player), { "games/game/players/other/alive": false }));
  await assertFails(set(ref(player, "games/game/hostNightActions/night/action"), { id: "action" }));
  await assertFails(set(ref(player, "games/game/hostNotes/night/note"), { id: "note" }));
  await assertFails(set(ref(player, "games/game/nightResolutions/night"), { id: "resolution" }));
  await assertFails(set(ref(player, "games/game/events/event"), { type: "GAME_ENDED", timestamp: 1, payload: {} }));
});

test("host can operate protected branches while Event History stays append-only", async () => {
  const host = environment.authenticatedContext("host").database();
  await assertSucceeds(update(ref(host), { "games/game/public/phase": "night" }));
  await assertSucceeds(set(ref(host, "games/game/events/event"), { type: "PHASE_CHANGED", timestamp: 1, actorUid: "host", visibility: "host-only", payload: { to: "night" } }));
  await assertFails(update(ref(host, "games/game/events/event"), { timestamp: 2 }));
  const snapshot = await assertSucceeds(get(ref(host, "games/game/privatePlayers")));
  assert.equal(snapshot.child("player/roleId").val(), "doctor");
});

test("host can atomically start the game in an untimed Night 1", async () => {
  const host = environment.authenticatedContext("host").database();

  await assertSucceeds(update(ref(host), {
    "games/startGame/public/status": "in-progress",
    "games/startGame/public/phase": "night",
    "games/startGame/public/phaseLabel": "Noite",
    "games/startGame/public/phaseSessionId": "phase-night-1",
    "games/startGame/public/currentNightId": "night-1-id",
    "games/startGame/public/phaseSequenceNumber": 1,
    "games/startGame/public/nightNumber": 1,
    "games/startGame/public/phaseEndsAt": null,
    "games/startGame/public/timerPaused": false,
    "games/startGame/public/timerRemainingMs": null,
    "games/startGame/settings/rolesAssignedAt": 1234,
    "games/startGame/privatePlayers/player": { roleId: "doctor", faction: "town" },
    "games/startGame/phaseSessions/phase-night-1": {
      id: "phase-night-1",
      phaseId: "night",
      label: "Noite",
      startedAt: 1234,
      sequenceNumber: 1,
      nightId: "night-1-id",
    },
    "games/startGame/nightSessions/night-1-id": {
      id: "night-1-id",
      phaseSessionId: "phase-night-1",
      nightNumber: 1,
      startedAt: 1234,
    },
  }));
});

test("host can end a game without declaring winners", async () => {
  const host = environment.authenticatedContext("host").database();

  await assertSucceeds(update(ref(host), {
    "games/game/public/status": "finished",
    "games/game/public/phase": "game-over",
    "games/game/public/phaseLabel": "Fim de jogo",
    "games/game/public/phaseEndsAt": null,
    "games/game/public/timerPaused": false,
    "games/game/public/timerRemainingMs": 0,
    "games/game/public/winningFactions": [],
    "games/game/public/winningPlayerUids": [],
    "games/game/public/gameEndedAt": 1,
    "games/game/events/game-ended": {
      type: "GAME_ENDED",
      timestamp: 1,
      actorUid: "host",
      visibility: "public",
      payload: {
        endedByHost: true,
        winningFactions: [],
        winningPlayerUids: [],
      },
    },
  }));
});

test("host can return an active game to the lobby without removing players", async () => {
  const host = environment.authenticatedContext("host").database();

  await assertSucceeds(update(ref(host), {
    "games/resetGame/public/status": "lobby",
    "games/resetGame/public/phase": "lobby",
    "games/resetGame/public/day": 0,
    "games/resetGame/public/currentNightId": null,
    "games/resetGame/settings/rolesAssignedAt": null,
    "games/resetGame/privatePlayers": null,
    "games/resetGame/votes": null,
    "games/resetGame/players/player/alive": true,
    "games/resetGame/players/other/alive": true,
    "games/resetGame/events/game-ended": {
      type: "GAME_ENDED",
      timestamp: 2,
      actorUid: "host",
      visibility: "public",
      payload: { endedByHost: true, returnedToLobby: true },
    },
  }));

  const [publicGame, settings, privatePlayers, players] = await Promise.all([
    assertSucceeds(get(ref(host, "games/resetGame/public"))),
    assertSucceeds(get(ref(host, "games/resetGame/settings"))),
    assertSucceeds(get(ref(host, "games/resetGame/privatePlayers"))),
    assertSucceeds(get(ref(host, "games/resetGame/players"))),
  ]);
  assert.equal(publicGame.child("status").val(), "lobby");
  assert.equal(publicGame.child("phase").val(), "lobby");
  assert.equal(settings.child("rolesAssignedAt").exists(), false);
  assert.equal(privatePlayers.exists(), false);
  assert.equal(players.child("player/alive").val(), true);
  assert.equal(players.child("other/alive").val(), true);
  assert.equal(players.size, 2);
});

test("host can save every new role and valid physical copy counts", async () => {
  const host = environment.authenticatedContext("host").database();
  await assertSucceeds(update(ref(host), {
    "games/lobbyGame/settings/roleComposition": {
      townie: 8,
      politician: 2,
      werewolf: 1,
    },
  }));
  await assertSucceeds(set(ref(host, "games/game/privatePlayers/newRole"), {
    roleId: "werewolf",
    faction: "neutral",
  }));
});

test("only the host can add a simulated player with a bot key", async () => {
  const host = environment.authenticatedContext("host").database();
  const player = environment.authenticatedContext("intruder").database();
  const bot = {
    name: "Bot 1",
    isBot: true,
    alive: true,
    disconnected: false,
    experience: "experienced",
    seat: 1,
  };

  await assertSucceeds(
    set(ref(host, "games/lobbyGame/players/bot-test"), bot),
  );
  await assertSucceeds(
    update(ref(host, "games/lobbyGame/players/bot-test"), {
      name: "Jogador reserva",
    }),
  );
  await assertFails(
    set(ref(player, "games/lobbyGame/players/intruder"), bot),
  );
  await assertFails(
    update(ref(player, "games/lobbyGame/players/bot-test"), {
      name: "Nome adulterado",
    }),
  );
});

test("role composition rejects unknown roles and counts above the deck limit", async () => {
  const host = environment.authenticatedContext("host").database();
  await assertFails(set(
    ref(host, "games/lobbyGame/settings/roleComposition/townie"),
    9,
  ));
  await assertFails(set(
    ref(host, "games/lobbyGame/settings/roleComposition/invented-role"),
    1,
  ));
});

test("the graveyard reveals dead roles to every player while only the host buries", async () => {
  const host = environment.authenticatedContext("host").database();
  const player = environment.authenticatedContext("player").database();

  await assertSucceeds(set(ref(host, "games/game/graveyard/other"), { roleId: "mafioso", cleaned: false, diedAt: 10 }));
  // A body cleaned by the Janitor is buried without its role.
  await assertSucceeds(set(ref(host, "games/game/graveyard/newRole"), { cleaned: true, diedAt: 20 }));

  const grave = await assertSucceeds(get(ref(player, "games/game/graveyard")));
  assert.equal(grave.child("other/roleId").val(), "mafioso");
  assert.equal(grave.child("newRole/roleId").val(), null);

  await assertFails(set(ref(player, "games/game/graveyard/player"), { roleId: "doctor", cleaned: false, diedAt: 30 }));
  await assertFails(set(ref(host, "games/game/graveyard/other"), { roleId: "not-a-role", cleaned: false, diedAt: 10 }));
  await assertFails(set(ref(host, "games/game/graveyard/other"), { roleId: "mafioso", cleaned: false }));
  await assertFails(set(ref(host, "games/game/graveyard/ghost"), { cleaned: true, diedAt: 10 }));
});
