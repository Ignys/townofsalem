import { expect, test } from "@playwright/test";

async function joinPlayer(page: import("@playwright/test").Page, code: string, name: string) {
  await page.goto("/");
  await expect(page.getByText("Acesso seguro pronto")).toBeVisible();
  await page.getByLabel("Código da sala").fill(code);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Partida encontrada")).toBeVisible();
  await page.getByLabel("Nickname").fill(name);
  await page.getByRole("button", { name: "Entrar na partida" }).click();
  await expect(page).toHaveURL(new RegExp(`/game/${code}$`));
}

test("a player confirms their own night action and it locks for everyone", async ({ browser }) => {
  const contexts = await Promise.all([
    browser.newContext(),
    browser.newContext({ viewport: { width: 375, height: 812 } }),
    browser.newContext({ viewport: { width: 375, height: 812 } }),
    browser.newContext({ viewport: { width: 375, height: 812 } }),
  ]);
  const [host, ana, beto, caio] = await Promise.all(contexts.map((context) => context.newPage()));

  await host.goto("/");
  await expect(host.getByText("Acesso seguro pronto")).toBeVisible();
  await host.getByRole("button", { name: "Criar partida" }).click();
  await expect(host).toHaveURL(/\/host\/[A-Z0-9]{6}$/);
  const code = host.url().split("/").pop()!;

  await joinPlayer(ana, code, "Ana");
  await joinPlayer(beto, code, "Beto");
  await joinPlayer(caio, code, "Caio");
  await expect(host.getByText("Caio", { exact: true })).toBeVisible();

  await host.getByRole("button", { name: /Doctor/ }).click();
  await host.getByRole("button", { name: /Sheriff/ }).click();
  await host.getByRole("button", { name: /Mafioso/ }).click();
  await host.getByRole("button", { name: "Sortear roles" }).click();
  await expect(host.getByRole("heading", { name: "Console do Mestre" })).toBeVisible();
  await expect(host.getByRole("heading", { name: "Noite 1" }).first()).toBeVisible();

  // Cada jogador escolhe no próprio celular. As roles são sorteadas, então
  // dirigimos a UI pela estrutura e não pelo nome de quem calhou de agir.
  // Nem toda role age na Noite 1, então espera até algum dos três ter o painel.
  await expect.poll(async () => {
    const counts = await Promise.all(
      [ana, beto, caio].map((player) => player.getByRole("region", { name: "Sua ação da noite" }).count()),
    );
    return counts.reduce((total, count) => total + count, 0);
  }).toBeGreaterThan(0);

  const submittedTargets: string[] = [];
  for (const player of [ana, beto, caio]) {
    const panel = player.getByRole("region", { name: "Sua ação da noite" });
    if (!(await panel.count())) continue;
    const targets = panel.getByRole("button", { name: /^(Ana|Beto|Caio)$/ });
    if (!(await targets.count())) continue;

    // Escolher não envia nada: dá para cancelar e escolher de novo antes de confirmar.
    await targets.first().click();
    await panel.getByRole("button", { name: "Cancelar" }).click();
    await expect(panel.getByRole("button", { name: "Confirmar" })).toBeDisabled();

    const target = (await targets.last().textContent())?.trim() ?? "";
    await targets.last().click();
    await panel.getByRole("button", { name: "Confirmar" }).click();
    await expect(panel.getByText("Confirmado", { exact: true }).first()).toBeVisible();

    // Depois de confirmar, o jogador não troca mais o alvo.
    await expect(targets.first()).toBeDisabled();
    await expect(panel.getByRole("button", { name: "Confirmar" })).toHaveCount(0);
    submittedTargets.push(target);
  }
  expect(submittedTargets.length, "ao menos um jogador precisa ter ação na Noite 1").toBeGreaterThan(0);

  // As submissões viram linhas do console do mestre, com o alvo do jogador já
  // preenchido e travado: nem o mestre altera o que o jogador confirmou.
  await expect(host.getByText("Confirmado pelo jogador")).toHaveCount(submittedTargets.length);
  const lockedTargets = host.getByRole("combobox", { name: /^Alvo 1/ });
  for (let index = 0; index < submittedTargets.length; index += 1) {
    const combobox = lockedTargets.nth(index);
    await expect(combobox).toBeDisabled();
    await expect(combobox).not.toContainText("Selecionar");
  }

  await Promise.all(contexts.map((context) => context.close()));
});

test("investigations arrive on confirm and starting the day applies the night", async ({ browser }) => {
  const contexts = await Promise.all([
    browser.newContext(),
    browser.newContext({ viewport: { width: 375, height: 812 } }),
    browser.newContext({ viewport: { width: 375, height: 812 } }),
    browser.newContext({ viewport: { width: 375, height: 812 } }),
  ]);
  const [host, ana, beto, caio] = await Promise.all(contexts.map((context) => context.newPage()));
  const players = [ana, beto, caio];

  await host.goto("/");
  await expect(host.getByText("Acesso seguro pronto")).toBeVisible();
  await host.getByRole("button", { name: "Criar partida" }).click();
  await expect(host).toHaveURL(/\/host\/[A-Z0-9]{6}$/);
  const code = host.url().split("/").pop()!;

  await joinPlayer(ana, code, "Ana");
  await joinPlayer(beto, code, "Beto");
  await joinPlayer(caio, code, "Caio");
  await expect(host.getByText("Caio", { exact: true })).toBeVisible();

  await host.getByRole("button", { name: /Doctor/ }).click();
  await host.getByRole("button", { name: /Sheriff/ }).click();
  await host.getByRole("button", { name: /Mafioso/ }).click();
  await host.getByRole("button", { name: "Sortear roles" }).click();
  await expect(host.getByRole("heading", { name: "Noite 1" }).first()).toBeVisible();

  // Quem tiver "Investigar alinhamento" é o Sheriff.
  await expect.poll(async () => {
    const counts = await Promise.all(
      players.map((player) => player.getByRole("heading", { name: "Investigar alinhamento" }).count()),
    );
    return counts.reduce((total, count) => total + count, 0);
  }).toBe(1);
  let sheriff = ana;
  for (const player of players) {
    if (await player.getByRole("heading", { name: "Investigar alinhamento" }).count()) sheriff = player;
  }

  for (const player of players) {
    const panel = player.getByRole("region", { name: "Sua ação da noite" });
    if (!(await panel.count())) continue;
    await panel.getByRole("button", { name: /^(Ana|Beto|Caio)$/ }).first().click();
    await panel.getByRole("button", { name: "Confirmar" }).click();
    await expect(panel.getByText("Confirmado", { exact: true }).first()).toBeVisible();
  }

  // A investigação chega na hora; o resto só ao amanhecer.
  const instant = sheriff.getByRole("region", { name: "Resultado da sua ação" });
  await expect(instant).toContainText(/Você investigou (Ana|Beto|Caio): (suspeito|não suspeito)\./);

  for (const player of players) {
    await expect(player.getByRole("region", { name: "Anúncios do dia" })).toHaveCount(0);
  }

  // Ir para o dia aplica a noite: sem clicar em "Aplicar resultado".
  await host.getByRole("button", { name: "Dia", exact: true }).click();
  await host.getByRole("button", { name: "Sim", exact: true }).click();
  for (const player of players) {
    await expect(player.getByRole("region", { name: "Anúncios do dia" })).toContainText("Noite 1");
  }
  // O mestre vê o mesmo anúncio na área do dia.
  await expect(host.getByText("Anúncios do dia · Noite 1")).toBeVisible();

  await Promise.all(contexts.map((context) => context.close()));
});

test("the veteran has no alert on night 1", async ({ browser }) => {
  const contexts = await Promise.all([
    browser.newContext(),
    browser.newContext({ viewport: { width: 375, height: 812 } }),
    browser.newContext({ viewport: { width: 375, height: 812 } }),
    browser.newContext({ viewport: { width: 375, height: 812 } }),
  ]);
  const [host, ana, beto, caio] = await Promise.all(contexts.map((context) => context.newPage()));
  const players = [ana, beto, caio];

  await host.goto("/");
  await expect(host.getByText("Acesso seguro pronto")).toBeVisible();
  await host.getByRole("button", { name: "Criar partida" }).click();
  await expect(host).toHaveURL(/\/host\/[A-Z0-9]{6}$/);
  const code = host.url().split("/").pop()!;
  await joinPlayer(ana, code, "Ana");
  await joinPlayer(beto, code, "Beto");
  await joinPlayer(caio, code, "Caio");
  await expect(host.getByText("Caio", { exact: true })).toBeVisible();

  await host.getByRole("button", { name: /Veteran/ }).click();
  await host.getByRole("button", { name: /Doctor/ }).click();
  await host.getByRole("button", { name: /Mafioso/ }).click();
  await host.getByRole("button", { name: "Sortear roles" }).click();
  await expect(host.getByRole("heading", { name: "Noite 1" }).first()).toBeVisible();

  // Ninguém mata na primeira noite: o Veteran ainda não tem Alert para usar.
  await expect(ana.getByRole("heading", { name: "Noite 1" }).first()).toBeVisible();
  for (const player of players) {
    await expect(player.getByRole("heading", { name: "Entrar em Alert" })).toHaveCount(0);
  }

  await Promise.all(contexts.map((context) => context.close()));
});
