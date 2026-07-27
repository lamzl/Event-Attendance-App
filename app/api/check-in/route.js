import { getGuestProvider } from "@/lib/guest-provider";
import { cleanGuestId } from "@/lib/guest-utils";

export const dynamic = "force-dynamic";

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

function cleanRequestId(value) {
  if (typeof value !== "string") return "";
  const id = value.trim();
  return /^[a-zA-Z0-9_-]{8,128}$/.test(id) ? id : "";
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json(
      {
        ok: false,
        code: "INVALID_REQUEST",
        message: "The check-in request is invalid.",
      },
      400,
    );
  }

  const guestId = cleanGuestId(body?.guestId);
  const requestId = cleanRequestId(body?.requestId);

  if (!guestId || !requestId) {
    return json(
      {
        ok: false,
        code: "INVALID_REQUEST",
        message: "Please select your name again.",
      },
      400,
    );
  }

  try {
    const provider = getGuestProvider();
    const result = await provider.checkIn({ guestId, requestId });

    return json({
      ok: true,
      ...result,
      source: provider.source,
    });
  } catch (error) {
    console.error("Check-in request failed:", error?.code || "UNKNOWN_ERROR");
    const status = Number.isInteger(error?.status) ? error.status : 503;

    return json(
      {
        ok: false,
        code: error?.code || "CHECK_IN_FAILED",
        message:
          status === 404
            ? "We could not find that guest."
            : status === 409
              ? error.message
              : "We could not record your attendance. Please try again.",
      },
      status,
    );
  }
}
