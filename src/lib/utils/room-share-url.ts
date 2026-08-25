export function buildRoomShareUrl(origin: string, code: string): string {
  if (!origin) {
    return "";
  }

  const url = new URL("/", origin);
  url.searchParams.set("code", code);

  return url.toString();
}
