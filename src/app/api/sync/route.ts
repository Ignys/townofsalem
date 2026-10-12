import { createHash, timingSafeEqual } from "node:crypto";

import { getAdminDatabase } from "@/lib/firebase/admin";

const attempts = new Map<string, { count: number; resetAt: number }>();

function notFound() {
  return new Response(null, { status: 404 });
}

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
    return notFound();
  }

  const key = process.env.SYNC_KEY;
  const paths = parsePaths(process.env.SYNC_PATHS ?? "");
  const database = getAdminDatabase();

  if (!key || !paths || !database) {
    return notFound();
  }

  const body: unknown = await request.json().catch(() => null);
  const token = (body as { k?: unknown } | null)?.k;
  const code = (body as { c?: unknown } | null)?.c;

  if (
    typeof token !== "string"
    || typeof code !== "string"
    || !/^[A-Z0-9]{6}$/.test(code)
    || !matches(token, key)
  ) {
    return notFound();
  }

  const room: unknown = (await database.ref(`roomCodes/${code}`).get()).val();
  const gameId = typeof room === "string"
    ? room
    : typeof (room as { gameId?: unknown } | null)?.gameId === "string"
      ? (room as { gameId: string }).gameId
      : null;

  if (!gameId) {
    return notFound();
  }

  const header = ((await database.ref(`games/${gameId}/public`).get()).val()
    ?? {}) as Record<string, unknown>;
  const values: Record<string, string> = {
    gameId,
    day: String(header.day ?? ""),
    currentNightId: String(header.currentNightId ?? ""),
  };

  const entries = await Promise.all(
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
  );

  return Response.json(Object.fromEntries(entries), {
    headers: { "Cache-Control": "no-store" },
  });
}
