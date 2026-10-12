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

test("a player submits their own night action and the host can override it", async ({ browser }) => {
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
  // Doctor, Sheriff e Mafioso acordam todos na Noite 1.
  await expect(ana.getByRole("region", { name: "Sua ação da noite" })).toBeVisible();

  let submitters = 0;
  for (const player of [ana, beto, caio]) {
    const panel = player.getByRole("region", { name: "Sua ação da noite" });
    if (!(await panel.count())) continue;
    const targets = panel.getByRole("button", { name: /^(Ana|Beto|Caio)$/ });
    if (!(await targets.count())) continue;
    await targets.first().click();
    await expect(panel.getByText("Enviado", { exact: true }).first()).toBeVisible();
    submitters += 1;
  }
  expect(submitters, "ao menos um jogador precisa ter ação na Noite 1").toBeGreaterThan(0);

  // As submissões viram linhas do console do mestre, marcadas como vindas do jogador.
  await expect(host.getByText("Enviado pelo jogador").first()).toBeVisible();

  // O mestre continua soberano: pode sobrescrever o alvo escolhido pelo jogador.
  const hostTarget = host.getByRole("combobox", { name: /^Alvo 1/ }).first();
  const submitted = (await hostTarget.textContent())?.trim() ?? "";
  expect(submitted).not.toBe("");

  await hostTarget.click();
  const options = host.getByRole("option");
  const optionCount = await options.count();
  for (let index = 1; index < optionCount; index += 1) {
    const label = (await options.nth(index).textContent())?.trim() ?? "";
    if (label && !submitted.startsWith(label)) {
      await options.nth(index).click();
      await expect(hostTarget).toContainText(label);
      break;
    }
  }

  await Promise.all(contexts.map((context) => context.close()));
});
