import assert from "node:assert/strict";
import test from "node:test";

import {
  formatTimerDurationMask,
  normalizeTimerDurationDigits,
  parseTimerDurationSeconds,
} from "./timer-duration-mask";

test("formats duration digits as a calculator-style mm:ss mask", () => {
  assert.equal(formatTimerDurationMask(""), "");
  assert.equal(formatTimerDurationMask("1"), "00:01");
  assert.equal(formatTimerDurationMask("130"), "01:30");
  assert.equal(formatTimerDurationMask("1234"), "12:34");
});

test("normalizes pasted masks and keeps the four most recent digits", () => {
  assert.equal(normalizeTimerDurationDigits("01:30"), "130");
  assert.equal(normalizeTimerDurationDigits("00:13"), "13");
  assert.equal(normalizeTimerDurationDigits("12:345"), "2345");
});

test("parses valid masked durations and rejects invalid seconds", () => {
  assert.equal(parseTimerDurationSeconds("130"), 90);
  assert.equal(parseTimerDurationSeconds("3000"), 1_800);
  assert.equal(parseTimerDurationSeconds("60"), null);
  assert.equal(parseTimerDurationSeconds(""), null);
});
