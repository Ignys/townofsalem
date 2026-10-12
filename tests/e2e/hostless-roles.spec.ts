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

/** Segura o botão "ver sua role" e lê o nome da carta, como o jogador faria. */
async function readOwnRole(page: Page): Promise<string> {
  const button = page.getByRole("button", { name: "Segure para ver sua role" });
  await button.hover();
  await page.mouse.down();
  const dialog = page.getByRole("dialog", { name: "Sua role secreta" });
  await expect(dialog).toBeVisible();
  const roleName = ((await dialog.locator("h1").first().textContent()) ?? "").trim();
  await page.mouse.up();
  return roleName;
}

// Timers reduzidos por NEXT_PUBLIC_HOSTLESS_TIMER_SCALE (playwright.config.ts).
test("hostless: the mayor reveals from the phone and a lynched jester takes revenge", async ({ browser }) => {
  test.setTimeout(150_000);
  const names = ["Ana", "Beto", "Caio", "Dani"];
  const contexts = await Promise.all([
    browser.newContext(),
    ...names.map(() => browser.newContext({ viewport: { width: 375, height: 812 } })),
  ]);
  const [table, ...phones] = await Promise.all(contexts.map((context) => context.newPage()));

  await table.goto("/");
  await expect(table.getByText("Acesso seguro pronto")).toBeVisible();
  await table.getByRole("button", { name: "Criar partida" }).click();
  await expect(table).toHaveURL(/\/host\/[A-Z0-9]{6}$/);
  const code = table.url().split("/").pop()!;
  for (const [index, phone] of phones.entries()) await joinPlayer(phone, code, names[index]);
  await expect(table.getByText("Dani", { exact: true })).toBeVisible();

  await table.getByRole("button", { name: /Sem mestre/ }).click();
  for (const role of [/Jester/, /Mayor/, /Mafioso/, /(?<!Peaceful |Spiteful )Townie/]) {
    await table.getByRole("button", { name: role }).first().click();
  }
  await table.getByRole("button", { name: "Sortear roles" }).click();
  await expect(table.getByText("A cidade dorme.")).toBeVisible();

  const roles = new Map<string, Page>();
  for (const phone of phones) roles.set(await readOwnRole(phone), phone);
  const jester = roles.get("Jester")!;
  const mayor = roles.get("Mayor")!;
  expect(jester, "alguém tirou o Jester").toBeTruthy();
  expect(mayor, "alguém tirou o Mayor").toBeTruthy();
  const jesterName = names[phones.indexOf(jester)];
  const others = phones.filter((phone) => phone !== jester);

  // Amanhece sozinho; o Mayor se revela pelo celular e a mesa passa a mostrar.
  await expect(mayor.getByRole("button", { name: "Revelar-se como Mayor" })).toBeVisible({ timeout: 30_000 });
  await mayor.getByRole("button", { name: "Revelar-se como Mayor" }).click();
  await mayor.getByRole("button", { name: "Revelar agora" }).click();
  const mayorName = names[phones.indexOf(mayor)];
  const roster = table.getByRole("region", { name: "Na partida" });
  await expect(roster.getByText(mayorName, { exact: true }).locator("xpath=ancestor::li[1]")).toContainText(/mayor/i);

  // Todos menos o Jester o acusam e votam culpado.
  for (const phone of others) await phone.getByRole("button", { name: jesterName, exact: true }).first().click();
  await expect(others[0].getByRole("button", { name: "Culpado" })).toBeVisible({ timeout: 30_000 });
  for (const phone of others) await phone.getByRole("button", { name: "Culpado" }).click();

  // Enforcado, o Jester escolhe na hora um dos culpados.
  const revenge = jester.getByRole("region", { name: "Vingança do Jester" });
  await expect(revenge).toBeVisible({ timeout: 30_000 });
  const victimButton = revenge.getByRole("button").first();
  const victimName = ((await victimButton.textContent()) ?? "").trim();
  await victimButton.click();

  // A vítima morre e a mesa mostra.
  const victim = phones[names.indexOf(victimName)];
  await expect(victim.getByText("Morto", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(roster.getByText(victimName, { exact: true }).locator("xpath=ancestor::li[1]")).toHaveClass(/a33843/);

  await Promise.all(contexts.map((context) => context.close()));
});
