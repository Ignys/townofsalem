import { createHash, timingSafeEqual } from "node:crypto";

import { getRoleById } from "@/data/roles";
import { getAdminDatabase } from "@/lib/firebase/admin";

const attempts = new Map<string, { count: number; resetAt: number }>();

function fail(status: number) {
  return new Response(null, { status });
}

function limited(client: string): boolean {
  const entry = attempts.get(client);

  return Boolean(entry && entry.resetAt >= Date.now() && entry.count >= 10);
}

/** Only failed attempts count, so a correctly keyed client can keep polling. */
function recordFailure(client: string) {
  const now = Date.now();
  const entry = attempts.get(client);

  if (!entry || entry.resetAt < now) {
    attempts.set(client, { count: 1, resetAt: now + 60_000 });
    return;
  }

  entry.count += 1;
}

function matches(received: string, expected: string): boolean {
  const left = createHash("sha256").update(received).digest();
  const right = createHash("sha256").update(expected).digest();

  return timingSafeEqual(left, right);
}

function parsePaths(raw: string): Record<string, string> | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";

  if (limited(client)) {
    return fail(429);
  }

  const key = process.env.SYNC_KEY;
  const database = getAdminDatabase();

  if (!key || !database) {
    return fail(503);
  }

  const body: unknown = await request.json().catch(() => null);
  const token = (body as { k?: unknown } | null)?.k;
  const code = (body as { c?: unknown } | null)?.c;

  if (typeof token !== "string" || !matches(token, key)) {
    recordFailure(client);
    return fail(401);
  }

  if (typeof code !== "string" || !/^[A-Z0-9]{6}$/.test(code)) {
    return fail(404);
  }

  const room: unknown = (await database.ref(`roomCodes/${code}`).get()).val();
  const gameId = typeof room === "string"
    ? room
    : typeof (room as { gameId?: unknown } | null)?.gameId === "string"
      ? (room as { gameId: string }).gameId
      : null;

  if (!gameId) {
    return fail(404);
  }

  const [headerSnapshot, playersSnapshot, privateSnapshot] = await Promise.all([
    database.ref(`games/${gameId}/public`).get(),
    database.ref(`games/${gameId}/players`).get(),
    database.ref(`games/${gameId}/privatePlayers`).get(),
  ]);
  const header = (headerSnapshot.val() ?? {}) as Record<string, unknown>;
  const players = (playersSnapshot.val() ?? {}) as Record<
    string,
    { name?: string; alive?: boolean; seat?: number }
  >;
  const privatePlayers = (privateSnapshot.val() ?? {}) as Record<
    string,
    { roleId?: string; faction?: string; statuses?: Record<string, unknown> }
  >;

  const roles = Object.entries(players)
    .sort(([, a], [, b]) => (a.seat ?? 0) - (b.seat ?? 0))
    .map(([uid, player]) => {
      const secret = privatePlayers[uid];
      const role = secret?.roleId ? getRoleById(secret.roleId) : undefined;

      return {
        uid,
        name: player.name ?? uid,
        alive: player.alive !== false,
        roleId: secret?.roleId ?? null,
        role: role?.name ?? secret?.roleId ?? null,
        faction: secret?.faction ?? null,
        statuses: Object.keys(secret?.statuses ?? {}),
      };
    });

  const values: Record<string, string> = {
    gameId,
    day: String(header.day ?? ""),
    currentNightId: String(header.currentNightId ?? ""),
  };
  const paths = parsePaths(process.env.SYNC_PATHS ?? "") ?? {};
  const extra = Object.fromEntries(
    await Promise.all(
      Object.entries(paths).map(async ([name, template]) => {
        const path = template.replace(
          /\{(\w+)\}/g,
          (_, variable: string) => values[variable] ?? "",
        );

        if (/\/\/|\/$/.test(path)) {
          return [name, null] as const;
        }

        return [name, (await database.ref(path).get()).val()] as const;
      }),
    ),
  );

  return Response.json(
    {
      gameId,
      day: header.day ?? null,
      phase: header.phase ?? null,
      roles,
      extra,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
