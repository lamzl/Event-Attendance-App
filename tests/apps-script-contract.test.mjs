import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../google-apps-script/Code.gs", import.meta.url),
  "utf8",
);

test("the Sheets adapter contains every required stable column", () => {
  const headers = [
    "guest_id",
    "name",
    "group",
    "table",
    "status",
    "checked_in",
    "checked_in_at",
    "check_in_request_id",
    "checked_in_source",
  ];

  for (const header of headers) {
    assert.match(source, new RegExp(`"${header}"`));
  }

  const requiredHeaders = source.match(/var REQUIRED_HEADERS = \[([\s\S]*?)\];/);
  assert.ok(requiredHeaders);
  assert.doesNotMatch(requiredHeaders[1], /"seat_number"/);
});

test("attendance writes are protected by a script lock", () => {
  assert.match(source, /LockService\.getScriptLock\(\)/);
  assert.match(source, /lock\.tryLock\(5000\)/);
  assert.match(source, /lock\.releaseLock\(\)/);
  assert.match(source, /getRange\(sheetRow, headerMap\.checked_in \+ 1, 1, 4\)/);
  assert.match(source, /\.setValues\(/);
});

test("guest IDs are validated for missing and duplicate values", () => {
  assert.match(source, /function validateGuestRows_/);
  assert.match(source, /Duplicate guest_id/);
  assert.match(source, /needs a valid guest_id/);
});

test("the shared token is checked before either data action", () => {
  const tokenCheck = source.indexOf("safeEqual_(body.token");
  const listAction = source.indexOf('body.action === "listGuests"');
  const checkInAction = source.indexOf('body.action === "checkIn"');

  assert.ok(tokenCheck > -1);
  assert.ok(tokenCheck < listAction);
  assert.ok(tokenCheck < checkInAction);
});
