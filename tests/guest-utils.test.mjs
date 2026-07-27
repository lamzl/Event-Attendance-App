import assert from "node:assert/strict";
import test from "node:test";

import {
  cleanGuestId,
  formatSeatLabel,
  sanitizeCheckInResult,
  sanitizeGuestListItem,
} from "../lib/guest-utils.js";

test("guest IDs allow only the documented opaque format", () => {
  assert.equal(cleanGuestId("gst_abc-123"), "gst_abc-123");
  assert.equal(cleanGuestId("guest id"), "");
  assert.equal(cleanGuestId("<script>"), "");
});

test("seat labels support table and seat combinations", () => {
  assert.equal(
    formatSeatLabel({ table: "4", seatNumber: "02" }),
    "Table 4 · Seat 02",
  );
  assert.equal(formatSeatLabel({ seatNumber: "B12" }), "Seat B12");
  assert.equal(formatSeatLabel({ seatLabel: "Garden lounge" }), "Garden lounge");
});

test("the public guest item does not expose a seat or attendance data", () => {
  const item = sanitizeGuestListItem({
    id: "gst_private",
    name: "  Aisha   Tan ",
    group: "Family",
    seatNumber: "8",
    table: "1",
    checkedInAt: "2026-07-27T12:00:00.000Z",
  });

  assert.deepEqual(item, {
    id: "gst_private",
    name: "Aisha Tan",
    group: "Family",
  });
  assert.equal("seatNumber" in item, false);
  assert.equal("checkedInAt" in item, false);
});

test("a check-in result must include a valid guest and assigned seat", () => {
  assert.deepEqual(
    sanitizeCheckInResult({
      id: "gst_valid",
      name: "Aisha Tan",
      table: "1",
      seatNumber: "8",
      checkedInAt: "2026-07-27T12:00:00.000Z",
    }),
    {
      id: "gst_valid",
      name: "Aisha Tan",
      seatLabel: "Table 1 · Seat 8",
    },
  );

  assert.equal(
    sanitizeCheckInResult({ id: "gst_valid", name: "Aisha Tan" }),
    null,
  );
});
