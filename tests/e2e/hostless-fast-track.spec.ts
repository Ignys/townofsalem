import { expect, test, type Page } from "@playwright/test";

async function joinPlayer(page: Page, code: string, name: string) {
  await page.goto("/");
  await expect(page.getByText("Acesso seguro pronto")).toBeVisible();
  await page.getByLabel("Código da sala").fill(code);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Partida encontrada")).toBeVisible();
  await page.getByLabel("Nickname").fill(name);
  await page.getByRole("button", { name: "Entrar na partida" }).click();
  await expect(page).toHaveURL(new RegExp(`/game/${code}$`));
}

/** Pausa o timer da mesa: daqui em diante só "todos fizeram sua parte" avança a fase. */
async function pauseTable(table: Page) {
  const pause = table.getByRole("button", { name: "Pausar timer" });
  await expect(pause).toBeVisible({ timeout: 15_000 });
  await pause.click();
  await expect(table.getByRole("button", { name: "Retomar timer" })).toBeVisible();
}

test("fast track: the night ends when everyone acted and the vote when everyone voted", async ({ browser }) => {
  test.setTimeout(120_000);
  const contexts = await Promise.all([
    browser.newContext(),
    browser.newContext({ viewport: { width: 375, height: 812 } }),
    browser.newContext({ viewport: { width: 375, height: 812 } }),
    browser.newContext({ viewport: { width: 375, height: 812 } }),
  ]);
  const [table, ana, beto, caio] = await Promise.all(contexts.map((context) => context.newPage()));
  const players = [ana, beto, caio];

  await table.goto("/");
  await expect(table.getByText("Acesso seguro pronto")).toBeVisible();
  await table.getByRole("button", { name: "Criar partida" }).click();
  await expect(table).toHaveURL(/\/host\/[A-Z0-9]{6}$/);
  const code = table.url().split("/").pop()!;
  await joinPlayer(ana, code, "Ana");
  await joinPlayer(beto, code, "Beto");
  await joinPlayer(caio, code, "Caio");
  await expect(table.getByText("Caio", { exact: true })).toBeVisible();

  await table.getByRole("button", { name: /Sem mestre/ }).click();
  await table.getByRole("button", { name: /Fast track/ }).click();
  await expect(table.getByRole("button", { name: /Fast track/ })).toHaveAttribute("aria-pressed", "true");
  await table.getByRole("button", { name: /Doctor/ }).click();
  await table.getByRole("button", { name: /Sheriff/ }).click();
  await table.getByRole("button", { name: /Mafioso/ }).click();
  await table.getByRole("button", { name: "Sortear roles" }).click();
  await expect(table.getByText("A cidade dorme.")).toBeVisible();
  await pauseTable(table);

  // Todo mundo com ação age (um confirma, outro passa): a noite acaba mesmo com o timer pausado.
  let passed = false;
  for (const player of players) {
    const panel = player.getByRole("region", { name: "Sua ação da noite" });
    if (!(await panel.count())) continue;
    if (!passed) {
      await panel.getByRole("button", { name: "Passar a noite" }).click();
      await expect(panel.getByText("Você passou esta noite.")).toBeVisible();
      passed = true;
      continue;
    }
    await panel.getByRole("button", { name: /^(Ana|Beto|Caio)$/ }).first().click();
    await panel.getByRole("button", { name: "Confirmar" }).click();
    await expect(panel.getByText("Confirmado", { exact: true })).toBeVisible();
  }
  for (const player of players) {
    await expect(player.getByRole("region", { name: "Anúncios do dia" })).toContainText("Noite 1", { timeout: 20_000 });
  }

  // A acusação abre a defesa (30s) e depois a votação.
  await ana.getByRole("button", { name: "Caio", exact: true }).first().click();
  await beto.getByRole("button", { name: "Caio", exact: true }).first().click();
  await expect(ana.getByRole("heading", { name: /Defesa/ })).toBeVisible({ timeout: 20_000 });
  await expect(ana.getByRole("heading", { name: /Votação/ })).toBeVisible({ timeout: 45_000 });
  await pauseTable(table);

  // Todos os eleitores votaram: a votação fecha mesmo com o timer pausado.
  await ana.getByRole("button", { name: "Culpado" }).click();
  await beto.getByRole("button", { name: "Inocente" }).click();
  await expect(table.getByRole("heading", { name: "Resultado da votação" })).toBeVisible({ timeout: 20_000 });

  await Promise.all(contexts.map((context) => context.close()));
});
