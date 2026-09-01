function cleanText(value, fallback, maxLength = 100) {
  if (typeof value !== "string") return fallback;
  const clean = value.trim().replace(/\s+/g, " ");
  return clean ? clean.slice(0, maxLength) : fallback;
}

export function getPublicEventConfig() {
  const name = cleanText(process.env.EVENT_NAME, "HDB Senior Management Advance 2026");

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
      "Thursday, 10 September",
    ),
    venue: cleanText(process.env.EVENT_VENUE, "Conrads Singapore Orchard"),
    helpText: cleanText(
      process.env.HOST_HELP_TEXT,
      "Please mark your attendance by clicking the button above. If you have any questions, please contact the host.",
      180,
    ),
  };
}
