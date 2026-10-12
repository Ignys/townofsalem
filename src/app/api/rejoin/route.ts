import { findRejoinSeat } from "@/features/lobby/find-rejoin-seat";
import { createCustomToken, getAdminDatabase } from "@/lib/firebase/admin";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/utils/room-code";

const attempts = new Map<string, { count: number; resetAt: number }>();

function limited(client: string): boolean {
  const now = Date.now();
  const entry = attempts.get(client);

  if (!entry || entry.resetAt < now) {
    attempts.set(client, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count += 1;

  return entry.count > 10;
}

function reply(status: number, body: Record<string, string>) {
  return Response.json(body, { status });
}

/**
 * Volta para uma partida em andamento depois de perder a sessão (aba fechada, outro
 * navegador). Tudo na partida é guardado pelo uid, então em vez de migrar dados o
 * servidor devolve um token que faz o jogador entrar de novo com o uid antigo.
 */
export async function POST(request: Request) {
  try {
    return await rejoin(request);
  } catch (error: unknown) {
    console.error("rejoin failed", error);
    return reply(500, { error: "server-error" });
  }
}

async function rejoin(request: Request) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";

  if (limited(client)) {
    return reply(429, { error: "rate-limited" });
  }

  const database = getAdminDatabase();

  if (!database) {
    return reply(503, { error: "unavailable" });
  }

  let code: string;
  let nickname: string;

  try {
    const body = (await request.json()) as { code?: unknown; nickname?: unknown };
    code = normalizeRoomCode(typeof body.code === "string" ? body.code : "");
    nickname = typeof body.nickname === "string" ? body.nickname : "";
  } catch {
    return reply(400, { error: "bad-request" });
  }

  if (!isValidRoomCode(code)) {
    return reply(400, { error: "bad-request" });
  }

  const room = (await database.ref(`roomCodes/${code}`).get()).val() as
    | string
    | { gameId?: string }
    | null;
  const gameId = typeof room === "string" ? room : room?.gameId;

  if (!gameId) {
    return reply(404, { error: "game-not-found" });
  }

  const [status, players] = await Promise.all([
    database.ref(`games/${gameId}/public/status`).get(),
    database.ref(`games/${gameId}/players`).get(),
  ]);

  if (status.val() !== "in-progress") {
    return reply(409, { error: "game-not-in-progress" });
  }

  const uid = findRejoinSeat(players.val(), nickname);

  if (!uid) {
    return reply(404, { error: "seat-not-found" });
  }

  const token = createCustomToken(uid);

  if (!token) {
    return reply(503, { error: "unavailable" });
  }

  return reply(200, { token, gameId });
}
