import assert from "node:assert/strict";
import test from "node:test";

import { buildRoomShareUrl } from "./room-share-url";

test("buildRoomShareUrl creates an absolute entry URL with the room code", () => {
  assert.equal(
    buildRoomShareUrl("https://salem.example", "ABC234"),
    "https://salem.example/?code=ABC234",
  );
});

test("buildRoomShareUrl waits until a browser origin is available", () => {
  assert.equal(buildRoomShareUrl("", "ABC234"), "");
});
