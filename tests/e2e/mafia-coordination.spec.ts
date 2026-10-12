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

test("the mafia sees each other, their live picks and reactions; the town sees nothing", async ({ browser }) => {
  test.setTimeout(120_000);
  const names = ["Ana", "Beto", "Caio", "Dani"];
  const contexts = await Promise.all([
    browser.newContext(),
    ...names.map(() => browser.newContext({ viewport: { width: 375, height: 812 } })),
  ]);
  const [host, ...phones] = await Promise.all(contexts.map((context) => context.newPage()));

  await host.goto("/");
  await expect(host.getByText("Acesso seguro pronto")).toBeVisible();
  await host.getByRole("button", { name: "Criar partida" }).click();
  await expect(host).toHaveURL(/\/host\/[A-Z0-9]{6}$/);
  const code = host.url().split("/").pop()!;
  for (const [index, phone] of phones.entries()) await joinPlayer(phone, code, names[index]);
  await expect(host.getByText("Dani", { exact: true })).toBeVisible();

  for (const role of [/Consigliere/, /Mafioso/, /Doctor/, /(?<!Peaceful |Spiteful )Townie/]) {
    await host.getByRole("button", { name: role }).first().click();
  }
  await host.getByRole("button", { name: "Sortear roles" }).click();
  await expect(host.getByRole("heading", { name: "Noite 1" }).first()).toBeVisible();

  const roles = new Map<string, Page>();
  for (const phone of phones) roles.set(await readOwnRole(phone), phone);
  const consigliere = roles.get("Consigliere")!;
  const mafioso = roles.get("Mafioso")!;
  const consigliereName = names[phones.indexOf(consigliere)];
  const mafiosoName = names[phones.indexOf(mafioso)];

  // A Máfia se enxerga, com as roles; a cidade não vê painel nenhum.
  for (const member of [consigliere, mafioso]) {
    const panel = member.getByRole("region", { name: "Sua Máfia" });
    await expect(panel).toContainText(consigliereName);
    await expect(panel).toContainText(mafiosoName);
    await expect(panel).toContainText(/consigliere/i);
    await expect(panel).toContainText(/mafioso/i);
  }
  for (const town of [roles.get("Doctor")!, roles.get("Townie")!]) {
    await expect(town.getByRole("region", { name: "Sua Máfia" })).toHaveCount(0);
  }

  // O Consigliere escolhe: o Mafioso vê ao vivo, antes da confirmação.
  const action = consigliere.getByRole("region", { name: "Sua ação da noite" });
  const target = action.getByRole("button", { name: /^(Ana|Beto|Caio|Dani)$/ }).first();
  const targetName = ((await target.textContent()) ?? "").trim();
  await target.click();
  const seenByMafioso = mafioso.getByRole("region", { name: "Sua Máfia" }).locator("[data-mafia-pick]");
  await expect(seenByMafioso).toContainText(targetName);
  await expect(seenByMafioso).toContainText("escolhendo");

  // Confirmou: aparece o cadeado.
  await action.getByRole("button", { name: "Confirmar" }).click();
  await expect(seenByMafioso.getByLabel("Confirmado")).toBeVisible();
  await expect(seenByMafioso).not.toContainText("escolhendo");

  // Reações chegam ao parceiro.
  await mafioso.getByRole("region", { name: "Sua Máfia" }).getByRole("button", { name: "Confia em mim" }).click();
  await expect(consigliere.getByRole("list", { name: "Reações recentes" })).toContainText(`${mafiosoName}: Confia em mim`);

  await Promise.all(contexts.map((context) => context.close()));
});
