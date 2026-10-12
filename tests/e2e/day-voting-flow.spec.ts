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

test("the town votes a player to trial and reaches a secret verdict", async ({ browser }) => {
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

  // Dia: os jogadores acusam pelo próprio celular.
  // Sair da noite pede confirmação explícita ao mestre.
  await host.getByRole("button", { name: "Dia", exact: true }).click();
  await host.getByRole("button", { name: "Sim", exact: true }).click();
  await expect(ana.getByRole("heading", { name: /^Dia/ })).toBeVisible();
  await expect(ana.getByRole("heading", { name: "Votação de acusação" })).toBeVisible();
  await expect(ana.getByRole("heading", { name: "Votos" })).toBeVisible();

  await ana.getByRole("button", { name: "Caio", exact: true }).first().click();
  await beto.getByRole("button", { name: "Caio", exact: true }).first().click();

  // Maioria atingida: o mestre vê a contagem regressiva e o jogo para no julgamento.
  await expect(host.getByText(/Maioria atingida/)).toBeVisible();
  await expect(caio.getByText(/está sendo julgado/)).toBeVisible({ timeout: 15_000 });
  await expect(ana.getByText(/está sendo julgado/)).toBeVisible();

  // O mestre corta a conversa e só então inicia a defesa de 30s.
  await host.getByRole("button", { name: "Defesa", exact: true }).click();
  await expect(ana.getByText(/Defesa de/)).toBeVisible();

  // Veredito secreto: cada um vota no próprio aparelho.
  await host.getByRole("button", { name: "Veredito", exact: true }).click();
  await expect(ana.getByRole("button", { name: "Culpado" })).toBeVisible();
  await ana.getByRole("button", { name: "Culpado" }).click();
  await beto.getByRole("button", { name: "Culpado" }).click();

  // Ninguém enxerga o resultado — nem o voto alheio — antes do fechamento.
  // (A leitura cruzada em si é barrada pelas regras do RTDB; ver
  // tests/firebase-rules.emulator.test.ts.)
  await expect(beto.getByText(/Veredito encerrado/)).toHaveCount(0);
  await expect(beto.getByRole("region", { name: "Sua ação da noite" })).toHaveCount(0);

  host.once("dialog", (dialog) => dialog.accept());
  await host.getByRole("button", { name: "Encerrar e calcular veredito" }).click();
  await expect(host.getByText(/Resultado: Culpado/)).toBeVisible();
  await expect(ana.getByText(/Veredito encerrado: Culpado/)).toBeVisible();

  // O linchamento é aplicado na resolução do dia, já travada no condenado.
  await expect(host.getByText(/condenado pelo veredito da mesa/)).toBeVisible();

  await Promise.all(contexts.map((context) => context.close()));
});
