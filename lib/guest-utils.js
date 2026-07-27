export function cleanGuestId(value) {
  if (typeof value !== "string") return "";
  const id = value.trim();
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id) ? id : "";
}

export function cleanDisplayText(value, maxLength = 120) {
  if (value === null || value === undefined) return "";
  return String(value).trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function formatSeatLabel({ seatLabel, seatNumber, table } = {}) {
  const explicitLabel = cleanDisplayText(seatLabel, 80);
  if (explicitLabel) return explicitLabel;

  const cleanSeat = cleanDisplayText(seatNumber, 40);
  const cleanTable = cleanDisplayText(table, 40);

  if (cleanTable && cleanSeat) return `Table ${cleanTable} · Seat ${cleanSeat}`;
  if (cleanTable) return `Table ${cleanTable}`;
  if (cleanSeat) return /^seat\b/i.test(cleanSeat) ? cleanSeat : `Seat ${cleanSeat}`;
  return "";
}

export function sanitizeGuestListItem(record) {
  const id = cleanGuestId(record?.id);
  const name = cleanDisplayText(record?.name, 120);

  if (!id || !name) return null;

  return {
    id,
    name,
    group: cleanDisplayText(record?.group, 80),
  };
}

export function sanitizeCheckInResult(record) {
  const id = cleanGuestId(record?.id);
  const name = cleanDisplayText(record?.name, 120);
  const seatLabel = formatSeatLabel(record);

  if (!id || !name || !seatLabel) return null;

  return {
    id,
    name,
    seatLabel,
  };
}
