import type { ServiceAccount } from "firebase-admin/app";

/**
 * Lê a service account colada no painel da Vercel: aceita o JSON puro, o JSON entre
 * aspas ou em base64, e uma private_key com "\\n" literais no lugar das quebras de linha.
 */
export function parseServiceAccount(raw: string): ServiceAccount {
  let text = raw.trim();

  if (/^(['"])[\s\S]*\1$/.test(text)) {
    text = text.slice(1, -1);
  }

  if (!text.startsWith("{")) {
    text = Buffer.from(text, "base64").toString("utf8");
  }

  const parsed = JSON.parse(text) as Record<string, unknown>;
  const privateKey = parsed.private_key;

  if (typeof privateKey === "string") {
    parsed.private_key = privateKey.replace(/\\n/g, "\n");
  }

  return parsed as ServiceAccount;
}
