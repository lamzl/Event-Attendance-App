/**
 * Google Sheets adapter for the Guest Check-in app.
 *
 * Add this file to a Google Apps Script project bound to your guest Sheet,
 * then add these Script Properties in Project Settings:
 *
 *   GUEST_SHEET_NAME  Guests
 *   SHARED_SECRET     a long random secret (also used by the web app)
 *
 *   SPREADSHEET_ID    the ID between /d/ and /edit in the Sheet URL
 *
 * setupGuestSheet() stores SPREADSHEET_ID automatically when run from a
 * bound script. A deployed web app must not rely on getActiveSpreadsheet().
 */

var REQUIRED_HEADERS = [
  "guest_id",
  "name",
  "group",
  "seat_number",
  "table",
  "status",
  "checked_in",
  "checked_in_at",
  "check_in_request_id",
  "checked_in_source",
];

function doGet() {
  return jsonResponse_({
    ok: true,
    service: "guest-check-in",
    message: "The Google Sheets adapter is running.",
  });
}

function doPost(event) {
  try {
    var body = parseRequest_(event);
    var config = getConfig_();

    if (!safeEqual_(body.token, config.sharedSecret)) {
      throw apiError_("UNAUTHORIZED", "The request is not authorized.");
    }

    if (body.action === "listGuests") {
      return jsonResponse_({
        ok: true,
        guests: listGuests_(config),
      });
    }

    if (body.action === "checkIn") {
      var result = checkInGuest_(config, body.guestId, body.requestId);
      return jsonResponse_({
        ok: true,
        status: result.status,
        guest: result.guest,
      });
    }

    throw apiError_("UNKNOWN_ACTION", "The requested action is not supported.");
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonResponse_({
      ok: false,
      code: error && error.code ? error.code : "INTERNAL_ERROR",
      message:
        error && error.publicMessage
          ? error.publicMessage
          : "The guest list service could not complete the request.",
    });
  }
}

/**
 * Run this once from the Apps Script editor.
 * It creates the Guests tab/header if needed and adds IDs to rows that have
 * a name but no guest_id. It does not overwrite guest data.
 */
function setupGuestSheet() {
  var properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty("SPREADSHEET_ID")) {
    var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!activeSpreadsheet) {
      throw new Error(
        "Set the SPREADSHEET_ID Script Property before running setup.",
      );
    }
    properties.setProperty("SPREADSHEET_ID", activeSpreadsheet.getId());
  }

  var config = getConfig_(true);
  var spreadsheet = getSpreadsheet_(config);
  var sheet =
    spreadsheet.getSheetByName(config.sheetName) ||
    spreadsheet.insertSheet(config.sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, REQUIRED_HEADERS.length).setValues([REQUIRED_HEADERS]);
  }

  var headerMap = getHeaderMap_(sheet);
  assertHeaders_(headerMap);
  backfillGuestIds_(sheet, headerMap);
  validateGuestRows_(sheet, headerMap);

  sheet.setFrozenRows(1);
  sheet
    .getRange(1, 1, 1, REQUIRED_HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#0f3d34")
    .setFontColor("#ffffff");
  sheet.getRange("D:E").setNumberFormat("@");
  sheet.getRange("H:H").setNumberFormat("yyyy-mm-dd hh:mm:ss");
  sheet.autoResizeColumns(1, REQUIRED_HEADERS.length);

  console.log("Guest sheet is ready: " + spreadsheet.getUrl());
}

/**
 * Optional helper: run after adding new guest rows to fill any missing IDs.
 */
function backfillGuestIds() {
  var config = getConfig_(true);
  var sheet = getGuestSheet_(config);
  var headerMap = getHeaderMap_(sheet);
  assertHeaders_(headerMap);
  backfillGuestIds_(sheet, headerMap);
}

function listGuests_(config) {
  var sheet = getGuestSheet_(config);
  var headerMap = getHeaderMap_(sheet);
  assertHeaders_(headerMap);

  if (sheet.getLastRow() < 2) return [];

  var values = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .getDisplayValues();
  validateGuestRows_(sheet, headerMap, values);
  var guests = [];

  values.forEach(function (row) {
    var id = cleanId_(row[headerMap.guest_id]);
    var name = cleanText_(row[headerMap.name], 120);
    var status = cleanText_(row[headerMap.status], 30).toLowerCase();

    if (!id || !name || (status && status !== "active")) return;

    guests.push({
      id: id,
      name: name,
      group: cleanText_(row[headerMap.group], 80),
    });
  });

  guests.sort(function (first, second) {
    return first.name.localeCompare(second.name);
  });

  return guests;
}

function checkInGuest_(config, guestId, requestId) {
  var cleanGuestId = cleanId_(guestId);
  var cleanRequestId = cleanRequestId_(requestId);

  if (!cleanGuestId || !cleanRequestId) {
    throw apiError_("INVALID_REQUEST", "Please select your name again.");
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    throw apiError_(
      "SERVICE_BUSY",
      "Check-in is busy right now. Please try again.",
    );
  }

  try {
    var sheet = getGuestSheet_(config);
    var headerMap = getHeaderMap_(sheet);
    assertHeaders_(headerMap);

    if (sheet.getLastRow() < 2) {
      throw apiError_("GUEST_NOT_FOUND", "We could not find that guest.");
    }

    var range = sheet.getRange(
      2,
      1,
      sheet.getLastRow() - 1,
      sheet.getLastColumn(),
    );
    var rawValues = range.getValues();
    var displayValues = range.getDisplayValues();
    validateGuestRows_(sheet, headerMap, displayValues);
    var matchIndex = -1;

    for (var index = 0; index < displayValues.length; index += 1) {
      if (cleanId_(displayValues[index][headerMap.guest_id]) === cleanGuestId) {
        matchIndex = index;
        break;
      }
    }

    if (matchIndex === -1) {
      throw apiError_("GUEST_NOT_FOUND", "We could not find that guest.");
    }

    var row = displayValues[matchIndex];
    var rawRow = rawValues[matchIndex];
    var sheetRow = matchIndex + 2;
    var status = cleanText_(row[headerMap.status], 30).toLowerCase();

    if (status && status !== "active") {
      throw apiError_(
        "GUEST_INACTIVE",
        "This invitation is not active. Please see a host for help.",
      );
    }

    var seatNumber = cleanText_(row[headerMap.seat_number], 40);
    var table = cleanText_(row[headerMap.table], 40);

    if (!seatNumber && !table) {
      throw apiError_(
        "SEAT_NOT_ASSIGNED",
        "A seat has not been assigned yet. Please see a host for help.",
      );
    }

    var checkedIn =
      isTruthy_(rawRow[headerMap.checked_in]) ||
      Boolean(rawRow[headerMap.checked_in_at]);
    var checkedInAt =
      (checkedIn ? toIsoString_(rawRow[headerMap.checked_in_at]) : "") ||
      new Date().toISOString();
    var storedRequestId =
      cleanRequestId_(row[headerMap.check_in_request_id]) || cleanRequestId;
    var storedSource =
      cleanText_(row[headerMap.checked_in_source], 40) || "qr-web";

    // These four app-managed columns are required to be contiguous, allowing
    // one range write. Repeated calls also repair any partial legacy record.
    sheet
      .getRange(sheetRow, headerMap.checked_in + 1, 1, 4)
      .setValues([
        [true, new Date(checkedInAt), storedRequestId, storedSource],
      ]);
    SpreadsheetApp.flush();

    return {
      status: checkedIn ? "already-checked-in" : "checked-in",
      guest: {
        id: cleanGuestId,
        name: cleanText_(row[headerMap.name], 120),
        seatNumber: seatNumber,
        table: table,
        checkedInAt: checkedInAt,
      },
    };
  } finally {
    lock.releaseLock();
  }
}

function getConfig_(allowMissingSecret) {
  var properties = PropertiesService.getScriptProperties();
  var sharedSecret = properties.getProperty("SHARED_SECRET") || "";

  if (!allowMissingSecret && sharedSecret.length < 24) {
    throw apiError_(
      "CONFIGURATION_ERROR",
      "The guest list service has not been configured.",
    );
  }

  return {
    spreadsheetId: properties.getProperty("SPREADSHEET_ID") || "",
    sheetName: properties.getProperty("GUEST_SHEET_NAME") || "Guests",
    sharedSecret: sharedSecret,
  };
}

function getSpreadsheet_(config) {
  if (!config.spreadsheetId) {
    throw apiError_(
      "CONFIGURATION_ERROR",
      "Set the SPREADSHEET_ID Script Property.",
    );
  }
  return SpreadsheetApp.openById(config.spreadsheetId);
}

function getGuestSheet_(config) {
  var sheet = getSpreadsheet_(config).getSheetByName(config.sheetName);
  if (!sheet) {
    throw apiError_(
      "CONFIGURATION_ERROR",
      "The configured guest sheet does not exist.",
    );
  }
  return sheet;
}

function getHeaderMap_(sheet) {
  if (sheet.getLastColumn() === 0) return {};

  var values = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];
  var map = {};

  values.forEach(function (value, index) {
    var header = String(value || "")
      .trim()
      .toLowerCase();
    if (header) map[header] = index;
  });

  return map;
}

function assertHeaders_(headerMap) {
  var missing = REQUIRED_HEADERS.filter(function (header) {
    return headerMap[header] === undefined;
  });

  if (missing.length) {
    throw apiError_(
      "CONFIGURATION_ERROR",
      "The guest sheet is missing columns: " + missing.join(", "),
    );
  }

  var attendanceHeaders = [
    "checked_in",
    "checked_in_at",
    "check_in_request_id",
    "checked_in_source",
  ];
  var attendanceStart = headerMap[attendanceHeaders[0]];
  var attendanceIsContiguous = attendanceHeaders.every(function (
    header,
    index,
  ) {
    return headerMap[header] === attendanceStart + index;
  });

  if (!attendanceIsContiguous) {
    throw apiError_(
      "CONFIGURATION_ERROR",
      "Keep checked_in, checked_in_at, check_in_request_id, and checked_in_source together in that order.",
    );
  }
}

function validateGuestRows_(sheet, headerMap, providedValues) {
  if (sheet.getLastRow() < 2) return;

  var values =
    providedValues ||
    sheet
      .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
      .getDisplayValues();
  var rowsById = {};

  values.forEach(function (row, index) {
    var name = cleanText_(row[headerMap.name], 120);
    var sheetRow = index + 2;
    var id = cleanId_(row[headerMap.guest_id]);
    if (name && !id) {
      throw apiError_(
        "CONFIGURATION_ERROR",
        "Guest row " +
          sheetRow +
          " needs a valid guest_id. Run backfillGuestIds().",
      );
    }

    if (!id) return;

    if (rowsById[id]) {
      throw apiError_(
        "CONFIGURATION_ERROR",
        "Duplicate guest_id '" +
          id +
          "' appears on rows " +
          rowsById[id] +
          " and " +
          sheetRow +
          ".",
      );
    }
    rowsById[id] = sheetRow;
  });
}

function backfillGuestIds_(sheet, headerMap) {
  if (sheet.getLastRow() < 2) return;

  var rowCount = sheet.getLastRow() - 1;
  var values = sheet
    .getRange(2, 1, rowCount, sheet.getLastColumn())
    .getDisplayValues();
  var idValues = values.map(function (row) {
    var name = cleanText_(row[headerMap.name], 120);
    var existingId = cleanId_(row[headerMap.guest_id]);
    return [name && !existingId ? createGuestId_() : existingId];
  });

  sheet
    .getRange(2, headerMap.guest_id + 1, rowCount, 1)
    .setValues(idValues);
}

function parseRequest_(event) {
  var contents =
    event && event.postData && event.postData.contents
      ? event.postData.contents
      : "";

  if (!contents || contents.length > 10000) {
    throw apiError_("INVALID_REQUEST", "The request is invalid.");
  }

  try {
    var body = JSON.parse(contents);
    if (!body || Object.prototype.toString.call(body) !== "[object Object]") {
      throw new Error("Body must be an object");
    }
    return body;
  } catch (error) {
    throw apiError_("INVALID_REQUEST", "The request is invalid.");
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function apiError_(code, publicMessage) {
  var error = new Error(publicMessage);
  error.code = code;
  error.publicMessage = publicMessage;
  return error;
}

function cleanText_(value, maxLength) {
  if (value === null || value === undefined) return "";
  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function cleanId_(value) {
  var id = cleanText_(value, 128);
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id) ? id : "";
}

function cleanRequestId_(value) {
  var id = cleanText_(value, 128);
  return /^[a-zA-Z0-9_-]{8,128}$/.test(id) ? id : "";
}

function createGuestId_() {
  return "gst_" + Utilities.getUuid().replace(/-/g, "");
}

function isTruthy_(value) {
  if (value === true || value === 1) return true;
  var normalized = String(value || "")
    .trim()
    .toLowerCase();
  return ["true", "yes", "y", "1", "checked in"].indexOf(normalized) !== -1;
}

function toIsoString_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return value.toISOString();
  }

  var date = new Date(value);
  return isNaN(date.getTime()) ? cleanText_(value, 64) : date.toISOString();
}

function safeEqual_(first, second) {
  first = String(first || "");
  second = String(second || "");

  var mismatch = first.length ^ second.length;
  var length = Math.max(first.length, second.length);

  for (var index = 0; index < length; index += 1) {
    mismatch |=
      (first.charCodeAt(index % Math.max(first.length, 1)) || 0) ^
      (second.charCodeAt(index % Math.max(second.length, 1)) || 0);
  }

  return mismatch === 0;
}
