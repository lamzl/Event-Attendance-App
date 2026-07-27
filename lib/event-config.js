function cleanText(value, fallback, maxLength = 100) {
  if (typeof value !== "string") return fallback;
  const clean = value.trim().replace(/\s+/g, " ");
  return clean ? clean.slice(0, maxLength) : fallback;
}

export function getPublicEventConfig() {
  const name = cleanText(process.env.EVENT_NAME, "HDB");

  return {
    name,
    monogram: name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
    date: cleanText(
      process.env.EVENT_DATE,
      "Saturday, 18 October · 6:30 PM",
    ),
    venue: cleanText(process.env.EVENT_VENUE, "The Garden Hall"),
    helpText: cleanText(
      process.env.HOST_HELP_TEXT,
      "Please see a host at the welcome desk.",
      180,
    ),
  };
}
