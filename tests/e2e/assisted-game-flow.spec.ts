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

test("complete assisted physical flow keeps player secrets and host authority", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const playerOneContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const playerTwoContext = await browser.newContext({ viewport: { width: 320, height: 720 } });
  const host = await hostContext.newPage();
  const playerOne = await playerOneContext.newPage();
  const playerTwo = await playerTwoContext.newPage();

  await host.goto("/");
  await expect(host.getByText("Acesso seguro pronto")).toBeVisible();
  await host.getByRole("button", { name: "Criar partida" }).click();
  await expect(host).toHaveURL(/\/host\/[A-Z0-9]{6}$/);
  const code = host.url().split("/").pop()!;

  await joinPlayer(playerOne, code, "Ana");
  await joinPlayer(playerTwo, code, "Beto");
  await expect(host.getByText("Ana", { exact: true })).toBeVisible();
  await expect(host.getByText("Beto", { exact: true })).toBeVisible();

  await host.getByRole("button", { name: /Doctor/ }).click();
  await host.getByRole("button", { name: /Sheriff/ }).click();
  await host.getByRole("button", { name: "Sortear roles" }).click();
  await expect(host.getByText("Composição bloqueada")).toBeVisible();
  await expect(playerOne.getByText("Sua role secreta")).toBeVisible();
  await expect(playerTwo.getByText("Sua role secreta")).toBeVisible();
  await expect(playerOne.getByText("Action Log")).toHaveCount(0);
  await expect(playerOne.getByRole("button", { name: /votar|culpado|inocente|confirmar ação/i })).toHaveCount(0);

  await host.getByRole("button", { name: "Dia", exact: true }).click();
  await expect(playerOne.getByText("Dia", { exact: true })).toBeVisible();
  await host.getByRole("button", { name: "Discussão", exact: true }).click();
  await expect(playerOne.getByText("Discussão", { exact: true })).toBeVisible();
  await host.getByRole("button", { name: "Personalizado", exact: true }).click();
  await host.getByLabel("Nome opcional").fill("Intervalo");
  await host.getByLabel("Minutos").fill("0");
  await host.getByRole("spinbutton", { name: "Segundos", exact: true }).fill("20");
  await host.getByRole("button", { name: "Iniciar fase personalizada" }).click();
  await expect(playerOne.getByText("Intervalo", { exact: true })).toBeVisible();

  await host.getByRole("button", { name: "Noite", exact: true }).click();
  await expect(host.getByRole("heading", { name: "Noite 1" }).first()).toBeVisible();
  await expect(playerOne.getByText("Noite 1", { exact: true })).toBeVisible();
  await expect(host.getByText(/0 de 2 registrados/)).toBeVisible();

  await host.getByRole("button", { name: /^1\./ }).click();
  const target = host.getByLabel(/^Alvo/);
  await target.selectOption({ index: 1 });
  await host.getByRole("button", { name: "Confirmar entrada" }).click();
  await expect(host.getByText("Ação salva no log.")).toBeVisible();
  await host.reload();
  await expect(host.getByRole("heading", { name: "Noite 1" }).first()).toBeVisible();
  await expect(host.getByRole("button", { name: "Editar" })).toBeVisible();
  await host.getByRole("button", { name: "Editar" }).click();
  await host.getByRole("button", { name: "Salvar correção" }).click();
  host.once("dialog", (dialog) => dialog.accept());
  await host.getByRole("button", { name: "Cancelar" }).click();

  await host.getByRole("button", { name: "Pré-visualizar resultado da noite" }).click();
  await expect(host.getByText("Ninguém morreu nesta noite.")).toBeVisible();
  await host.getByRole("button", { name: "Confirmar resultado" }).click();
  await expect(host.getByText("Resultado aplicado. A fase não foi alterada.")).toBeVisible();
  await expect(playerOne.getByText("Ninguém morreu nesta noite.")).toHaveCount(0);
  await expect(host.getByText(/Noite 1 · confirmada/)).toBeVisible();
  host.once("dialog", (dialog) => dialog.accept());
  await host.getByRole("button", { name: "Desfazer última resolução" }).click();
  await expect(host.getByText("Resolução desfeita. Gere um novo preview após corrigir o log.")).toBeVisible();
  await expect(host.getByText(/Noite 1 · corrigida\/rollback/)).toBeVisible();

  for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 844, height: 390 }, { width: 430, height: 932 }]) {
    await host.setViewportSize(viewport);
    await expect(host.getByRole("button", { name: "Noite", exact: true })).toBeVisible();
    const horizontalOverflow = await host.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: Array.from(document.querySelectorAll<HTMLElement>("body *"))
        .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 8)
        .map((element) => ({
          tag: element.tagName,
          className: element.className,
          right: Math.round(element.getBoundingClientRect().right),
          text: element.innerText?.slice(0, 80),
        })),
    }));
    expect(horizontalOverflow.scrollWidth, JSON.stringify({ viewport, ...horizontalOverflow }, null, 2)).toBeLessThanOrEqual(horizontalOverflow.clientWidth);
  }
  for (const viewport of [{ width: 320, height: 720 }, { width: 375, height: 812 }, { width: 430, height: 932 }]) {
    await playerOne.setViewportSize(viewport);
    await expect(playerOne.getByText("Sua role secreta")).toBeVisible();
    expect(await playerOne.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }

  await hostContext.close();
  await playerOneContext.close();
  await playerTwoContext.close();
});
