import assert from "node:assert/strict";
import test from "node:test";

import { parseServiceAccount } from "./parse-service-account";

const account = { project_id: "p", client_email: "e@p", private_key: "-----BEGIN-----\nabc\n-----END-----\n" };
const json = JSON.stringify(account);

test("reads the service account JSON as pasted, quoted or in base64", () => {
  assert.deepEqual(parseServiceAccount(json), account);
  assert.deepEqual(parseServiceAccount(` '${json}' `), account);
  assert.deepEqual(parseServiceAccount(Buffer.from(json).toString("base64")), account);
});

test("turns literal \\n in the private key into line breaks", () => {
  const escaped = json.replaceAll("\\n", "\\\\n");
  assert.equal((parseServiceAccount(escaped) as Record<string, unknown>).private_key, account.private_key);
});
