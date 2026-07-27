import { getGuestProvider } from "@/lib/guest-provider";

export const dynamic = "force-dynamic";

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

export async function GET() {
  try {
    const provider = getGuestProvider();
    const guests = await provider.listGuests();

    return json({
      ok: true,
      guests,
      source: provider.source,
    });
  } catch (error) {
    console.error("Guest list request failed:", error?.code || "UNKNOWN_ERROR");
    return json(
      {
        ok: false,
        code: error?.code || "GUEST_LIST_UNAVAILABLE",
        message: "Check-in is temporarily unavailable.",
      },
      Number.isInteger(error?.status) ? error.status : 503,
    );
  }
}
