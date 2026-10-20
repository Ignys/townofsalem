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

// Timers reduzidos por NEXT_PUBLIC_HOSTLESS_TIMER_SCALE (playwright.config.ts).
test("a hostless game runs night, trial, verdict, lynch and the win without anyone at the table", async ({ browser }) => {
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

  await table.getByRole("radio", { name: /Sem mestre/ }).click();
  await expect(table.getByRole("radio", { name: /Sem mestre/ })).toHaveAttribute("aria-checked", "true");
  await table.getByRole("button", { name: /Doctor/ }).click();
  await table.getByRole("button", { name: /Sheriff/ }).click();
  await table.getByRole("button", { name: /Mafioso/ }).click();
  await table.getByRole("button", { name: "Sortear roles" }).click();

  // A mesa não mostra o console nem as roles de ninguém.
  await expect(table.getByText("A cidade dorme.")).toBeVisible();
  await expect(table.getByRole("heading", { name: "Console do Mestre" })).toHaveCount(0);
  await expect(table.getByRole("button", { name: "Dia", exact: true })).toHaveCount(0);

  // Os celulares mostram a contagem da noite.
  for (const player of players) {
    await expect(player.getByText("Tempo restante", { exact: true })).toBeVisible({ timeout: 15_000 });
  }

  // A noite acaba sozinha no timer, mesmo sem ninguém agir.
  for (const player of players) {
    await expect(player.getByRole("region", { name: "Anúncios do dia" })).toContainText("Noite 1", { timeout: 30_000 });
  }
  await expect(table.getByText("Anúncios do dia · Noite 1")).toBeVisible();

  // Maioria acusa a Caio: julgamento, depois defesa e votação, tudo automático.
  await ana.getByRole("button", { name: "Caio", exact: true }).first().click();
  await beto.getByRole("button", { name: "Caio", exact: true }).first().click();
  await expect(ana.getByRole("button", { name: "Culpado" })).toBeVisible({ timeout: 30_000 });
  await ana.getByRole("button", { name: "Culpado" }).click();
  await beto.getByRole("button", { name: "Culpado" }).click();

  // Os votos aparecem ao vivo para todos, inclusive na mesa e para o acusado.
  for (const viewer of [table, caio]) {
    const guilty = viewer.getByRole("region", { name: "Votos do veredito" }).locator('[data-verdict-column="guilty"]');
    await expect(guilty).toContainText("Culpado · 2");
    await expect(guilty).toContainText("Ana");
    await expect(guilty).toContainText("Beto");
  }
  await expect(table.getByRole("heading", { name: "Resultado da votação" })).toBeVisible({ timeout: 30_000 });

  // O veredito fecha no timer e Caio é linchado; a mesa revela a role dele.
  await expect(caio.getByText("Morto", { exact: true })).toBeVisible({ timeout: 30_000 });
  const lynchedRow = table.getByText("Caio", { exact: true }).locator("xpath=ancestor::li[1]");
  await expect(lynchedRow).toContainText(/MAFIOSO|SHERIFF|DOCTOR/i, { timeout: 30_000 });
  const lynchedRole = ((await lynchedRow.textContent()) ?? "").toLowerCase();

  if (lynchedRole.includes("mafioso")) {
    // Sem Máfia, a Cidade vence: o motor encerra sozinho e todo mundo vê o resultado.
    for (const viewer of [table, ...players]) {
      await expect(viewer.getByRole("region", { name: "Partida encerrada" })).toContainText("Vitória: Cidade", { timeout: 30_000 });
    }
    await table.getByRole("button", { name: "Nova partida" }).click();
    await expect(table.getByRole("radio", { name: /Sem mestre/ })).toBeVisible();
  } else {
    // Ninguém venceu ainda: a partida segue para a Noite 2.
    for (const player of players) {
      await expect(player.getByRole("heading", { name: "Noite 2" })).toBeVisible({ timeout: 30_000 });
    }
    await expect(table.getByRole("region", { name: "Partida encerrada" })).toHaveCount(0);
  }

  await Promise.all(contexts.map((context) => context.close()));
});
