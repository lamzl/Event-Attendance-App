import { demoGuests } from "@/data/demo-guests";
import {
  sanitizeCheckInResult,
  sanitizeGuestListItem,
} from "@/lib/guest-utils";

const attendance = new Map();

export class DemoGuestProvider {
  source = "demo";

  async listGuests() {
    return demoGuests
      .map(sanitizeGuestListItem)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async checkIn({ guestId }) {
    const guest = demoGuests.find((item) => item.id === guestId);
    if (!guest) {
      const error = new Error("Guest not found");
      error.code = "GUEST_NOT_FOUND";
      error.status = 404;
      throw error;
    }

    const existingTimestamp = attendance.get(guest.id);
    const checkedInAt = existingTimestamp || new Date().toISOString();

    if (!existingTimestamp) attendance.set(guest.id, checkedInAt);

    return {
      status: existingTimestamp ? "already-checked-in" : "checked-in",
      guest: sanitizeCheckInResult({ ...guest, checkedInAt }),
    };
  }
}
